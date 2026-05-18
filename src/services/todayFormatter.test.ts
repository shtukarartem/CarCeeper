import { describe, expect, it } from 'vitest';
import type { RecentExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatTodayExpenses } from './todayFormatter.js';

describe('formatTodayExpenses', () => {
  it('formats empty today expenses', () => {
    expect(formatTodayExpenses([])).toBe('Сегодня расходов пока нет.');
  });

  it('formats today expenses', () => {
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
      }
    ];

    expect(formatTodayExpenses(expenses)).toBe(
      'Расходы за сегодня:\n1. топливо - 3200 BYN - бензин'
    );
  });
});
