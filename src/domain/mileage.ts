export type Mileage = number;

export type FuelEntryDraft = {
  liters: number;
  amount: number;
  pricePerLiter: number;
  mileage: Mileage;
};

export type ManualMileageUpdateDecision =
  | {
      status: 'updated';
      nextMileage: Mileage;
    }
  | {
      status: 'unchanged';
      nextMileage: Mileage;
    }
  | {
      status: 'rejected_decrease';
      currentMileage: Mileage;
      requestedMileage: Mileage;
    };

export type FuelMileageUpdateDecision =
  | {
      status: 'updated';
      shouldUpdateCar: true;
      nextMileage: Mileage;
    }
  | {
      status: 'unchanged';
      shouldUpdateCar: false;
      nextMileage: Mileage;
    }
  | {
      status: 'historical';
      shouldUpdateCar: false;
      nextMileage: Mileage;
      fuelMileage: Mileage;
    };

export class MileageRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MileageRuleError';
  }
}

export function assertValidMileage(value: number): Mileage {
  if (!Number.isFinite(value)) {
    throw new MileageRuleError('Пробег должен быть числом.');
  }

  if (!Number.isInteger(value)) {
    throw new MileageRuleError('Пробег должен быть целым числом.');
  }

  if (value < 0) {
    throw new MileageRuleError('Пробег не может быть отрицательным.');
  }

  return value;
}

export function resolveManualMileageUpdate(
  currentMileage: Mileage | null,
  requestedMileage: Mileage
): ManualMileageUpdateDecision {
  const validRequestedMileage = assertValidMileage(requestedMileage);
  const validCurrentMileage = currentMileage === null ? null : assertValidMileage(currentMileage);

  if (validCurrentMileage === null || validRequestedMileage > validCurrentMileage) {
    return {
      status: 'updated',
      nextMileage: validRequestedMileage
    };
  }

  if (validRequestedMileage === validCurrentMileage) {
    return {
      status: 'unchanged',
      nextMileage: validCurrentMileage
    };
  }

  return {
    status: 'rejected_decrease',
    currentMileage: validCurrentMileage,
    requestedMileage: validRequestedMileage
  };
}

export function resolveFuelMileageUpdate(
  currentMileage: Mileage | null,
  fuelMileage: Mileage
): FuelMileageUpdateDecision {
  const validFuelMileage = assertValidMileage(fuelMileage);
  const validCurrentMileage = currentMileage === null ? null : assertValidMileage(currentMileage);

  if (validCurrentMileage === null || validFuelMileage > validCurrentMileage) {
    return {
      status: 'updated',
      shouldUpdateCar: true,
      nextMileage: validFuelMileage
    };
  }

  if (validFuelMileage === validCurrentMileage) {
    return {
      status: 'unchanged',
      shouldUpdateCar: false,
      nextMileage: validCurrentMileage
    };
  }

  return {
    status: 'historical',
    shouldUpdateCar: false,
    nextMileage: validCurrentMileage,
    fuelMileage: validFuelMileage
  };
}
