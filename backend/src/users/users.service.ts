import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramUser } from '../common/telegram-init-data';

const PLATFORM_OWNER_TELEGRAM_ID = '1029738735'; // @reznik_kir1ll

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private adminIds(): Set<string> {
    const ids = new Set(
      (this.config.get<string>('ADMIN_TELEGRAM_IDS') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    ids.add(PLATFORM_OWNER_TELEGRAM_ID);
    return ids;
  }

  /** Creates the user on first login, or refreshes their Telegram profile. */
  async upsertFromTelegram(tg: TelegramUser) {
    const data = {
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      photoUrl: tg.photo_url ?? null,
    };
    const isAdmin = this.adminIds().has(String(tg.id));

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tg.id) },
      create: {
        telegramId: BigInt(tg.id),
        ...data,
        role: isAdmin ? Role.ADMIN : Role.CUSTOMER,
      },
      update: data,
    });

    // keep admin role in sync with env config
    if (isAdmin && user.role !== Role.ADMIN) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { role: Role.ADMIN },
      });
    }
    return user;
  }
}
