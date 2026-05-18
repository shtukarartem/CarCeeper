import type { Bot } from 'grammy';
import { unknownMessage } from '../messages.js';

export function registerUnknownMessageHandler(bot: Bot): void {
  bot.on('message:text', async (ctx) => {
    await ctx.reply(unknownMessage);
  });
}
