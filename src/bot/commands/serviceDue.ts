import type { Bot } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import {
  getUpcomingServiceEntriesByDate,
  getUpcomingServiceEntriesByMileage,
  type ServiceEntryRecord
} from '../../db/repositories/serviceRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { calculateServiceDueItems } from '../../services/serviceDueCalculator.js';
import { formatServiceDue, formatServiceMissingCar } from '../../services/serviceFormatter.js';

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function mergeServiceEntries(entries: ServiceEntryRecord[]): ServiceEntryRecord[] {
  const byId = new Map<number, ServiceEntryRecord>();

  for (const entry of entries) {
    byId.set(entry.id, entry);
  }

  return [...byId.values()];
}

export function registerServiceDueCommand(bot: Bot): void {
  bot.command('service_due', async (ctx) => {
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
      await ctx.reply(formatServiceMissingCar());
      return;
    }

    const today = new Date();
    const [mileageEntries, dateEntries] = await Promise.all([
      activeCar.currentMileage === null
        ? Promise.resolve([])
        : getUpcomingServiceEntriesByMileage(activeCar.id, activeCar.currentMileage, 1000, 10),
      getUpcomingServiceEntriesByDate(activeCar.id, addDays(today, 30), 10)
    ]);
    const dueItems = calculateServiceDueItems(mergeServiceEntries([...mileageEntries, ...dateEntries]), {
      currentMileage: activeCar.currentMileage,
      today
    });

    await ctx.reply(formatServiceDue(dueItems, activeCar.currentMileage !== null));
  });
}
