import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from '../users/users.module';
import { VisionModule } from '../vision/vision.module';
import { RatingRecalculationService } from './rating-recalculation.service';
import { TrustAdminService } from './trust-admin.service';
import { TrustConfigService } from './trust-config.service';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [UsersModule, UploadsModule, VisionModule],
  controllers: [TrustController],
  providers: [TrustConfigService, RatingRecalculationService, TrustService, TrustAdminService],
  exports: [TrustConfigService, RatingRecalculationService, TrustService],
})
export class TrustModule {}
