import type { Bot } from 'grammy';
import { saveActiveCarForUser } from '../../db/repositories/carRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';

const missingCarNameMessage = [
  'Укажи автомобиль. Например:',
  '/car Toyota Camry'
].join('\n');

export function registerCarCommand(bot: Bot): void {
  bot.command('car', async (ctx) => {
    const carName = ctx.match.trim();

    if (!carName) {
      await ctx.reply(missingCarNameMessage);
      return;
    }

    const from = ctx.from;

    if (!from) {
      await ctx.reply('Не удалось определить пользователя Telegram.');
      return;
    }

    const user = await upsertTelegramUser({
      telegramId: from.id,
      username: from.username,
      firstName: from.first_name
    });

    const car = await saveActiveCarForUser(user.id, carName);

    await ctx.reply([
      `Автомобиль сохранен: ${car.name}`,
      'Теперь можно записывать расходы через /add.'
    ].join('\n'));
  });
}
