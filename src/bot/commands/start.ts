import type { Bot } from 'grammy';
import { startMessage } from '../messages.js';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';

export function registerStartCommand(bot: Bot): void {
  bot.command('start', async (ctx) => {
    const from = ctx.from;

    if (!from) {
      await ctx.reply(startMessage);
      return;
    }

    const user = await upsertTelegramUser({
      telegramId: from.id,
      username: from.username,
      firstName: from.first_name
    });

    const activeCar = await getActiveCarByUserId(user.id);
    const activeCarLines = activeCar
      ? [
          '',
          `Текущий автомобиль: ${activeCar.name}`,
          activeCar.currentMileage === null ? null : `Текущий пробег: ${activeCar.currentMileage} км`
        ].filter((line): line is string => line !== null)
      : [];
    const message = [startMessage, ...activeCarLines].join('\n');

    await ctx.reply(message);
  });
}
