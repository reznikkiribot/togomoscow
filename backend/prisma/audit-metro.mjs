import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const usePg = process.argv.includes('--pg');
const prisma = usePg ? null : new PrismaClient();
const client = usePg
  ? new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;
try {
  if (client) await client.connect();
  const query = async (sql) => client ? (await client.query(sql)).rows : prisma.$queryRawUnsafe(sql);
  const restaurants = await query(`SELECT COUNT(*)::int AS count FROM listings WHERE type = 'RESTAURANT'`);
  const columns = await query(`SELECT column_name FROM information_schema.columns
      WHERE table_name = 'listings' AND column_name IN ('metro', 'metro_distance')
      ORDER BY column_name`);
  const coverage = columns.length === 2 ? await query(`SELECT
      COUNT(*) FILTER (WHERE type = 'RESTAURANT' AND lat IS NOT NULL AND lng IS NOT NULL)::int AS with_coordinates,
      COUNT(*) FILTER (WHERE type = 'RESTAURANT' AND metro IS NOT NULL)::int AS with_metro,
      COUNT(*) FILTER (WHERE type = 'RESTAURANT' AND metro_distance <= 3000)::int AS visible_metro
      FROM listings`) : [];
  console.log(JSON.stringify({
    restaurants: restaurants[0]?.count ?? 0,
    metroColumns: columns.map((row) => row.column_name),
    coverage: coverage[0] ?? null,
  }, null, 2));
} finally {
  if (client) await client.end().catch(() => {});
  if (prisma) await prisma.$disconnect();
}
