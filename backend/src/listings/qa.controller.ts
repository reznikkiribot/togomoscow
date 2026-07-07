import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { ListingsService } from './listings.service';

@Controller()
export class QaController {
  constructor(
    private readonly listings: ListingsService,
    private readonly users: UsersService,
  ) {}

  @Get('listings/:id/questions')
  questions(@Param('id') id: string) {
    return this.listings.questions(id);
  }

  @Post('listings/:id/questions')
  @UseGuards(TelegramAuthGuard)
  async ask(@Req() req: any, @Param('id') id: string, @Body() body: { text: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.askQuestion(u.id, id, body.text);
  }

  @Post('questions/:id/answers')
  @UseGuards(TelegramAuthGuard)
  async answer(@Req() req: any, @Param('id') id: string, @Body() body: { text: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.answerQuestion(u.id, id, body.text);
  }
}
