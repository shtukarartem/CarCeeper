import { assertValidMileage } from '../domain/mileage.js';

export class MileageParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MileageParseError';
  }
}

const integerPattern = /^-?\d+$/;
const decimalPattern = /^-?\d+[.,]\d+$/;

export function parseMileageInput(input: string): number {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new MileageParseError('Укажи пробег. Например: /mileage 125000');
  }

  const decimalToken = tokens.find((token) => decimalPattern.test(token));

  if (decimalToken) {
    throw new MileageParseError('Пробег должен быть целым числом.');
  }

  const mileageToken = tokens.find((token) => integerPattern.test(token));

  if (!mileageToken) {
    throw new MileageParseError('Не нашел пробег. Например: /mileage 125000');
  }

  try {
    return assertValidMileage(Number(mileageToken));
  } catch (error) {
    if (error instanceof Error) {
      throw new MileageParseError(error.message);
    }

    throw error;
  }
}
