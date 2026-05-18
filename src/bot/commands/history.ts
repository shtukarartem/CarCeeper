import type { Bot } from 'grammy';
import { getRecentExpensesByUserId } from '../../db/repositories/expenseRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatExpenseHistory } from '../../services/historyFormatter.js';

export function registerHistoryCommand(bot: Bot): void {
  bot.command('history', async (ctx) => {
    const from = ctx.from;

    if (!from) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    const user = await upsertTelegramUser({
      telegramId: from.id,
      username: from.username,
      firstName: from.first_name
    });

    const expenses = await getRecentExpensesByUserId(user.id, 10);
    await ctx.reply(formatExpenseHistory(expenses));
  });
}
