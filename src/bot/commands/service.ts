import type { Bot } from 'grammy';
import { createServiceFromParsedInput } from '../actions/serviceAction.js';
import { ServiceParseError, parseServiceInput } from '../../services/serviceParser.js';

export function registerServiceCommand(bot: Bot): void {
  bot.command('service', async (ctx) => {
    try {
      await createServiceFromParsedInput(ctx, parseServiceInput(ctx.match));
    } catch (error) {
      if (error instanceof ServiceParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
