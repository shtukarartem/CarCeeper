import type {
  ReminderNotificationInput,
  ReminderNotificationSender
} from './reminderCheckService.js';
import { formatReminderNotification } from './reminderNotificationFormatter.js';

export type TelegramReminderApi = {
  sendMessage(chatId: string, text: string): Promise<unknown>;
};

export function createTelegramReminderNotificationSender(
  api: TelegramReminderApi
): ReminderNotificationSender {
  return {
    async sendReminderNotification(input: ReminderNotificationInput): Promise<void> {
      await api.sendMessage(input.telegramId, formatReminderNotification(input));
    }
  };
}
