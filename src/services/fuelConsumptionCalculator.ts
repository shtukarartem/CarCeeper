export type FuelConsumptionEntry = {
  liters: number;
  mileage: number;
};

export type FuelConsumptionResult =
  | {
      status: 'calculated';
      distanceKm: number;
      liters: number;
      litersPer100Km: number;
      entriesUsed: number;
    }
  | {
      status: 'not_enough_data';
    };

export function calculateFuelConsumption(
  entries: FuelConsumptionEntry[]
): FuelConsumptionResult {
  if (entries.length < 2) {
    return {
      status: 'not_enough_data'
    };
  }

  const sortedEntries = [...entries].sort((left, right) => left.mileage - right.mileage);
  let previousEntry = sortedEntries[0];
  let totalDistanceKm = 0;
  let totalLiters = 0;
  let entriesUsed = 0;

  for (const currentEntry of sortedEntries.slice(1)) {
    const distanceKm = currentEntry.mileage - previousEntry.mileage;

    if (distanceKm <= 0) {
      previousEntry = currentEntry;
      continue;
    }

    totalDistanceKm += distanceKm;
    totalLiters += currentEntry.liters;
    entriesUsed += 1;
    previousEntry = currentEntry;
  }

  if (totalDistanceKm === 0 || entriesUsed === 0) {
    return {
      status: 'not_enough_data'
    };
  }

  return {
    status: 'calculated',
    distanceKm: totalDistanceKm,
    liters: totalLiters,
    litersPer100Km: (totalLiters / totalDistanceKm) * 100,
    entriesUsed
  };
}
