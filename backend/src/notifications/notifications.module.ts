import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

// Global: reviews/social/comments services emit notifications from anywhere
// without wiring the module into each of them.
@Global()
@Module({
  imports: [UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
