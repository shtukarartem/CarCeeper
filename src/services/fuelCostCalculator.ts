export type FuelCostEntry = {
  amount: number;
  mileage: number;
};

export type FuelCostPerKmResult =
  | {
      status: 'calculated';
      distanceKm: number;
      amount: number;
      costPerKm: number;
      entriesUsed: number;
    }
  | {
      status: 'not_enough_data';
    };

export function calculateFuelCostPerKm(entries: FuelCostEntry[]): FuelCostPerKmResult {
  if (entries.length < 2) {
    return {
      status: 'not_enough_data'
    };
  }

  const sortedEntries = [...entries].sort((left, right) => left.mileage - right.mileage);
  let previousEntry = sortedEntries[0];
  let totalDistanceKm = 0;
  let totalAmount = 0;
  let entriesUsed = 0;

  for (const currentEntry of sortedEntries.slice(1)) {
    const distanceKm = currentEntry.mileage - previousEntry.mileage;

    if (distanceKm <= 0) {
      previousEntry = currentEntry;
      continue;
    }

    totalDistanceKm += distanceKm;
    totalAmount += currentEntry.amount;
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
    amount: totalAmount,
    costPerKm: totalAmount / totalDistanceKm,
    entriesUsed
  };
}
