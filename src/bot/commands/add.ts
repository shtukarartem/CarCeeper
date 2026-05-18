import type { Bot } from 'grammy';
import { loadAppConfig } from '../../config/env.js';
import { getExpenseCategoryLabel } from '../../domain/expenseCategories.js';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { createExpense } from '../../db/repositories/expenseRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { ExpenseParseError, parseExpenseInput } from '../../services/expenseParser.js';
import { missingCarMessage } from '../messages.js';

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export function registerAddCommand(bot: Bot): void {
  const config = loadAppConfig();

  bot.command('add', async (ctx) => {
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

    const activeCar = await getActiveCarByUserId(user.id);

    if (!activeCar) {
      await ctx.reply(missingCarMessage);
      return;
    }

    try {
      const parsedExpense = parseExpenseInput(ctx.match);
      const expense = await createExpense({
        userId: user.id,
        carId: activeCar.id,
        category: parsedExpense.category,
        amount: parsedExpense.amount,
        currency: config.defaultCurrency,
        comment: parsedExpense.comment || null
      });

      await ctx.reply([
        'Расход добавлен:',
        `Категория: ${getExpenseCategoryLabel(expense.category)}`,
        `Сумма: ${formatAmount(expense.amount)} ${expense.currency}`,
        `Автомобиль: ${activeCar.name}`,
        `Комментарий: ${expense.comment || '-'}`
      ].join('\n'));
    } catch (error) {
      if (error instanceof ExpenseParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
