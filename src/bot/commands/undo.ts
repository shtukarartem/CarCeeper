import type { Bot } from 'grammy';
import { deleteLastExpenseByUserId } from '../../db/repositories/expenseRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatDeletedExpense } from '../../services/undoFormatter.js';

export function registerUndoCommand(bot: Bot): void {
  bot.command('undo', async (ctx) => {
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

    const deletedExpense = await deleteLastExpenseByUserId(user.id);

    if (!deletedExpense) {
      await ctx.reply('Удалять пока нечего.');
      return;
    }

    await ctx.reply(formatDeletedExpense(deletedExpense));
  });
}
