import { describe, expect, it } from 'vitest';
import type { ExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatDeletedExpense } from './undoFormatter.js';

describe('formatDeletedExpense', () => {
  it('formats deleted expense', () => {
    const expense: ExpenseRecord = {
      id: 1,
      userId: 1,
      carId: 1,
      category: 'fuel',
      amount: 3200,
      currency: 'BYN',
      comment: 'бензин',
      expenseDate: '2026-05-14'
    };

    expect(formatDeletedExpense(expense)).toBe(
      'Удален расход:\n14.05.2026 - топливо - 3200 BYN - бензин'
    );
  });

  it('formats deleted expense without comment', () => {
    const expense: ExpenseRecord = {
      id: 1,
      userId: 1,
      carId: 1,
      category: 'parking',
      amount: 10.5,
      currency: 'BYN',
      comment: null,
      expenseDate: '2026-05-14'
    };

    expect(formatDeletedExpense(expense)).toBe(
      'Удален расход:\n14.05.2026 - парковка - 10.50 BYN'
    );
  });
});
