import type { Context } from 'grammy';
import { loadAppConfig } from '../../config/env.js';
import { getActiveCarByUserId, updateCarMileage } from '../../db/repositories/carRepository.js';
import { createServiceReminderIfNeeded } from '../../db/repositories/reminderRepository.js';
import { createServiceEntryWithExpense } from '../../db/repositories/serviceRepository.js';
import { upsertTelegramUser } from '../../db/repositories/userRepository.js';
import { formatServiceCreated, formatServiceMissingCar } from '../../services/serviceFormatter.js';
import type { ParsedServiceInput } from '../../services/serviceParser.js';
import { calculateServiceSchedule } from '../../services/serviceScheduleCalculator.js';

function formatServiceDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createServiceFromParsedInput(
  ctx: Context,
  parsedService: ParsedServiceInput
): Promise<void> {
  const from = ctx.from;

  if (!from) {
    await ctx.reply('Не удалось определить пользователя Telegram.');
    return;
  }

  const config = loadAppConfig();
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

  const serviceDate = formatServiceDate(new Date());
  const schedule = calculateServiceSchedule({
    serviceMileage: parsedService.serviceMileage,
    serviceDate,
    nextIntervalKm: parsedService.nextIntervalKm,
    nextIntervalMonths: parsedService.nextIntervalMonths
  });

  const created = await createServiceEntryWithExpense({
    userId: user.id,
    carId: activeCar.id,
    serviceType: parsedService.serviceType,
    title: parsedService.title,
    amount: parsedService.amount,
    currency: config.defaultCurrency,
    serviceMileage: parsedService.serviceMileage,
    nextIntervalKm: parsedService.nextIntervalKm,
    nextDueMileage: schedule.nextDueMileage,
    nextIntervalMonths: parsedService.nextIntervalMonths,
    nextDueDate: schedule.nextDueDate,
    comment: parsedService.comment || null,
    serviceDate
  });

  const serviceMileage = parsedService.serviceMileage;
  const currentMileageUpdated =
    serviceMileage !== null &&
    (activeCar.currentMileage === null || serviceMileage > activeCar.currentMileage);
  const historicalMileage =
    serviceMileage !== null &&
    activeCar.currentMileage !== null &&
    serviceMileage < activeCar.currentMileage;

  if (currentMileageUpdated) {
    await updateCarMileage(activeCar.id, serviceMileage);
  }

  let serviceReminderCreated = false;

  try {
    const reminder = await createServiceReminderIfNeeded({
      userId: user.id,
      carId: activeCar.id,
      serviceEntryId: created.serviceEntry.id,
      title: created.serviceEntry.title,
      dueDate: created.serviceEntry.nextDueDate,
      dueMileage: created.serviceEntry.nextDueMileage
    });

    serviceReminderCreated = reminder !== null;
  } catch (error) {
    console.error('Failed to create service reminder:', error);
  }

  await ctx.reply(
    formatServiceCreated({
      carName: activeCar.name,
      serviceEntry: created.serviceEntry,
      expense: created.expense,
      currentMileageUpdated,
      historicalMileage,
      serviceReminderCreated
    })
  );
}
