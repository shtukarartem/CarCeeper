import type { Bot } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { getRecentServiceEntriesByCarId } from '../../db/repositories/serviceRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatServiceHistory, formatServiceMissingCar } from '../../services/serviceFormatter.js';

export function registerServicesCommand(bot: Bot): void {
  bot.command('services', async (ctx) => {
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

    const serviceEntries = await getRecentServiceEntriesByCarId(activeCar.id, 10);
    await ctx.reply(formatServiceHistory(serviceEntries));
  });
}
