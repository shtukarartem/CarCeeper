import type { Bot } from 'grammy';
import { loadAppConfig } from '../../config/env.js';
import { getActiveCarByUserId, updateCarMileage } from '../../db/repositories/carRepository.js';
import { createFuelEntryWithExpense } from '../../db/repositories/fuelRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { resolveFuelMileageUpdate } from '../../domain/mileage.js';
import { FuelParseError, parseFuelInput } from '../../services/fuelParser.js';
import { formatAmount } from '../../utils/formatters.js';
import { missingCarMessage } from '../messages.js';

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

function formatLiters(liters: number): string {
  return Number.isInteger(liters) ? String(liters) : liters.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

export function registerFuelCommand(bot: Bot): void {
  const config = loadAppConfig();

  bot.command('fuel', async (ctx) => {
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
      const parsedFuel = parseFuelInput(ctx.match);
      const mileageDecision = resolveFuelMileageUpdate(activeCar.currentMileage, parsedFuel.mileage);

      const created = await createFuelEntryWithExpense({
        userId: user.id,
        carId: activeCar.id,
        liters: parsedFuel.liters,
        amount: parsedFuel.amount,
        pricePerLiter: parsedFuel.pricePerLiter,
        mileage: parsedFuel.mileage,
        currency: config.defaultCurrency,
        comment: 'заправка'
      });

      if (mileageDecision.shouldUpdateCar) {
        await updateCarMileage(activeCar.id, mileageDecision.nextMileage);
      }

      const response = [
        'Заправка добавлена:',
        `Автомобиль: ${activeCar.name}`,
        `Литры: ${formatLiters(created.fuelEntry.liters)} л`,
        `Сумма: ${formatAmount(created.expense.amount)} ${created.expense.currency}`,
        `Цена за литр: ${formatAmount(created.fuelEntry.pricePerLiter)} ${created.expense.currency}`,
        `Пробег: ${formatMileage(created.fuelEntry.mileage)}`
      ];

      if (mileageDecision.status === 'historical') {
        response.push('Текущий пробег автомобиля не изменен.');
      }

      await ctx.reply(response.join('\n'));
    } catch (error) {
      if (error instanceof FuelParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
