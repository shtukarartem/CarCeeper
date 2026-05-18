import { describe, expect, it } from 'vitest';
import { calculateFuelConsumption } from './fuelConsumptionCalculator.js';

describe('calculateFuelConsumption', () => {
  it('returns not_enough_data when there are fewer than two entries', () => {
    expect(calculateFuelConsumption([])).toEqual({
      status: 'not_enough_data'
    });
    expect(calculateFuelConsumption([{ liters: 45, mileage: 124000 }])).toEqual({
      status: 'not_enough_data'
    });
  });

  it('calculates liters per 100 km from sequential fuel entries', () => {
    expect(
      calculateFuelConsumption([
        { liters: 45, mileage: 124000 },
        { liters: 42, mileage: 124500 },
        { liters: 43, mileage: 125000 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      liters: 85,
      litersPer100Km: 8.5,
      entriesUsed: 2
    });
  });

  it('sorts entries by mileage before calculating', () => {
    expect(
      calculateFuelConsumption([
        { liters: 43, mileage: 125000 },
        { liters: 45, mileage: 124000 },
        { liters: 42, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      liters: 85,
      litersPer100Km: 8.5,
      entriesUsed: 2
    });
  });

  it('skips pairs where mileage does not grow', () => {
    expect(
      calculateFuelConsumption([
        { liters: 45, mileage: 124000 },
        { liters: 42, mileage: 124000 },
        { liters: 43, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 500,
      liters: 43,
      litersPer100Km: 8.6,
      entriesUsed: 1
    });
  });

  it('handles historical entries after sorting by mileage', () => {
    expect(
      calculateFuelConsumption([
        { liters: 40, mileage: 125000 },
        { liters: 30, mileage: 124000 },
        { liters: 35, mileage: 124500 },
        { liters: 38, mileage: 124500 }
      ])
    ).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      liters: 75,
      litersPer100Km: 7.5,
      entriesUsed: 2
    });
  });

  it('calculates decimal fuel consumption', () => {
    const result = calculateFuelConsumption([
      { liters: 45.5, mileage: 124000 },
      { liters: 42.25, mileage: 124375 }
    ]);

    expect(result).toEqual({
      status: 'calculated',
      distanceKm: 375,
      liters: 42.25,
      litersPer100Km: 42.25 / 375 * 100,
      entriesUsed: 1
    });
  });

  it('returns not_enough_data when all pairs have non-growing mileage', () => {
    expect(
      calculateFuelConsumption([
        { liters: 45, mileage: 124000 },
        { liters: 42, mileage: 124000 }
      ])
    ).toEqual({
      status: 'not_enough_data'
    });
  });
});
