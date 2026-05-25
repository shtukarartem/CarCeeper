import type { Bot } from 'grammy';
import { sendExport } from '../actions/exportAction.js';

export function registerExportCommand(bot: Bot): void {
  bot.command('export', async (ctx) => {
    await sendExport(ctx, ctx.match);
  });
}
