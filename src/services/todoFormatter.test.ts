import { describe, expect, it } from 'vitest';
import type { ReminderRecord } from '../domain/reminders.js';
import type { ReminderDueItem } from './reminderDueCalculator.js';
import { formatTodo } from './todoFormatter.js';

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

function dueItem(overrides: Partial<ReminderDueItem>): ReminderDueItem {
  return {
    reminder,
    dateStatus: 'overdue',
    daysDelta: -1,
    mileageStatus: null,
    mileageDelta: null,
    isDue: true,
    isUpcoming: false,
    shouldShowInTodo: true,
    shouldNotify: true,
    ...overrides
  };
}

describe('formatTodo', () => {
  it('formats empty todo list', () => {
    expect(formatTodo([], { hasCurrentMileage: true, hasMileageReminders: false })).toBe([
      'Ближайших задач пока нет.',
      'Добавь напоминание:',
      '/remind страховка 2026-09-01'
    ].join('\n'));
  });

  it('formats empty todo list with missing mileage hint', () => {
    expect(formatTodo([], { hasCurrentMileage: false, hasMileageReminders: true })).toBe([
      'Ближайших задач пока нет.',
      'Добавь напоминание:',
      '/remind страховка 2026-09-01',
      'Для задач по пробегу сначала обнови пробег: /mileage 126000'
    ].join('\n'));
  });

  it('formats due date reminder', () => {
    expect(formatTodo([dueItem({})], { hasCurrentMileage: true, hasMileageReminders: false })).toBe([
      'Ближайшие задачи:',
      '#12 Просрочено: страховка - 01.09.2026',
      '',
      'Чтобы отметить задачу выполненной:',
      '/done 12'
    ].join('\n'));
  });

  it('formats upcoming date reminder', () => {
    expect(
      formatTodo(
        [
          dueItem({
            dateStatus: 'upcoming',
            daysDelta: 12,
            isDue: false,
            isUpcoming: true,
            shouldNotify: false
          })
        ],
        { hasCurrentMileage: true, hasMileageReminders: false }
      )
    ).toContain('#12 Скоро: страховка - через 12 дней');
  });

  it('formats due mileage reminder', () => {
    expect(
      formatTodo(
        [
          dueItem({
            reminder: {
              ...reminder,
              title: 'масло',
              dueDate: null,
              dueMileage: 134000
            },
            dateStatus: null,
            daysDelta: null,
            mileageStatus: 'overdue',
            mileageDelta: -500
          })
        ],
        { hasCurrentMileage: true, hasMileageReminders: true }
      )
    ).toContain('#12 Просрочено: масло - 134000 км');
  });

  it('formats upcoming mileage reminder', () => {
    expect(
      formatTodo(
        [
          dueItem({
            reminder: {
              ...reminder,
              title: 'масло',
              dueDate: null,
              dueMileage: 134000
            },
            dateStatus: null,
            daysDelta: null,
            mileageStatus: 'upcoming',
            mileageDelta: 500,
            isDue: false,
            isUpcoming: true,
            shouldNotify: false
          })
        ],
        { hasCurrentMileage: true, hasMileageReminders: true }
      )
    ).toContain('#12 Скоро: масло - через 500 км');
  });

  it('formats reminder with date and mileage', () => {
    expect(
      formatTodo(
        [
          dueItem({
            reminder: {
              ...reminder,
              title: 'техосмотр',
              dueMileage: 150000
            },
            mileageStatus: 'upcoming',
            mileageDelta: 800
          })
        ],
        { hasCurrentMileage: true, hasMileageReminders: true }
      )
    ).toContain('#12 Просрочено: техосмотр - 01.09.2026 - через 800 км');
  });

  it('formats missing mileage hint with non-empty list', () => {
    expect(
      formatTodo([dueItem({})], { hasCurrentMileage: false, hasMileageReminders: true })
    ).toBe([
      'Ближайшие задачи:',
      '#12 Просрочено: страховка - 01.09.2026',
      '',
      'Чтобы отметить задачу выполненной:',
      '/done 12',
      '',
      'Для задач по пробегу сначала обнови пробег: /mileage 126000'
    ].join('\n'));
  });
});
