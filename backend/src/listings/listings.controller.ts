import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ListingType } from '@prisma/client';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { validateTelegramInitData } from '../common/telegram-init-data';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { ListingsService } from './listings.service';

// Public browse/search endpoints — no auth needed to discover venues.
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listings: ListingsService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private async located<T>(req: any, result: Promise<T> | T): Promise<T> {
    return this.listings.localizeVenueReferences(await result, this.listings.viewerLocation(req));
  }

  /** Resolve the viewer when initData is present, without requiring auth. */
  private async optionalViewer(req: any) {
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    return tgUser ? this.users.upsertFromTelegram(tgUser) : null;
  }

  // a logged-in user proposes a dish/drink for a venue (pending owner approval)
  @Post(':id/items')
  @UseGuards(TelegramAuthGuard)
  async addItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      type: 'DISH' | 'DRINK';
      name: string;
      description?: string;
      photoUrl?: string;
      category?: string;
    },
  ) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.addItem(u.id, id, body);
  }

  // link an existing dish/drink to a restaurant the user picked
  @Post(':itemId/served-at')
  @UseGuards(TelegramAuthGuard)
  async servedAt(@Req() req: any, @Param('itemId') itemId: string, @Body() body: { venueId: string }) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.linkItemToVenue(u.id, itemId, body.venueId);
  }

  // a user checks in at a venue; GPS coords (if provided) verify proximity
  @Post(':id/checkin')
  @UseGuards(TelegramAuthGuard)
  async checkin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number; photoUrl?: string; note?: string },
  ) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.checkin(u.id, id, body);
  }

  @Get()
  async list(
    @Req() req: any,
    @Query('type') type?: ListingType,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('sort') sort?: string,
    @Query('price') price?: string,
    @Query('openNow') openNow?: string,
    @Query('cuisine') cuisine?: string,
    @Query('category') category?: string,
  ) {
    // optional auth: a known viewer gets «Рекомендуемые» ranked by THEIR taste
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
    return this.located(req, this.listings.list({
      type,
      search,
      take: take ? Number(take) : undefined,
      sort,
      price: price ? Number(price) : undefined,
      openNow: openNow === '1' || openNow === 'true',
      cuisine,
      category,
      viewerId: viewer?.id ?? null,
    }));
  }

  @Get('feed')
  async feed(@Req() req: any, @Query('take') take?: string) {
    // optional auth: a known viewer gets the PERSONALIZED one-time feed
    // (impressions recorded); anonymous falls back to the public ranking
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
    return this.located(req, this.listings.feedRanked(viewer?.id ?? null, take ? Number(take) : undefined));
  }

  // NOTE: specific routes must be declared before the ':id' wildcard.
  @Get('recommended')
  recommended(@Req() req: any, @Query('take') take?: string) {
    return this.located(req, this.listings.recommended(take ? Number(take) : undefined));
  }

  @Get('top-weekly')
  topWeekly(@Req() req: any) {
    return this.located(req, this.listings.topWeekly());
  }

  // items where THIS user was the first taster (their discoveries)
  @Get('my-discoveries')
  @UseGuards(TelegramAuthGuard)
  async myDiscoveries(@Req() req: any) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.located(req, this.listings.myDiscoveries(u.id));
  }

  // «Станьте первым дегустатором» — items nobody has reviewed yet (gamification).
  // Optional auth: a known viewer gets ROTATED cards (never the same set twice),
  // anonymous gets a random sample.
  @Get('first-taster')
  async firstTaster(@Req() req: any, @Query('take') take?: string) {
    const viewer = await this.optionalViewer(req);
    return this.located(req, this.listings.firstTasterItems(take ? Number(take) : undefined, viewer?.id ?? null));
  }

  // personalized picks from the user's chosen categories (quiz)
  @Get('recommended-for')
  recommendedFor(@Req() req: any, @Query('cats') cats?: string) {
    return this.located(req, this.listings.recommendedFor((cats ?? '').split(',').filter(Boolean)));
  }

  @Get('geo')
  geo() {
    return this.listings.geo();
  }

  // venues serving a dish/drink (for the Блюда / Напитки map search)
  @Get('venues-serving')
  venuesServing(@Req() req: any, @Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.located(req, this.listings.venuesServing(type === 'DRINK' ? 'DRINK' : 'DISH', q));
  }

  // autocomplete suggestions for adding a dish/drink
  @Get('item-suggest')
  itemSuggest(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.suggestItems(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  // unified venue search (by name OR by dish/drink they serve)
  @Get('search-venues')
  searchVenues(@Req() req: any, @Query('q') q?: string) {
    return this.located(req, this.listings.searchVenues(q));
  }

  // unified search: matching dish/drink first, then venues
  @Get('search-all')
  searchAll(@Req() req: any, @Query('q') q?: string) {
    return this.located(req, this.listings.searchAll(q));
  }

  // search-bar autocomplete suggestions
  @Get('suggest')
  suggest(@Query('q') q?: string) {
    return this.listings.suggest(q);
  }

  // search dishes/drinks by name (Блюда / Напитки mode)
  @Get('search-items')
  searchItems(@Req() req: any, @Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.located(req, this.listings.searchItems(type === 'DRINK' ? 'DRINK' : 'DISH', q));
  }

  @Get('group')
  group(@Req() req: any, @Query('key') key: string, @Query('type') type?: ListingType) {
    return this.located(req, this.listings.group(key, type));
  }

  // find beers by the flavor/serving tags people left in reviews (e.g. "Мягкое,С горчинкой")
  @Get('beer-by-tags')
  beerByTags(@Req() req: any, @Query('tags') tags?: string) {
    const list = (tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    return this.located(req, this.listings.beerByTags(list));
  }

  // smart personal feed (ratings + recent views + quiz − dislikes)
  @Get('recommended-smart')
  @UseGuards(TelegramAuthGuard)
  async recommendedSmart(@Req() req: any, @Query('recent') recent?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.located(req, this.listings.recommendedSmart(u.id, (recent ?? '').split(',').filter(Boolean)));
  }

  // real places to taste a given dish/drink (menu links + cuisine match)
  @Get(':id/where')
  placesForItem(@Req() req: any, @Param('id') id: string) {
    return this.located(req, this.listings.placesForItem(id));
  }

  @Get(':id')
  async byId(@Req() req: any, @Param('id') id: string) {
    // optional auth: a known viewer sees their own likes lit on first render
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
    const tgUser = scheme === 'tma' && initData && token ? validateTelegramInitData(initData, token, 0) : null;
    const viewer = tgUser ? await this.users.upsertFromTelegram(tgUser) : null;
    return this.located(req, this.listings.byId(id, viewer?.id ?? null));
  }
}
