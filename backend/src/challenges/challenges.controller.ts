import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { ChallengesService, CreateChallengeDto } from './challenges.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class ChallengesController {
  constructor(
    private readonly challenges: ChallengesService,
    private readonly users: UsersService,
  ) {}

  private me(req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }

  @Get('challenges')
  async list(@Req() req: any) {
    const u = await this.me(req);
    return this.challenges.list(u.id);
  }

  @Get('admin/challenges')
  async adminList(@Req() req: any) {
    const u = await this.me(req);
    return this.challenges.adminList(u.id);
  }

  @Post('admin/challenges')
  async create(@Req() req: any, @Body() body: CreateChallengeDto) {
    const u = await this.me(req);
    return this.challenges.create(u.id, body);
  }

  @Post('admin/challenges/:id/deactivate')
  async deactivate(@Req() req: any, @Param('id') id: string) {
    const u = await this.me(req);
    return this.challenges.deactivate(u.id, id);
  }
}
