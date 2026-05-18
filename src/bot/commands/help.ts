import type { Bot } from 'grammy';
import { helpMessage } from '../messages.js';

export function registerHelpCommand(bot: Bot): void {
  bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage);
  });
}
