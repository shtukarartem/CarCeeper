import type { Bot } from 'grammy';
import { notImplementedMessage } from '../messages.js';

const placeholderCommands: string[] = [];

export function registerPlaceholderCommands(bot: Bot): void {
  for (const command of placeholderCommands) {
    bot.command(command, async (ctx) => {
      await ctx.reply(notImplementedMessage);
    });
  }
}
