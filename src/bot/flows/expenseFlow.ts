import type { Bot } from 'grammy';
import { ExpenseParseError, parseExpenseInput } from '../../services/expenseParser.js';
import { createExpenseFromParsedInput } from '../actions/expenseAction.js';
import { clearUserFlowState, getUserFlowState, setUserFlowState } from './flowState.js';

const amountPattern = /^-?\d+(?:[.,]\d{1,2})?$/;

function parsePositiveAmount(value: string): number | null {
  const trimmedValue = value.trim();

  if (!amountPattern.test(trimmedValue)) {
    return null;
  }

  const amount = Number(trimmedValue.replace(',', '.'));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export function registerExpenseFlow(bot: Bot): void {
  bot.callbackQuery('menu:expense:start', async (ctx) => {
    await ctx.answerCallbackQuery();

    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    setUserFlowState(userId, {
      type: 'expense',
      step: 'description',
      data: {}
    });

    await ctx.reply([
      'Добавление расхода.',
      'Что за расход?',
      'Например: мойка',
      '',
      'Отмена: /cancel'
    ].join('\n'));
  });

  bot.on('message:text', async (ctx, next) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await next();
      return;
    }

    const state = getUserFlowState(userId);

    if (!state || state.type !== 'expense') {
      await next();
      return;
    }

    const text = ctx.message.text.trim();

    if (text.startsWith('/')) {
      await ctx.reply('Заверши текущее действие или отмени его командой /cancel.');
      return;
    }

    if (state.step === 'description') {
      if (text.length === 0) {
        await ctx.reply('Описание расхода не должно быть пустым. Например: мойка');
        return;
      }

      setUserFlowState(userId, {
        type: 'expense',
        step: 'amount',
        data: {
          description: text
        }
      });
      await ctx.reply('Какая сумма? Например: 800');
      return;
    }

    const amount = parsePositiveAmount(text);

    if (amount === null) {
      await ctx.reply('Сумма должна быть числом больше нуля. Например: 800');
      return;
    }

    try {
      const parsedExpense = parseExpenseInput(`${state.data.description} ${amount}`);

      clearUserFlowState(userId);
      await createExpenseFromParsedInput(ctx, parsedExpense);
    } catch (error) {
      if (error instanceof ExpenseParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
