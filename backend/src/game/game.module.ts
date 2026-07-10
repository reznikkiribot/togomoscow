import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { GameService } from './game.service';
import { GameController } from './game.controller';

// Gamification: progressive feature unlocks, levels, achievements, discoveries.
// All rules live in game_config (DB) and are editable from the admin panel at
// runtime — no code changes or redeploys to tune the system.
@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
