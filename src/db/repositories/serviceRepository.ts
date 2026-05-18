import type { PoolClient } from 'pg';
import type { ExpenseCategory } from '../../domain/expenseCategories.js';
import type { ServiceType } from '../../domain/serviceTypes.js';
import type { ExpenseRecord } from './expenseRepository.js';
import { db } from '../client.js';

export type CreateServiceEntryWithExpenseInput = {
  userId: number;
  carId: number;
  expenseCategory?: ExpenseCategory;
  serviceType: ServiceType;
  title: string;
  amount: number;
  currency: string;
  serviceMileage?: number | null;
  nextIntervalKm?: number | null;
  nextDueMileage?: number | null;
  nextIntervalMonths?: number | null;
  nextDueDate?: string | Date | null;
  comment?: string | null;
  serviceDate?: string | Date | null;
};

export type ServiceEntryRecord = {
  id: number;
  userId: number;
  carId: number;
  expenseId: number | null;
  serviceType: ServiceType;
  title: string;
  amount: number;
  currency: string;
  serviceMileage: number | null;
  nextIntervalKm: number | null;
  nextDueMileage: number | null;
  nextIntervalMonths: number | null;
  nextDueDate: string | null;
  comment: string | null;
  serviceDate: string;
};

export type ServiceEntryWithExpenseRecord = {
  serviceEntry: ServiceEntryRecord;
  expense: ExpenseRecord;
};

type ExpenseRow = {
  id: number;
  user_id: number;
  car_id: number | null;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  comment: string | null;
  expense_date: string;
};

type ServiceEntryRow = {
  id: number;
  user_id: number;
  car_id: number;
  expense_id: number | null;
  service_type: ServiceType;
  title: string;
  amount: string;
  currency: string;
  service_mileage: number | null;
  next_interval_km: number | null;
  next_due_mileage: number | null;
  next_interval_months: number | null;
  next_due_date: string | null;
  comment: string | null;
  service_date: string;
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

function mapServiceEntry(row: ServiceEntryRow): ServiceEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    expenseId: row.expense_id,
    serviceType: row.service_type,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    serviceMileage: row.service_mileage,
    nextIntervalKm: row.next_interval_km,
    nextDueMileage: row.next_due_mileage,
    nextIntervalMonths: row.next_interval_months,
    nextDueDate: row.next_due_date,
    comment: row.comment,
    serviceDate: row.service_date
  };
}

async function insertServiceExpense(
  client: PoolClient,
  input: CreateServiceEntryWithExpenseInput
): Promise<ExpenseRecord> {
  const result = await client.query<ExpenseRow>(
    `
      insert into expenses (user_id, car_id, category, amount, currency, comment, expense_date)
      values ($1, $2, $3, $4, $5, $6, coalesce($7, current_date))
      returning id, user_id, car_id, category, amount, currency, comment, expense_date::text as expense_date
    `,
    [
      input.userId,
      input.carId,
      input.expenseCategory ?? 'maintenance',
      input.amount,
      input.currency,
      input.comment ?? input.title,
      input.serviceDate ?? null
    ]
  );

  return mapExpense(result.rows[0]);
}

async function insertServiceEntry(
  client: PoolClient,
  input: CreateServiceEntryWithExpenseInput,
  expenseId: number
): Promise<ServiceEntryRecord> {
  const result = await client.query<ServiceEntryRow>(
    `
      insert into service_entries (
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date,
        comment,
        service_date
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, coalesce($14, current_date))
      returning
        id,
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date::text as next_due_date,
        comment,
        service_date::text as service_date
    `,
    [
      input.userId,
      input.carId,
      expenseId,
      input.serviceType,
      input.title,
      input.amount,
      input.currency,
      input.serviceMileage ?? null,
      input.nextIntervalKm ?? null,
      input.nextDueMileage ?? null,
      input.nextIntervalMonths ?? null,
      input.nextDueDate ?? null,
      input.comment ?? null,
      input.serviceDate ?? null
    ]
  );

  return mapServiceEntry(result.rows[0]);
}

export async function createServiceEntryWithExpense(
  input: CreateServiceEntryWithExpenseInput
): Promise<ServiceEntryWithExpenseRecord> {
  const client = await db.connect();

  try {
    await client.query('begin');

    const expense = await insertServiceExpense(client, input);
    const serviceEntry = await insertServiceEntry(client, input, expense.id);

    await client.query('commit');

    return {
      serviceEntry,
      expense
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function getRecentServiceEntriesByCarId(
  carId: number,
  limit = 10
): Promise<ServiceEntryRecord[]> {
  const result = await db.query<ServiceEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date::text as next_due_date,
        comment,
        service_date::text as service_date
      from service_entries
      where car_id = $1
      order by service_date desc, created_at desc, id desc
      limit $2
    `,
    [carId, limit]
  );

  return result.rows.map(mapServiceEntry);
}

export async function getServiceEntriesByCarId(carId: number): Promise<ServiceEntryRecord[]> {
  const result = await db.query<ServiceEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date::text as next_due_date,
        comment,
        service_date::text as service_date
      from service_entries
      where car_id = $1
      order by service_date desc, created_at desc, id desc
    `,
    [carId]
  );

  return result.rows.map(mapServiceEntry);
}

export async function getUpcomingServiceEntriesByMileage(
  carId: number,
  currentMileage: number,
  thresholdKm = 1000,
  limit = 10
): Promise<ServiceEntryRecord[]> {
  const result = await db.query<ServiceEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date::text as next_due_date,
        comment,
        service_date::text as service_date
      from service_entries
      where car_id = $1
        and next_due_mileage is not null
        and next_due_mileage <= $2
      order by next_due_mileage asc, service_date desc, id desc
      limit $3
    `,
    [carId, currentMileage + thresholdKm, limit]
  );

  return result.rows.map(mapServiceEntry);
}

export async function getUpcomingServiceEntriesByDate(
  carId: number,
  endDate: Date,
  limit = 10
): Promise<ServiceEntryRecord[]> {
  const result = await db.query<ServiceEntryRow>(
    `
      select
        id,
        user_id,
        car_id,
        expense_id,
        service_type,
        title,
        amount,
        currency,
        service_mileage,
        next_interval_km,
        next_due_mileage,
        next_interval_months,
        next_due_date::text as next_due_date,
        comment,
        service_date::text as service_date
      from service_entries
      where car_id = $1
        and next_due_date is not null
        and next_due_date <= $2
      order by next_due_date asc, service_date desc, id desc
      limit $3
    `,
    [carId, endDate, limit]
  );

  return result.rows.map(mapServiceEntry);
}
