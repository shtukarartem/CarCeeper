import type { Bot } from 'grammy';
import { loadAppConfig } from '../../config/env.js';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { getFuelEntriesForStatsByCarId } from '../../db/repositories/fuelRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { calculateFuelConsumption } from '../../services/fuelConsumptionCalculator.js';
import { calculateFuelCostPerKm } from '../../services/fuelCostCalculator.js';
import { formatFuelStats } from '../../services/fuelStatsFormatter.js';
import { missingCarMessage } from '../messages.js';

export function registerFuelStatsCommand(bot: Bot): void {
  const config = loadAppConfig();

  bot.command('fuel_stats', async (ctx) => {
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

    const fuelEntries = await getFuelEntriesForStatsByCarId(activeCar.id);
    const consumption = calculateFuelConsumption(fuelEntries);
    const cost = calculateFuelCostPerKm(fuelEntries);

    await ctx.reply(
      formatFuelStats({
        car: activeCar,
        entryCount: fuelEntries.length,
        consumption,
        cost,
        currency: config.defaultCurrency
      })
    );
  });
}
