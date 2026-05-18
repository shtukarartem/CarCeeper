export class DoneParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DoneParseError';
  }
}

const integerPattern = /^-?\d+$/;
const decimalPattern = /^-?\d+[.,]\d+$/;

export function parseDoneInput(input: string): number {
  const tokens = input.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    throw new DoneParseError('Укажи номер задачи. Например: /done 12');
  }

  if (tokens.length > 1) {
    throw new DoneParseError('Укажи только один номер задачи. Например: /done 12');
  }

  const [rawReminderId] = tokens;

  if (decimalPattern.test(rawReminderId)) {
    throw new DoneParseError('Номер задачи должен быть целым числом.');
  }

  if (!integerPattern.test(rawReminderId)) {
    throw new DoneParseError('Номер задачи должен быть числом.');
  }

  const reminderId = Number(rawReminderId);

  if (!Number.isSafeInteger(reminderId) || reminderId <= 0) {
    throw new DoneParseError('Номер задачи должен быть больше нуля.');
  }

  return reminderId;
}
