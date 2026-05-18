import { describe, expect, it } from 'vitest';
import type { ExpenseReportSummary } from '../db/repositories/reportRepository.js';
import { formatMonthlyReport, formatYearlyReport } from './reportFormatter.js';

describe('formatMonthlyReport', () => {
  it('formats empty monthly report', () => {
    const summary: ExpenseReportSummary = {
      totalAmount: 0,
      expenseCount: 0,
      currency: null,
      byCategory: [],
      topExpenses: [],
      dynamics: []
    };

    expect(formatMonthlyReport({
      periodLabel: 'май 2026 г.',
      carName: 'Toyota Camry',
      summary,
      costPerKm: {
        status: 'calculated',
        distanceKm: 1600,
        fuelCostPerKm: 7000 / 1600,
        totalCostPerKm: 12800 / 1600
      }
    })).toBe([
      'Отчет за май 2026 г.:',
      'Автомобиль: Toyota Camry',
      '',
      'За этот период расходов пока нет.',
      'Добавь первый:',
      '/add бензин 3200'
    ].join('\n'));
  });

  it('formats monthly report summary, categories, top expenses and dynamics', () => {
    const summary: ExpenseReportSummary = {
      totalAmount: 12800,
      expenseCount: 4,
      currency: 'BYN',
      byCategory: [
        { category: 'fuel', amount: 7000 },
        { category: 'maintenance', amount: 4200 },
        { category: 'car_wash', amount: 1600 }
      ],
      topExpenses: [
        {
          id: 3,
          expenseDate: '2026-05-14',
          category: 'maintenance',
          amount: 4200,
          currency: 'BYN',
          comment: 'масло'
        },
        {
          id: 1,
          expenseDate: '2026-05-10',
          category: 'fuel',
          amount: 3200,
          currency: 'BYN',
          comment: null
        }
      ],
      dynamics: [
        {
          period: '2026-05-04',
          totalAmount: 3200,
          expenseCount: 1
        },
        {
          period: '2026-05-11',
          totalAmount: 4200,
          expenseCount: 1
        }
      ]
    };

    expect(formatMonthlyReport({
      periodLabel: 'май 2026 г.',
      carName: 'Toyota Camry',
      summary,
      costPerKm: {
        status: 'calculated',
        distanceKm: 1600,
        fuelCostPerKm: 7000 / 1600,
        totalCostPerKm: 12800 / 1600
      }
    })).toBe([
      'Отчет за май 2026 г.:',
      'Автомобиль: Toyota Camry',
      'Всего: 12800 BYN',
      'Записей: 4',
      '',
      'По категориям:',
      'топливо: 7000 BYN (54.7%)',
      'ТО: 4200 BYN (32.8%)',
      'мойка: 1600 BYN (12.5%)',
      '',
      'Стоимость владения:',
      'За период: 12800 BYN',
      'Среднее в месяц: 12800 BYN',
      'Топливо: 7000 BYN',
      'ТО и ремонт: 4200 BYN',
      'Прочее: 1600 BYN',
      '',
      'Стоимость 1 км:',
      'Пробег за период: 1600 км',
      'Топливо: 4.38 BYN/км',
      'Все расходы: 8 BYN/км',
      '',
      'Топ расходов:',
      '1. 14.05.2026 - ТО - 4200 BYN - масло',
      '2. 10.05.2026 - топливо - 3200 BYN',
      '',
      'Динамика:',
      'Неделя с 04.05.2026: 3200 BYN',
      'Неделя с 11.05.2026: 4200 BYN'
    ].join('\n'));
  });

  it('formats missing top expenses as a placeholder', () => {
    const summary: ExpenseReportSummary = {
      totalAmount: 7000,
      expenseCount: 2,
      currency: 'BYN',
      byCategory: [
        { category: 'fuel', amount: 7000 }
      ],
      topExpenses: [],
      dynamics: []
    };

    expect(formatMonthlyReport({
      periodLabel: 'май 2026 г.',
      carName: 'Toyota Camry',
      summary
    })).toBe([
      'Отчет за май 2026 г.:',
      'Автомобиль: Toyota Camry',
      'Всего: 7000 BYN',
      'Записей: 2',
      '',
      'По категориям:',
      'топливо: 7000 BYN (100.0%)',
      '',
      'Стоимость владения:',
      'За период: 7000 BYN',
      'Среднее в месяц: 7000 BYN',
      'Топливо: 7000 BYN',
      'ТО и ремонт: 0 BYN',
      'Прочее: 0 BYN',
      '',
      'Стоимость 1 км:',
      'Недостаточно данных о пробеге.',
      'Добавь минимум две заправки с пробегом.',
      '',
      'Топ расходов:',
      '-',
      '',
      'Динамика:',
      '-'
    ].join('\n'));
  });
});

