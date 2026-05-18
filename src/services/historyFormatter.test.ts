import { describe, expect, it } from 'vitest';
import type { RecentExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatExpenseHistory } from './historyFormatter.js';

describe('formatExpenseHistory', () => {
  it('formats empty history', () => {
    expect(formatExpenseHistory([])).toBe('Расходов пока нет. Добавь первый:\n/add бензин 3200');
  });

  it('formats recent expenses', () => {
    const expenses: RecentExpenseRecord[] = [
      {
        id: 1,
        userId: 1,
        carId: 1,
        carName: 'Toyota Camry',
        category: 'fuel',
        amount: 3200,
        currency: 'BYN',
        comment: 'бензин',
        expenseDate: '2026-05-14'
      },
      {
        id: 2,
        userId: 1,
        carId: 1,
        carName: 'Toyota Camry',
        category: 'car_wash',
        amount: 800,
        currency: 'BYN',
        comment: 'мойка кузова',
        expenseDate: '2026-05-13'
      }
    ];

    expect(formatExpenseHistory(expenses)).toBe([
      'Последние расходы:',
      '1. 14.05.2026 - топливо - 3200 BYN - бензин',
      '2. 13.05.2026 - мойка - 800 BYN - мойка кузова'
    ].join('\n'));
  });
});
