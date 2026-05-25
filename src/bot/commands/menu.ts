import { InlineKeyboard, type Bot } from 'grammy';
import { sendExport } from '../actions/exportAction.js';
import { sendReport } from '../actions/reportAction.js';
import { examplesMessage, helpMessage } from '../messages.js';

function createMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Добавить расход', 'menu:expense:start')
    .row()
    .text('Добавить заправку', 'menu:fuel:start')
    .row()
    .text('Добавить обслуживание', 'menu:service:start')
    .row()
    .text('Отчет за месяц', 'menu:report:month')
    .text('Отчет за год', 'menu:report:year')
    .row()
    .text('Экспорт CSV', 'menu:export:csv')
    .text('Экспорт Excel', 'menu:export:excel')
    .row()
    .text('Примеры', 'menu:examples')
    .text('Помощь', 'menu:help');
}

export function registerMenuCommand(bot: Bot): void {
  bot.command('menu', async (ctx) => {
    await ctx.reply('Что сделать?', {
      reply_markup: createMenuKeyboard()
    });
  });

  bot.callbackQuery('menu:report:month', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendReport(ctx, 'month');
  });

  bot.callbackQuery('menu:report:year', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendReport(ctx, 'year');
  });

  bot.callbackQuery('menu:export:csv', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendExport(ctx, 'csv');
  });

  bot.callbackQuery('menu:export:excel', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendExport(ctx, 'excel');
  });

  bot.callbackQuery('menu:examples', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(examplesMessage);
  });

  bot.callbackQuery('menu:help', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(helpMessage);
  });
}
