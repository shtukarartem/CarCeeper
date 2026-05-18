import { describe, expect, it } from 'vitest';
import {
  ServiceScheduleError,
  calculateServiceSchedule
} from './serviceScheduleCalculator.js';

describe('calculateServiceSchedule', () => {
  it('calculates next due mileage from service mileage and km interval', () => {
    expect(
      calculateServiceSchedule({
        serviceMileage: 126000,
        nextIntervalKm: 8000
      })
    ).toEqual({
      nextDueMileage: 134000,
      nextDueDate: null
    });
  });

  it('calculates next due date from service date and month interval', () => {
    expect(
      calculateServiceSchedule({
        serviceDate: '2026-05-14',
        nextIntervalMonths: 12
      })
    ).toEqual({
      nextDueMileage: null,
      nextDueDate: '2027-05-14'
    });
  });

  it('calculates both mileage and date schedule when all inputs are present', () => {
    expect(
      calculateServiceSchedule({
        serviceMileage: 126000,
        serviceDate: '2026-05-14',
        nextIntervalKm: 8000,
        nextIntervalMonths: 12
      })
    ).toEqual({
      nextDueMileage: 134000,
      nextDueDate: '2027-05-14'
    });
  });

  it('keeps next fields null when intervals are missing', () => {
    expect(
      calculateServiceSchedule({
        serviceMileage: 126000,
        serviceDate: '2026-05-14'
      })
    ).toEqual({
      nextDueMileage: null,
      nextDueDate: null
    });
  });

  it('keeps next due mileage null when service mileage is missing', () => {
    expect(
      calculateServiceSchedule({
        nextIntervalKm: 8000
      })
    ).toEqual({
      nextDueMileage: null,
      nextDueDate: null
    });
  });

  it('keeps next due date null when service date is missing', () => {
    expect(
      calculateServiceSchedule({
        nextIntervalMonths: 12
      })
    ).toEqual({
      nextDueMileage: null,
      nextDueDate: null
    });
  });

  it('uses the last valid day when adding months to a month-end date', () => {
    expect(
      calculateServiceSchedule({
        serviceDate: '2026-01-31',
        nextIntervalMonths: 1
      })
    ).toEqual({
      nextDueMileage: null,
      nextDueDate: '2026-02-28'
    });
  });

  it('throws when service mileage is negative', () => {
    expect(() =>
      calculateServiceSchedule({
        serviceMileage: -1,
        nextIntervalKm: 8000
      })
    ).toThrow('Пробег обслуживания должен быть целым числом больше или равным нулю.');
  });

  it('throws when service mileage is decimal', () => {
    expect(() =>
      calculateServiceSchedule({
        serviceMileage: 126000.5,
        nextIntervalKm: 8000
      })
    ).toThrow(ServiceScheduleError);
  });

  it('throws when km interval is not positive', () => {
    expect(() =>
      calculateServiceSchedule({
        serviceMileage: 126000,
        nextIntervalKm: 0
      })
    ).toThrow('Интервал следующей замены в километрах должен быть целым числом больше нуля.');
  });

  it('throws when month interval is not positive', () => {
    expect(() =>
      calculateServiceSchedule({
        serviceDate: '2026-05-14',
        nextIntervalMonths: -12
      })
    ).toThrow('Интервал следующей замены в месяцах должен быть целым числом больше нуля.');
  });

  it('throws when service date is invalid', () => {
    expect(() =>
      calculateServiceSchedule({
        serviceDate: 'not-a-date',
        nextIntervalMonths: 12
      })
    ).toThrow('Дата обслуживания должна быть корректной датой.');
  });
});
