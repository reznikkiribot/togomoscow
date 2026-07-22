import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../uploads/uploads.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [UsersModule, UploadsModule],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
