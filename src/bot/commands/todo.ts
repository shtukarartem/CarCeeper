import type { Bot } from 'grammy';
import { getActiveCarByUserId } from '../../db/repositories/carRepository.js';
import { getActiveRemindersByCarId } from '../../db/repositories/reminderRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatReminderMissingCar } from '../../services/reminderFormatter.js';
import { calculateReminderDueItems } from '../../services/reminderDueCalculator.js';
import { formatTodo } from '../../services/todoFormatter.js';

export function registerTodoCommand(bot: Bot): void {
  bot.command('todo', async (ctx) => {
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

    const reminders = await getActiveRemindersByCarId(activeCar.id);
    const dueItems = calculateReminderDueItems(reminders, {
      currentMileage: activeCar.currentMileage,
      today: new Date()
    });

    await ctx.reply(
      formatTodo(dueItems, {
        hasCurrentMileage: activeCar.currentMileage !== null,
        hasMileageReminders: reminders.some((reminder) => reminder.dueMileage !== null)
      })
    );
  });
}
