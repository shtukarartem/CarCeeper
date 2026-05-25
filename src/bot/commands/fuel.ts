import type { Bot } from 'grammy';
import { FuelParseError, parseFuelInput } from '../../services/fuelParser.js';
import { createFuelFromParsedInput } from '../actions/fuelAction.js';

export function registerFuelCommand(bot: Bot): void {
  bot.command('fuel', async (ctx) => {
    try {
      await createFuelFromParsedInput(ctx, parseFuelInput(ctx.match));
    } catch (error) {
      if (error instanceof FuelParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
