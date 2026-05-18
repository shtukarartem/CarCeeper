import { describe, expect, it } from 'vitest';
import { DoneParseError, parseDoneInput } from './doneParser.js';

describe('parseDoneInput', () => {
  it('parses reminder id', () => {
    expect(parseDoneInput('12')).toBe(12);
  });

  it('trims input', () => {
    expect(parseDoneInput('  12  ')).toBe(12);
  });

  it('throws on empty input', () => {
    expect(() => parseDoneInput('   ')).toThrow('Укажи номер задачи. Например: /done 12');
  });

  it('throws on non-numeric input', () => {
    expect(() => parseDoneInput('abc')).toThrow('Номер задачи должен быть числом.');
  });

  it('throws on decimal input', () => {
    expect(() => parseDoneInput('12.5')).toThrow('Номер задачи должен быть целым числом.');
    expect(() => parseDoneInput('12,5')).toThrow('Номер задачи должен быть целым числом.');
  });

  it('throws on negative input', () => {
    expect(() => parseDoneInput('-1')).toThrow('Номер задачи должен быть больше нуля.');
  });

  it('throws on zero', () => {
    expect(() => parseDoneInput('0')).toThrow('Номер задачи должен быть больше нуля.');
  });

  it('throws on multiple tokens', () => {
    expect(() => parseDoneInput('12 13')).toThrow(
      'Укажи только один номер задачи. Например: /done 12'
    );
  });

  it('uses DoneParseError for parser errors', () => {
    expect(() => parseDoneInput('abc')).toThrow(DoneParseError);
  });
});
