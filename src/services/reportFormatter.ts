import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { ExpenseReportSummary } from '../db/repositories/reportRepository.js';
import type { OwnershipCostPerKmResult } from './ownershipCostPerKmCalculator.js';
import { formatAmount, formatDate } from '../utils/formatters.js';

export type MonthlyReportFormatInput = {
  periodLabel: string;
  carName: string;
  summary: ExpenseReportSummary;
  costPerKm?: OwnershipCostPerKmResult;
};

export type YearlyReportFormatInput = MonthlyReportFormatInput;

export function formatEmptyMonthlyReport(input: Pick<MonthlyReportFormatInput, 'periodLabel' | 'carName'>): string {
  return [
    `Отчет за ${input.periodLabel}:`,
    `Автомобиль: ${input.carName}`,
    '',
    'За этот период расходов пока нет.',
    'Добавь первый:',
    '/add бензин 3200'
  ].join('\n');
}

export function formatEmptyYearlyReport(input: Pick<YearlyReportFormatInput, 'periodLabel' | 'carName'>): string {
  return [
    `Отчет за ${input.periodLabel}:`,
    `Автомобиль: ${input.carName}`,
    '',
    'За этот год расходов пока нет.',
    'Добавь первый:',
    '/add бензин 3200'
  ].join('\n');
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCategoryLines(
  categories: ExpenseReportSummary['byCategory'],
  totalAmount: number,
  currency: string
): string[] {
  return categories.map((item) => {
    const percent = totalAmount > 0 ? ` (${formatPercent((item.amount / totalAmount) * 100)})` : '';

    return `${getExpenseCategoryLabel(item.category)}: ${formatAmount(item.amount)} ${currency}${percent}`;
  });
}

function formatTopExpenseLines(topExpenses: ExpenseReportSummary['topExpenses']): string[] {
  if (topExpenses.length === 0) {
    return ['-'];
  }

  return topExpenses.map((expense, index) => {
    const comment = expense.comment ? ` - ${expense.comment}` : '';

    return [
      `${index + 1}. ${formatDate(expense.expenseDate)}`,
      getExpenseCategoryLabel(expense.category),
      `${formatAmount(expense.amount)} ${expense.currency}${comment}`
    ].join(' - ');
  });
}

function formatMonthlyDynamicsLines(dynamics: ExpenseReportSummary['dynamics'], currency: string): string[] {
  if (dynamics.length === 0) {
    return ['-'];
  }

  return dynamics.map((item) => `Неделя с ${formatDate(item.period)}: ${formatAmount(item.totalAmount)} ${currency}`);
}

function formatYearlyDynamicsLines(dynamics: ExpenseReportSummary['dynamics'], currency: string): string[] {
  if (dynamics.length === 0) {
    return ['-'];
  }

  return dynamics.map((item) => `${formatMonthPeriod(item.period)}: ${formatAmount(item.totalAmount)} ${currency}`);
}

function formatOwnershipCostLines(
  summary: ExpenseReportSummary,
  monthCount: number,
  currency: string
): string[] {
  const fuelAmount = getCategoryAmount(summary, ['fuel']);
  const serviceAmount = getCategoryAmount(summary, ['maintenance', 'repair', 'parts']);
  const otherAmount = Math.max(0, summary.totalAmount - fuelAmount - serviceAmount);
  const averagePerMonth = monthCount > 0 ? summary.totalAmount / monthCount : summary.totalAmount;

  return [
    `За период: ${formatAmount(summary.totalAmount)} ${currency}`,
    `Среднее в месяц: ${formatAmount(averagePerMonth)} ${currency}`,
    `Топливо: ${formatAmount(fuelAmount)} ${currency}`,
    `ТО и ремонт: ${formatAmount(serviceAmount)} ${currency}`,
    `Прочее: ${formatAmount(otherAmount)} ${currency}`
  ];
}

function formatCostPerKmLines(costPerKm: OwnershipCostPerKmResult | undefined, currency: string): string[] {
  if (!costPerKm || costPerKm.status === 'not_enough_data') {
    return [
      'Недостаточно данных о пробеге.',
      'Добавь минимум две заправки с пробегом.'
    ];
  }

  return [
    `Пробег за период: ${costPerKm.distanceKm} км`,
    `Топливо: ${formatAmount(costPerKm.fuelCostPerKm)} ${currency}/км`,
    `Все расходы: ${formatAmount(costPerKm.totalCostPerKm)} ${currency}/км`
  ];
}

function getCategoryAmount(
  summary: ExpenseReportSummary,
  categories: Array<ExpenseReportSummary['byCategory'][number]['category']>
): number {
  const categorySet = new Set(categories);

  return summary.byCategory
    .filter((item) => categorySet.has(item.category))
    .reduce((total, item) => total + item.amount, 0);
}

export function formatMonthlyReport(input: MonthlyReportFormatInput): string {
  const { periodLabel, carName, summary } = input;

  if (summary.expenseCount === 0) {
    return formatEmptyMonthlyReport({ periodLabel, carName });
  }

  const currency = summary.currency ?? 'BYN';
  const categoryLines = formatCategoryLines(summary.byCategory, summary.totalAmount, currency);
  const topExpenseLines = formatTopExpenseLines(summary.topExpenses);
  const dynamicsLines = formatMonthlyDynamicsLines(summary.dynamics, currency);
  const ownershipCostLines = formatOwnershipCostLines(summary, 1, currency);
  const costPerKmLines = formatCostPerKmLines(input.costPerKm, currency);

  return [
    `Отчет за ${periodLabel}:`,
    `Автомобиль: ${carName}`,
    `Всего: ${formatAmount(summary.totalAmount)} ${currency}`,
    `Записей: ${summary.expenseCount}`,
    '',
    'По категориям:',
    ...categoryLines,
    '',
    'Стоимость владения:',
    ...ownershipCostLines,
    '',
    'Стоимость 1 км:',
    ...costPerKmLines,
    '',
    'Топ расходов:',
    ...topExpenseLines,
    '',
    'Динамика:',
    ...dynamicsLines
  ].join('\n');
}

export function formatYearlyReport(input: YearlyReportFormatInput): string {
  const { periodLabel, carName, summary } = input;

  if (summary.expenseCount === 0) {
    return formatEmptyYearlyReport({ periodLabel, carName });
  }

  const currency = summary.currency ?? 'BYN';
  const categoryLines = formatCategoryLines(summary.byCategory, summary.totalAmount, currency);
  const dynamicsLines = formatYearlyDynamicsLines(summary.dynamics, currency);
  const ownershipCostLines = formatOwnershipCostLines(summary, 12, currency);
  const costPerKmLines = formatCostPerKmLines(input.costPerKm, currency);
  const mostExpensivePeriod = summary.dynamics.reduce<ExpenseReportSummary['dynamics'][number] | null>(
    (current, item) => {
      if (!current || item.totalAmount > current.totalAmount) {
        return item;
      }

      return current;
    },
    null
  );
  const topExpenseLines = formatTopExpenseLines(summary.topExpenses);

  return [
    `Отчет за ${periodLabel}:`,
    `Автомобиль: ${carName}`,
    `Всего: ${formatAmount(summary.totalAmount)} ${currency}`,
    `Записей: ${summary.expenseCount}`,
    '',
    'По категориям:',
    ...categoryLines,
    '',
    'Стоимость владения:',
    ...ownershipCostLines,
    '',
    'Стоимость 1 км:',
    ...costPerKmLines,
    '',
    'По месяцам:',
    ...dynamicsLines,
    '',
    'Самый дорогой месяц:',
    mostExpensivePeriod
      ? `${formatMonthPeriod(mostExpensivePeriod.period)} - ${formatAmount(mostExpensivePeriod.totalAmount)} ${currency}`
      : '-',
    '',
    'Топ расходов:',
    ...topExpenseLines
  ].join('\n');
}

function formatMonthPeriod(value: string): string {
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
