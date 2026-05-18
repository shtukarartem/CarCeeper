import { describe, expect, it } from 'vitest';
import type { MonthlyExpenseStats } from '../db/repositories/expenseRepository.js';
import { formatMonthlyStats } from './statsFormatter.js';

describe('formatMonthlyStats', () => {
  it('formats empty stats', () => {
    const stats: MonthlyExpenseStats = {
      month: '2026-05',
      totalAmount: 0,
      expenseCount: 0,
      currency: null,
      byCategory: [],
      largestExpense: null
    };

    expect(formatMonthlyStats(stats)).toBe(
      'За этот месяц расходов пока нет.\nДобавь первый:\n/add бензин 3200'
    );
  });

  it('formats monthly stats', () => {
    const stats: MonthlyExpenseStats = {
      month: '2026-05',
      totalAmount: 12800,
      expenseCount: 5,
      currency: 'BYN',
      byCategory: [
        { category: 'fuel', amount: 9000 },
        { category: 'repair', amount: 3000 },
        { category: 'car_wash', amount: 800 }
      ],
      largestExpense: {
        category: 'repair',
        amount: 3000,
        currency: 'BYN',
        comment: 'замена лампы'
      }
    };

    expect(formatMonthlyStats(stats)).toBe([
      'Расходы за май 2026 г.:',
      'Всего: 12800 BYN',
      'Записей: 5',
      '',
      'По категориям:',
      'топливо: 9000 BYN',
      'ремонт: 3000 BYN',
      'мойка: 800 BYN',
      '',
      'Самый крупный расход:',
      'ремонт - 3000 BYN - замена лампы'
    ].join('\n'));
  });
});
