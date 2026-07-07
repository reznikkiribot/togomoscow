import { Body, Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { SheetService, SheetRow } from './sheet.service';

// Google Sheet bridge. Secured by a shared secret (SHEET_SECRET) rather than
// Telegram auth, because the caller is a Google Apps Script webhook, not a user.
@Controller('sheet')
export class SheetController {
  constructor(private readonly sheet: SheetService) {}

  private check(secret?: string) {
    const expected = process.env.SHEET_SECRET;
    if (!expected || secret !== expected) throw new ForbiddenException('bad secret');
  }

  /** The sheet pulls all venues from here to (re)populate itself. */
  @Get('export')
  async export(
    @Query('secret') secret: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    this.check(secret);
    return this.sheet.exportRows(offset ? Number(offset) : 0, limit ? Number(limit) : 1000);
  }

  /** Apps Script onEdit → posts the edited row here; we apply it immediately. */
  @Post('sync')
  async sync(@Query('secret') secret: string, @Body() row: SheetRow) {
    this.check(secret);
    return this.sheet.sync(row);
  }
}
