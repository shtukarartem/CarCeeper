export type OwnershipCostPerKmInput = {
  totalAmount: number;
  fuelAmount: number;
  mileagePoints: number[];
};

export type OwnershipCostPerKmResult =
  | {
      status: 'calculated';
      distanceKm: number;
      fuelCostPerKm: number;
      totalCostPerKm: number;
    }
  | {
      status: 'not_enough_data';
    };

export function calculateOwnershipCostPerKm(
  input: OwnershipCostPerKmInput
): OwnershipCostPerKmResult {
  const sortedMileagePoints = [...input.mileagePoints].sort((left, right) => left - right);
  const firstMileage = sortedMileagePoints[0];
  const lastMileage = sortedMileagePoints[sortedMileagePoints.length - 1];

  if (
    sortedMileagePoints.length < 2 ||
    firstMileage === undefined ||
    lastMileage === undefined ||
    lastMileage <= firstMileage
  ) {
    return {
      status: 'not_enough_data'
    };
  }

  const distanceKm = lastMileage - firstMileage;

  return {
    status: 'calculated',
    distanceKm,
    fuelCostPerKm: input.fuelAmount / distanceKm,
    totalCostPerKm: input.totalAmount / distanceKm
  };
}
