import type { Bot } from 'grammy';
import { getActiveCarByUserId, updateCarMileage } from '../../db/repositories/carRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { resolveManualMileageUpdate } from '../../domain/mileage.js';
import { MileageParseError, parseMileageInput } from '../../services/mileageParser.js';
import { missingCarMessage } from '../messages.js';

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

export function registerMileageCommand(bot: Bot): void {
  bot.command('mileage', async (ctx) => {
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

    const activeCar = await getActiveCarByUserId(user.id);

    if (!activeCar) {
      await ctx.reply(missingCarMessage);
      return;
    }

    try {
      const requestedMileage = parseMileageInput(ctx.match);
      const decision = resolveManualMileageUpdate(activeCar.currentMileage, requestedMileage);

      if (decision.status === 'rejected_decrease') {
        await ctx.reply([
          'Новый пробег меньше текущего:',
          `Автомобиль: ${activeCar.name}`,
          `Текущий пробег: ${formatMileage(decision.currentMileage)}`,
          `Введенный пробег: ${formatMileage(decision.requestedMileage)}`,
          'Пробег не обновлен.'
        ].join('\n'));
        return;
      }

      if (decision.status === 'unchanged') {
        await ctx.reply([
          'Пробег уже установлен:',
          `Автомобиль: ${activeCar.name}`,
          `Пробег: ${formatMileage(decision.nextMileage)}`
        ].join('\n'));
        return;
      }

      const updatedCar = await updateCarMileage(activeCar.id, decision.nextMileage);

      await ctx.reply([
        'Пробег обновлен:',
        `Автомобиль: ${updatedCar.name}`,
        `Пробег: ${formatMileage(updatedCar.currentMileage ?? decision.nextMileage)}`
      ].join('\n'));
    } catch (error) {
      if (error instanceof MileageParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
