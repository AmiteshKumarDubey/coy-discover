import { createClient, type Client } from '@libsql/client';

/**
 * Returns a cached LibSQL/Turso client.
 *
 * Local dev:  set TURSO_DATABASE_URL=file:coy.db (no token needed)
 * Production: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel env vars
 */
function getDb(): Client {
  const g = global as { __tursoClient?: Client };
  if (g.__tursoClient) return g.__tursoClient;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. ' +
      'For local dev add it to .env.local; for production add it to Vercel env vars.'
    );
  }

  g.__tursoClient = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN, // undefined is fine for file: URLs
  });

  return g.__tursoClient;
}

export default getDb;
