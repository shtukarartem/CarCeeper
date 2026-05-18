import type { ReminderRecord } from '../domain/reminders.js';

export function formatReminderDone(reminder: ReminderRecord): string {
  return `Задача выполнена: ${reminder.title}`;
}

export function formatReminderDoneNotFound(): string {
  return [
    'Не нашел активную задачу с таким номером.',
    'Открой список задач: /todo'
  ].join('\n');
}
