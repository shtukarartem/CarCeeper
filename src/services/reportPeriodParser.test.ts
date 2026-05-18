import { describe, expect, it } from 'vitest';
import { ReportPeriodParseError, parseReportPeriod } from './reportPeriodParser.js';

const currentDate = new Date('2026-05-18T12:00:00.000Z');

describe('parseReportPeriod', () => {
  it('defaults to the current month', () => {
    expect(parseReportPeriod('', currentDate)).toEqual({
      type: 'month',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
      label: 'май 2026 г.'
    });
  });

  it('parses current month alias', () => {
    expect(parseReportPeriod('month', currentDate)).toEqual({
      type: 'month',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
      label: 'май 2026 г.'
    });
  });

  it('parses current year alias', () => {
    expect(parseReportPeriod('year', currentDate)).toEqual({
      type: 'year',
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      label: '2026'
    });
  });

  it('parses a concrete month', () => {
    expect(parseReportPeriod('2026-03', currentDate)).toEqual({
      type: 'month',
      startDate: '2026-03-01',
      endDate: '2026-04-01',
      label: 'март 2026 г.'
    });
  });

  it('parses december month boundary', () => {
    expect(parseReportPeriod('2026-12', currentDate)).toEqual({
      type: 'month',
      startDate: '2026-12-01',
      endDate: '2027-01-01',
      label: 'декабрь 2026 г.'
    });
  });

  it('parses a concrete year', () => {
    expect(parseReportPeriod('2025', currentDate)).toEqual({
      type: 'year',
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      label: '2025'
    });
  });

  it('trims input and accepts uppercase aliases', () => {
    expect(parseReportPeriod('  MONTH  ', currentDate)).toEqual({
      type: 'month',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
      label: 'май 2026 г.'
    });
  });

  it('throws when month has an invalid format', () => {
    expect(() => parseReportPeriod('2026-5', currentDate)).toThrow(ReportPeriodParseError);
    expect(() => parseReportPeriod('2026-5', currentDate)).toThrow(
      'Не понял период отчета.'
    );
  });

  it('throws when month number is out of range', () => {
    expect(() => parseReportPeriod('2026-13', currentDate)).toThrow(
      'Месяц должен быть от 01 до 12. Например: /report 2026-05'
    );
  });

  it('throws when year is out of range', () => {
    expect(() => parseReportPeriod('0000', currentDate)).toThrow(
      'Год должен быть в формате YYYY. Например: /report 2026'
    );
  });

  it('throws when range format is used before it is supported', () => {
    expect(() => parseReportPeriod('2026-01-01 2026-03-31', currentDate)).toThrow(
      'Не понял период отчета.'
    );
  });

  it('throws when current date is invalid', () => {
    expect(() => parseReportPeriod('month', new Date('invalid'))).toThrow(
      'Текущая дата некорректна.'
    );
  });
});
