import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import {
  formatReminderCreated,
  formatReminderMissingCar,
  formatReminderMissingMileage
} from './reminderFormatter.js';

const reminder: ReminderRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  serviceEntryId: null,
  type: 'manual',
  title: 'страховка',
  description: null,
  dueDate: '2026-09-01',
  dueMileage: null,
  status: 'active',
  lastNotifiedAt: null,
  completedAt: null,
  createdAt: new Date('2026-05-17T00:00:00.000Z'),
  updatedAt: new Date('2026-05-17T00:00:00.000Z')
};

describe('formatReminderCreated', () => {
  it('formats date reminder confirmation', () => {
    expect(formatReminderCreated(reminder)).toBe([
      'Напоминание добавлено:',
      'Задача: страховка',
      'Дата: 01.09.2026'
    ].join('\n'));
  });

  it('formats mileage reminder confirmation', () => {
    expect(
      formatReminderCreated({
        ...reminder,
        title: 'масло',
        dueDate: null,
        dueMileage: 134000
      })
    ).toBe([
      'Напоминание добавлено:',
      'Задача: масло',
      'Пробег: 134000 км'
    ].join('\n'));
  });
});

describe('reminder helper messages', () => {
  it('formats missing car message', () => {
    expect(formatReminderMissingCar()).toBe([
      'Сначала добавь автомобиль:',
      '/car Toyota Camry'
    ].join('\n'));
  });

  it('formats missing mileage message', () => {
    expect(formatReminderMissingMileage()).toBe([
      'Для напоминания по пробегу сначала обнови текущий пробег:',
      '/mileage 126000'
    ].join('\n'));
  });
});
