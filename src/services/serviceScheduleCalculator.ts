export type ServiceScheduleInput = {
  serviceMileage?: number | null;
  serviceDate?: Date | string | null;
  nextIntervalKm?: number | null;
  nextIntervalMonths?: number | null;
};

export type ServiceScheduleResult = {
  nextDueMileage: number | null;
  nextDueDate: string | null;
};

export class ServiceScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceScheduleError';
  }
}

function assertOptionalNonNegativeInteger(value: number | null | undefined, message: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new ServiceScheduleError(message);
  }

  return value;
}

function assertOptionalPositiveInteger(value: number | null | undefined, message: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new ServiceScheduleError(message);
  }

  return value;
}

function parseServiceDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new ServiceScheduleError('Дата обслуживания должна быть корректной датой.');
  }

  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const originalDay = result.getUTCDate();

  result.setUTCMonth(result.getUTCMonth() + months);

  if (result.getUTCDate() !== originalDay) {
    result.setUTCDate(0);
  }

  return result;
}

export function calculateServiceSchedule(input: ServiceScheduleInput): ServiceScheduleResult {
  const serviceMileage = assertOptionalNonNegativeInteger(
    input.serviceMileage,
    'Пробег обслуживания должен быть целым числом больше или равным нулю.'
  );
  const nextIntervalKm = assertOptionalPositiveInteger(
    input.nextIntervalKm,
    'Интервал следующей замены в километрах должен быть целым числом больше нуля.'
  );
  const nextIntervalMonths = assertOptionalPositiveInteger(
    input.nextIntervalMonths,
    'Интервал следующей замены в месяцах должен быть целым числом больше нуля.'
  );
  const serviceDate = parseServiceDate(input.serviceDate);

  return {
    nextDueMileage:
      serviceMileage === null || nextIntervalKm === null
        ? null
        : serviceMileage + nextIntervalKm,
    nextDueDate:
      serviceDate === null || nextIntervalMonths === null
        ? null
        : formatDate(addMonths(serviceDate, nextIntervalMonths))
  };
}
