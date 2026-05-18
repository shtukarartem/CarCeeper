import type { ReminderRecord } from '../domain/reminders.js';
import { formatDate } from '../utils/formatters.js';

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

export function formatReminderMissingCar(): string {
  return [
    'Сначала добавь автомобиль:',
    '/car Toyota Camry'
  ].join('\n');
}

export function formatReminderMissingMileage(): string {
  return [
    'Для напоминания по пробегу сначала обнови текущий пробег:',
    '/mileage 126000'
  ].join('\n');
}

export function formatReminderCreated(reminder: ReminderRecord): string {
  const lines = [
    'Напоминание добавлено:',
    `Задача: ${reminder.title}`
  ];

  if (reminder.dueDate !== null) {
    lines.push(`Дата: ${formatDate(reminder.dueDate)}`);
  }

  if (reminder.dueMileage !== null) {
    lines.push(`Пробег: ${formatMileage(reminder.dueMileage)}`);
  }

  return lines.join('\n');
}
