export type ReportPeriodType = 'month' | 'year';

export type ReportPeriod = {
  type: ReportPeriodType;
  startDate: string;
  endDate: string;
  label: string;
};

export class ReportPeriodParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportPeriodParseError';
  }
}

const supportedFormatsMessage = [
  'Не понял период отчета.',
  'Примеры:',
  '/report month',
  '/report year',
  '/report 2026-05',
  '/report 2026'
].join('\n');

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getCurrentYear(currentDate: Date): number {
  return currentDate.getUTCFullYear();
}

function getCurrentMonth(currentDate: Date): number {
  return currentDate.getUTCMonth() + 1;
}

function buildMonthPeriod(year: number, month: number): ReportPeriod {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    type: 'month',
    startDate: formatDate(year, month, 1),
    endDate: formatDate(nextYear, nextMonth, 1),
    label: formatMonthLabel(year, month)
  };
}

function buildYearPeriod(year: number): ReportPeriod {
  return {
    type: 'year',
    startDate: formatDate(year, 1, 1),
    endDate: formatDate(year + 1, 1, 1),
    label: String(year)
  };
}

function parseYear(value: string): number {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new ReportPeriodParseError('Год должен быть в формате YYYY. Например: /report 2026');
  }

  return year;
}

function parseMonth(value: string): ReportPeriod {
  const match = /^(?<year>\d{4})-(?<month>\d{2})$/.exec(value);

  if (!match?.groups) {
    throw new ReportPeriodParseError('Месяц должен быть в формате YYYY-MM. Например: /report 2026-05');
  }

  const year = parseYear(match.groups.year);
  const month = Number(match.groups.month);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ReportPeriodParseError('Месяц должен быть от 01 до 12. Например: /report 2026-05');
  }

  return buildMonthPeriod(year, month);
}

export function parseReportPeriod(input: string | undefined, currentDate = new Date()): ReportPeriod {
  const value = (input ?? '').trim().toLocaleLowerCase('ru-RU');

  if (Number.isNaN(currentDate.getTime())) {
    throw new ReportPeriodParseError('Текущая дата некорректна.');
  }

  if (value === '' || value === 'month') {
    return buildMonthPeriod(getCurrentYear(currentDate), getCurrentMonth(currentDate));
  }

  if (value === 'year') {
    return buildYearPeriod(getCurrentYear(currentDate));
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return parseMonth(value);
  }

  if (/^\d{4}$/.test(value)) {
    return buildYearPeriod(parseYear(value));
  }

  throw new ReportPeriodParseError(supportedFormatsMessage);
}
