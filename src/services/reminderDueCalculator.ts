import type { ReminderRecord } from '../domain/reminders.js';

export type ReminderTargetStatus = 'overdue' | 'upcoming' | null;

export type ReminderDueItem = {
  reminder: ReminderRecord;
  dateStatus: ReminderTargetStatus;
  daysDelta: number | null;
  mileageStatus: ReminderTargetStatus;
  mileageDelta: number | null;
  isDue: boolean;
  isUpcoming: boolean;
  shouldShowInTodo: boolean;
  shouldNotify: boolean;
};

export type CalculateReminderDueOptions = {
  currentMileage: number | null;
  today: Date | string;
  dateUpcomingWindowDays?: number;
  mileageUpcomingWindowKm?: number;
  notificationCooldownDays?: number;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function toUtcDate(value: Date | string): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function diffDays(left: Date, right: Date): number {
  return Math.round((left.getTime() - right.getTime()) / millisecondsPerDay);
}

function getDateStatus(
  reminder: ReminderRecord,
  today: Date,
  dateUpcomingWindowDays: number
): {
  status: ReminderTargetStatus;
  delta: number | null;
} {
  if (reminder.dueDate === null) {
    return {
      status: null,
      delta: null
    };
  }

  const daysDelta = diffDays(toUtcDate(reminder.dueDate), today);

  if (daysDelta <= 0) {
    return {
      status: 'overdue',
      delta: daysDelta
    };
  }

  return {
    status: daysDelta <= dateUpcomingWindowDays ? 'upcoming' : null,
    delta: daysDelta
  };
}

function getMileageStatus(
  reminder: ReminderRecord,
  currentMileage: number | null,
  mileageUpcomingWindowKm: number
): {
  status: ReminderTargetStatus;
  delta: number | null;
} {
  if (reminder.dueMileage === null || currentMileage === null) {
    return {
      status: null,
      delta: null
    };
  }

  const mileageDelta = reminder.dueMileage - currentMileage;

  if (mileageDelta <= 0) {
    return {
      status: 'overdue',
      delta: mileageDelta
    };
  }

  return {
    status: mileageDelta <= mileageUpcomingWindowKm ? 'upcoming' : null,
    delta: mileageDelta
  };
}

function wasNotifiedWithinCooldown(
  lastNotifiedAt: Date | null,
  today: Date,
  notificationCooldownDays: number
): boolean {
  if (lastNotifiedAt === null) {
    return false;
  }

  const lastNotificationDate = toUtcDate(lastNotifiedAt);
  const daysSinceNotification = diffDays(today, lastNotificationDate);

  return daysSinceNotification < notificationCooldownDays;
}

export function calculateReminderDueItem(
  reminder: ReminderRecord,
  options: CalculateReminderDueOptions
): ReminderDueItem {
  const today = toUtcDate(options.today);
  const dateUpcomingWindowDays = options.dateUpcomingWindowDays ?? 30;
  const mileageUpcomingWindowKm = options.mileageUpcomingWindowKm ?? 1000;
  const notificationCooldownDays = options.notificationCooldownDays ?? 1;
  const inactive = reminder.status !== 'active';
  const dateResult = getDateStatus(reminder, today, dateUpcomingWindowDays);
  const mileageResult = getMileageStatus(reminder, options.currentMileage, mileageUpcomingWindowKm);

  if (inactive) {
    return {
      reminder,
      dateStatus: null,
      daysDelta: dateResult.delta,
      mileageStatus: null,
      mileageDelta: mileageResult.delta,
      isDue: false,
      isUpcoming: false,
      shouldShowInTodo: false,
      shouldNotify: false
    };
  }

  const isDue = dateResult.status === 'overdue' || mileageResult.status === 'overdue';
  const isUpcoming = !isDue && (dateResult.status === 'upcoming' || mileageResult.status === 'upcoming');
  const notificationBlocked = wasNotifiedWithinCooldown(
    reminder.lastNotifiedAt,
    today,
    notificationCooldownDays
  );

  return {
    reminder,
    dateStatus: dateResult.status,
    daysDelta: dateResult.delta,
    mileageStatus: mileageResult.status,
    mileageDelta: mileageResult.delta,
    isDue,
    isUpcoming,
    shouldShowInTodo: isDue || isUpcoming,
    shouldNotify: isDue && !notificationBlocked
  };
}

export function calculateReminderDueItems(
  reminders: ReminderRecord[],
  options: CalculateReminderDueOptions
): ReminderDueItem[] {
  return reminders
    .map((reminder) => calculateReminderDueItem(reminder, options))
    .filter((item) => item.shouldShowInTodo)
    .sort((left, right) => {
      if (left.isDue !== right.isDue) {
        return left.isDue ? -1 : 1;
      }

      const leftDistance = Math.min(
        Math.abs(left.daysDelta ?? Number.POSITIVE_INFINITY),
        Math.abs(left.mileageDelta ?? Number.POSITIVE_INFINITY)
      );
      const rightDistance = Math.min(
        Math.abs(right.daysDelta ?? Number.POSITIVE_INFINITY),
        Math.abs(right.mileageDelta ?? Number.POSITIVE_INFINITY)
      );

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.reminder.id - right.reminder.id;
    });
}
