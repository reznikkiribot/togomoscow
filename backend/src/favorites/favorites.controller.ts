import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { FavoritesService } from './favorites.service';
import { ListingsService } from '../listings/listings.service';

@Controller('me/favorites')
@UseGuards(TelegramAuthGuard)
export class FavoritesController {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly users: UsersService,
    private readonly listings: ListingsService,
  ) {}

  @Get()
  async list(@Req() req: any) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.listings.localizeVenueReferences(
      await this.favorites.list(user.id),
      this.listings.viewerLocation(req),
    );
  }

  @Post(':listingId')
  async add(@Req() req: any, @Param('listingId') listingId: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.favorites.add(user.id, listingId);
  }

  @Delete(':listingId')
  async remove(@Req() req: any, @Param('listingId') listingId: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.favorites.remove(user.id, listingId);
  }
}
