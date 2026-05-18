import type { Bot } from 'grammy';
import { completeReminderForUser } from '../../db/repositories/reminderRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatReminderDone, formatReminderDoneNotFound } from '../../services/doneFormatter.js';
import { DoneParseError, parseDoneInput } from '../../services/doneParser.js';

export function registerDoneCommand(bot: Bot): void {
  bot.command('done', async (ctx) => {
    const from = ctx.from;

    if (!from) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    try {
      const reminderId = parseDoneInput(ctx.match);
      const user = await upsertTelegramUser({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name
      });
      const reminder = await completeReminderForUser(user.id, reminderId);

      if (!reminder) {
        await ctx.reply(formatReminderDoneNotFound());
        return;
      }

      await ctx.reply(formatReminderDone(reminder));
    } catch (error) {
      if (error instanceof DoneParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
