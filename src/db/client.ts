import pg from 'pg';
import { loadDatabaseConfig } from '../config/env.js';

const { Pool } = pg;

const config = loadDatabaseConfig();

export const db = new Pool({
  connectionString: config.databaseUrl
});

export async function closeDb(): Promise<void> {
  await db.end();
}
