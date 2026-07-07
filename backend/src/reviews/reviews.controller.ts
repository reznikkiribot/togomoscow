import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { VoteType } from '@prisma/client';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateReviewDto, ReviewsService } from './reviews.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly users: UsersService,
  ) {}

  @Post('listings/:id/reviews')
  async create(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: CreateReviewDto,
  ) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.create(user.id, id, body);
  }

  @Get('me/reviews')
  async mine(@Req() req: any) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.myReviews(user.id);
  }

  @Delete('reviews/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.remove(user.id, id);
  }

  @Post('reviews/:id/vote')
  async vote(@Req() req: any, @Param('id') id: string, @Body() body: { type: VoteType }) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.vote(user.id, id, body.type);
  }

  // current reaction counts + which ones are MINE (to prefill the photo view)
  @Get('reviews/:id/vote')
  async voteState(@Req() req: any, @Param('id') id: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.voteState(id, user.id);
  }

  // threaded comments (Reddit-style) on a review
  @Get('reviews/:id/comments')
  comments(@Param('id') id: string) {
    return this.reviews.comments(id);
  }

  @Post('reviews/:id/comments')
  async addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { text: string; parentId?: string },
  ) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.addComment(user.id, id, body.text, body.parentId);
  }

  @Delete('comments/:cid')
  async deleteComment(@Req() req: any, @Param('cid') cid: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.deleteComment(user.id, cid);
  }

  // prepare a rich shareable message (photo + caption + open-app button) for a friend
  @Post('share/prepare')
  async sharePrepare(@Req() req: any, @Body() body: { listingId: string; text?: string; photoUrl?: string }) {
    return this.reviews.preparePost(req.telegramUser?.id, body.listingId, body.text, body.photoUrl);
  }

  // add a photo to a card WITHOUT leaving a review/rating (just the picture)
  @Post('listings/:id/photo')
  async addPhoto(@Req() req: any, @Param('id') id: string, @Body() body: { url: string }) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    return this.reviews.addPhoto(user.id, id, body.url);
  }
}
