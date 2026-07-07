import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [UsersModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
