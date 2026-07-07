import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Controller('session')
@UseGuards(TelegramAuthGuard)
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  @Post('start')
  async start(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    const s = await this.prisma.session.create({ data: { userId: u.id } });
    return { id: s.id };
  }

  @Post('end')
  async end(@Req() req: any, @Body() body: { id: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    if (body?.id) {
      await this.prisma.session
        .updateMany({ where: { id: body.id, userId: u.id, endedAt: null }, data: { endedAt: new Date() } })
        .catch(() => {});
    }
    return { ok: true };
  }
}
