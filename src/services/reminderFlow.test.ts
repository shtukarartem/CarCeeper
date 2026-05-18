import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import { calculateReminderDueItem } from './reminderDueCalculator.js';
import { formatReminderNotification } from './reminderNotificationFormatter.js';
import { parseReminderInput } from './reminderParser.js';
import { formatTodo } from './todoFormatter.js';

describe('reminder flow', () => {
  it('handles relative mileage reminder from parsing to todo and notification', () => {
    const parsed = parseReminderInput('масло через 8000км');
    const currentMileage = 126000;

    expect(parsed).toEqual({
      title: 'масло',
      dueDate: null,
      dueMileage: 8000,
      mileageMode: 'relative'
    });

    if (parsed.mileageMode !== 'relative') {
      throw new Error('Expected relative mileage reminder');
    }

    const reminder: ReminderRecord = {
      id: 12,
      userId: 1,
      carId: 1,
      serviceEntryId: null,
      type: 'mileage',
      title: parsed.title,
      description: null,
      dueDate: null,
      dueMileage: currentMileage + parsed.dueMileage,
      status: 'active',
      lastNotifiedAt: null,
      completedAt: null,
      createdAt: new Date('2026-05-18T00:00:00.000Z'),
      updatedAt: new Date('2026-05-18T00:00:00.000Z')
    };

    const upcomingItem = calculateReminderDueItem(reminder, {
      currentMileage: 133500,
      today: '2026-05-18'
    });

    expect(upcomingItem).toMatchObject({
      mileageStatus: 'upcoming',
      mileageDelta: 500,
      isDue: false,
      isUpcoming: true,
      shouldShowInTodo: true,
      shouldNotify: false
    });
    expect(
      formatTodo([upcomingItem], {
        hasCurrentMileage: true,
        hasMileageReminders: true
      })
    ).toContain('#12 Скоро: масло - через 500 км');

    const dueItem = calculateReminderDueItem(reminder, {
      currentMileage: 134000,
      today: '2026-05-18'
    });

    expect(dueItem).toMatchObject({
      mileageStatus: 'overdue',
      mileageDelta: 0,
      isDue: true,
      shouldNotify: true
    });
    expect(
      formatReminderNotification({
        reminder,
        dueItem,
        telegramId: '123',
        carName: 'Toyota Camry',
        currentMileage: 134000
      })
    ).toBe([
      'Напоминание:',
      'Пора сделать: масло',
      'Автомобиль: Toyota Camry',
      'Пробег: 134000 км'
    ].join('\n'));
  });
});
