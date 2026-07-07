import { Module } from '@nestjs/common';
import { RecsysService } from './recsys.service';
import { RecsysController } from './recsys.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [PrismaModule, UsersModule, ListingsModule],
  controllers: [RecsysController],
  providers: [RecsysService],
  exports: [RecsysService],
})
export class RecsysModule {}
