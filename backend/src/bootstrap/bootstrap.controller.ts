import { Controller, Get, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateTelegramInitData } from '../common/telegram-init-data';
import { ResponseCacheService } from '../common/response-cache.service';
import { ListingsService } from '../listings/listings.service';
import { RecsysService } from '../recsys/recsys.service';
import { UsersService } from '../users/users.service';

// ONE request for the whole first screen.
//
// The home screen used to fire ~10 parallel calls on mount, each paying the full
// round-trip; on a cold server that was several seconds of blank page and the
// watchdog occasionally gave up entirely (reported: «не загрузилось приложение»).
// index.html now kicks this off while the JS bundle is still downloading, so the
// data is usually waiting by the time React mounts.
@Controller('bootstrap')
export class BootstrapController {
  constructor(
    private readonly listings: ListingsService,
    private readonly recsys: RecsysService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly cache: ResponseCacheService,
  ) {}

  @Get()
  async bootstrap(@Req() req: any, @Query('take') take?: string) {
    const limit = Math.min(Math.max(Number(take) || 10, 4), 20);
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;

    // The heavy, viewer-independent parts stay on the shared cache; anything
    // personal (rotation, "me") is computed per viewer on top of it.
    const [feed, firstTaster, topDishes, topDrinks] = await Promise.all([
      viewer
        ? this.recsys.recommendByTaste(viewer.id, limit).catch(() => this.recsys.anonFeed(limit))
        : this.recsys.anonFeed(limit),
      this.listings.firstTasterItems(8, viewer?.id ?? null).catch(() => []),
      this.cache.getOrSet('bootstrap:top-dish:v1', 120_000, () =>
        this.listings.list({ type: 'DISH', sort: 'rating', take: 12 }),
      ).catch(() => []),
      this.cache.getOrSet('bootstrap:top-drink:v1', 120_000, () =>
        this.listings.list({ type: 'DRINK', sort: 'rating', take: 12 }),
      ).catch(() => []),
    ]);

    const located = await this.listings.localizeVenueReferences(
      { feed, firstTaster, topDishes, topDrinks },
      this.listings.viewerLocation(req),
    );

    return {
      ...located,
      me: viewer ? { id: viewer.id, role: viewer.role, onboardedAt: viewer.onboardedAt } : null,
    };
  }
}
