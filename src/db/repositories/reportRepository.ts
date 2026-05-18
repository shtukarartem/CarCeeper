import type { ExpenseCategory } from '../../domain/expenseCategories.js';
import { db } from '../client.js';

export type ReportPeriodQuery = {
  userId: number;
  carId?: number | null;
  startDate: string | Date;
  endDate: string | Date;
};

export type ReportDynamicsGroup = 'day' | 'week' | 'month';

export type ReportCategoryTotal = {
  category: ExpenseCategory;
  amount: number;
};

export type ReportTopExpense = {
  id: number;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  comment: string | null;
};

export type ReportDynamicsPoint = {
  period: string;
  totalAmount: number;
  expenseCount: number;
};

export type ExpenseReportSummary = {
  totalAmount: number;
  expenseCount: number;
  currency: string | null;
  byCategory: ReportCategoryTotal[];
  topExpenses: ReportTopExpense[];
  dynamics: ReportDynamicsPoint[];
};

export type ExportExpenseEventType = 'expense' | 'fuel' | 'service';

export type ExportExpenseRecord = {
  id: number;
  expenseDate: string;
  carName: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  comment: string | null;
  eventType: ExportExpenseEventType;
};

export type ReportFuelMileagePoint = {
  mileage: number;
};

type ReportTotalRow = {
  total_amount: string | null;
  expense_count: string;
  currency: string | null;
};

type ReportCategoryRow = {
  category: ExpenseCategory;
  amount: string;
};

type ReportTopExpenseRow = {
  id: number;
  expense_date: string;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  comment: string | null;
};

type ReportDynamicsRow = {
  period: string;
  total_amount: string;
  expense_count: string;
};

type ExportExpenseRow = {
  id: number;
  expense_date: string;
  car_name: string | null;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  comment: string | null;
  event_type: ExportExpenseEventType;
};

type ReportFuelMileagePointRow = {
  mileage: number;
};

function mapTopExpense(row: ReportTopExpenseRow): ReportTopExpense {
  return {
    id: row.id,
    expenseDate: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    comment: row.comment
  };
}

function mapDynamicsPoint(row: ReportDynamicsRow): ReportDynamicsPoint {
  return {
    period: row.period,
    totalAmount: Number(row.total_amount),
    expenseCount: Number(row.expense_count)
  };
}

function mapExportExpense(row: ExportExpenseRow): ExportExpenseRecord {
  return {
    id: row.id,
    expenseDate: row.expense_date,
    carName: row.car_name,
    category: row.category,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    comment: row.comment,
    eventType: row.event_type
  };
}

function getPeriodParams(query: ReportPeriodQuery): [number, number | null, string | Date, string | Date] {
  return [query.userId, query.carId ?? null, query.startDate, query.endDate];
}

function getExpensePeriodWhereClause(): string {
  return `
    expenses.user_id = $1
    and ($2::integer is null or expenses.car_id = $2)
    and expenses.expense_date >= $3
    and expenses.expense_date < $4
  `;
}

function getDateTruncUnit(group: ReportDynamicsGroup): string {
  switch (group) {
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
  }
}

export async function getReportTotals(query: ReportPeriodQuery): Promise<{
  totalAmount: number;
  expenseCount: number;
  currency: string | null;
}> {
  const result = await db.query<ReportTotalRow>(
    `
      select
        coalesce(sum(expenses.amount), 0) as total_amount,
        count(*) as expense_count,
        max(expenses.currency)::text as currency
      from expenses
      where ${getExpensePeriodWhereClause()}
    `,
    getPeriodParams(query)
  );

  const total = result.rows[0];

  return {
    totalAmount: Number(total.total_amount ?? 0),
    expenseCount: Number(total.expense_count),
    currency: total.currency?.trim() ?? null
  };
}