describe('formatYearlyReport', () => {
  it('formats empty yearly report', () => {
    const summary: ExpenseReportSummary = {
      totalAmount: 0,
      expenseCount: 0,
      currency: null,
      byCategory: [],
      topExpenses: [],
      dynamics: []
    };

    expect(formatYearlyReport({
      periodLabel: '2026',
      carName: 'Toyota Camry',
      summary,
      costPerKm: {
        status: 'calculated',
        distanceKm: 12000,
        fuelCostPerKm: 82000 / 12000,
        totalCostPerKm: 154000 / 12000
      }
    })).toBe([
      'Отчет за 2026:',
      'Автомобиль: Toyota Camry',
      '',
      'За этот год расходов пока нет.',
      'Добавь первый:',
      '/add бензин 3200'
    ].join('\n'));
  });

  it('formats yearly report with month dynamics and most expensive month', () => {
    const summary: ExpenseReportSummary = {
      totalAmount: 154000,
      expenseCount: 132,
      currency: 'BYN',
      byCategory: [
        { category: 'fuel', amount: 82000 },
        { category: 'maintenance', amount: 54000 },
        { category: 'other', amount: 18000 }
      ],
      topExpenses: [
        {
          id: 8,
          expenseDate: '2026-05-14',
          category: 'maintenance',
          amount: 4200,
          currency: 'BYN',
          comment: 'масло'
        }
      ],
      dynamics: [
        {
          period: '2026-01-01',
          totalAmount: 12000,
          expenseCount: 10
        },
        {
          period: '2026-02-01',
          totalAmount: 9500,
          expenseCount: 8
        },
        {
          period: '2026-03-01',
          totalAmount: 18000,
          expenseCount: 12
        }
      ]
    };

    expect(formatYearlyReport({
      periodLabel: '2026',
      carName: 'Toyota Camry',
      summary,
      costPerKm: {
        status: 'calculated',
        distanceKm: 12000,
        fuelCostPerKm: 82000 / 12000,
        totalCostPerKm: 154000 / 12000
      }
    })).toBe([
      'Отчет за 2026:',
      'Автомобиль: Toyota Camry',
      'Всего: 154000 BYN',
      'Записей: 132',
      '',
      'По категориям:',
      'топливо: 82000 BYN (53.2%)',
      'ТО: 54000 BYN (35.1%)',
      'прочее: 18000 BYN (11.7%)',
      '',
      'Стоимость владения:',
      'За период: 154000 BYN',
      'Среднее в месяц: 12833.33 BYN',
      'Топливо: 82000 BYN',
      'ТО и ремонт: 54000 BYN',
      'Прочее: 18000 BYN',
      '',
      'Стоимость 1 км:',
      'Пробег за период: 12000 км',
      'Топливо: 6.83 BYN/км',
      'Все расходы: 12.83 BYN/км',
      '',
      'По месяцам:',
      'январь 2026 г.: 12000 BYN',
      'февраль 2026 г.: 9500 BYN',
      'март 2026 г.: 18000 BYN',
      '',
      'Самый дорогой месяц:',
      'март 2026 г. - 18000 BYN',
      '',
      'Топ расходов:',
      '1. 14.05.2026 - ТО - 4200 BYN - масло'
    ].join('\n'));
  });
});
