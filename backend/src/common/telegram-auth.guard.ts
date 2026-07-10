import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateTelegramInitData } from './telegram-init-data';

/**
 * Expects an `Authorization: tma <initData>` header, where <initData> is the
 * raw string from Telegram.WebApp.initData. On success, attaches the validated
 * Telegram user to request.telegramUser.
 */
@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string = req.headers['authorization'] ?? '';
    const [scheme, initData] = auth.split(' ');
    const where = `${req.method} ${(req.url || '').split('?')[0]}`;

    if (scheme !== 'tma' || !initData) {
      throw new UnauthorizedException('Missing Telegram init data');
    }

    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'PUT_YOUR_BOT_TOKEN_HERE') {
      throw new UnauthorizedException('Server is missing TELEGRAM_BOT_TOKEN');
    }

    // age of the initData (why mobile 401s if it's very old / cached)
    let ageS = -1;
    try {
      const ad = Number(new URLSearchParams(initData).get('auth_date'));
      if (ad > 0) ageS = Math.round(Date.now() / 1000 - ad);
    } catch {
      /* ignore */
    }

    // No freshness limit: the HMAC already authenticates the data. A time window
    // silently 401s long-lived / cached mobile sessions that reuse old initData.
    const user = validateTelegramInitData(initData, token, 0);
    if (!user) {
      throw new UnauthorizedException('Invalid Telegram init data');
    }
    req.telegramUser = user;
    return true;
  }
}
