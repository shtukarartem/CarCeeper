import type { Bot } from 'grammy';
import { getTodayExpensesByUserId } from '../../db/repositories/expenseRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatTodayExpenses } from '../../services/todayFormatter.js';

export function registerTodayCommand(bot: Bot): void {
  bot.command('today', async (ctx) => {
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

    const expenses = await getTodayExpensesByUserId(user.id);
    await ctx.reply(formatTodayExpenses(expenses));
  });
}
