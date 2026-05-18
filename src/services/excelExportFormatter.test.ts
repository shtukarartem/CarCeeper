import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type {
  ExportExpenseRecord,
  ExpenseReportSummary
} from '../db/repositories/reportRepository.js';
import { formatExpensesExcel } from './excelExportFormatter.js';

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
    amount: 4200,
    currency: 'BYN',
    comment: 'масло',
    eventType: 'service'
  }
];

const summary: ExpenseReportSummary = {
  totalAmount: 7400,
  expenseCount: 2,
  currency: 'BYN',
  byCategory: [
    {
      category: 'maintenance',
      amount: 4200
    },
    {
      category: 'fuel',
      amount: 3200
    }
  ],
  topExpenses: [],
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

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as Parameters<ExcelJS.Workbook['xlsx']['load']>[0];

  await workbook.xlsx.load(excelBuffer);

  return workbook;
}

describe('formatExpensesExcel', () => {
  it('creates workbook with expected sheets', async () => {
    const workbook = await loadWorkbook(await formatExpensesExcel({ expenses, summary }));

    expect(workbook.worksheets.map((worksheet) => worksheet.name)).toEqual([
      'Расходы',
      'Категории',
      'Динамика'
    ]);
  });

  it('writes expenses sheet with numeric amounts', async () => {
    const workbook = await loadWorkbook(await formatExpensesExcel({ expenses, summary }));
    const worksheet = workbook.getWorksheet('Расходы');

    expect(worksheet?.getRow(1).values).toEqual([
      undefined,
      'Дата',
      'Автомобиль',
      'Категория',
      'Сумма',
      'Валюта',
      'Комментарий',
      'Тип события'
    ]);
    expect(worksheet?.getCell('D2').value).toBe(3200);
    expect(worksheet?.getCell('G3').value).toBe('service');
  });

  it('writes category summary with numeric shares', async () => {
    const workbook = await loadWorkbook(await formatExpensesExcel({ expenses, summary }));
    const worksheet = workbook.getWorksheet('Категории');

    expect(worksheet?.getCell('A2').value).toBe('ТО');
    expect(worksheet?.getCell('B2').value).toBe(4200);
    expect(worksheet?.getCell('C2').value).toBe(4200 / 7400);
  });

  it('writes dynamics sheet', async () => {
    const workbook = await loadWorkbook(await formatExpensesExcel({ expenses, summary }));
    const worksheet = workbook.getWorksheet('Динамика');

    expect(worksheet?.getCell('A2').value).toBe('2026-05-04');
    expect(worksheet?.getCell('B2').value).toBe(3200);
    expect(worksheet?.getCell('C2').value).toBe(1);
  });
});
