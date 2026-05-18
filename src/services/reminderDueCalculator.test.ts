import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import {
  calculateReminderDueItem,
  calculateReminderDueItems
} from './reminderDueCalculator.js';

const baseReminder: ReminderRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  serviceEntryId: null,
  type: 'manual',
  title: 'страховка',
  description: null,
  dueDate: '2026-05-20',
  dueMileage: null,
  status: 'active',
  lastNotifiedAt: null,
  completedAt: null,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z')
};

describe('calculateReminderDueItem', () => {
  it('marks date reminder as overdue when due date is today', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-17'
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: 'overdue',
      daysDelta: 0,
      isDue: true,
      shouldShowInTodo: true,
      shouldNotify: true
    });
  });

  it('marks date reminder as overdue when due date is in the past', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-01'
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: 'overdue',
      daysDelta: -16,
      isDue: true
    });
  });

  it('marks date reminder as upcoming inside the 30 day window', () => {
    expect(
      calculateReminderDueItem(baseReminder, {
        currentMileage: null,
        today: '2026-05-17'
      })
    ).toMatchObject({
      dateStatus: 'upcoming',
      daysDelta: 3,
      isDue: false,
      isUpcoming: true,
      shouldShowInTodo: true,
      shouldNotify: false
    });
  });

  it('does not show date reminder outside the 30 day window', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-06-17'
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: null,
      daysDelta: 31,
      shouldShowInTodo: false,
      shouldNotify: false
    });
  });

  it('marks mileage reminder as overdue when due mileage equals current mileage', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          type: 'mileage',
          dueDate: null,
          dueMileage: 134000
        },
        {
          currentMileage: 134000,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      mileageStatus: 'overdue',
      mileageDelta: 0,
      isDue: true,
      shouldShowInTodo: true,
      shouldNotify: true
    });
  });

  it('marks mileage reminder as overdue when current mileage is higher', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          type: 'mileage',
          dueDate: null,
          dueMileage: 134000
        },
        {
          currentMileage: 134500,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      mileageStatus: 'overdue',
      mileageDelta: -500,
      isDue: true
    });
  });

  it('marks mileage reminder as upcoming inside the 1000 km window', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          type: 'mileage',
          dueDate: null,
          dueMileage: 134000
        },
        {
          currentMileage: 133200,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      mileageStatus: 'upcoming',
      mileageDelta: 800,
      isDue: false,
      isUpcoming: true,
      shouldShowInTodo: true,
      shouldNotify: false
    });
  });

  it('does not calculate mileage reminder without current mileage', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          type: 'mileage',
          dueDate: null,
          dueMileage: 134000
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      mileageStatus: null,
      mileageDelta: null,
      shouldShowInTodo: false,
      shouldNotify: false
    });
  });

  it('uses any due target when reminder has date and mileage', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          type: 'service',
          serviceEntryId: 10,
          dueDate: '2026-06-30',
          dueMileage: 134000
        },
        {
          currentMileage: 134100,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: null,
      mileageStatus: 'overdue',
      isDue: true,
      shouldNotify: true
    });
  });

  it('does not show completed reminder', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-01',
          status: 'completed',
          completedAt: new Date('2026-05-17T09:00:00.000Z')
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: null,
      isDue: false,
      shouldShowInTodo: false,
      shouldNotify: false
    });
  });

  it('does not show dismissed reminder', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-01',
          status: 'dismissed'
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      dateStatus: null,
      isDue: false,
      shouldShowInTodo: false,
      shouldNotify: false
    });
  });

  it('blocks notification when reminder was already notified today', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-01',
          lastNotifiedAt: new Date('2026-05-17T08:00:00.000Z')
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      isDue: true,
      shouldShowInTodo: true,
      shouldNotify: false
    });
  });

  it('allows notification when last notification was yesterday', () => {
    expect(
      calculateReminderDueItem(
        {
          ...baseReminder,
          dueDate: '2026-05-01',
          lastNotifiedAt: new Date('2026-05-16T08:00:00.000Z')
        },
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject({
      isDue: true,
      shouldNotify: true
    });
  });
});

describe('calculateReminderDueItems', () => {
  it('filters hidden reminders and sorts due before upcoming', () => {
    const items = calculateReminderDueItems(
      [
        {
          ...baseReminder,
          id: 1,
          title: 'через месяц',
          dueDate: '2026-06-17'
        },
        {
          ...baseReminder,
          id: 2,
          title: 'скоро',
          dueDate: '2026-05-20'
        },
        {
          ...baseReminder,
          id: 3,
          title: 'просрочено',
          dueDate: '2026-05-16'
        }
      ],
      {
        currentMileage: null,
        today: '2026-05-17'
      }
    );

    expect(items.map((item) => item.reminder.id)).toEqual([3, 2]);
  });
});
