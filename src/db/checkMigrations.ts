import { db, closeDb } from './client.js';

type MigrationRow = {
  name: string;
  run_on: Date;
};

async function checkMigrations(): Promise<void> {
  const tableResult = await db.query<{ exists: boolean }>(
    "select to_regclass('public.pgmigrations') is not null as exists"
  );

  if (!tableResult.rows[0]?.exists) {
    console.log('No migration table found.');
    return;
  }

  const result = await db.query<MigrationRow>(
    'select name, run_on from pgmigrations order by run_on desc'
  );

  if (result.rowCount === 0) {
    console.log('No migrations have been applied.');
    return;
  }

  console.log('Applied migrations:');
  for (const migration of result.rows) {
    console.log(`- ${migration.name} (${migration.run_on.toISOString()})`);
  }
}

try {
  await checkMigrations();
} finally {
  await closeDb();
}
