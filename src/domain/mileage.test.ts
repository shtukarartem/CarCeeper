import { describe, expect, it } from 'vitest';
import {
  MileageRuleError,
  assertValidMileage,
  resolveFuelMileageUpdate,
  resolveManualMileageUpdate
} from './mileage.js';

describe('assertValidMileage', () => {
  it('accepts zero and positive integers', () => {
    expect(assertValidMileage(0)).toBe(0);
    expect(assertValidMileage(125000)).toBe(125000);
  });

  it('rejects non-finite mileage', () => {
    expect(() => assertValidMileage(Number.NaN)).toThrow(MileageRuleError);
  });

  it('rejects decimal mileage', () => {
    expect(() => assertValidMileage(125000.5)).toThrow('Пробег должен быть целым числом.');
  });

  it('rejects negative mileage', () => {
    expect(() => assertValidMileage(-1)).toThrow('Пробег не может быть отрицательным.');
  });
});

describe('resolveManualMileageUpdate', () => {
  it('sets mileage when car has no current mileage', () => {
    expect(resolveManualMileageUpdate(null, 125000)).toEqual({
      status: 'updated',
      nextMileage: 125000
    });
  });

  it('updates mileage when requested mileage is higher', () => {
    expect(resolveManualMileageUpdate(124000, 125000)).toEqual({
      status: 'updated',
      nextMileage: 125000
    });
  });

  it('keeps mileage unchanged when requested mileage is the same', () => {
    expect(resolveManualMileageUpdate(125000, 125000)).toEqual({
      status: 'unchanged',
      nextMileage: 125000
    });
  });

  it('rejects manual mileage decrease', () => {
    expect(resolveManualMileageUpdate(125000, 124000)).toEqual({
      status: 'rejected_decrease',
      currentMileage: 125000,
      requestedMileage: 124000
    });
  });
});

describe('resolveFuelMileageUpdate', () => {
  it('sets current mileage from first fuel entry', () => {
    expect(resolveFuelMileageUpdate(null, 124500)).toEqual({
      status: 'updated',
      shouldUpdateCar: true,
      nextMileage: 124500
    });
  });

  it('updates current mileage from a higher fuel mileage', () => {
    expect(resolveFuelMileageUpdate(124000, 124500)).toEqual({
      status: 'updated',
      shouldUpdateCar: true,
      nextMileage: 124500
    });
  });

  it('does not update current mileage for equal fuel mileage', () => {
    expect(resolveFuelMileageUpdate(124500, 124500)).toEqual({
      status: 'unchanged',
      shouldUpdateCar: false,
      nextMileage: 124500
    });
  });

  it('keeps lower fuel mileage as historical without decreasing current mileage', () => {
    expect(resolveFuelMileageUpdate(125000, 124500)).toEqual({
      status: 'historical',
      shouldUpdateCar: false,
      nextMileage: 125000,
      fuelMileage: 124500
    });
  });
});
