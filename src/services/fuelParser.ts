import { assertValidMileage } from '../domain/mileage.js';

export type ParsedFuelInput = {
  liters: number;
  amount: number;
  mileage: number;
  pricePerLiter: number;
};

export class FuelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FuelParseError';
  }
}

const decimalNumberPattern = /^-?\d+(?:[.,]\d+)?$/;
const integerPattern = /^-?\d+$/;

function parsePositiveDecimal(
  value: string,
  invalidMessage: string,
  nonPositiveMessage: string
): number {
  if (!decimalNumberPattern.test(value)) {
    throw new FuelParseError(invalidMessage);
  }

  const parsedValue = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new FuelParseError(nonPositiveMessage);
  }

  return parsedValue;
}

function parseMileage(value: string): number {
  if (!integerPattern.test(value)) {
    throw new FuelParseError('Пробег должен быть целым числом.');
  }

  try {
    return assertValidMileage(Number(value));
  } catch (error) {
    if (error instanceof Error) {
      throw new FuelParseError(error.message);
    }

    throw error;
  }
}

export function parseFuelInput(input: string): ParsedFuelInput {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new FuelParseError('Укажи заправку. Например: /fuel 45 3200 124500');
  }

  if (tokens.length < 3) {
    throw new FuelParseError('Укажи литры, сумму и пробег. Например: /fuel 45 3200 124500');
  }

  const liters = parsePositiveDecimal(
    tokens[0],
    'Литры должны быть числом.',
    'Литры должны быть больше нуля.'
  );
  const amount = parsePositiveDecimal(
    tokens[1],
    'Сумма должна быть числом.',
    'Сумма должна быть больше нуля.'
  );
  const mileage = parseMileage(tokens[2]);

  return {
    liters,
    amount,
    mileage,
    pricePerLiter: amount / liters
  };
}
