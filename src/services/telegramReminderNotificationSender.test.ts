import { describe, expect, it, vi } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import type { ReminderDueItem } from './reminderDueCalculator.js';
import { createTelegramReminderNotificationSender } from './telegramReminderNotificationSender.js';

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

const dueItem: ReminderDueItem = {
  reminder,
  dateStatus: 'overdue',
  daysDelta: 0,
  mileageStatus: null,
  mileageDelta: null,
  isDue: true,
  isUpcoming: false,
  shouldShowInTodo: true,
  shouldNotify: true
};

describe('createTelegramReminderNotificationSender', () => {
  it('sends formatted reminder notification through Telegram API', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const sender = createTelegramReminderNotificationSender({ sendMessage });

    await sender.sendReminderNotification({
      reminder,
      dueItem,
      telegramId: '123',
      carName: 'Toyota Camry',
      currentMileage: 126000
    });

    expect(sendMessage).toHaveBeenCalledWith(
      '123',
      [
        'Напоминание:',
        'Пора сделать: страховка',
        'Автомобиль: Toyota Camry',
        'Дата: 01.09.2026'
      ].join('\n')
    );
  });

  it('propagates Telegram API errors', async () => {
    const error = new Error('telegram failed');
    const sendMessage = vi.fn().mockRejectedValue(error);
    const sender = createTelegramReminderNotificationSender({ sendMessage });

    await expect(
      sender.sendReminderNotification({
        reminder,
        dueItem,
        telegramId: '123',
        carName: 'Toyota Camry',
        currentMileage: 126000
      })
    ).rejects.toThrow('telegram failed');
  });
});
