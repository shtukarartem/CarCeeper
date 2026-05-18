import type { PoolClient } from 'pg';
import type { ExpenseRecord } from './expenseRepository.js';
import { db } from '../client.js';

export type CreateFuelEntryWithExpenseInput = {
  userId: number;
  carId: number;
  liters: number;
  amount: number;
  pricePerLiter: number;
  mileage: number;
  currency: string;
  comment?: string | null;
  fuelDate?: Date;
};

export type FuelEntryRecord = {
  id: number;
  userId: number;
  carId: number;
  expenseId: number | null;
  liters: number;
  amount: number;
  pricePerLiter: number;
  mileage: number;
  fuelDate: string;
};

export type FuelEntryWithExpenseRecord = {
  fuelEntry: FuelEntryRecord;
  expense: ExpenseRecord;
};

type ExpenseRow = {
  id: number;
  user_id: number;
  car_id: number | null;
  category: 'fuel';
  amount: string;
  currency: string;
  comment: string | null;
  expense_date: string;
};

type FuelEntryRow = {
  id: number;
  user_id: number;
  car_id: number;
  expense_id: number | null;
  liters: string;
  amount: string;
  price_per_liter: string;
  mileage: number;
  fuel_date: string;
};

function mapExpense(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    comment: row.comment,
    expenseDate: row.expense_date
  };
}

function mapFuelEntry(row: FuelEntryRow): FuelEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    expenseId: row.expense_id,
    liters: Number(row.liters),
    amount: Number(row.amount),
    pricePerLiter: Number(row.price_per_liter),
    mileage: row.mileage,
    fuelDate: row.fuel_date
  };
}

async function insertFuelExpense(
  client: PoolClient,
  input: CreateFuelEntryWithExpenseInput
): Promise<ExpenseRecord> {
  const result = await client.query<ExpenseRow>(
    `
      insert into expenses (user_id, car_id, category, amount, currency, comment, expense_date)
      values ($1, $2, 'fuel', $3, $4, $5, coalesce($6, current_date))
      returning id, user_id, car_id, category, amount, currency, comment, expense_date::text as expense_date
    `,
    [
      input.userId,
      input.carId,
      input.amount,
      input.currency,
      input.comment ?? null,
      input.fuelDate ?? null
    ]
  );

  return mapExpense(result.rows[0]);
}

async function insertFuelEntry(
  client: PoolClient,
  input: CreateFuelEntryWithExpenseInput,
  expenseId: number
): Promise<FuelEntryRecord> {
  const result = await client.query<FuelEntryRow>(
    `
      insert into fuel_entries (
        user_id,
        car_id,
        expense_id,
        liters,
        amount,
        price_per_liter,
        mileage,
        fuel_date
      )
      values ($1, $2, $3, $4, $5, $6, $7, coalesce($8, current_date))
      returning
        id,
        user_id,
        car_id,
        expense_id,
        liters,
        amount,
        price_per_liter,
        mileage,
        fuel_date::text as fuel_date
    `,
    [
      input.userId,
      input.carId,
      expenseId,
      input.liters,
      input.amount,
      input.pricePerLiter,
      input.mileage,
      input.fuelDate ?? null
    ]
  );

  return mapFuelEntry(result.rows[0]);
}

export async function createFuelEntryWithExpense(
  input: CreateFuelEntryWithExpenseInput
): Promise<FuelEntryWithExpenseRecord> {
  const client = await db.connect();

  try {
    await client.query('begin');

    const expense = await insertFuelExpense(client, input);
    const fuelEntry = await insertFuelEntry(client, input, expense.id);

    await client.query('commit');

    return {
      fuelEntry,
      expense
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function getRecentFuelEntriesByCarId(
  carId: number,
  limit = 10
): Promise<FuelEntryRecord[]> {
  const result = await db.query<FuelEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        liters,
        amount,
        price_per_liter,
        mileage,
        fuel_date::text as fuel_date
      from fuel_entries
      where car_id = $1
      order by fuel_date desc, created_at desc, id desc
      limit $2
    `,
    [carId, limit]
  );

  return result.rows.map(mapFuelEntry);
}

export async function getFuelEntriesByCarId(carId: number): Promise<FuelEntryRecord[]> {
  const result = await db.query<FuelEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        liters,
        amount,
        price_per_liter,
        mileage,
        fuel_date::text as fuel_date
      from fuel_entries
      where car_id = $1
      order by mileage asc, fuel_date asc, id asc
    `,
    [carId]
  );

  return result.rows.map(mapFuelEntry);
}

export async function getFuelEntriesByCarIdForPeriod(
  carId: number,
  startDate: Date,
  endDate: Date
): Promise<FuelEntryRecord[]> {
  const result = await db.query<FuelEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        liters,
        amount,
        price_per_liter,
        mileage,
        fuel_date::text as fuel_date
      from fuel_entries
      where car_id = $1
        and fuel_date >= $2
        and fuel_date < $3
      order by mileage asc, fuel_date asc, id asc
    `,
    [carId, startDate, endDate]
  );

  return result.rows.map(mapFuelEntry);
}

export async function getFuelEntriesForStatsByCarId(carId: number): Promise<FuelEntryRecord[]> {
  return getFuelEntriesByCarId(carId);
}
