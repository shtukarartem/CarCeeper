import type { ExpenseCategory } from '../../domain/expenseCategories.js';
import { db } from '../client.js';

export type CreateExpenseInput = {
  userId: number;
  carId: number;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  comment: string | null;
  expenseDate?: Date;
};

export type ExpenseRecord = {
  id: number;
  userId: number;
  carId: number | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  comment: string | null;
  expenseDate: string;
};

export type RecentExpenseRecord = ExpenseRecord & {
  carName: string | null;
};

export type ExpenseCategoryStats = {
  category: ExpenseCategory;
  amount: number;
};

export type LargestExpenseStats = {
  category: ExpenseCategory;
  amount: number;
  currency: string;
  comment: string | null;
};

export type MonthlyExpenseStats = {
  month: string;
  totalAmount: number;
  expenseCount: number;
  currency: string | null;
  byCategory: ExpenseCategoryStats[];
  largestExpense: LargestExpenseStats | null;
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

type RecentExpenseRow = ExpenseRow & {
  car_name: string | null;
};

type MonthlyTotalRow = {
  month: string;
  total_amount: string | null;
  expense_count: string;
  currency: string | null;
};

type CategoryStatsRow = {
  category: ExpenseCategory;
  amount: string;
};

type LargestExpenseRow = {
  category: ExpenseCategory;
  amount: string;
  currency: string;
  comment: string | null;
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

function mapRecentExpense(row: RecentExpenseRow): RecentExpenseRecord {
  return {
    ...mapExpense(row),
    carName: row.car_name
  };
}

export async function createExpense(input: CreateExpenseInput): Promise<ExpenseRecord> {
  const result = await db.query<ExpenseRow>(
    `
      insert into expenses (user_id, car_id, category, amount, currency, comment, expense_date)
      values ($1, $2, $3, $4, $5, $6, coalesce($7, current_date))
      returning id, user_id, car_id, category, amount, currency, comment, expense_date::text as expense_date
    `,
    [
      input.userId,
      input.carId,
      input.category,
      input.amount,
      input.currency,
      input.comment,
      input.expenseDate ?? null
    ]
  );

  return mapExpense(result.rows[0]);
}

export async function getRecentExpensesByUserId(
  userId: number,
  limit = 10
): Promise<RecentExpenseRecord[]> {
  const result = await db.query<RecentExpenseRow>(
    `
      select
        expenses.id,
        expenses.user_id,
        expenses.car_id,
        expenses.category,
        expenses.amount,
        expenses.currency,
        expenses.comment,
        expenses.expense_date::text as expense_date,
        cars.name as car_name
      from expenses
      left join cars on cars.id = expenses.car_id
      where expenses.user_id = $1
      order by expenses.expense_date desc, expenses.created_at desc, expenses.id desc
      limit $2
    `,
    [userId, limit]
  );

  return result.rows.map(mapRecentExpense);
}

export async function getTodayExpensesByUserId(userId: number): Promise<RecentExpenseRecord[]> {
  const result = await db.query<RecentExpenseRow>(
    `
      select
        expenses.id,
        expenses.user_id,
        expenses.car_id,
        expenses.category,
        expenses.amount,
        expenses.currency,
        expenses.comment,
        expenses.expense_date::text as expense_date,
        cars.name as car_name
      from expenses
      left join cars on cars.id = expenses.car_id
      where expenses.user_id = $1
        and expenses.expense_date = current_date
      order by expenses.created_at desc, expenses.id desc
    `,
    [userId]
  );

  return result.rows.map(mapRecentExpense);
}

export async function getCurrentMonthStatsByUserId(userId: number): Promise<MonthlyExpenseStats> {
  const totalResult = await db.query<MonthlyTotalRow>(
    `
      select
        to_char(date_trunc('month', current_date), 'YYYY-MM') as month,
        coalesce(sum(amount), 0) as total_amount,
        count(*) as expense_count,
        max(currency)::text as currency
      from expenses
      where user_id = $1
        and expense_date >= date_trunc('month', current_date)::date
        and expense_date < (date_trunc('month', current_date) + interval '1 month')::date
    `,
    [userId]
  );

  const categoryResult = await db.query<CategoryStatsRow>(
    `
      select category, sum(amount) as amount
      from expenses
      where user_id = $1
        and expense_date >= date_trunc('month', current_date)::date
        and expense_date < (date_trunc('month', current_date) + interval '1 month')::date
      group by category
      order by sum(amount) desc, category asc
    `,
    [userId]
  );

  const largestResult = await db.query<LargestExpenseRow>(
    `
      select category, amount, currency, comment
      from expenses
      where user_id = $1
        and expense_date >= date_trunc('month', current_date)::date
        and expense_date < (date_trunc('month', current_date) + interval '1 month')::date
      order by amount desc, expense_date desc, created_at desc, id desc
      limit 1
    `,
    [userId]
  );

  const total = totalResult.rows[0];
  const largestExpense = largestResult.rows[0];

  return {
    month: total.month,
    totalAmount: Number(total.total_amount ?? 0),
    expenseCount: Number(total.expense_count),
    currency: total.currency?.trim() ?? null,
    byCategory: categoryResult.rows.map((row) => ({
      category: row.category,
      amount: Number(row.amount)
    })),
    largestExpense: largestExpense
      ? {
          category: largestExpense.category,
          amount: Number(largestExpense.amount),
          currency: largestExpense.currency.trim(),
          comment: largestExpense.comment
        }
      : null
  };
}

export async function deleteLastExpenseByUserId(userId: number): Promise<ExpenseRecord | null> {
  const result = await db.query<ExpenseRow>(
    `
      with target_expense as (
        select id
        from expenses
        where user_id = $1
        order by created_at desc, id desc
        limit 1
      ),
      deleted_fuel_entries as (
        delete from fuel_entries
        where expense_id in (select id from target_expense)
      ),
      deleted_service_entries as (
        delete from service_entries
        where expense_id in (select id from target_expense)
      )
      delete from expenses
      where id in (
        select id
        from target_expense
      )
      returning id, user_id, car_id, category, amount, currency, comment, expense_date::text as expense_date
    `,
    [userId]
  );

  return result.rows[0] ? mapExpense(result.rows[0]) : null;
}
