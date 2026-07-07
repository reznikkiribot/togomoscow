import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';

@Module({
  imports: [UsersModule],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
