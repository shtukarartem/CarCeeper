import { detectExpenseCategory, type ExpenseCategory } from '../domain/expenseCategories.js';

export type ParsedExpense = {
  category: ExpenseCategory;
  amount: number;
  comment: string;
};

export class ExpenseParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpenseParseError';
  }
}

const amountPattern = /^-?\d+(?:[.,]\d{1,2})?$/;

export function parseExpenseInput(input: string): ParsedExpense {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new ExpenseParseError('Укажи расход. Например: /add бензин 3200');
  }

  const amountIndex = tokens.findIndex((token) => amountPattern.test(token));

  if (amountIndex === -1) {
    throw new ExpenseParseError('Не нашел сумму. Например: /add бензин 3200');
  }

  const amount = Number(tokens[amountIndex].replace(',', '.'));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ExpenseParseError('Сумма должна быть больше нуля.');
  }

  const textTokens = tokens.filter((_, index) => index !== amountIndex);
  const category = detectExpenseCategory(textTokens);

  return {
    category,
    amount,
    comment: textTokens.join(' ')
  };
}
