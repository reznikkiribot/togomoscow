import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ListingsController } from './listings.controller';
import { QaController } from './qa.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [UsersModule, UploadsModule],
  controllers: [ListingsController, QaController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
