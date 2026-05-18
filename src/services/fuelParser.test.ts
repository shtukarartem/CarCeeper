import { describe, expect, it } from 'vitest';
import { FuelParseError, parseFuelInput } from './fuelParser.js';

describe('parseFuelInput', () => {
  it('parses liters, amount, mileage and price per liter', () => {
    expect(parseFuelInput('45 3200 124500')).toEqual({
      liters: 45,
      amount: 3200,
      mileage: 124500,
      pricePerLiter: 3200 / 45
    });
  });

  it('supports decimal liters and amount with dot', () => {
    expect(parseFuelInput('45.5 3230.75 124500')).toEqual({
      liters: 45.5,
      amount: 3230.75,
      mileage: 124500,
      pricePerLiter: 3230.75 / 45.5
    });
  });

  it('supports decimal liters and amount with comma', () => {
    expect(parseFuelInput('45,5 3230,75 124500')).toEqual({
      liters: 45.5,
      amount: 3230.75,
      mileage: 124500,
      pricePerLiter: 3230.75 / 45.5
    });
  });

  it('accepts zero mileage', () => {
    expect(parseFuelInput('45 3200 0')).toEqual({
      liters: 45,
      amount: 3200,
      mileage: 0,
      pricePerLiter: 3200 / 45
    });
  });

  it('throws on empty input', () => {
    expect(() => parseFuelInput('   ')).toThrow('Укажи заправку. Например: /fuel 45 3200 124500');
  });

  it('throws when values are missing', () => {
    expect(() => parseFuelInput('45 3200')).toThrow(
      'Укажи литры, сумму и пробег. Например: /fuel 45 3200 124500'
    );
  });

  it('throws when liters are not a number', () => {
    expect(() => parseFuelInput('сорок 3200 124500')).toThrow(FuelParseError);
    expect(() => parseFuelInput('сорок 3200 124500')).toThrow('Литры должны быть числом.');
  });

  it('throws when amount is not a number', () => {
    expect(() => parseFuelInput('45 сумма 124500')).toThrow('Сумма должна быть числом.');
  });

  it('throws when liters are zero or negative', () => {
    expect(() => parseFuelInput('0 3200 124500')).toThrow('Литры должны быть больше нуля.');
    expect(() => parseFuelInput('-45 3200 124500')).toThrow('Литры должны быть больше нуля.');
  });

  it('throws when amount is zero or negative', () => {
    expect(() => parseFuelInput('45 0 124500')).toThrow('Сумма должна быть больше нуля.');
    expect(() => parseFuelInput('45 -3200 124500')).toThrow('Сумма должна быть больше нуля.');
  });

  it('throws when mileage is negative', () => {
    expect(() => parseFuelInput('45 3200 -1')).toThrow('Пробег не может быть отрицательным.');
  });

  it('throws when mileage is decimal', () => {
    expect(() => parseFuelInput('45 3200 124500.5')).toThrow('Пробег должен быть целым числом.');
  });
});
