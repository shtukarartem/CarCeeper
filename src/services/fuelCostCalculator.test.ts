import { describe, expect, it } from 'vitest';
import { calculateFuelCostPerKm } from './fuelCostCalculator.js';

describe('calculateFuelCostPerKm', () => {
  it('returns not_enough_data when there are fewer than two entries', () => {
    expect(calculateFuelCostPerKm([])).toEqual({
      status: 'not_enough_data'
    });
    expect(calculateFuelCostPerKm([{ amount: 3200, mileage: 124000 }])).toEqual({
      status: 'not_enough_data'
    });
  });

  it('calculates fuel cost per kilometer from sequential entries', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 3200, mileage: 124000 },
        { amount: 3100, mileage: 124500 },
        { amount: 3300, mileage: 125000 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      amount: 6400,
      costPerKm: 6.4,
      entriesUsed: 2
    });
  });

  it('sorts entries by mileage before calculating', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 3300, mileage: 125000 },
        { amount: 3200, mileage: 124000 },
        { amount: 3100, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      amount: 6400,
      costPerKm: 6.4,
      entriesUsed: 2
    });
  });

  it('skips pairs where mileage does not grow', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 3200, mileage: 124000 },
        { amount: 3100, mileage: 124000 },
        { amount: 3300, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 500,
      amount: 3300,
      costPerKm: 6.6,
      entriesUsed: 1
    });
  });

  it('handles historical entries after sorting by mileage', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 4000, mileage: 125000 },
        { amount: 3000, mileage: 124000 },
        { amount: 3500, mileage: 124500 },
        { amount: 3800, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      amount: 7500,
      costPerKm: 7.5,
      entriesUsed: 2
    });
  });

  it('calculates decimal cost per kilometer', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 3200.5, mileage: 124000 },
        { amount: 1234.56, mileage: 124375 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 375,
      amount: 1234.56,
      costPerKm: 1234.56 / 375,
      entriesUsed: 1
    });
  });

  it('returns not_enough_data when all pairs have non-growing mileage', () => {
    expect(
      calculateFuelCostPerKm([
        { amount: 3200, mileage: 124000 },
        { amount: 3100, mileage: 124000 }
      ])
    ).toEqual({
      status: 'not_enough_data'
    });
  });
});
