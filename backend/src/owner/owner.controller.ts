import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MenuItemStatus, Role } from '@prisma/client';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { EditVenueDto, OwnerService, SubmitBusinessDto } from './owner.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class OwnerController {
  constructor(
    private readonly owner: OwnerService,
    private readonly users: UsersService,
  ) {}

  private user(req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }

  // ---- owner ----
  @Post('owner/claims/:listingId')
  async claim(@Req() req: any, @Param('listingId') id: string, @Body() body: { message?: string }) {
    const u = await this.user(req);
    return this.owner.claim(u.id, id, body?.message);
  }

  @Get('me/claims')
  async myClaims(@Req() req: any) {
    const u = await this.user(req);
    return this.owner.myClaims(u.id);
  }

  @Get('owner/venues')
  async myVenues(@Req() req: any) {
    const u = await this.user(req);
    return this.owner.myVenues(u.id);
  }

  @Patch('owner/venues/:id')
  async edit(@Req() req: any, @Param('id') id: string, @Body() body: EditVenueDto) {
    const u = await this.user(req);
    return this.owner.editVenue(u.id, id, body);
  }

  @Get('owner/venues/:id/reviews')
  async venueReviews(@Param('id') id: string) {
    return this.owner.venueReviews(id);
  }

  @Post('owner/reviews/:id/reply')
  async reply(@Req() req: any, @Param('id') id: string, @Body() body: { text: string }) {
    const u = await this.user(req);
    return this.owner.reply(u.id, id, body.text);
  }

  // user-proposed dishes/drinks awaiting this owner's approval
  @Get('owner/venues/:id/pending-items')
  async pendingItems(@Req() req: any, @Param('id') id: string) {
    const u = await this.user(req);
    return this.owner.pendingItems(u.id, id);
  }

  @Post('owner/venues/:venueId/items/:itemId')
  async setItem(
    @Req() req: any,
    @Param('venueId') venueId: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: MenuItemStatus; price?: number },
  ) {
    const u = await this.user(req);
    return this.owner.setItemStatus(u.id, venueId, itemId, body.status, body.price);
  }

  @Get('admin/users')
  async adminUsers(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.adminUsers();
  }

  @Get('admin/support')
  async adminSupport(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.adminSupport();
  }

  @Get('admin/corrections')
  async adminCorrections(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.adminCorrections();
  }

  @Post('admin/corrections/:id/resolve')
  async resolveCorrection(@Req() req: any, @Param('id') id: string) {
    await this.requireAdmin(req);
    return this.owner.resolveCorrection(id);
  }

  // ---- admin menu-item moderation ----
  @Get('admin/items')
  async adminPendingItems(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.adminPendingItems();
  }

  @Post('admin/items/:venueId/:itemId')
  async adminSetItem(
    @Req() req: any,
    @Param('venueId') venueId: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: MenuItemStatus; price?: number },
  ) {
    await this.requireAdmin(req);
    return this.owner.adminSetItem(venueId, itemId, body.status, body.price);
  }

  // ---- admin comment moderation ----
  @Get('admin/comments')
  async pendingComments(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.pendingComments();
  }

  @Post('admin/comments/:id/:action')
  async moderateComment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'reject',
  ) {
    await this.requireAdmin(req);
    return this.owner.moderateComment(id, action === 'approve' ? 'approve' : 'reject');
  }

  // ---- admin review moderation ----
  @Get('admin/reviews')
  async pendingReviews(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.pendingReviews();
  }

  @Post('admin/reviews/:id/:action')
  async moderateReview(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'reject',
    @Body() body: { price?: number } = {},
  ) {
    const admin = await this.requireAdmin(req);
    return this.owner.moderateReview(
      id,
      action === 'approve' ? 'approve' : 'reject',
      body?.price,
      admin.id,
    );
  }

  // ---- add a business (Yelp-style suggestion) ----
  @Post('business')
  async submitBusiness(@Req() req: any, @Body() body: SubmitBusinessDto) {
    const u = await this.user(req);
    return this.owner.submitBusiness(u.id, body);
  }

  @Get('me/business')
  async mySubmissions(@Req() req: any) {
    const u = await this.user(req);
    return this.owner.mySubmissions(u.id);
  }

  @Get('admin/business')
  async pendingBusiness(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.pendingSubmissions();
  }

  @Post('admin/business/:id/:action')
  async setBusiness(
    @Req() req: any,
    @Param('id') id: string,
    @Param('action') action: 'approve' | 'reject',
    @Body()
    body?: { name?: string; address?: string; phone?: string; category?: string; website?: string },
  ) {
    await this.requireAdmin(req);
    return this.owner.setSubmission(id, action === 'approve' ? 'approve' : 'reject', body);
  }

  // ---- admin (manual verification) ----
  @Get('admin/claims')
  async pending(@Req() req: any) {
    await this.requireAdmin(req);
    return this.owner.pendingClaims();
  }

  @Post('admin/claims/:id/approve')
  async approve(@Req() req: any, @Param('id') id: string) {
    await this.requireAdmin(req);
    return this.owner.approveClaim(id);
  }

  @Post('admin/claims/:id/reject')
  async reject(@Req() req: any, @Param('id') id: string) {
    await this.requireAdmin(req);
    return this.owner.rejectClaim(id);
  }

  private async requireAdmin(req: any) {
    const u = await this.user(req);
    if (u.role !== Role.ADMIN) throw new ForbiddenException('Admins only');
    return u;
  }
}
