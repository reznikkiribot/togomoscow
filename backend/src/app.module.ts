import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ListingsModule } from './listings/listings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SocialModule } from './social/social.module';
import { UploadsModule } from './uploads/uploads.module';
import { OwnerModule } from './owner/owner.module';
import { StockModule } from './stock/stock.module';
import { SupportModule } from './support/support.module';
import { SessionsModule } from './sessions/sessions.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BotModule } from './bot/bot.module';
import { RecsysModule } from './recsys/recsys.module';
import { EventsModule } from './events/events.module';
import { SheetModule } from './sheet/sheet.module';
import { VisionModule } from './vision/vision.module';
import { GameModule } from './game/game.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    ListingsModule,
    ReviewsModule,
    FavoritesModule,
    SocialModule,
    UploadsModule,
    OwnerModule,
    StockModule,
    SupportModule,
    SessionsModule,
    ChallengesModule,
    BotModule,
    RecsysModule,
    EventsModule,
    SheetModule,
    VisionModule,
    GameModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
