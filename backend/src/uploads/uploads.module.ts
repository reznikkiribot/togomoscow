import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService], // vision feedback reads confirmed photos to learn from them
})
export class UploadsModule {}
