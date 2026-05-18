import { db, closeDb } from './client.js';

async function checkConnection(): Promise<void> {
  const result = await db.query<{ now: Date; database_name: string }>(
    'select now() as now, current_database() as database_name'
  );

  const row = result.rows[0];
  console.log(`PostgreSQL connection: ok`);
  console.log(`Database: ${row.database_name}`);
  console.log(`Server time: ${row.now.toISOString()}`);
}

try {
  await checkConnection();
} finally {
  await closeDb();
}
