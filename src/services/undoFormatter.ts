import { getExpenseCategoryLabel } from '../domain/expenseCategories.js';
import type { ExpenseRecord } from '../db/repositories/expenseRepository.js';
import { formatAmount, formatDate } from '../utils/formatters.js';

export function formatDeletedExpense(expense: ExpenseRecord): string {
  const comment = expense.comment ? ` - ${expense.comment}` : '';

  return [
    'Удален расход:',
    `${formatDate(expense.expenseDate)} - ${getExpenseCategoryLabel(expense.category)} - ${formatAmount(expense.amount)} ${expense.currency}${comment}`
  ].join('\n');
}
