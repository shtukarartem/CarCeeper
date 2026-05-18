import type { ReminderRecord, ReminderStatus, ReminderType } from '../../domain/reminders.js';
import { db } from '../client.js';

export type CreateReminderInput = {
  userId: number;
  carId: number;
  serviceEntryId?: number | null;
  type: ReminderType;
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  dueMileage?: number | null;
};

export type CreateServiceReminderInput = Omit<
  CreateReminderInput,
  'serviceEntryId' | 'type'
> & {
  serviceEntryId: number;
};

export type ReminderNotificationCandidate = {
  reminder: ReminderRecord;
  telegramId: string;
  carName: string;
  currentMileage: number | null;
};

type ReminderRow = {
  id: number;
  user_id: number;
  car_id: number;
  service_entry_id: number | null;
  type: ReminderType;
  title: string;
  description: string | null;
  due_date: string | null;
  due_mileage: number | null;
  status: ReminderStatus;
  last_notified_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type ReminderNotificationCandidateRow = ReminderRow & {
  telegram_id: string;
  car_name: string;
  current_mileage: number | null;
};

const reminderReturningFields = `
  id,
  user_id,
  car_id,
  service_entry_id,
  type,
  title,
  description,
  due_date::text as due_date,
  due_mileage,
  status,
  last_notified_at,
  completed_at,
  created_at,
  updated_at
`;

function mapReminder(row: ReminderRow): ReminderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    serviceEntryId: row.service_entry_id,
    type: row.type,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueMileage: row.due_mileage,
    status: row.status,
    lastNotifiedAt: row.last_notified_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createReminder(input: CreateReminderInput): Promise<ReminderRecord> {
  const result = await db.query<ReminderRow>(
    `
      insert into reminders (
        user_id,
        car_id,
        service_entry_id,
        type,
        title,
        description,
        due_date,
        due_mileage
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning ${reminderReturningFields}
    `,
    [
      input.userId,
      input.carId,
      input.serviceEntryId ?? null,
      input.type,
      input.title,
      input.description ?? null,
      input.dueDate ?? null,
      input.dueMileage ?? null
    ]
  );

  return mapReminder(result.rows[0]);
}

export async function createServiceReminderIfNeeded(
  input: CreateServiceReminderInput
): Promise<ReminderRecord | null> {
  if (input.dueDate == null && input.dueMileage == null) {
    return null;
  }

  const result = await db.query<ReminderRow>(
    `
      insert into reminders (
        user_id,
        car_id,
        service_entry_id,
        type,
        title,
        description,
        due_date,
        due_mileage
      )
      values ($1, $2, $3, 'service', $4, $5, $6, $7)
      on conflict (service_entry_id) where service_entry_id is not null do nothing
      returning ${reminderReturningFields}
    `,
    [
      input.userId,
      input.carId,
      input.serviceEntryId,
      input.title,
      input.description ?? null,
      input.dueDate ?? null,
      input.dueMileage ?? null
    ]
  );

  return result.rows[0] ? mapReminder(result.rows[0]) : null;
}

export async function getActiveRemindersByUserId(userId: number): Promise<ReminderRecord[]> {
  const result = await db.query<ReminderRow>(
    `
      select ${reminderReturningFields}
      from reminders
      where user_id = $1
        and status = 'active'
      order by
        due_date asc nulls last,
        due_mileage asc nulls last,
        created_at asc,
        id asc
    `,
    [userId]
  );

  return result.rows.map(mapReminder);
}

export async function getActiveRemindersByCarId(carId: number): Promise<ReminderRecord[]> {
  const result = await db.query<ReminderRow>(
    `
      select ${reminderReturningFields}
      from reminders
      where car_id = $1
        and status = 'active'
      order by
        due_date asc nulls last,
        due_mileage asc nulls last,
        created_at asc,
        id asc
    `,
    [carId]
  );

  return result.rows.map(mapReminder);
}

export async function getActiveRemindersForNotification(): Promise<ReminderNotificationCandidate[]> {
  const result = await db.query<ReminderNotificationCandidateRow>(
    `
      select
        reminders.id,
        reminders.user_id,
        reminders.car_id,
        reminders.service_entry_id,
        reminders.type,
        reminders.title,
        reminders.description,
        reminders.due_date::text as due_date,
        reminders.due_mileage,
        reminders.status,
        reminders.last_notified_at,
        reminders.completed_at,
        reminders.created_at,
        reminders.updated_at,
        users.telegram_id::text as telegram_id,
        cars.name as car_name,
        cars.current_mileage
      from reminders
      inner join users on users.id = reminders.user_id
      inner join cars on cars.id = reminders.car_id
      where reminders.status = 'active'
      order by reminders.created_at asc, reminders.id asc
    `
  );

  return result.rows.map((row) => ({
    reminder: mapReminder(row),
    telegramId: row.telegram_id,
    carName: row.car_name,
    currentMileage: row.current_mileage
  }));
}

export async function getActiveReminderByUserIdAndId(
  userId: number,
  reminderId: number
): Promise<ReminderRecord | null> {
  const result = await db.query<ReminderRow>(
    `
      select ${reminderReturningFields}
      from reminders
      where user_id = $1
        and id = $2
        and status = 'active'
      limit 1
    `,
    [userId, reminderId]
  );

  return result.rows[0] ? mapReminder(result.rows[0]) : null;
}

export async function completeReminderForUser(
  userId: number,
  reminderId: number
): Promise<ReminderRecord | null> {
  const result = await db.query<ReminderRow>(
    `
      update reminders
      set status = 'completed',
          completed_at = current_timestamp
      where user_id = $1
        and id = $2
        and status = 'active'
      returning ${reminderReturningFields}
    `,
    [userId, reminderId]
  );

  return result.rows[0] ? mapReminder(result.rows[0]) : null;
}

export async function dismissReminderForUser(
  userId: number,
  reminderId: number
): Promise<ReminderRecord | null> {
  const result = await db.query<ReminderRow>(
    `
      update reminders
      set status = 'dismissed',
          completed_at = null
      where user_id = $1
        and id = $2
        and status = 'active'
      returning ${reminderReturningFields}
    `,
    [userId, reminderId]
  );

  return result.rows[0] ? mapReminder(result.rows[0]) : null;
}

export async function markReminderNotified(reminderId: number): Promise<ReminderRecord | null> {
  const result = await db.query<ReminderRow>(
    `
      update reminders
      set last_notified_at = current_timestamp
      where id = $1
        and status = 'active'
      returning ${reminderReturningFields}
    `,
    [reminderId]
  );

  return result.rows[0] ? mapReminder(result.rows[0]) : null;
}
