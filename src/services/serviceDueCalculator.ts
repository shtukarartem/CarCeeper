import type { ServiceEntryRecord } from '../db/repositories/serviceRepository.js';

export type ServiceDueItem = {
  serviceEntry: ServiceEntryRecord;
  mileageStatus: 'overdue' | 'upcoming' | null;
  mileageDelta: number | null;
  dateStatus: 'overdue' | 'upcoming' | null;
  daysDelta: number | null;
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

export function calculateServiceDueItems(
  entries: ServiceEntryRecord[],
  options: {
    currentMileage: number | null;
    today: Date | string;
  }
): ServiceDueItem[] {
  const today = toUtcDate(options.today);

  return entries
    .map((entry): ServiceDueItem => {
      const mileageDelta =
        options.currentMileage === null || entry.nextDueMileage === null
          ? null
          : entry.nextDueMileage - options.currentMileage;
      const dueDate = entry.nextDueDate === null ? null : toUtcDate(entry.nextDueDate);
      const daysDelta = dueDate === null ? null : diffDays(dueDate, today);

      return {
        serviceEntry: entry,
        mileageStatus:
          mileageDelta === null ? null : mileageDelta < 0 ? 'overdue' : 'upcoming',
        mileageDelta,
        dateStatus: daysDelta === null ? null : daysDelta < 0 ? 'overdue' : 'upcoming',
        daysDelta
      };
    })
    .sort((left, right) => {
      const leftOverdue = left.mileageStatus === 'overdue' || left.dateStatus === 'overdue';
      const rightOverdue = right.mileageStatus === 'overdue' || right.dateStatus === 'overdue';

      if (leftOverdue !== rightOverdue) {
        return leftOverdue ? -1 : 1;
      }

      const leftDistance = Math.min(
        Math.abs(left.mileageDelta ?? Number.POSITIVE_INFINITY),
        Math.abs(left.daysDelta ?? Number.POSITIVE_INFINITY)
      );
      const rightDistance = Math.min(
        Math.abs(right.mileageDelta ?? Number.POSITIVE_INFINITY),
        Math.abs(right.daysDelta ?? Number.POSITIVE_INFINITY)
      );

      return leftDistance - rightDistance;
    });
}
