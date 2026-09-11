import 'dotenv/config';
import { Client } from 'pg';
const value = process.env.DATABASE_URL;
if (!value) throw new Error('DATABASE_URL is missing.');
const url = new URL(value);
console.log(`Database target: ${url.hostname}:${url.port || 5432}${url.pathname}`);
const client = new Client({ connectionString: value, connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  console.log((await client.query('SELECT current_database(), current_schema()')).rows);
  console.log((await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`)).rows);
} catch (error) {
  const e = error as Error & { code?: string };
  console.error(`Database check failed (${e.code || e.name}): ${e.message.replaceAll(value, '[connection string]')}`);
  process.exitCode = 1;
} finally { await client.end(); }
