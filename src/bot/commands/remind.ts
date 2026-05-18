import type { Bot } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { createReminder } from '../../db/repositories/reminderRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import {
  formatReminderCreated,
  formatReminderMissingCar,
  formatReminderMissingMileage
} from '../../services/reminderFormatter.js';
import { ReminderParseError, parseReminderInput } from '../../services/reminderParser.js';

export function registerRemindCommand(bot: Bot): void {
  bot.command('remind', async (ctx) => {
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
      await ctx.reply(formatReminderMissingCar());
      return;
    }

    try {
      const parsedReminder = parseReminderInput(ctx.match);
      const dueMileage =
        parsedReminder.mileageMode === 'relative'
          ? activeCar.currentMileage === null
            ? null
            : activeCar.currentMileage + parsedReminder.dueMileage
          : parsedReminder.dueMileage;

      if (parsedReminder.mileageMode === 'relative' && dueMileage === null) {
        await ctx.reply(formatReminderMissingMileage());
        return;
      }

      const reminder = await createReminder({
        userId: user.id,
        carId: activeCar.id,
        type: parsedReminder.dueDate === null ? 'mileage' : 'date',
        title: parsedReminder.title,
        dueDate: parsedReminder.dueDate,
        dueMileage
      });

      await ctx.reply(formatReminderCreated(reminder));
    } catch (error) {
      if (error instanceof ReminderParseError) {
        await ctx.reply(error.message);
        return;
      }

      throw error;
    }
  });
}
