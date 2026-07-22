import { Module } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';
import { ListingsModule } from '../listings/listings.module';
import { RecsysModule } from '../recsys/recsys.module';
import { UsersModule } from '../users/users.module';
import { ResponseCacheModule } from '../common/response-cache.module';

@Module({
  imports: [ListingsModule, RecsysModule, UsersModule, ResponseCacheModule],
  controllers: [BootstrapController],
})
export class BootstrapModule {}
