const { PGlite } = require('@electric-sql/pglite');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
}

async function seed(db) {
  await db.exec(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL,
      password_demo TEXT NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user'))
    );
    CREATE TABLE products (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL,
      public BOOLEAN NOT NULL DEFAULT true
    );
    CREATE TABLE notes (
      id SERIAL PRIMARY KEY, body TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'public'
    );
    CREATE TABLE comments (
      id SERIAL PRIMARY KEY, author TEXT NOT NULL, body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );
    INSERT INTO products (name, price, public) VALUES
      ('Zazzles mug', 12, true), ('Security notebook', 8, true),
      ('Internal prototype', 999, false);
    INSERT INTO notes (body) VALUES ('Welcome to the SQL lab');
    INSERT INTO comments (author, body) VALUES
      ('alice', 'First! Welcome to the guestbook.'),
      ('bob', 'Great lab — <b>benign markup</b> should survive sanitization.');
  `);
  for (const [username, password, role] of [
    ['admin', 'admin-lab-only', 'admin'], ['alice', 'alice-lab-only', 'user'],
  ]) {
    // Plaintext exists ONLY for SQL-001's deliberately unsafe login comparison.
    await db.query('INSERT INTO users (username, password_demo, password_hash, role) VALUES ($1, $2, $3, $4)',
      [username, password, hashPassword(password), role]);
  }
}

async function createDatabase() {
  const db = await PGlite.create(); // No path: no persistence, no database service.
  try { await seed(db); return db; }
  catch (error) { await db.close(); throw error; }
}

// Global promise survives Next.js development reloads in this server process.
// Each separate process/worker owns an independent in-memory database.
function getDatabase() {
  if (!globalThis.__zazzlesLabDatabase) {
    globalThis.__zazzlesLabDatabase = createDatabase().catch((error) => {
      delete globalThis.__zazzlesLabDatabase;
      throw error;
    });
  }
  return globalThis.__zazzlesLabDatabase;
}

async function resetDatabase() {
  const db = await getDatabase();
  // Reset atomically, on the same instance so concurrent requests cannot retain
  // a closed database. Recovery also works after a stacked-query DROP TABLE.
  await db.transaction(async (tx) => {
    await tx.exec('DROP TABLE IF EXISTS notes, comments, products, users CASCADE');
    await seed(tx);
  });
}

module.exports = { createDatabase, getDatabase, resetDatabase, verifyPassword };
