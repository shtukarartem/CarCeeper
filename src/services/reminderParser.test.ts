import { describe, expect, it } from 'vitest';
import { ReminderParseError, parseReminderInput } from './reminderParser.js';

describe('parseReminderInput', () => {
  it('parses date reminder', () => {
    expect(parseReminderInput('страховка 2026-09-01')).toEqual({
      title: 'страховка',
      dueDate: '2026-09-01',
      dueMileage: null,
      mileageMode: null
    });
  });

  it('parses date reminder with multi-word title', () => {
    expect(parseReminderInput('страховка гражданская ответственность 2026-09-01')).toEqual({
      title: 'страховка гражданская ответственность',
      dueDate: '2026-09-01',
      dueMileage: null,
      mileageMode: null
    });
  });

  it('parses relative mileage reminder with attached unit', () => {
    expect(parseReminderInput('масло через 8000км')).toEqual({
      title: 'масло',
      dueDate: null,
      dueMileage: 8000,
      mileageMode: 'relative'
    });
  });

  it('parses relative mileage reminder with separate unit', () => {
    expect(parseReminderInput('масло через 8000 км')).toEqual({
      title: 'масло',
      dueDate: null,
      dueMileage: 8000,
      mileageMode: 'relative'
    });
  });

  it('parses absolute mileage reminder with attached unit', () => {
    expect(parseReminderInput('колодки на 150000км')).toEqual({
      title: 'колодки',
      dueDate: null,
      dueMileage: 150000,
      mileageMode: 'absolute'
    });
  });

  it('parses absolute mileage reminder with separate unit', () => {
    expect(parseReminderInput('колодки на 150000 км')).toEqual({
      title: 'колодки',
      dueDate: null,
      dueMileage: 150000,
      mileageMode: 'absolute'
    });
  });

  it('parses latin km and short cyrillic unit aliases', () => {
    expect(parseReminderInput('масло через 8000km')).toMatchObject({
      dueMileage: 8000,
      mileageMode: 'relative'
    });
    expect(parseReminderInput('колодки на 150000 к')).toMatchObject({
      dueMileage: 150000,
      mileageMode: 'absolute'
    });
  });

  it('throws on empty input', () => {
    expect(() => parseReminderInput('   ')).toThrow(
      'Укажи напоминание. Например: /remind страховка 2026-09-01'
    );
  });

  it('throws when date or mileage target is missing', () => {
    expect(() => parseReminderInput('страховка')).toThrow(
      'Не нашел дату или пробег. Например: /remind страховка 2026-09-01'
    );
  });

  it('throws on invalid date', () => {
    expect(() => parseReminderInput('страховка 2026-99-99')).toThrow(
      'Дата напоминания должна быть корректной датой.'
    );
  });

  it('throws when date has invalid format', () => {
    expect(() => parseReminderInput('страховка 2026-9-1')).toThrow(
      'Дата напоминания должна быть в формате YYYY-MM-DD.'
    );
  });

  it('throws when mileage is not numeric', () => {
    expect(() => parseReminderInput('масло через abc')).toThrow(
      'Пробег напоминания должен быть числом.'
    );
  });

  it('throws when mileage is decimal', () => {
    expect(() => parseReminderInput('масло через 8000.5км')).toThrow(
      'Пробег напоминания должен быть целым числом.'
    );
  });

  it('throws when mileage is negative', () => {
    expect(() => parseReminderInput('масло через -8000км')).toThrow(
      'Пробег напоминания должен быть больше нуля.'
    );
  });

  it('throws when title is missing for date reminder', () => {
    expect(() => parseReminderInput('2026-09-01')).toThrow('Укажи название напоминания.');
  });

  it('throws when title is missing for mileage reminder', () => {
    expect(() => parseReminderInput('через 8000км')).toThrow('Укажи название напоминания.');
  });

  it('throws when both date and mileage are present', () => {
    expect(() => parseReminderInput('масло 2026-09-01 через 8000км')).toThrow(
      'Укажи либо дату, либо пробег напоминания.'
    );
  });

  it('throws when multiple targets are present', () => {
    expect(() => parseReminderInput('масло 2026-09-01 2026-10-01')).toThrow(
      'Укажи только одну дату или один пробег напоминания.'
    );
  });

  it('throws when date is not the last argument', () => {
    expect(() => parseReminderInput('страховка 2026-09-01 срочно')).toThrow(
      'Дата напоминания должна быть последним аргументом.'
    );
  });

  it('throws when mileage is not the last argument', () => {
    expect(() => parseReminderInput('масло через 8000 км срочно')).toThrow(
      'Пробег напоминания должен быть последним аргументом.'
    );
  });

  it('uses ReminderParseError for parser errors', () => {
    expect(() => parseReminderInput('страховка')).toThrow(ReminderParseError);
  });
});
