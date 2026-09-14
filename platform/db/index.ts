import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon's HTTP driver holds no connection, so one client can be reused for the
// life of the isolate instead of being rebuilt at each of its call sites. The
// URL is part of the key, so a rotated secret still takes effect.
let cached: { url: string; db: ReturnType<typeof drizzle> } | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      'DATABASE_URL is not configured. Add the rotated Neon pooled connection string to runtime secrets.',
    );
  if (cached?.url !== databaseUrl)
    cached = { url: databaseUrl, db: drizzle(neon(databaseUrl), { schema }) };
  return cached.db;
}
