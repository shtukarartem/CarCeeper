import type { CarRecord } from '../db/repositories/carRepository.js';
import type { FuelConsumptionResult } from './fuelConsumptionCalculator.js';
import type { FuelCostPerKmResult } from './fuelCostCalculator.js';
import { formatAmount } from '../utils/formatters.js';

export type FuelStatsFormatterInput = {
  car: Pick<CarRecord, 'name'>;
  entryCount: number;
  consumption: FuelConsumptionResult;
  cost: FuelCostPerKmResult;
  currency: string;
};

function formatLiters(liters: number): string {
  return Number.isInteger(liters) ? String(liters) : liters.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function formatFuelStats(input: FuelStatsFormatterInput): string {
  if (input.entryCount < 2 || input.consumption.status === 'not_enough_data' || input.cost.status === 'not_enough_data') {
    return [
      'Недостаточно данных для статистики топлива.',
      `Автомобиль: ${input.car.name}`,
      `Заправок: ${input.entryCount}`,
      'Добавь минимум две заправки с растущим пробегом:',
      '/fuel 45 3200 124500'
    ].join('\n');
  }

  return [
    'Статистика топлива:',
    `Автомобиль: ${input.car.name}`,
    `Заправок: ${input.entryCount}`,
    `Пробег по заправкам: ${input.consumption.distanceKm} км`,
    `Топливо: ${formatLiters(input.consumption.liters)} л`,
    `Расход: ${formatAmount(input.consumption.litersPer100Km)} л/100 км`,
    `Расходы на топливо: ${formatAmount(input.cost.amount)} ${input.currency}`,
    `Стоимость 1 км по топливу: ${formatAmount(input.cost.costPerKm)} ${input.currency}`
  ].join('\n');
}
