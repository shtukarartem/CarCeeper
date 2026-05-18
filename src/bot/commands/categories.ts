import type { Bot } from 'grammy';
import { formatExpenseCategories } from '../../services/categoriesFormatter.js';

export function registerCategoriesCommand(bot: Bot): void {
  bot.command('categories', async (ctx) => {
    await ctx.reply(formatExpenseCategories());
  });
}
