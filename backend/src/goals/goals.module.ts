import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { GameModule } from '../game/game.module';
import { ResponseCacheModule } from '../common/response-cache.module';

@Module({
  imports: [PrismaModule, UsersModule, GameModule, ResponseCacheModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
