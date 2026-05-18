import { db } from '../client.js';

export type TelegramUserInput = {
  telegramId: number;
  username?: string;
  firstName?: string;
};

export type UserRecord = {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string | null;
};

type UserRow = {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    telegramId: row.telegram_id,
    username: row.username,
    firstName: row.first_name
  };
}

export async function upsertTelegramUser(input: TelegramUserInput): Promise<UserRecord> {
  const result = await db.query<UserRow>(
    `
      insert into users (telegram_id, username, first_name)
      values ($1, $2, $3)
      on conflict (telegram_id)
      do update set
        username = excluded.username,
        first_name = excluded.first_name
      returning id, telegram_id, username, first_name
    `,
    [input.telegramId, input.username ?? null, input.firstName ?? null]
  );

  return mapUser(result.rows[0]);
}
