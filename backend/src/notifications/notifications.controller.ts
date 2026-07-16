import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(TelegramAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.notifications.list(u.id);
  }

  @Get('unread')
  async unread(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return { unread: await this.notifications.unreadCount(u.id) };
  }

  @Post('read')
  async read(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.notifications.markAllRead(u.id);
  }
}
