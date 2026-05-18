export type ParsedReminderInput =
  | {
      title: string;
      dueDate: string;
      dueMileage: null;
      mileageMode: null;
    }
  | {
      title: string;
      dueDate: null;
      dueMileage: number;
      mileageMode: 'relative' | 'absolute';
    };

export class ReminderParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReminderParseError';
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const mileageTokenPattern = /^(-?\d+)(?:км|km|к)?$/i;
const integerPattern = /^-?\d+$/;
const decimalPattern = /^-?\d+[.,]\d+/;
const relativeMileageKeywords = new Set(['через']);
const absoluteMileageKeywords = new Set(['на']);
const mileageUnitPattern = /^(км|km|к)$/i;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDateToken(value: string): string {
  if (!datePattern.test(value)) {
    throw new ReminderParseError('Дата напоминания должна быть в формате YYYY-MM-DD.');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || toIsoDate(date) !== value) {
    throw new ReminderParseError('Дата напоминания должна быть корректной датой.');
  }

  return value;
}

function parseMileageToken(value: string): number {
  const normalizedValue = value.trim().toLowerCase();
  const match = normalizedValue.match(mileageTokenPattern);

  if (!match) {
    if (decimalPattern.test(normalizedValue)) {
      throw new ReminderParseError('Пробег напоминания должен быть целым числом.');
    }

    throw new ReminderParseError('Пробег напоминания должен быть числом.');
  }

  const rawMileage = match[1];

  if (!integerPattern.test(rawMileage)) {
    throw new ReminderParseError('Пробег напоминания должен быть целым числом.');
  }

  const mileage = Number(rawMileage);

  if (!Number.isFinite(mileage) || mileage <= 0) {
    throw new ReminderParseError('Пробег напоминания должен быть больше нуля.');
  }

  return mileage;
}

function parseDateReminder(tokens: string[], dateIndex: number): ParsedReminderInput {
  const title = tokens.slice(0, dateIndex).join(' ').trim();

  if (!title) {
    throw new ReminderParseError('Укажи название напоминания.');
  }

  if (dateIndex !== tokens.length - 1) {
    throw new ReminderParseError('Дата напоминания должна быть последним аргументом.');
  }

  return {
    title,
    dueDate: parseDateToken(tokens[dateIndex]),
    dueMileage: null,
    mileageMode: null
  };
}

function parseMileageReminder(
  tokens: string[],
  keywordIndex: number,
  mileageMode: 'relative' | 'absolute'
): ParsedReminderInput {
  const mileageIndex = keywordIndex + 1;
  const unitIndex = keywordIndex + 2;
  const title = tokens.slice(0, keywordIndex).join(' ').trim();

  if (!title) {
    throw new ReminderParseError('Укажи название напоминания.');
  }

  if (!tokens[mileageIndex]) {
    throw new ReminderParseError('Укажи пробег напоминания.');
  }

  const hasSeparateUnit = tokens[unitIndex] ? mileageUnitPattern.test(tokens[unitIndex]) : false;
  const expectedLength = hasSeparateUnit ? unitIndex + 1 : mileageIndex + 1;

  if (tokens.length !== expectedLength) {
    throw new ReminderParseError('Пробег напоминания должен быть последним аргументом.');
  }

  return {
    title,
    dueDate: null,
    dueMileage: parseMileageToken(tokens[mileageIndex]),
    mileageMode
  };
}

export function parseReminderInput(input: string): ParsedReminderInput {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new ReminderParseError(
      'Укажи напоминание. Например: /remind страховка 2026-09-01'
    );
  }

  const dateIndexes = tokens
    .map((token, index) => (datePattern.test(token) ? index : -1))
    .filter((index) => index !== -1);
  const relativeMileageIndex = tokens.findIndex((token) =>
    relativeMileageKeywords.has(token.toLowerCase())
  );
  const absoluteMileageIndex = tokens.findIndex((token) =>
    absoluteMileageKeywords.has(token.toLowerCase())
  );
  const mileageIndexes = [relativeMileageIndex, absoluteMileageIndex].filter((index) => index !== -1);

  if (dateIndexes.length > 0 && mileageIndexes.length > 0) {
    throw new ReminderParseError('Укажи либо дату, либо пробег напоминания.');
  }

  if (dateIndexes.length > 1 || mileageIndexes.length > 1) {
    throw new ReminderParseError('Укажи только одну дату или один пробег напоминания.');
  }

  if (dateIndexes.length === 1) {
    return parseDateReminder(tokens, dateIndexes[0]);
  }

  if (relativeMileageIndex !== -1) {
    return parseMileageReminder(tokens, relativeMileageIndex, 'relative');
  }

  if (absoluteMileageIndex !== -1) {
    return parseMileageReminder(tokens, absoluteMileageIndex, 'absolute');
  }

  const maybeInvalidDate = tokens.find((token) => /^\d{4}-\d{1,2}-\d{1,2}$/.test(token));

  if (maybeInvalidDate) {
    parseDateToken(maybeInvalidDate);
  }

  throw new ReminderParseError(
    'Не нашел дату или пробег. Например: /remind страховка 2026-09-01'
  );
}
