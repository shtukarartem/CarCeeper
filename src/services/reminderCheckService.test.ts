import { describe, expect, it, vi } from 'vitest';
import type { ReminderNotificationCandidate } from '../db/repositories/reminderRepository.js';
import type { ReminderRecord } from '../domain/reminders.js';
import { checkDueReminders, type ReminderNotificationSender } from './reminderCheckService.js';

const reminder: ReminderRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  serviceEntryId: null,
  type: 'manual',
  title: 'страховка',
  description: null,
  dueDate: '2026-05-17',
  dueMileage: null,
  status: 'active',
  lastNotifiedAt: null,
  completedAt: null,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z')
};

function candidate(overrides: Partial<ReminderNotificationCandidate> = {}): ReminderNotificationCandidate {
  return {
    reminder,
    telegramId: '123',
    carName: 'Toyota Camry',
    currentMileage: 126000,
    ...overrides
  };
}

function sender(): ReminderNotificationSender & {
  sendReminderNotification: ReturnType<typeof vi.fn>;
} {
  return {
    sendReminderNotification: vi.fn().mockResolvedValue(undefined)
  };
}

describe('checkDueReminders', () => {
  it('sends due reminder and marks it as notified', async () => {
    const notificationSender = sender();
    const markNotified = vi.fn().mockResolvedValue(undefined);

    await expect(
      checkDueReminders({
        getCandidates: async () => [candidate()],
        markNotified,
        sender: notificationSender,
        now: () => new Date('2026-05-17T12:00:00.000Z')
      })
    ).resolves.toEqual({
      checked: 1,
      due: 1,
      sent: 1,
      failed: 0
    });

    expect(notificationSender.sendReminderNotification).toHaveBeenCalledOnce();
    expect(markNotified).toHaveBeenCalledWith(1);
  });

  it('does not send upcoming reminder', async () => {
    const notificationSender = sender();
    const markNotified = vi.fn().mockResolvedValue(undefined);

    const result = await checkDueReminders({
      getCandidates: async () => [
        candidate({
          reminder: {
            ...reminder,
            dueDate: '2026-05-20'
          }
        })
      ],
      markNotified,
      sender: notificationSender,
      now: () => new Date('2026-05-17T12:00:00.000Z')
    });

    expect(result).toEqual({
      checked: 1,
      due: 0,
      sent: 0,
      failed: 0
    });
    expect(notificationSender.sendReminderNotification).not.toHaveBeenCalled();
    expect(markNotified).not.toHaveBeenCalled();
  });

  it('does not send completed or dismissed reminders', async () => {
    const notificationSender = sender();
    const markNotified = vi.fn().mockResolvedValue(undefined);

    const result = await checkDueReminders({
      getCandidates: async () => [
        candidate({
          reminder: {
            ...reminder,
            status: 'completed',
            completedAt: new Date('2026-05-17T09:00:00.000Z')
          }
        }),
        candidate({
          reminder: {
            ...reminder,
            id: 2,
            status: 'dismissed'
          }
        })
      ],
      markNotified,
      sender: notificationSender,
      now: () => new Date('2026-05-17T12:00:00.000Z')
    });

    expect(result).toEqual({
      checked: 2,
      due: 0,
      sent: 0,
      failed: 0
    });
    expect(notificationSender.sendReminderNotification).not.toHaveBeenCalled();
    expect(markNotified).not.toHaveBeenCalled();
  });

  it('does not send when reminder was already notified today', async () => {
    const notificationSender = sender();
    const markNotified = vi.fn().mockResolvedValue(undefined);

    const result = await checkDueReminders({
      getCandidates: async () => [
        candidate({
          reminder: {
            ...reminder,
            lastNotifiedAt: new Date('2026-05-17T08:00:00.000Z')
          }
        })
      ],
      markNotified,
      sender: notificationSender,
      now: () => new Date('2026-05-17T12:00:00.000Z')
    });

    expect(result.sent).toBe(0);
    expect(notificationSender.sendReminderNotification).not.toHaveBeenCalled();
    expect(markNotified).not.toHaveBeenCalled();
  });

  it('does not mark reminder as notified when sending fails', async () => {
    const notificationSender: ReminderNotificationSender = {
      sendReminderNotification: vi.fn().mockRejectedValue(new Error('send failed'))
    };
    const markNotified = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    const result = await checkDueReminders({
      getCandidates: async () => [candidate()],
      markNotified,
      sender: notificationSender,
      now: () => new Date('2026-05-17T12:00:00.000Z'),
      onError
    });

    expect(result).toEqual({
      checked: 1,
      due: 1,
      sent: 0,
      failed: 1
    });
    expect(markNotified).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
  });
});
