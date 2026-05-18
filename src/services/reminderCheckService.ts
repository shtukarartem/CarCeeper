import type {
  ReminderNotificationCandidate
} from '../db/repositories/reminderRepository.js';
import type { ReminderRecord } from '../domain/reminders.js';
import {
  getActiveRemindersForNotification,
  markReminderNotified
} from '../db/repositories/reminderRepository.js';
import { calculateReminderDueItem, type ReminderDueItem } from './reminderDueCalculator.js';

export type ReminderNotificationInput = {
  reminder: ReminderRecord;
  dueItem: ReminderDueItem;
  telegramId: string;
  carName: string;
  currentMileage: number | null;
};

export type ReminderNotificationSender = {
  sendReminderNotification(input: ReminderNotificationInput): Promise<void>;
};

export type ReminderCheckDependencies = {
  getCandidates?: () => Promise<ReminderNotificationCandidate[]>;
  markNotified?: (reminderId: number) => Promise<unknown>;
  sender: ReminderNotificationSender;
  now?: () => Date;
  onError?: (error: unknown, candidate: ReminderNotificationCandidate) => void;
};

export type ReminderCheckResult = {
  checked: number;
  due: number;
  sent: number;
  failed: number;
};

export async function checkDueReminders(
  dependencies: ReminderCheckDependencies
): Promise<ReminderCheckResult> {
  const getCandidates = dependencies.getCandidates ?? getActiveRemindersForNotification;
  const markNotified = dependencies.markNotified ?? markReminderNotified;
  const now = dependencies.now ?? (() => new Date());
  const candidates = await getCandidates();
  const result: ReminderCheckResult = {
    checked: candidates.length,
    due: 0,
    sent: 0,
    failed: 0
  };

  for (const candidate of candidates) {
    const dueItem = calculateReminderDueItem(candidate.reminder, {
      currentMileage: candidate.currentMileage,
      today: now()
    });

    if (!dueItem.shouldNotify) {
      continue;
    }

    result.due += 1;

    try {
      await dependencies.sender.sendReminderNotification({
        reminder: candidate.reminder,
        dueItem,
        telegramId: candidate.telegramId,
        carName: candidate.carName,
        currentMileage: candidate.currentMileage
      });
      await markNotified(candidate.reminder.id);
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      dependencies.onError?.(error, candidate);
    }
  }

  return result;
}
