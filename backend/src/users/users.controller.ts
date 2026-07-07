import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // GET /api/me — validates Telegram initData, upserts the user, returns them.
  @UseGuards(TelegramAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }
}
