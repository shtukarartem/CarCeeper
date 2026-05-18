import { describe, expect, it } from 'vitest';
import { ExpenseParseError, parseExpenseInput } from './expenseParser.js';

describe('parseExpenseInput', () => {
  it('parses fuel expense by synonym', () => {
    expect(parseExpenseInput('бензин 3200')).toEqual({
      category: 'fuel',
      amount: 3200,
      comment: 'бензин'
    });
  });

  it('parses car wash expense', () => {
    expect(parseExpenseInput('мойка 800')).toEqual({
      category: 'car_wash',
      amount: 800,
      comment: 'мойка'
    });
  });

  it('parses repair expense with comment', () => {
    expect(parseExpenseInput('ремонт 4500 замена лампы')).toEqual({
      category: 'repair',
      amount: 4500,
      comment: 'ремонт замена лампы'
    });
  });

  it('falls back to other category', () => {
    expect(parseExpenseInput('что-то непонятное 1000')).toEqual({
      category: 'other',
      amount: 1000,
      comment: 'что-то непонятное'
    });
  });

  it('supports decimal amounts with comma', () => {
    expect(parseExpenseInput('заправка 48,50')).toEqual({
      category: 'fuel',
      amount: 48.5,
      comment: 'заправка'
    });
  });

  it('supports decimal amounts with dot', () => {
    expect(parseExpenseInput('бензин 48.50')).toEqual({
      category: 'fuel',
      amount: 48.5,
      comment: 'бензин'
    });
  });

  it('supports amount before category', () => {
    expect(parseExpenseInput('3200 бензин')).toEqual({
      category: 'fuel',
      amount: 3200,
      comment: 'бензин'
    });
  });

  it('uses the first amount-like token as amount', () => {
    expect(parseExpenseInput('ремонт 4500 чек 123')).toEqual({
      category: 'repair',
      amount: 4500,
      comment: 'ремонт чек 123'
    });
  });

  it('throws on empty input', () => {
    expect(() => parseExpenseInput('   ')).toThrow('Укажи расход. Например: /add бензин 3200');
  });

  it('throws when amount is missing', () => {
    expect(() => parseExpenseInput('бензин')).toThrow(ExpenseParseError);
  });

  it('throws when amount is zero', () => {
    expect(() => parseExpenseInput('бензин 0')).toThrow('Сумма должна быть больше нуля.');
  });

  it('throws when amount is negative', () => {
    expect(() => parseExpenseInput('бензин -100')).toThrow('Сумма должна быть больше нуля.');
  });
});
