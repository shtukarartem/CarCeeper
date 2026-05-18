import type { Bot } from 'grammy';
import { formatServiceTypes } from '../../services/serviceTypesFormatter.js';

export function registerServiceTypesCommand(bot: Bot): void {
  bot.command('service_types', async (ctx) => {
    await ctx.reply(formatServiceTypes());
  });
}
