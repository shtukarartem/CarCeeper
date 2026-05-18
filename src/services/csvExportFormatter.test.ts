import { describe, expect, it } from 'vitest';
import type { ExportExpenseRecord } from '../db/repositories/reportRepository.js';
import { formatExpensesCsv, formatExpensesCsvWithBom } from './csvExportFormatter.js';

describe('formatExpensesCsv', () => {
  it('formats expenses with headers', () => {
    const expenses: ExportExpenseRecord[] = [
      {
        id: 1,
        expenseDate: '2026-05-10',
        carName: 'Toyota Camry',
        category: 'fuel',
        amount: 3200,
        currency: 'BYN',
        comment: 'заправка',
        eventType: 'fuel'
      },
      {
        id: 2,
        expenseDate: '2026-05-14',
        carName: 'Toyota Camry',
        category: 'maintenance',
        amount: 4200.5,
        currency: 'BYN',
        comment: 'масло',
        eventType: 'service'
      }
    ];

    expect(formatExpensesCsv(expenses)).toBe([
      'дата,автомобиль,категория,сумма,валюта,комментарий,тип события',
      '2026-05-10,Toyota Camry,топливо,3200,BYN,заправка,fuel',
      '2026-05-14,Toyota Camry,ТО,4200.5,BYN,масло,service'
    ].join('\r\n'));
  });

  it('escapes commas, quotes and line breaks', () => {
    const expenses: ExportExpenseRecord[] = [
      {
        id: 1,
        expenseDate: '2026-05-10',
        carName: 'Toyota, Camry',
        category: 'repair',
        amount: 1500,
        currency: 'BYN',
        comment: 'замена "лампы"\nпередней',
        eventType: 'expense'
      }
    ];

    expect(formatExpensesCsv(expenses)).toBe([
      'дата,автомобиль,категория,сумма,валюта,комментарий,тип события',
      '2026-05-10,"Toyota, Camry",ремонт,1500,BYN,"замена ""лампы""\nпередней",expense'
    ].join('\r\n'));
  });

  it('keeps empty cells for null values', () => {
    const expenses: ExportExpenseRecord[] = [
      {
        id: 1,
        expenseDate: '2026-05-10',
        carName: null,
        category: 'other',
        amount: 100,
        currency: 'BYN',
        comment: null,
        eventType: 'expense'
      }
    ];

    expect(formatExpensesCsv(expenses)).toBe([
      'дата,автомобиль,категория,сумма,валюта,комментарий,тип события',
      '2026-05-10,,прочее,100,BYN,,expense'
    ].join('\r\n'));
  });

  it('adds UTF-8 BOM when requested', () => {
    expect(formatExpensesCsvWithBom([]).startsWith('\uFEFF')).toBe(true);
  });
});
