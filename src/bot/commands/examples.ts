import type { Bot } from 'grammy';
import { examplesMessage } from '../messages.js';

export function registerExamplesCommand(bot: Bot): void {
  bot.command('examples', async (ctx) => {
    await ctx.reply(examplesMessage);
  });
}
