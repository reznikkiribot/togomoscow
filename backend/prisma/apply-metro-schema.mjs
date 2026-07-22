import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
try {
  await client.connect();
  await client.query('ALTER TABLE listings ADD COLUMN IF NOT EXISTS metro TEXT');
  await client.query('ALTER TABLE listings ADD COLUMN IF NOT EXISTS metro_distance INTEGER');
  console.log('Metro schema is present.');
} finally {
  await client.end().catch(() => {});
}
