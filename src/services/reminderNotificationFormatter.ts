import type { ReminderNotificationInput } from './reminderCheckService.js';
import { formatDate } from '../utils/formatters.js';

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

export function formatReminderNotification(input: ReminderNotificationInput): string {
  const lines = [
    'Напоминание:',
    `Пора сделать: ${input.reminder.title}`,
    `Автомобиль: ${input.carName}`
  ];

  if (input.reminder.dueDate !== null) {
    lines.push(`Дата: ${formatDate(input.reminder.dueDate)}`);
  }

  if (input.reminder.dueMileage !== null) {
    lines.push(`Пробег: ${formatMileage(input.reminder.dueMileage)}`);
  }

  return lines.join('\n');
}
