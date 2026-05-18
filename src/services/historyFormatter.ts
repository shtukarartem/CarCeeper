import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { RecentExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatAmount, formatDate } from '../utils/formatters.js';

export function formatExpenseHistory(expenses: RecentExpenseRecord[]): string {
  if (expenses.length === 0) {
    return [
      'Расходов пока нет. Добавь первый:',
      '/add бензин 3200'
    ].join('\n');
  }

  const lines = expenses.map((expense, index) => {
    const comment = expense.comment ? ` - ${expense.comment}` : '';

    return [
      `${index + 1}. ${formatDate(expense.expenseDate)}`,
      getExpenseCategoryLabel(expense.category),
      `${formatAmount(expense.amount)} ${expense.currency}${comment}`
    ].join(' - ');
  });

  return ['Последние расходы:', ...lines].join('\n');
}
