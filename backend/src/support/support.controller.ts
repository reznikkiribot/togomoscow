import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { SupportService } from './support.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly users: UsersService,
  ) {}

  @Post('support')
  async send(@Req() req: any, @Body() body: { text: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.support.create(u, body.text);
  }

  @Post('listings/:id/correction')
  async correction(@Req() req: any, @Param() params: { id: string }, @Body() body: { text: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.support.correction(u, params.id, body.text);
  }
}
