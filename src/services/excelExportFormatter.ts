import ExcelJS from 'exceljs';
import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type {
  ExportExpenseRecord,
  ExpenseReportSummary
} from '../db/repositories/reportRepository.js';

export type ExcelExportInput = {
  expenses: ExportExpenseRecord[];
  summary: ExpenseReportSummary;
};

function styleHeaderRow(worksheet: ExcelJS.Worksheet): void {
  const headerRow = worksheet.getRow(1);

  headerRow.font = {
    bold: true
  };
  headerRow.alignment = {
    vertical: 'middle'
  };
}

function applyAutoFilter(worksheet: ExcelJS.Worksheet): void {
  if (worksheet.columnCount === 0 || worksheet.rowCount === 0) {
    return;
  }

  worksheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: 1,
      column: worksheet.columnCount
    }
  };
}

function addExpensesSheet(workbook: ExcelJS.Workbook, expenses: ExportExpenseRecord[]): void {
  const worksheet = workbook.addWorksheet('Расходы');

  worksheet.columns = [
    { header: 'Дата', key: 'expenseDate', width: 14 },
    { header: 'Автомобиль', key: 'carName', width: 24 },
    { header: 'Категория', key: 'category', width: 18 },
    { header: 'Сумма', key: 'amount', width: 14 },
    { header: 'Валюта', key: 'currency', width: 10 },
    { header: 'Комментарий', key: 'comment', width: 32 },
    { header: 'Тип события', key: 'eventType', width: 14 }
  ];

  for (const expense of expenses) {
    worksheet.addRow({
      expenseDate: expense.expenseDate,
      carName: expense.carName ?? '',
      category: getExpenseCategoryLabel(expense.category),
      amount: expense.amount,
      currency: expense.currency,
      comment: expense.comment ?? '',
      eventType: expense.eventType
    });
  }

  worksheet.getColumn('amount').numFmt = '#,##0.00';
  styleHeaderRow(worksheet);
  applyAutoFilter(worksheet);
}

function addCategoriesSheet(workbook: ExcelJS.Workbook, summary: ExpenseReportSummary): void {
  const worksheet = workbook.addWorksheet('Категории');

  worksheet.columns = [
    { header: 'Категория', key: 'category', width: 20 },
    { header: 'Сумма', key: 'amount', width: 14 },
    { header: 'Доля', key: 'share', width: 12 }
  ];

  for (const category of summary.byCategory) {
    worksheet.addRow({
      category: getExpenseCategoryLabel(category.category),
      amount: category.amount,
      share: summary.totalAmount > 0 ? category.amount / summary.totalAmount : 0
    });
  }

  worksheet.getColumn('amount').numFmt = '#,##0.00';
  worksheet.getColumn('share').numFmt = '0.0%';
  styleHeaderRow(worksheet);
  applyAutoFilter(worksheet);
}

function addDynamicsSheet(workbook: ExcelJS.Workbook, summary: ExpenseReportSummary): void {
  const worksheet = workbook.addWorksheet('Динамика');

  worksheet.columns = [
    { header: 'Период', key: 'period', width: 16 },
    { header: 'Сумма', key: 'totalAmount', width: 14 },
    { header: 'Записей', key: 'expenseCount', width: 12 }
  ];

  for (const point of summary.dynamics) {
    worksheet.addRow({
      period: point.period,
      totalAmount: point.totalAmount,
      expenseCount: point.expenseCount
    });
  }

  worksheet.getColumn('totalAmount').numFmt = '#,##0.00';
  styleHeaderRow(worksheet);
  applyAutoFilter(worksheet);
}

export async function formatExpensesExcel(input: ExcelExportInput): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'CarKeeper';
  workbook.created = new Date();

  addExpensesSheet(workbook, input.expenses);
  addCategoriesSheet(workbook, input.summary);
  addDynamicsSheet(workbook, input.summary);

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}
