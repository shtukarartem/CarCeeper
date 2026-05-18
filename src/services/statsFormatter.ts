import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { MonthlyExpenseStats } from '../db/repositories/expenseRepository.js';
import { formatAmount, formatMonth } from '../utils/formatters.js';

export function formatMonthlyStats(stats: MonthlyExpenseStats): string {
  if (stats.expenseCount === 0) {
    return [
      'За этот месяц расходов пока нет.',
      'Добавь первый:',
      '/add бензин 3200'
    ].join('\n');
  }

  const currency = stats.currency ?? 'BYN';
  const categoryLines = stats.byCategory.map(
    (item) => `${getExpenseCategoryLabel(item.category)}: ${formatAmount(item.amount)} ${currency}`
  );
  const largestExpense = stats.largestExpense;
  const largestComment = largestExpense?.comment ? ` - ${largestExpense.comment}` : '';

  return [
    `Расходы за ${formatMonth(stats.month)}:`,
    `Всего: ${formatAmount(stats.totalAmount)} ${currency}`,
    `Записей: ${stats.expenseCount}`,
    '',
    'По категориям:',
    ...categoryLines,
    '',
    'Самый крупный расход:',
    largestExpense
      ? `${getExpenseCategoryLabel(largestExpense.category)} - ${formatAmount(largestExpense.amount)} ${largestExpense.currency}${largestComment}`
      : '-'
  ].join('\n');
}
