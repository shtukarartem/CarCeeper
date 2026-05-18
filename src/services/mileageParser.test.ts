import { describe, expect, it } from 'vitest';
import { MileageParseError, parseMileageInput } from './mileageParser.js';

describe('parseMileageInput', () => {
  it('parses mileage from a single integer', () => {
    expect(parseMileageInput('125000')).toBe(125000);
  });

  it('parses mileage from text input', () => {
    expect(parseMileageInput('пробег 125000')).toBe(125000);
  });

  it('parses mileage from longer text input', () => {
    expect(parseMileageInput('текущий пробег 125000')).toBe(125000);
  });

  it('accepts zero mileage', () => {
    expect(parseMileageInput('0')).toBe(0);
  });

  it('throws on empty input', () => {
    expect(() => parseMileageInput('   ')).toThrow('Укажи пробег. Например: /mileage 125000');
  });

  it('throws when mileage is missing', () => {
    expect(() => parseMileageInput('пробег')).toThrow(MileageParseError);
    expect(() => parseMileageInput('сто тысяч')).toThrow('Не нашел пробег. Например: /mileage 125000');
  });

  it('throws when mileage is negative', () => {
    expect(() => parseMileageInput('-100')).toThrow('Пробег не может быть отрицательным.');
  });

  it('throws when mileage has dot decimals', () => {
    expect(() => parseMileageInput('125000.5')).toThrow('Пробег должен быть целым числом.');
  });

  it('throws when mileage has comma decimals', () => {
    expect(() => parseMileageInput('125000,5')).toThrow('Пробег должен быть целым числом.');
  });
});
