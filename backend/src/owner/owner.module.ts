import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { TrustModule } from '../trust/trust.module';

@Module({
  imports: [UsersModule, TrustModule],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