export async function getReportCategoryTotals(
  query: ReportPeriodQuery
): Promise<ReportCategoryTotal[]> {
  const result = await db.query<ReportCategoryRow>(
    `
      select
        expenses.category,
        sum(expenses.amount) as amount
      from expenses
      where ${getExpensePeriodWhereClause()}
      group by expenses.category
      order by sum(expenses.amount) desc, expenses.category asc
    `,
    getPeriodParams(query)
  );

  return result.rows.map((row) => ({
    category: row.category,
    amount: Number(row.amount)
  }));
}

export async function getReportTopExpenses(
  query: ReportPeriodQuery,
  limit = 5
): Promise<ReportTopExpense[]> {
  const result = await db.query<ReportTopExpenseRow>(
    `
      select
        expenses.id,
        expenses.expense_date::text as expense_date,
        expenses.category,
        expenses.amount,
        expenses.currency,
        expenses.comment
      from expenses
      where ${getExpensePeriodWhereClause()}
      order by expenses.amount desc, expenses.expense_date desc, expenses.created_at desc, expenses.id desc
      limit $5
    `,
    [...getPeriodParams(query), limit]
  );

  return result.rows.map(mapTopExpense);
}

export async function getReportDynamics(
  query: ReportPeriodQuery,
  group: ReportDynamicsGroup
): Promise<ReportDynamicsPoint[]> {
  const dateTruncUnit = getDateTruncUnit(group);

  const result = await db.query<ReportDynamicsRow>(
    `
      select
        date_trunc('${dateTruncUnit}', expenses.expense_date)::date::text as period,
        sum(expenses.amount) as total_amount,
        count(*) as expense_count
      from expenses
      where ${getExpensePeriodWhereClause()}
      group by date_trunc('${dateTruncUnit}', expenses.expense_date)::date
      order by date_trunc('${dateTruncUnit}', expenses.expense_date)::date asc
    `,
    getPeriodParams(query)
  );

  return result.rows.map(mapDynamicsPoint);
}

export async function getExpenseReportSummary(
  query: ReportPeriodQuery,
  options: {
    topExpensesLimit?: number;
    dynamicsGroup?: ReportDynamicsGroup;
  } = {}
): Promise<ExpenseReportSummary> {
  const [totals, byCategory, topExpenses, dynamics] = await Promise.all([
    getReportTotals(query),
    getReportCategoryTotals(query),
    getReportTopExpenses(query, options.topExpensesLimit ?? 5),
    getReportDynamics(query, options.dynamicsGroup ?? 'month')
  ]);

  return {
    ...totals,
    byCategory,
    topExpenses,
    dynamics
  };
}

export async function getExpensesForExport(query: ReportPeriodQuery): Promise<ExportExpenseRecord[]> {
  const result = await db.query<ExportExpenseRow>(
    `
      select
        expenses.id,
        expenses.expense_date::text as expense_date,
        cars.name as car_name,
        expenses.category,
        expenses.amount,
        expenses.currency,
        expenses.comment,
        case
          when fuel_entries.id is not null then 'fuel'
          when service_entries.id is not null then 'service'
          else 'expense'
        end as event_type
      from expenses
      left join cars on cars.id = expenses.car_id
      left join fuel_entries on fuel_entries.expense_id = expenses.id
      left join service_entries on service_entries.expense_id = expenses.id
      where ${getExpensePeriodWhereClause()}
      order by expenses.expense_date asc, expenses.created_at asc, expenses.id asc
    `,
    getPeriodParams(query)
  );

  return result.rows.map(mapExportExpense);
}

export async function getReportFuelMileagePoints(
  query: ReportPeriodQuery
): Promise<ReportFuelMileagePoint[]> {
  const result = await db.query<ReportFuelMileagePointRow>(
    `
      select fuel_entries.mileage
      from fuel_entries
      where fuel_entries.user_id = $1
        and ($2::integer is null or fuel_entries.car_id = $2)
        and fuel_entries.fuel_date >= $3
        and fuel_entries.fuel_date < $4
      order by fuel_entries.mileage asc, fuel_entries.fuel_date asc, fuel_entries.id asc
    `,
    getPeriodParams(query)
  );

  return result.rows.map((row) => ({
    mileage: row.mileage
  }));
}
