import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

const APP_URL = 'https://app.togomoscow.ru/tg-boot-222?v=222&from=start';
const OWNER_TELEGRAM_ID = '1029738735'; // @reznik_kir1ll

// Lightweight long-polling bot: handles /start by offering a one-tap button
// that launches the Mini App. Notifications elsewhere use sendMessage directly.
@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly log = new Logger('TelegramBot');
  private readonly token = process.env.TELEGRAM_BOT_TOKEN;
  private offset = 0;

  async onModuleInit() {
    if (!this.token) {
      this.log.warn('TELEGRAM_BOT_TOKEN missing — /start handler disabled');
      return;
    }
    // clear any backlog so a backend restart doesn't re-greet old chats
    try {
      await this.call('deleteWebhook', { drop_pending_updates: true });
    } catch {
      /* ignore */
    }
    void this.poll();
    this.log.log('/start handler polling');
  }

  private async call(method: string, body: unknown) {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  private async poll() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res: any = await this.call('getUpdates', {
          offset: this.offset,
          timeout: 30,
          allowed_updates: ['message'],
        });
        if (res?.ok && Array.isArray(res.result)) {
          for (const u of res.result) {
            this.offset = u.update_id + 1;
            await this.handle(u).catch(() => {});
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async handle(update: any) {
    const msg = update?.message;
    if (!msg?.text || typeof msg.chat?.id === 'undefined') return;
    if (String(msg.chat.id) !== OWNER_TELEGRAM_ID) return;
    if (msg.text.startsWith('/start')) {
      await this.call('sendMessage', {
        chat_id: msg.chat.id,
        text: 'Клуб дегустаторов togomoscow\n\nОценивайте блюда и напитки и попадите на закрытую вечеринку топ дегустаторов Москвы! 🔥',
        reply_markup: {
          inline_keyboard: [[{ text: '🚀 Открыть приложение', web_app: { url: APP_URL } }]],
        },
      });
      // pin a support message at the top of this chat so it's always reachable
      try {
        const sup: any = await this.call('sendMessage', {
          chat_id: msg.chat.id,
          text: '🛟 Поддержка togomoscow\n\nИдея, вопрос или проблема? Напишете нам 😊',
          reply_markup: {
            inline_keyboard: [[{ text: 'Поддержка', url: 'https://t.me/moscow_suppo' }]],
          },
        });
        const mid = sup?.result?.message_id;
        if (mid) await this.call('pinChatMessage', { chat_id: msg.chat.id, message_id: mid, disable_notification: true });
      } catch {
        /* pin not critical */
      }
    }
  }
}
