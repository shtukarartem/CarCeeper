import { describe, expect, it } from 'vitest';
import type { ServiceEntryRecord } from '../db/repositories/serviceRepository.js';
import { calculateServiceDueItems } from './serviceDueCalculator.js';

const baseEntry: ServiceEntryRecord = {
  id: 1,
  userId: 1,
  carId: 1,
  expenseId: 1,
  serviceType: 'oil',
  title: 'масло',
  amount: 6200,
  currency: 'BYN',
  serviceMileage: 126000,
  nextIntervalKm: 8000,
  nextDueMileage: 134000,
  nextIntervalMonths: null,
  nextDueDate: null,
  comment: null,
  serviceDate: '2026-05-17'
};

describe('calculateServiceDueItems', () => {
  it('marks mileage item as upcoming', () => {
    expect(
      calculateServiceDueItems([baseEntry], {
        currentMileage: 133200,
        today: '2026-05-17'
      })
    ).toMatchObject([
      {
        mileageStatus: 'upcoming',
        mileageDelta: 800,
        dateStatus: null,
        daysDelta: null
      }
    ]);
  });

  it('marks mileage item as overdue', () => {
    expect(
      calculateServiceDueItems([baseEntry], {
        currentMileage: 134500,
        today: '2026-05-17'
      })
    ).toMatchObject([
      {
        mileageStatus: 'overdue',
        mileageDelta: -500
      }
    ]);
  });

  it('marks date item as upcoming', () => {
    expect(
      calculateServiceDueItems(
        [
          {
            ...baseEntry,
            nextDueMileage: null,
            nextDueDate: '2026-06-01'
          }
        ],
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject([
      {
        mileageStatus: null,
        mileageDelta: null,
        dateStatus: 'upcoming',
        daysDelta: 15
      }
    ]);
  });

  it('marks date item as overdue', () => {
    expect(
      calculateServiceDueItems(
        [
          {
            ...baseEntry,
            nextDueMileage: null,
            nextDueDate: '2026-05-01'
          }
        ],
        {
          currentMileage: null,
          today: '2026-05-17'
        }
      )
    ).toMatchObject([
      {
        dateStatus: 'overdue',
        daysDelta: -16
      }
    ]);
  });

  it('does not calculate mileage status without current mileage', () => {
    expect(
      calculateServiceDueItems([baseEntry], {
        currentMileage: null,
        today: '2026-05-17'
      })
    ).toMatchObject([
      {
        mileageStatus: null,
        mileageDelta: null
      }
    ]);
  });
});
