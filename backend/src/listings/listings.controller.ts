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
  list(
    @Query('type') type?: ListingType,
    @Query('search') search?: string,
    @Query('take') take?: string,
    @Query('sort') sort?: string,
    @Query('price') price?: string,
    @Query('openNow') openNow?: string,
    @Query('cuisine') cuisine?: string,
    @Query('category') category?: string,
  ) {
    return this.listings.list({
      type,
      search,
      take: take ? Number(take) : undefined,
      sort,
      price: price ? Number(price) : undefined,
      openNow: openNow === '1' || openNow === 'true',
      cuisine,
      category,
    });
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
    return this.listings.feedRanked(viewer?.id ?? null, take ? Number(take) : undefined);
  }

  // NOTE: specific routes must be declared before the ':id' wildcard.
  @Get('recommended')
  recommended(@Query('take') take?: string) {
    return this.listings.recommended(take ? Number(take) : undefined);
  }

  @Get('top-weekly')
  topWeekly() {
    return this.listings.topWeekly();
  }

  // «Станьте первым дегустатором» — items nobody has reviewed yet (gamification)
  @Get('first-taster')
  firstTaster(@Query('take') take?: string) {
    return this.listings.firstTasterItems(take ? Number(take) : undefined);
  }

  // personalized picks from the user's chosen categories (quiz)
  @Get('recommended-for')
  recommendedFor(@Query('cats') cats?: string) {
    return this.listings.recommendedFor((cats ?? '').split(',').filter(Boolean));
  }

  @Get('geo')
  geo() {
    return this.listings.geo();
  }

  // venues serving a dish/drink (for the Блюда / Напитки map search)
  @Get('venues-serving')
  venuesServing(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.venuesServing(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  // autocomplete suggestions for adding a dish/drink
  @Get('item-suggest')
  itemSuggest(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.suggestItems(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  // unified venue search (by name OR by dish/drink they serve)
  @Get('search-venues')
  searchVenues(@Query('q') q?: string) {
    return this.listings.searchVenues(q);
  }

  // unified search: matching dish/drink first, then venues
  @Get('search-all')
  searchAll(@Query('q') q?: string) {
    return this.listings.searchAll(q);
  }

  // search-bar autocomplete suggestions
  @Get('suggest')
  suggest(@Query('q') q?: string) {
    return this.listings.suggest(q);
  }

  // search dishes/drinks by name (Блюда / Напитки mode)
  @Get('search-items')
  searchItems(@Query('type') type: 'DISH' | 'DRINK', @Query('q') q?: string) {
    return this.listings.searchItems(type === 'DRINK' ? 'DRINK' : 'DISH', q);
  }

  @Get('group')
  group(@Query('key') key: string, @Query('type') type?: ListingType) {
    return this.listings.group(key, type);
  }

  // find beers by the flavor/serving tags people left in reviews (e.g. "Мягкое,С горчинкой")
  @Get('beer-by-tags')
  beerByTags(@Query('tags') tags?: string) {
    const list = (tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    return this.listings.beerByTags(list);
  }

  // smart personal feed (ratings + recent views + quiz − dislikes)
  @Get('recommended-smart')
  @UseGuards(TelegramAuthGuard)
  async recommendedSmart(@Req() req: any, @Query('recent') recent?: string) {
    const u = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.recommendedSmart(u.id, (recent ?? '').split(',').filter(Boolean));
  }

  // real places to taste a given dish/drink (menu links + cuisine match)
  @Get(':id/where')
  placesForItem(@Param('id') id: string) {
    return this.listings.placesForItem(id);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.listings.byId(id);
  }
}
