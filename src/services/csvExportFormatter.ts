import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { ExportExpenseRecord } from '../db/repositories/reportRepository.js';

const csvHeaders = [
  'дата',
  'автомобиль',
  'категория',
  'сумма',
  'валюта',
  'комментарий',
  'тип события'
];

function escapeCsvCell(value: string | number | null): string {
  const cell = value === null ? '' : String(value);

  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
}

export function formatExpensesCsv(expenses: ExportExpenseRecord[]): string {
  const rows = expenses.map((expense) => [
    expense.expenseDate,
    expense.carName,
    getExpenseCategoryLabel(expense.category),
    expense.amount,
    expense.currency,
    expense.comment,
    expense.eventType
  ]);

  return [
    csvHeaders.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ].join('\r\n');
}

export function formatExpensesCsvWithBom(expenses: ExportExpenseRecord[]): string {
  return `\uFEFF${formatExpensesCsv(expenses)}`;
}
