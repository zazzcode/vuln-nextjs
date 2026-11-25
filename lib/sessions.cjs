const { randomBytes } = require('node:crypto');
const { getDatabase, verifyPassword } = require('./database.cjs');

// Server-side sessions for the COOKIE scenarios: an opaque random token maps to
// a synthetic lab user. Kept on globalThis because Next.js bundles each API
// route separately; one server process must share one map.
function sessionMap() {
  if (!globalThis.__zazzlesLabSessions) globalThis.__zazzlesLabSessions = new Map();
  return globalThis.__zazzlesLabSessions;
}

// Returns a new session token for valid lab credentials, otherwise null.
async function openSession(username, password) {
  const db = await getDatabase();
  const { rows } = await db.query('SELECT username, role, password_hash FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  const token = randomBytes(24).toString('hex');
  sessionMap().set(token, { username: user.username, role: user.role });
  return token;
}

function findSession(token) {
  return typeof token === 'string' ? sessionMap().get(token) : undefined;
}

function closeSession(token) {
  if (typeof token === 'string') sessionMap().delete(token);
}

module.exports = { openSession, findSession, closeSession };
