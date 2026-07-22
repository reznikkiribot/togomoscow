import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { GoalsService } from './goals.service';

@Controller('goals')
@UseGuards(TelegramAuthGuard)
export class GoalsController {
  constructor(private readonly goals: GoalsService, private readonly users: UsersService) {}

  /** The one goal for this session. `session` is a client-generated id that stays
   *  stable for the lifetime of the mini-app launch, so the goal does not change
   *  on re-renders — only on a genuinely new launch. */
  @Get()
  async current(@Req() req: any, @Query('session') session?: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.goals.goalForSession(user.id, session || 'default');
  }

  @Post('react')
  async react(@Req() req: any, @Body() body: { id: string; event: 'clicked' | 'dismissed' | 'completed' }) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.goals.react(user.id, body.id, body.event);
  }
}
