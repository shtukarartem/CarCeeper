import type { Bot } from 'grammy';
import { ExpenseParseError, parseExpenseInput } from '../../services/expenseParser.js';
import { createExpenseFromParsedInput } from '../actions/expenseAction.js';

export function registerAddCommand(bot: Bot): void {
  bot.command('add', async (ctx) => {
    try {
      await createExpenseFromParsedInput(ctx, parseExpenseInput(ctx.match));
    } catch (error) {
      if (error instanceof ExpenseParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
