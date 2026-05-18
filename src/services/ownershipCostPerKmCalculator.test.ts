import { describe, expect, it } from 'vitest';
import { calculateOwnershipCostPerKm } from './ownershipCostPerKmCalculator.js';

describe('calculateOwnershipCostPerKm', () => {
  it('returns not_enough_data when there are fewer than two mileage points', () => {
    expect(calculateOwnershipCostPerKm({
      totalAmount: 1000,
      fuelAmount: 500,
      mileagePoints: []
    })).toEqual({
      status: 'not_enough_data'
    });

    expect(calculateOwnershipCostPerKm({
      totalAmount: 1000,
      fuelAmount: 500,
      mileagePoints: [124000]
    })).toEqual({
      status: 'not_enough_data'
    });
  });

  it('calculates fuel and total cost per kilometer', () => {
    expect(calculateOwnershipCostPerKm({
      totalAmount: 12800,
      fuelAmount: 7000,
      mileagePoints: [124000, 125600]
    })).toEqual({
      status: 'calculated',
      distanceKm: 1600,
      fuelCostPerKm: 7000 / 1600,
      totalCostPerKm: 12800 / 1600
    });
  });

  it('sorts mileage points before calculating distance', () => {
    expect(calculateOwnershipCostPerKm({
      totalAmount: 12000,
      fuelAmount: 6000,
      mileagePoints: [125000, 124000, 124500]
    })).toEqual({
      status: 'calculated',
      distanceKm: 1000,
      fuelCostPerKm: 6,
      totalCostPerKm: 12
    });
  });

  it('returns not_enough_data when distance is zero', () => {
    expect(calculateOwnershipCostPerKm({
      totalAmount: 1000,
      fuelAmount: 500,
      mileagePoints: [124000, 124000]
    })).toEqual({
      status: 'not_enough_data'
    });
  });
});
