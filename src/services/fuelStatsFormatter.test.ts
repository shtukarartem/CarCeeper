import { describe, expect, it } from 'vitest';
import { formatFuelStats } from './fuelStatsFormatter.js';

describe('formatFuelStats', () => {
  it('formats not enough data state', () => {
    expect(
      formatFuelStats({
        car: { name: 'Toyota Camry' },
        entryCount: 1,
        consumption: { status: 'not_enough_data' },
        cost: { status: 'not_enough_data' },
        currency: 'BYN'
      })
    ).toBe([
      'Недостаточно данных для статистики топлива.',
      'Автомобиль: Toyota Camry',
      'Заправок: 1',
      'Добавь минимум две заправки с растущим пробегом:',
      '/fuel 45 3200 124500'
    ].join('\n'));
  });

  it('formats not enough data state for non-growing mileage pairs', () => {
    expect(
      formatFuelStats({
        car: { name: 'Toyota Camry' },
        entryCount: 2,
        consumption: { status: 'not_enough_data' },
        cost: { status: 'not_enough_data' },
        currency: 'BYN'
      })
    ).toBe([
      'Недостаточно данных для статистики топлива.',
      'Автомобиль: Toyota Camry',
      'Заправок: 2',
      'Добавь минимум две заправки с растущим пробегом:',
      '/fuel 45 3200 124500'
    ].join('\n'));
  });

  it('formats calculated fuel stats', () => {
    expect(
      formatFuelStats({
        car: { name: 'Toyota Camry' },
        entryCount: 4,
        consumption: {
          status: 'calculated',
          distanceKm: 1250,
          liters: 180,
          litersPer100Km: 14.4,
          entriesUsed: 3
        },
        cost: {
          status: 'calculated',
          distanceKm: 1250,
          amount: 12800,
          costPerKm: 10.24,
          entriesUsed: 3
        },
        currency: 'BYN'
      })
    ).toBe([
      'Статистика топлива:',
      'Автомобиль: Toyota Camry',
      'Заправок: 4',
      'Пробег по заправкам: 1250 км',
      'Топливо: 180 л',
      'Расход: 14.40 л/100 км',
      'Расходы на топливо: 12800 BYN',
      'Стоимость 1 км по топливу: 10.24 BYN'
    ].join('\n'));
  });

  it('formats decimal liters and rounded money values', () => {
    expect(
      formatFuelStats({
        car: { name: 'Toyota Camry' },
        entryCount: 2,
        consumption: {
          status: 'calculated',
          distanceKm: 375,
          liters: 42.25,
          litersPer100Km: 11.2666666667,
          entriesUsed: 1
        },
        cost: {
          status: 'calculated',
          distanceKm: 375,
          amount: 1234.56,
          costPerKm: 3.29216,
          entriesUsed: 1
        },
        currency: 'BYN'
      })
    ).toBe([
      'Статистика топлива:',
      'Автомобиль: Toyota Camry',
      'Заправок: 2',
      'Пробег по заправкам: 375 км',
      'Топливо: 42.25 л',
      'Расход: 11.27 л/100 км',
      'Расходы на топливо: 1234.56 BYN',
      'Стоимость 1 км по топливу: 3.29 BYN'
    ].join('\n'));
  });
});
