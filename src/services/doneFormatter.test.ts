import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import { formatReminderDone, formatReminderDoneNotFound } from './doneFormatter.js';

const reminder: ReminderRecord = {
  id: 12,
  userId: 1,
  carId: 1,
  serviceEntryId: null,
  type: 'manual',
  title: 'масло',
  description: null,
  dueDate: null,
  dueMileage: 134000,
  status: 'completed',
  lastNotifiedAt: null,
  completedAt: new Date('2026-05-17T00:00:00.000Z'),
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-17T00:00:00.000Z')
};

describe('done formatter', () => {
  it('formats completed reminder', () => {
    expect(formatReminderDone(reminder)).toBe('Задача выполнена: масло');
  });

  it('formats not found message', () => {
    expect(formatReminderDoneNotFound()).toBe([
      'Не нашел активную задачу с таким номером.',
      'Открой список задач: /todo'
    ].join('\n'));
  });
});
