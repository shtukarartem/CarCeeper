import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { RecentExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatAmount } from '../utils/formatters.js';

export function formatTodayExpenses(expenses: RecentExpenseRecord[]): string {
  if (expenses.length === 0) {
    return 'Сегодня расходов пока нет.';
  }

  const lines = expenses.map((expense, index) => {
    const comment = expense.comment ? ` - ${expense.comment}` : '';

    return `${index + 1}. ${getExpenseCategoryLabel(expense.category)} - ${formatAmount(expense.amount)} ${expense.currency}${comment}`;
  });

  return ['Расходы за сегодня:', ...lines].join('\n');
}
