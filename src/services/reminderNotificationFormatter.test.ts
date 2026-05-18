import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import type { ReminderDueItem } from './reminderDueCalculator.js';
import { formatReminderNotification } from './reminderNotificationFormatter.js';

const reminder: ReminderRecord = {
  id: 12,
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

function dueItem(reminderInput: ReminderRecord): ReminderDueItem {
  return {
    reminder: reminderInput,
    dateStatus: reminderInput.dueDate === null ? null : 'overdue',
    daysDelta: reminderInput.dueDate === null ? null : 0,
    mileageStatus: reminderInput.dueMileage === null ? null : 'overdue',
    mileageDelta: reminderInput.dueMileage === null ? null : 0,
    isDue: true,
    isUpcoming: false,
    shouldShowInTodo: true,
    shouldNotify: true
  };
}

describe('formatReminderNotification', () => {
  it('formats date reminder notification', () => {
    expect(
      formatReminderNotification({
        reminder,
        dueItem: dueItem(reminder),
        telegramId: '123',
        carName: 'Toyota Camry',
        currentMileage: 126000
      })
    ).toBe([
      'Напоминание:',
      'Пора сделать: страховка',
      'Автомобиль: Toyota Camry',
      'Дата: 01.09.2026'
    ].join('\n'));
  });

  it('formats mileage reminder notification', () => {
    const mileageReminder = {
      ...reminder,
      title: 'масло',
      dueDate: null,
      dueMileage: 134000
    };

    expect(
      formatReminderNotification({
        reminder: mileageReminder,
        dueItem: dueItem(mileageReminder),
        telegramId: '123',
        carName: 'Toyota Camry',
        currentMileage: 134500
      })
    ).toBe([
      'Напоминание:',
      'Пора сделать: масло',
      'Автомобиль: Toyota Camry',
      'Пробег: 134000 км'
    ].join('\n'));
  });

  it('formats date and mileage reminder notification', () => {
    const serviceReminder = {
      ...reminder,
      title: 'техосмотр',
      dueMileage: 150000
    };

    expect(
      formatReminderNotification({
        reminder: serviceReminder,
        dueItem: dueItem(serviceReminder),
        telegramId: '123',
        carName: 'Toyota Camry',
        currentMileage: 150000
      })
    ).toBe([
      'Напоминание:',
      'Пора сделать: техосмотр',
      'Автомобиль: Toyota Camry',
      'Дата: 01.09.2026',
      'Пробег: 150000 км'
    ].join('\n'));
  });
});
