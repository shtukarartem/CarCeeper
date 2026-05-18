import { describe, expect, it } from 'vitest';
import { formatExpenseCategories } from './categoriesFormatter.js';

describe('formatExpenseCategories', () => {
  it('formats categories with examples', () => {
    const message = formatExpenseCategories();

    expect(message).toContain('Категории расходов:');
    expect(message).toContain('- топливо: бензин, дизель, заправка');
    expect(message).toContain('- страховка: осаго, каско');
    expect(message).toContain('/add бензин 3200');
  });
});
