import type { ReminderRecord } from '../domain/reminders.js';
import type { ReminderDueItem } from './reminderDueCalculator.js';
import { formatDate } from '../utils/formatters.js';

export type FormatTodoOptions = {
  hasCurrentMileage: boolean;
  hasMileageReminders: boolean;
};

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

function formatDayWord(days: number): string {
  const lastTwoDigits = days % 100;
  const lastDigit = days % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }

  if (lastDigit === 1) {
    return 'день';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }

  return 'дней';
}

function formatDateDetail(item: ReminderDueItem): string | null {
  if (item.reminder.dueDate === null) {
    return null;
  }

  if (item.dateStatus === 'upcoming' && item.daysDelta !== null) {
    return `через ${item.daysDelta} ${formatDayWord(item.daysDelta)}`;
  }

  return formatDate(item.reminder.dueDate);
}

function formatMileageDetail(item: ReminderDueItem): string | null {
  if (item.reminder.dueMileage === null) {
    return null;
  }

  if (item.mileageStatus === 'upcoming' && item.mileageDelta !== null) {
    return `через ${item.mileageDelta} км`;
  }

  return formatMileage(item.reminder.dueMileage);
}

function formatTodoItem(item: ReminderDueItem): string {
  const statusText = item.isDue ? 'Просрочено' : 'Скоро';
  const details = [formatDateDetail(item), formatMileageDetail(item)].filter(Boolean);

  return `#${item.reminder.id} ${statusText}: ${item.reminder.title} - ${details.join(' - ')}`;
}

export function formatTodo(items: ReminderDueItem[], options: FormatTodoOptions): string {
  if (items.length === 0) {
    const lines = [
      'Ближайших задач пока нет.',
      'Добавь напоминание:',
      '/remind страховка 2026-09-01'
    ];

    if (!options.hasCurrentMileage && options.hasMileageReminders) {
      lines.push('Для задач по пробегу сначала обнови пробег: /mileage 126000');
    }

    return lines.join('\n');
  }

  const lines = ['Ближайшие задачи:', ...items.map(formatTodoItem), '', 'Чтобы отметить задачу выполненной:'];
  const firstReminder: ReminderRecord = items[0].reminder;
  lines.push(`/done ${firstReminder.id}`);

  if (!options.hasCurrentMileage && options.hasMileageReminders) {
    lines.push('');
    lines.push('Для задач по пробегу сначала обнови пробег: /mileage 126000');
  }

  return lines.join('\n');
}
