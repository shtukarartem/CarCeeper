import { describe, expect, it } from 'vitest';
import type { ExpenseRecord } from '../db/repositories/expenseRepository.js';
import type { ServiceEntryRecord } from '../db/repositories/serviceRepository.js';
import {
  formatServiceCreated,
  formatServiceDue,
  formatServiceHistory,
  formatServiceMissingCar
} from './serviceFormatter.js';

const expense: ExpenseRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  category: 'maintenance',
  amount: 6200,
  currency: 'BYN',
  comment: 'Motul',
  expenseDate: '2026-05-17'
};

const serviceEntry: ServiceEntryRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  expenseId: 1,
  serviceType: 'oil',
  title: 'масло',
  amount: 6200,
  currency: 'BYN',
  serviceMileage: 126000,
  nextIntervalKm: 8000,
  nextDueMileage: 134000,
  nextIntervalMonths: 12,
  nextDueDate: '2027-05-17',
  comment: 'Motul',
  serviceDate: '2026-05-17'
};

describe('formatServiceCreated', () => {
  it('formats service confirmation with next mileage and date', () => {
    expect(
      formatServiceCreated({
        carName: 'Toyota Camry',
        serviceEntry,
        expense,
        currentMileageUpdated: true,
        historicalMileage: false,
        serviceReminderCreated: true
      })
    ).toBe([
      'Обслуживание добавлено:',
      'Автомобиль: Toyota Camry',
      'Работа: масло',
      'Сумма: 6200 BYN',
      'Пробег: 126000 км',
      'Следующая замена: 134000 км',
      'Следующая дата: 17.05.2027',
      'Комментарий: Motul',
      'Текущий пробег автомобиля обновлен.',
      'Напоминание о следующем обслуживании добавлено.'
    ].join('\n'));
  });

  it('formats service confirmation without optional fields', () => {
    expect(
      formatServiceCreated({
        carName: 'Toyota Camry',
        serviceEntry: {
          ...serviceEntry,
          serviceMileage: null,
          nextIntervalKm: null,
          nextDueMileage: null,
          nextIntervalMonths: null,
          nextDueDate: null,
          comment: null
        },
        expense: {
          ...expense,
          amount: 5000,
          comment: null
        },
        currentMileageUpdated: false,
        historicalMileage: false
      })
    ).toBe([
      'Обслуживание добавлено:',
      'Автомобиль: Toyota Camry',
      'Работа: масло',
      'Сумма: 5000 BYN'
    ].join('\n'));
  });

  it('formats historical mileage note', () => {
    expect(
      formatServiceCreated({
        carName: 'Toyota Camry',
        serviceEntry,
        expense,
        currentMileageUpdated: false,
        historicalMileage: true
      })
    ).toContain('Текущий пробег автомобиля не изменен.');
  });

  it('does not show service reminder line when reminder was not created', () => {
    expect(
      formatServiceCreated({
        carName: 'Toyota Camry',
        serviceEntry,
        expense,
        currentMileageUpdated: false,
        historicalMileage: false,
        serviceReminderCreated: false
      })
    ).not.toContain('Напоминание о следующем обслуживании добавлено.');
  });
});

describe('formatServiceMissingCar', () => {
  it('formats missing active car message', () => {
    expect(formatServiceMissingCar()).toBe([
      'Сначала добавь автомобиль:',
      '/car Toyota Camry'
    ].join('\n'));
  });
});

describe('formatServiceHistory', () => {
  it('formats empty service history', () => {
    expect(formatServiceHistory([])).toBe([
      'Истории обслуживания пока нет.',
      'Добавь первое обслуживание:',
      '/service масло 6200 пробег 126000 след 8000'
    ].join('\n'));
  });

  it('formats service history entries', () => {
    expect(
      formatServiceHistory([
        serviceEntry,
        {
          ...serviceEntry,
          id: 2,
          serviceType: 'brake_pads',
          title: 'колодки',
          amount: 9000,
          serviceMileage: 127000,
          nextIntervalKm: 30000,
          nextDueMileage: 157000,
          nextIntervalMonths: null,
          nextDueDate: null,
          comment: null,
          serviceDate: '2026-05-10'
        }
      ])
    ).toBe([
      'История обслуживания:',
      '1. 17.05.2026 - масло - 6200 BYN - 126000 км - след: 134000 км, 17.05.2027 - Motul',
      '2. 10.05.2026 - колодки - 9000 BYN - 127000 км - след: 157000 км'
    ].join('\n'));
  });

  it('formats entries without mileage and next fields', () => {
    expect(
      formatServiceHistory([
        {
          ...serviceEntry,
          serviceMileage: null,
          nextIntervalKm: null,
          nextDueMileage: null,
          nextIntervalMonths: null,
          nextDueDate: null,
          comment: null
        }
      ])
    ).toBe([
      'История обслуживания:',
      '1. 17.05.2026 - масло - 6200 BYN'
    ].join('\n'));
  });
});

describe('formatServiceDue', () => {
  it('formats empty due list', () => {
    expect(formatServiceDue([], true)).toBe([
      'Ближайших замен пока нет.',
      'Добавь обслуживание с интервалом:',
      '/service масло 6200 пробег 126000 след 8000'
    ].join('\n'));
  });

  it('formats empty due list without current mileage hint', () => {
    expect(formatServiceDue([], false)).toBe([
      'Ближайших замен пока нет.',
      'Добавь обслуживание с интервалом:',
      '/service масло 6200 пробег 126000 след 8000',
      'Для замен по пробегу сначала обнови пробег: /mileage 126000'
    ].join('\n'));
  });

  it('formats mileage and date due items', () => {
    expect(
      formatServiceDue(
        [
          {
            serviceEntry,
            mileageStatus: 'upcoming',
            mileageDelta: 800,
            dateStatus: null,
            daysDelta: null
          },
          {
            serviceEntry: {
              ...serviceEntry,
              title: 'тормозная жидкость',
              nextDueMileage: null,
              nextDueDate: '2026-06-01'
            },
            mileageStatus: null,
            mileageDelta: null,
            dateStatus: 'upcoming',
            daysDelta: 15
          }
        ],
        true
      )
    ).toBe([
      'Ближайшие замены:',
      '1. масло - через 800 км - 134000 км',
      '2. тормозная жидкость - до 01.06.2026'
    ].join('\n'));
  });

  it('formats overdue mileage and date due items', () => {
    expect(
      formatServiceDue(
        [
          {
            serviceEntry,
            mileageStatus: 'overdue',
            mileageDelta: -500,
            dateStatus: 'overdue',
            daysDelta: -16
          }
        ],
        true
      )
    ).toBe([
      'Ближайшие замены:',
      '1. масло - просрочено на 500 км - 134000 км - просрочено с 17.05.2027'
    ].join('\n'));
  });
});
