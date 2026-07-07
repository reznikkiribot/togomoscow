import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const OWNER_TELEGRAM_ID = '1029738735'; // @reznik_kir1ll

type TgUser = {
  id: string;
  firstName: string | null;
  username: string | null;
  telegramId: bigint;
};

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(user: TgUser, text: string) {
    const clean = (text ?? '').trim();
    if (!clean) return { ok: false };
    const msg = await this.prisma.supportMessage.create({
      data: { userId: user.id, text: clean },
    });
    const who = user.firstName ?? user.username ?? 'гость';
    const tag = user.username ? `@${user.username}` : `id ${user.telegramId}`;
    const targets = this.ownerOnlyTargets();
    this.sendTo(targets, `🆘 Поддержка от ${who} (${tag}):\n\n${clean}`).catch(() => {});
    return { ok: true, id: msg.id };
  }

  /** A correction/addition for a card → admins + the venue owner. */
  async correction(user: TgUser, listingId: string, text: string) {
    const clean = (text ?? '').trim();
    if (!clean) return { ok: false };
    const c = await this.prisma.correction.create({
      data: { listingId, userId: user.id, text: clean },
    });
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });
    const who = user.firstName ?? user.username ?? 'гость';
    const body = `✏️ Правка к «${listing?.name ?? '?'}» от ${who} (TG ${user.telegramId}):\n\n${clean}`;
    this.sendTo(this.ownerOnlyTargets(), body).catch(() => {});
    return { ok: true, id: c.id };
  }

  private adminIds(): string[] {
    return (this.config.get<string>('ADMIN_TELEGRAM_IDS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private ownerOnlyTargets(): string[] {
    return [...new Set([OWNER_TELEGRAM_ID, ...this.adminIds().filter((id) => id === OWNER_TELEGRAM_ID)])];
  }

  private async sendTo(ids: string[], text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) return;
    for (const id of ids) {
      if (id !== OWNER_TELEGRAM_ID) continue;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text }),
      }).catch(() => {});
    }
  }
}
