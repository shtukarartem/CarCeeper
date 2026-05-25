import type { Bot } from 'grammy';
import { clearUserFlowState } from '../flows/flowState.js';

export function registerCancelCommand(bot: Bot): void {
  bot.command('cancel', async (ctx) => {
    const userId = ctx.from?.id;

    if (!userId) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    const hadActiveFlow = clearUserFlowState(userId);

    await ctx.reply(hadActiveFlow ? 'Действие отменено.' : 'Нет активного действия для отмены.');
  });
}
