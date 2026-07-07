import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RecsysService } from './recsys.service';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('recsys')
@UseGuards(TelegramAuthGuard)
export class RecsysController {
  constructor(
    private readonly recsys: RecsysService,
    private readonly users: UsersService,
  ) {}

  /** Log an implicit-feedback event (OPEN / VIEW / SAVE). RATE is logged server-side. */
  @Post('event')
  async event(@Req() req: any, @Body() body: { listingId: string; type: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.log(u.id, body.listingId, body.type);
  }

  /** Transparent "probability you'll like" (0–100%) + a human reason. */
  @Get('probability/:id')
  async probability(@Req() req: any, @Param('id') id: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.likeProbability(u.id, id);
  }

  @Get('recommend')
  async recommend(@Req() req: any, @Query('take') take?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.recommend(u.id, take ? Number(take) : undefined);
  }

  /** AI-profile personalized feed of dishes/drinks to try. */
  @Get('feed')
  async feed(@Req() req: any, @Query('take') take?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.recsys.recommendByTaste(u.id, take ? Number(take) : undefined);
  }
}
