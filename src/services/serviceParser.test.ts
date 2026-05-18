import { describe, expect, it } from 'vitest';
import { ServiceParseError, parseServiceInput } from './serviceParser.js';

describe('parseServiceInput', () => {
  it('parses oil service with mileage and km interval', () => {
    expect(parseServiceInput('масло 6200 пробег 126000 след 8000')).toEqual({
      serviceType: 'oil',
      title: 'масло',
      amount: 6200,
      serviceMileage: 126000,
      nextIntervalKm: 8000,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('parses brake pads service with mileage and km interval', () => {
    expect(parseServiceInput('колодки 9000 пробег 127000 след 30000')).toEqual({
      serviceType: 'brake_pads',
      title: 'колодки',
      amount: 9000,
      serviceMileage: 127000,
      nextIntervalKm: 30000,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('parses service without mileage and next fields', () => {
    expect(parseServiceInput('свечи 5000')).toEqual({
      serviceType: 'spark_plugs',
      title: 'свечи',
      amount: 5000,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('parses comment after service fields', () => {
    expect(parseServiceInput('масло 6200 пробег 126000 след 8000 комментарий Motul')).toEqual({
      serviceType: 'oil',
      title: 'масло',
      amount: 6200,
      serviceMileage: 126000,
      nextIntervalKm: 8000,
      nextIntervalMonths: null,
      comment: 'Motul'
    });
  });

  it('parses month interval with compact suffix', () => {
    expect(parseServiceInput('страховка 28000 след 12м')).toEqual({
      serviceType: 'other',
      title: 'страховка',
      amount: 28000,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: 12,
      comment: ''
    });
  });

  it('parses month interval with separate unit', () => {
    expect(parseServiceInput('тормозная жидкость 1200 след 24 месяца')).toEqual({
      serviceType: 'brake_fluid',
      title: 'тормозная жидкость',
      amount: 1200,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: 24,
      comment: ''
    });
  });

  it('parses month interval for service with mileage omitted', () => {
    expect(parseServiceInput('масло 6200 след 12 месяцев')).toEqual({
      serviceType: 'oil',
      title: 'масло',
      amount: 6200,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: 12,
      comment: ''
    });
  });

  it('falls back to other for generic filter input', () => {
    expect(parseServiceInput('фильтр 1000')).toEqual({
      serviceType: 'other',
      title: 'фильтр',
      amount: 1000,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('parses km interval with compact suffix', () => {
    expect(parseServiceInput('масло 6200 пробег 126000 след 8000км')).toEqual({
      serviceType: 'oil',
      title: 'масло',
      amount: 6200,
      serviceMileage: 126000,
      nextIntervalKm: 8000,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('supports decimal amount with comma', () => {
    expect(parseServiceInput('масло 6200,50 пробег 126000 след 8000')).toEqual({
      serviceType: 'oil',
      title: 'масло',
      amount: 6200.5,
      serviceMileage: 126000,
      nextIntervalKm: 8000,
      nextIntervalMonths: null,
      comment: ''
    });
  });

  it('keeps free text after amount as comment', () => {
    expect(parseServiceInput('замена масла 6200 Motul 5W-30')).toEqual({
      serviceType: 'oil',
      title: 'замена масла',
      amount: 6200,
      serviceMileage: null,
      nextIntervalKm: null,
      nextIntervalMonths: null,
      comment: 'Motul 5W-30'
    });
  });

  it('throws on empty input', () => {
    expect(() => parseServiceInput('   ')).toThrow(
      'Укажи обслуживание. Например: /service масло 6200 пробег 126000 след 8000'
    );
  });

  it('throws when amount is missing', () => {
    expect(() => parseServiceInput('масло')).toThrow(ServiceParseError);
    expect(() => parseServiceInput('масло')).toThrow('Не нашел сумму. Например: /service масло 6200');
  });

  it('throws when amount is not positive', () => {
    expect(() => parseServiceInput('масло 0')).toThrow('Сумма должна быть больше нуля.');
    expect(() => parseServiceInput('масло -100')).toThrow('Сумма должна быть больше нуля.');
  });

  it('throws when mileage is negative', () => {
    expect(() => parseServiceInput('масло 6200 пробег -1')).toThrow(
      'Пробег не может быть отрицательным.'
    );
  });

  it('throws when mileage is decimal', () => {
    expect(() => parseServiceInput('масло 6200 пробег 126000.5')).toThrow(
      'Пробег должен быть целым числом.'
    );
  });

  it('throws when mileage value is missing', () => {
    expect(() => parseServiceInput('масло 6200 пробег')).toThrow(
      'Укажи пробег после слова "пробег".'
    );
  });

  it('throws when next interval is not positive', () => {
    expect(() => parseServiceInput('масло 6200 след 0')).toThrow(
      'Интервал следующей замены должен быть больше нуля.'
    );
    expect(() => parseServiceInput('масло 6200 след -8000')).toThrow(
      'Интервал следующей замены должен быть больше нуля.'
    );
  });

  it('throws when next interval is decimal', () => {
    expect(() => parseServiceInput('масло 6200 след 8000.5')).toThrow(
      'Интервал следующей замены должен быть целым числом.'
    );
  });

  it('throws when next interval is missing', () => {
    expect(() => parseServiceInput('масло 6200 след')).toThrow(
      'Укажи интервал после слова "след".'
    );
  });

  it('throws when next interval unit is unknown', () => {
    expect(() => parseServiceInput('масло 6200 след 12лет')).toThrow(
      'Не понял единицу интервала следующей замены.'
    );
  });
});
