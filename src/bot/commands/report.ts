import type { Bot } from 'grammy';
import { sendReport } from '../actions/reportAction.js';

export function registerReportCommand(bot: Bot): void {
  bot.command('report', async (ctx) => {
    await sendReport(ctx, ctx.match);
  });
}
