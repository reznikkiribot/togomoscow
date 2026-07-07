import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { SocialService } from './social.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class SocialController {
  constructor(
    private readonly social: SocialService,
    private readonly users: UsersService,
  ) {}

  private me(req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }

  @Get('me/profile')
  async profile(@Req() req: any) {
    const user = await this.me(req);
    return this.social.profile(user.id);
  }

  @Get('me/onboarding')
  async onboarding(@Req() req: any) {
    const user = await this.me(req);
    return this.social.onboarding(user.id);
  }

  @Post('me/onboarding')
  async setOnboarding(@Req() req: any, @Body() body: { categories: string[]; price?: number }) {
    const user = await this.me(req);
    return this.social.setOnboarding(user.id, body);
  }

  @Get('me/taste-ranking')
  async tasteRanking(@Req() req: any, @Query('itemId') itemId: string) {
    const user = await this.me(req);
    return this.social.tasteRanking(user.id, itemId);
  }

  @Get('me/skips')
  async skips(@Req() req: any) {
    const user = await this.me(req);
    return this.social.skips(user.id);
  }

  @Post('me/skip')
  async skip(@Req() req: any, @Body() body: { itemId: string; category?: string }) {
    const user = await this.me(req);
    return this.social.skip(user.id, body.itemId, body.category);
  }

  @Post('me/compare')
  async compare(
    @Req() req: any,
    @Body() body: { winnerId: string; loserId: string; reason?: string; category?: string },
  ) {
    const user = await this.me(req);
    return this.social.compare(user.id, body);
  }

  @Get('me/taste-profile')
  async tasteProfile(@Req() req: any) {
    const user = await this.me(req);
    return this.social.tasteProfile(user.id);
  }

  @Get('me/category-progress')
  async categoryProgress(@Req() req: any) {
    const user = await this.me(req);
    return this.social.categoryProgress(user.id);
  }

  @Get('me/stats')
  async stats(@Req() req: any) {
    const user = await this.me(req);
    return this.social.stats(user.id);
  }

  @Get('me/specializations')
  async specializations(@Req() req: any) {
    const user = await this.me(req);
    return this.social.specializations(user.id);
  }

  @Get('me/followers')
  async myFollowers(@Req() req: any) {
    const user = await this.me(req);
    return this.social.followers(user.id, user.id);
  }

  @Get('me/following')
  async myFollowing(@Req() req: any) {
    const user = await this.me(req);
    return this.social.following(user.id, user.id);
  }

  @Get('me/following-feed')
  async followingFeed(@Req() req: any) {
    const user = await this.me(req);
    return this.social.followingFeed(user.id);
  }

  @Get('users/search')
  async search(@Req() req: any, @Query('q') q: string) {
    const user = await this.me(req);
    return this.social.search(q, user.id);
  }

  @Get('users/:id/profile')
  async userProfile(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.userProfile(id, user.id);
  }

  @Post('users/:id/follow')
  async follow(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.follow(user.id, id);
  }

  @Delete('users/:id/follow')
  async unfollow(@Req() req: any, @Param('id') id: string) {
    const user = await this.me(req);
    return this.social.unfollow(user.id, id);
  }
}
