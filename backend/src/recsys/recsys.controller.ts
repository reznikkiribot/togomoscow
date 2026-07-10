import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RecsysService } from './recsys.service';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { validateTelegramInitData } from '../common/telegram-init-data';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Controller('recsys')
export class RecsysController {
  constructor(
    private readonly recsys: RecsysService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  /** Log an implicit-feedback event (OPEN / VIEW / SAVE). RATE is logged server-side. */
  @Post('event')
  @UseGuards(TelegramAuthGuard)
  async event(@Req() req: any, @Body() body: { listingId: string; type: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.log(u.id, body.listingId, body.type);
  }

  /** Transparent "probability you'll like" (0–100%) + a human reason. */
  @Get('probability/:id')
  @UseGuards(TelegramAuthGuard)
  async probability(@Req() req: any, @Param('id') id: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.likeProbability(u.id, id);
  }

  @Get('recommend')
  @UseGuards(TelegramAuthGuard)
  async recommend(@Req() req: any, @Query('take') take?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.recommend(u.id, take ? Number(take) : undefined);
  }

  /** AI-profile personalized feed. OPTIONAL auth: the home screen must render on
   *  the very first request — an anonymous/cold visitor gets the cold-start feed
   *  instead of a 401 (which used to cost the first paint a failed round-trip). */
  @Get('feed')
  async feed(@Req() req: any, @Query('take') take?: string) {
    const n = take ? Number(take) : undefined;
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    if (!tgUser) return this.recsys.anonFeed(n);
    const u = await this.users.upsertFromTelegram(tgUser);
    return this.recsys.recommendByTaste(u.id, n);
  }
}
