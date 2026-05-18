import { describe, expect, it } from 'vitest';
import { detectServiceType, getServiceTypeLabel } from './serviceTypes.js';

describe('detectServiceType', () => {
  it.each([
    ['масло', 'oil'],
    ['масляный', 'oil_filter'],
    ['воздушный', 'air_filter'],
    ['салонный', 'cabin_filter'],
    ['топливный', 'fuel_filter'],
    ['колодки', 'brake_pads'],
    ['диски', 'brake_discs'],
    ['свечи', 'spark_plugs'],
    ['резина', 'tires'],
    ['акб', 'battery'],
    ['грм', 'timing_belt'],
    ['антифриз', 'coolant'],
    ['тормозуха', 'brake_fluid']
  ] as const)('detects %s as %s', (token, serviceType) => {
    expect(detectServiceType([token])).toBe(serviceType);
  });

  it.each([
    [['замена', 'масла'], 'oil'],
    [['масляный', 'фильтр'], 'oil_filter'],
    [['воздушный', 'фильтр'], 'air_filter'],
    [['салонный', 'фильтр'], 'cabin_filter'],
    [['топливный', 'фильтр'], 'fuel_filter'],
    [['тормозные', 'колодки'], 'brake_pads'],
    [['тормозные', 'диски'], 'brake_discs'],
    [['ремень', 'грм'], 'timing_belt'],
    [['охлаждающая', 'жидкость'], 'coolant'],
    [['тормозная', 'жидкость'], 'brake_fluid']
  ] as const)('detects phrase %s as %s', (tokens, serviceType) => {
    expect(detectServiceType([...tokens])).toBe(serviceType);
  });

  it('detects service type from any token', () => {
    expect(detectServiceType(['замена', 'передние', 'колодки'])).toBe('brake_pads');
  });

  it('is case-insensitive for russian tokens', () => {
    expect(detectServiceType(['АКБ'])).toBe('battery');
  });

  it('falls back to other for unknown tokens', () => {
    expect(detectServiceType(['непонятное'])).toBe('other');
  });
});

describe('getServiceTypeLabel', () => {
  it('returns russian service type label', () => {
    expect(getServiceTypeLabel('oil')).toBe('масло');
    expect(getServiceTypeLabel('brake_pads')).toBe('тормозные колодки');
    expect(getServiceTypeLabel('other')).toBe('прочее');
  });
});
