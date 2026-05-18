import {
  detectServiceType,
  getServiceTypeLabel,
  normalizeServiceTypeText,
  type ServiceType
} from '../domain/serviceTypes.js';

export type ParsedServiceInput = {
  serviceType: ServiceType;
  title: string;
  amount: number;
  serviceMileage: number | null;
  nextIntervalKm: number | null;
  nextIntervalMonths: number | null;
  comment: string;
};

export class ServiceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceParseError';
  }
}

const amountPattern = /^-?\d+(?:[.,]\d{1,2})?$/;
const integerPattern = /^-?\d+$/;
const decimalPattern = /^-?\d+[.,]\d+$/;
const mileageKeywords = new Set(['пробег']);
const nextKeywords = new Set(['след', 'следующий', 'следующая']);
const commentKeywords = new Set(['комментарий', 'коммент']);
const kmUnits = new Set(['км', 'km', 'к']);
const monthUnits = new Set(['м', 'мес', 'месяц', 'месяца', 'месяцев']);

function normalizeToken(value: string): string {
  return normalizeServiceTypeText(value).replaceAll('ё', 'е');
}

function parsePositiveAmount(value: string): number {
  const amount = Number(value.replace(',', '.'));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ServiceParseError('Сумма должна быть больше нуля.');
  }

  return amount;
}

function parseNonNegativeInteger(value: string, fieldName: string): number {
  if (decimalPattern.test(value)) {
    throw new ServiceParseError(`${fieldName} должен быть целым числом.`);
  }

  if (!integerPattern.test(value)) {
    throw new ServiceParseError(`${fieldName} должен быть числом.`);
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new ServiceParseError(`${fieldName} не может быть отрицательным.`);
  }

  return parsedValue;
}

function parsePositiveInteger(value: string, fieldName: string): number {
  if (decimalPattern.test(value)) {
    throw new ServiceParseError(`${fieldName} должен быть целым числом.`);
  }

  if (!integerPattern.test(value)) {
    throw new ServiceParseError(`${fieldName} должен быть числом.`);
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new ServiceParseError(`${fieldName} должен быть больше нуля.`);
  }

  return parsedValue;
}

function parseIntervalToken(value: string): {
  value: number;
  unit: 'km' | 'months' | null;
} {
  const normalizedValue = normalizeToken(value);
  const match = normalizedValue.match(/^(-?\d+)([а-яa-z]+)?$/);

  if (!match) {
    if (decimalPattern.test(normalizedValue)) {
      throw new ServiceParseError('Интервал следующей замены должен быть целым числом.');
    }

    throw new ServiceParseError('Интервал следующей замены должен быть числом.');
  }

  const intervalValue = parsePositiveInteger(match[1], 'Интервал следующей замены');
  const unit = match[2];

  if (!unit) {
    return {
      value: intervalValue,
      unit: null
    };
  }

  if (kmUnits.has(unit)) {
    return {
      value: intervalValue,
      unit: 'km'
    };
  }

  if (monthUnits.has(unit)) {
    return {
      value: intervalValue,
      unit: 'months'
    };
  }

  throw new ServiceParseError('Не понял единицу интервала следующей замены.');
}

function findAmountIndex(tokens: string[]): number {
  return tokens.findIndex((token) => amountPattern.test(token));
}

export function parseServiceInput(input: string): ParsedServiceInput {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new ServiceParseError(
      'Укажи обслуживание. Например: /service масло 6200 пробег 126000 след 8000'
    );
  }

  const amountIndex = findAmountIndex(tokens);

  if (amountIndex === -1) {
    throw new ServiceParseError('Не нашел сумму. Например: /service масло 6200');
  }

  const amount = parsePositiveAmount(tokens[amountIndex]);
  const consumedIndexes = new Set<number>([amountIndex]);
  let serviceMileage: number | null = null;
  let nextIntervalKm: number | null = null;
  let nextIntervalMonths: number | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = normalizeToken(tokens[index]);

    if (mileageKeywords.has(token)) {
      const mileageIndex = index + 1;

      if (!tokens[mileageIndex]) {
        throw new ServiceParseError('Укажи пробег после слова "пробег".');
      }

      serviceMileage = parseNonNegativeInteger(tokens[mileageIndex], 'Пробег');
      consumedIndexes.add(index);
      consumedIndexes.add(mileageIndex);
      index = mileageIndex;
      continue;
    }

    if (nextKeywords.has(token)) {
      const intervalIndex = index + 1;

      if (!tokens[intervalIndex]) {
        throw new ServiceParseError('Укажи интервал после слова "след".');
      }

      const parsedInterval = parseIntervalToken(tokens[intervalIndex]);
      const unitIndex = intervalIndex + 1;
      const explicitUnit = tokens[unitIndex] ? normalizeToken(tokens[unitIndex]) : null;
      let intervalUnit = parsedInterval.unit;

      if (intervalUnit === null && explicitUnit && (kmUnits.has(explicitUnit) || monthUnits.has(explicitUnit))) {
        intervalUnit = kmUnits.has(explicitUnit) ? 'km' : 'months';
        consumedIndexes.add(unitIndex);
        index = unitIndex;
      } else {
        index = intervalIndex;
      }

      if (intervalUnit === 'months') {
        nextIntervalMonths = parsedInterval.value;
      } else {
        nextIntervalKm = parsedInterval.value;
      }

      consumedIndexes.add(index === unitIndex ? index - 2 : index - 1);
      consumedIndexes.add(intervalIndex);
    }
  }

  const titleTokens = tokens.slice(0, amountIndex);
  const serviceType = detectServiceType(tokens.filter((_, index) => !consumedIndexes.has(index)));
  const title = titleTokens.join(' ').trim() || getServiceTypeLabel(serviceType);
  const comment = tokens
    .filter((_, index) => !consumedIndexes.has(index))
    .slice(titleTokens.length)
    .filter((token) => !commentKeywords.has(normalizeToken(token)))
    .join(' ');

  return {
    serviceType,
    title,
    amount,
    serviceMileage,
    nextIntervalKm,
    nextIntervalMonths,
    comment
  };
}
