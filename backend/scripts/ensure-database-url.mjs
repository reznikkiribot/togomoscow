import { appendFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');

function hasDatabaseUrl() {
  if (process.env.DATABASE_URL) return true;
  if (!existsSync(envPath)) return false;
  return /^DATABASE_URL\s*=.+/m.test(readFileSync(envPath, 'utf8'));
}

function fromPgParts() {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const db = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE;
  if (!host || !user || !password || !db) return undefined;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(db)}?schema=public`;
}

if (!hasDatabaseUrl()) {
  const url =
    process.env.DATABASE_PRIVATE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_DATABASE_URL ||
    fromPgParts();

  if (url) {
    appendFileSync(envPath, `\nDATABASE_URL=${JSON.stringify(url)}\n`);
    console.log('DATABASE_URL prepared from Railway database variables');
  } else {
    console.warn('DATABASE_URL is missing and no Railway database fallback variables were found');
  }
}
