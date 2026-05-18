export const expenseCategories = [
  'fuel',
  'car_wash',
  'repair',
  'maintenance',
  'insurance',
  'parking',
  'fines',
  'parts',
  'tax',
  'other'
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  fuel: 'топливо',
  car_wash: 'мойка',
  repair: 'ремонт',
  maintenance: 'ТО',
  insurance: 'страховка',
  parking: 'парковка',
  fines: 'штрафы',
  parts: 'запчасти',
  tax: 'налог',
  other: 'прочее'
};

export const expenseCategorySynonyms: Record<ExpenseCategory, string[]> = {
  fuel: ['топливо', 'бензин', 'дизель', 'заправка', 'заправился', 'солярка'],
  car_wash: ['мойка', 'автомойка', 'помыл'],
  repair: ['ремонт', 'починка', 'отремонтировал'],
  maintenance: ['то', 'техобслуживание', 'сервис', 'обслуживание'],
  insurance: ['страховка', 'осаго', 'каско'],
  parking: ['парковка', 'паркинг'],
  fines: ['штраф', 'штрафы'],
  parts: ['запчасти', 'запчасть', 'детали', 'деталь'],
  tax: ['налог'],
  other: ['прочее', 'другое']
};

const synonymToCategory = new Map<string, ExpenseCategory>(
  Object.entries(expenseCategorySynonyms).flatMap(([category, synonyms]) =>
    synonyms.map((synonym) => [normalizeCategoryToken(synonym), category as ExpenseCategory])
  )
);

export function normalizeCategoryToken(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU');
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  return expenseCategoryLabels[category];
}

export function detectExpenseCategory(tokens: string[]): ExpenseCategory {
  for (const token of tokens) {
    const category = synonymToCategory.get(normalizeCategoryToken(token));

    if (category) {
      return category;
    }
  }

  return 'other';
}
