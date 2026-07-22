import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { TrustAdminService } from './trust-admin.service';
import { TrustService } from './trust.service';

@Controller()
@UseGuards(TelegramAuthGuard)
export class TrustController {
  constructor(
    private readonly users: UsersService,
    private readonly trust: TrustService,
    private readonly admin: TrustAdminService,
  ) {}

  @Get('me/location-consent')
  async consent(@Req() req: any) {
    const user = await this.user(req);
    return this.trust.consent(user.id);
  }

  @Post('me/location-consent')
  async setConsent(@Req() req: any, @Body() body: { consented: boolean; textVersion: string; systemPermission: string }) {
    const user = await this.user(req);
    return this.trust.recordConsent(user.id, body);
  }

  @Delete('me/location-consent')
  async revokeConsent(@Req() req: any) {
    const user = await this.user(req);
    return this.trust.revokeConsent(user.id);
  }

  @Get('admin/trust/config')
  async config(@Req() req: any) {
    await this.requireAdmin(req);
    return this.admin.config();
  }

  @Put('admin/trust/config')
  async updateConfig(@Req() req: any, @Body() body: { config: unknown; formulaVersion?: string; recalculate?: boolean }) {
    const user = await this.requireAdmin(req);
    return this.admin.updateConfig(user.id, body);
  }

  @Get('admin/trust/queue')
  async queue(@Req() req: any) {
    await this.requireAdmin(req);
    return this.admin.queue();
  }

  @Post('admin/trust/reviews/:id/action')
  async action(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const user = await this.requireAdmin(req);
    return this.admin.action(user.id, id, body);
  }

  @Post('admin/trust/recalculate')
  async recalculate(@Req() req: any) {
    const user = await this.requireAdmin(req);
    return this.trust.startMassRecalculation(user.id);
  }

  @Get('admin/trust/jobs')
  async jobs(@Req() req: any) {
    await this.requireAdmin(req);
    return this.admin.jobs();
  }

  @Get('admin/trust/metrics')
  async metrics(@Req() req: any) {
    await this.requireAdmin(req);
    return this.admin.metrics();
  }

  private user(req: any) {
    return this.users.upsertFromTelegram(req.telegramUser);
  }

  private async requireAdmin(req: any) {
    const user = await this.user(req);
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return user;
  }
}
