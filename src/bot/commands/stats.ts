import type { Bot } from 'grammy';
import { getCurrentMonthStatsByUserId } from '../../db/repositories/expenseRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatMonthlyStats } from '../../services/statsFormatter.js';

export function registerStatsCommand(bot: Bot): void {
  bot.command(['stats', 'month'], async (ctx) => {
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

    const stats = await getCurrentMonthStatsByUserId(user.id);
    await ctx.reply(formatMonthlyStats(stats));
  });
}
