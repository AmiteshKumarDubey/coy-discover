import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'coy.db');

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      photo TEXT NOT NULL,
      bio TEXT NOT NULL,
      city TEXT NOT NULL,
      interests TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS swipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      swiper_id INTEGER NOT NULL DEFAULT 0,
      target_id INTEGER NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(swiper_id, target_id)
    );
  `);
}

function createConnection(): Database.Database {
  const db = new Database(DB_PATH);
  initSchema(db);
  return db;
}

function getDb(): Database.Database {
  const g = global as { __db?: Database.Database };

  // If we have a cached connection, verify it is still alive
  if (g.__db) {
    try {
      // A lightweight probe — throws if the file was deleted/moved
      g.__db.prepare('SELECT 1').get();
      return g.__db;
    } catch {
      // Connection is stale (e.g. db file was deleted); drop the cache
      try { g.__db.close(); } catch { /* ignore */ }
      g.__db = undefined;
    }
  }

  g.__db = createConnection();
  return g.__db;
}

export default getDb;
