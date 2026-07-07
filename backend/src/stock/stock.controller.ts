import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { STOCK } from './stock.data';

// Proxies curated commercial-licensed stock photos through our own domain and
// caches them in memory, so the Mini App never hotlinks an external CDN.
@Controller()
export class StockController {
  private cache = new Map<string, { buf: Buffer; type: string }>();

  @Get('stock/:id')
  async stock(@Param('id') id: string, @Res() res: Response) {
    const url = STOCK[id];
    if (!url) throw new NotFoundException('Unknown stock id');

    let hit = this.cache.get(id);
    if (!hit) {
      const r = await fetch(url);
      if (!r.ok) throw new NotFoundException('Stock fetch failed');
      const ab = await r.arrayBuffer();
      hit = { buf: Buffer.from(ab), type: r.headers.get('content-type') ?? 'image/jpeg' };
      this.cache.set(id, hit);
    }
    res.setHeader('Content-Type', hit.type);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(hit.buf);
  }
}
