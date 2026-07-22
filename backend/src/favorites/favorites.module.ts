import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [UsersModule, ListingsModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
