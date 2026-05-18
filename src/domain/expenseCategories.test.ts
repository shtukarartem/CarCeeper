import { describe, expect, it } from 'vitest';
import { detectExpenseCategory } from './expenseCategories.js';

describe('detectExpenseCategory', () => {
  it.each([
    ['бензин', 'fuel'],
    ['дизель', 'fuel'],
    ['автомойка', 'car_wash'],
    ['осаго', 'insurance'],
    ['каско', 'insurance'],
    ['сервис', 'maintenance'],
    ['штраф', 'fines'],
    ['запчасти', 'parts'],
    ['налог', 'tax']
  ] as const)('detects %s as %s', (token, category) => {
    expect(detectExpenseCategory([token])).toBe(category);
  });

  it('is case-insensitive for russian tokens', () => {
    expect(detectExpenseCategory(['ОСАГО'])).toBe('insurance');
  });

  it('falls back to other for unknown tokens', () => {
    expect(detectExpenseCategory(['непонятное'])).toBe('other');
  });

  it('detects category from any token', () => {
    expect(detectExpenseCategory(['замена', 'лампы', 'ремонт'])).toBe('repair');
  });
});
