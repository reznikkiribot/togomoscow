import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { GameService, DEFAULT_CONFIG } from './game.service';

@Controller()
export class GameController {
  constructor(
    private readonly game: GameService,
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  /** The user's full gamification state (unlocks, level, achievements, counters). */
  @Get('game/state')
  @UseGuards(TelegramAuthGuard)
  async state(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.game.state(u.id);
  }

  /** "Первый дегустатор" plaque data for a card. Public. */
  @Get('game/first-taster/:listingId')
  firstTaster(@Param('listingId') id: string) {
    return this.game.firstTaster(id);
  }

  // ---- admin panel: live-editable gamification config ----
  private async requireAdmin(req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    if (u.role !== Role.ADMIN) throw new ForbiddenException('admin only');
    return u;
  }

  @Get('admin/game/config')
  @UseGuards(TelegramAuthGuard)
  async getConfig(@Req() req: any) {
    await this.requireAdmin(req);
    const current = await this.game.config();
    return { current, defaults: DEFAULT_CONFIG };
  }

  @Put('admin/game/config')
  @UseGuards(TelegramAuthGuard)
  async putConfig(@Req() req: any, @Body() body: { key: string; value: unknown }) {
    await this.requireAdmin(req);
    if (!body?.key || !(body.key in DEFAULT_CONFIG)) {
      throw new BadRequestException(`unknown config key; allowed: ${Object.keys(DEFAULT_CONFIG).join(', ')}`);
    }
    return this.game.setConfig(body.key, body.value);
  }
}
