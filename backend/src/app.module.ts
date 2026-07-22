import { Module } from '@nestjs/common';
import { BootstrapModule } from './bootstrap/bootstrap.module';
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
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health/health.controller';
import { TrustModule } from './trust/trust.module';
import { ResponseCacheModule } from './common/response-cache.module';

@Module({
  imports: [
    BootstrapModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ResponseCacheModule,
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
    NotificationsModule,
    TrustModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
