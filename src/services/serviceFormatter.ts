import type { ExpenseRecord } from '../db/repositories/expenseRepository.js';
import type { ServiceEntryRecord } from '../db/repositories/serviceRepository.js';
import type { ServiceDueItem } from './serviceDueCalculator.js';
import { formatAmount, formatDate } from '../utils/formatters.js';

export type FormatServiceCreatedInput = {
  carName: string;
  serviceEntry: ServiceEntryRecord;
  expense: ExpenseRecord;
  currentMileageUpdated: boolean;
  historicalMileage: boolean;
  serviceReminderCreated?: boolean;
};

function formatMileage(mileage: number): string {
  return `${mileage} км`;
}

export function formatServiceMissingCar(): string {
  return [
    'Сначала добавь автомобиль:',
    '/car Toyota Camry'
  ].join('\n');
}

export function formatServiceCreated(input: FormatServiceCreatedInput): string {
  const lines = [
    'Обслуживание добавлено:',
    `Автомобиль: ${input.carName}`,
    `Работа: ${input.serviceEntry.title}`,
    `Сумма: ${formatAmount(input.expense.amount)} ${input.expense.currency}`
  ];

  if (input.serviceEntry.serviceMileage !== null) {
    lines.push(`Пробег: ${formatMileage(input.serviceEntry.serviceMileage)}`);
  }

  if (input.serviceEntry.nextDueMileage !== null) {
    lines.push(`Следующая замена: ${formatMileage(input.serviceEntry.nextDueMileage)}`);
  }

  if (input.serviceEntry.nextDueDate !== null) {
    lines.push(`Следующая дата: ${formatDate(input.serviceEntry.nextDueDate)}`);
  }

  if (input.serviceEntry.comment) {
    lines.push(`Комментарий: ${input.serviceEntry.comment}`);
  }

  if (input.historicalMileage) {
    lines.push('Текущий пробег автомобиля не изменен.');
  } else if (input.currentMileageUpdated) {
    lines.push('Текущий пробег автомобиля обновлен.');
  }

  if (input.serviceReminderCreated) {
    lines.push('Напоминание о следующем обслуживании добавлено.');
  }

  return lines.join('\n');
}

export function formatServiceHistory(entries: ServiceEntryRecord[]): string {
  if (entries.length === 0) {
    return [
      'Истории обслуживания пока нет.',
      'Добавь первое обслуживание:',
      '/service масло 6200 пробег 126000 след 8000'
    ].join('\n');
  }

  const lines = entries.map((entry, index) => {
    const mileage = entry.serviceMileage === null ? null : `${entry.serviceMileage} км`;
    const next = [
      entry.nextDueMileage === null ? null : `${entry.nextDueMileage} км`,
      entry.nextDueDate === null ? null : formatDate(entry.nextDueDate)
    ].filter(Boolean);
    const nextText = next.length > 0 ? ` - след: ${next.join(', ')}` : '';
    const mileageText = mileage ? ` - ${mileage}` : '';
    const commentText = entry.comment ? ` - ${entry.comment}` : '';

    return `${index + 1}. ${formatDate(entry.serviceDate)} - ${entry.title} - ${formatAmount(entry.amount)} ${entry.currency}${mileageText}${nextText}${commentText}`;
  });

  return ['История обслуживания:', ...lines].join('\n');
}

export function formatServiceDue(items: ServiceDueItem[], hasCurrentMileage: boolean): string {
  if (items.length === 0) {
    const lines = [
      'Ближайших замен пока нет.',
      'Добавь обслуживание с интервалом:',
      '/service масло 6200 пробег 126000 след 8000'
    ];

    if (!hasCurrentMileage) {
      lines.push('Для замен по пробегу сначала обнови пробег: /mileage 126000');
    }

    return lines.join('\n');
  }

  const lines = items.map((item, index) => {
    const details: string[] = [];

    if (item.mileageDelta !== null && item.serviceEntry.nextDueMileage !== null) {
      if (item.mileageStatus === 'overdue') {
        details.push(`просрочено на ${Math.abs(item.mileageDelta)} км`);
      } else {
        details.push(`через ${item.mileageDelta} км`);
      }

      details.push(`${item.serviceEntry.nextDueMileage} км`);
    }

    if (item.daysDelta !== null && item.serviceEntry.nextDueDate !== null) {
      if (item.dateStatus === 'overdue') {
        details.push(`просрочено с ${formatDate(item.serviceEntry.nextDueDate)}`);
      } else {
        details.push(`до ${formatDate(item.serviceEntry.nextDueDate)}`);
      }
    }

    return `${index + 1}. ${item.serviceEntry.title} - ${details.join(' - ')}`;
  });

  if (!hasCurrentMileage) {
    lines.push('');
    lines.push('Для замен по пробегу сначала обнови пробег: /mileage 126000');
  }

  return ['Ближайшие замены:', ...lines].join('\n');
}
