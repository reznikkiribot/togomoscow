import { Injectable, Logger } from '@nestjs/common';
import { createWorker, type Worker } from 'tesseract.js';

// OCR via Tesseract.js (pure WASM — no native binaries, works on any machine).
// Used for wine bottles (label text → producer/vintage/region) and photos of menus
// (lines → dish/drink names). Lazily boots one shared RU+EN worker.
@Injectable()
export class OCRService {
  private readonly log = new Logger('OCR');
  private worker: Promise<Worker> | null = null;

  private getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = createWorker(['rus', 'eng']).catch((e) => {
        this.worker = null;
        throw e;
      });
    }
    return this.worker;
  }

  /** Raw text from an image buffer. Empty string on failure. */
  async text(image: Buffer): Promise<string> {
    try {
      const w = await this.getWorker();
      const { data } = await w.recognize(image);
      return (data.text ?? '').trim();
    } catch (e: any) {
      this.log.warn(`ocr failed: ${e?.message}`);
      return '';
    }
  }

  /** Split OCR text into plausible menu-item / label lines (drops noise & prices). */
  lines(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      // keep lines with real words; drop pure prices / short noise
      .filter((l) => l.length >= 3 && /[a-zа-яё]{3,}/i.test(l))
      .map((l) => l.replace(/\s*[-–—.·]{2,}\s*\d+.*$/, '').replace(/\s+\d{2,4}\s*(₽|руб|р)?\.?$/i, '').trim())
      .filter(Boolean)
      .slice(0, 40);
  }
}
