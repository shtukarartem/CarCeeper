import {
  expenseCategories,
  expenseCategorySynonyms,
  getExpenseCategoryLabel
} from '../domain/expenseCategories.js';

export function formatExpenseCategories(): string {
  const lines = expenseCategories.map((category) => {
    const synonyms = expenseCategorySynonyms[category].filter(
      (synonym) => synonym !== getExpenseCategoryLabel(category).toLocaleLowerCase('ru-RU')
    );
    const suffix = synonyms.length > 0 ? `: ${synonyms.join(', ')}` : '';

    return `- ${getExpenseCategoryLabel(category)}${suffix}`;
  });

  return [
    'Категории расходов:',
    ...lines,
    '',
    'Пример:',
    '/add бензин 3200'
  ].join('\n');
}
