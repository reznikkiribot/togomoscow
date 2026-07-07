import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly users: UsersService,
  ) {}

  /** Recent venue events across the city (public). */
  @Get()
  recent(@Query('take') take?: string) {
    return this.events.recent(take ? Number(take) : undefined);
  }

  /** Taste-personalized feed of new dishes/drinks (home strip). */
  @Get('feed')
  @UseGuards(TelegramAuthGuard)
  async feed(@Req() req: any, @Query('take') take?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.events.forTaste(u.id, take ? Number(take) : undefined);
  }

  /** Events from venues the signed-in user favorited. */
  @Get('mine')
  @UseGuards(TelegramAuthGuard)
  async mine(@Req() req: any, @Query('take') take?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.events.forUser(u.id, take ? Number(take) : undefined);
  }

  @Get('venue/:id')
  forVenue(@Param('id') id: string, @Query('take') take?: string) {
    return this.events.forVenue(id, take ? Number(take) : undefined);
  }
}
