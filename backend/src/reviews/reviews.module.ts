import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { VisionModule } from '../vision/vision.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CommentModerationService } from './comment-moderation.service';
import { TrustModule } from '../trust/trust.module';

@Module({
  imports: [UsersModule, UploadsModule, VisionModule, TrustModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, CommentModerationService],
})
export class ReviewsModule {}
