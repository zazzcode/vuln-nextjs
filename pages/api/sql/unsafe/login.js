import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase, verifyPassword } = database;
const { endpoint, validText } = http;

export default endpoint(['POST'], async (req, res) => {
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const db = await getDatabase();
  // SQL-001 / CWE-89: intentionally interpolate both attacker-controlled fields.
  const { rows } = await db.query(`SELECT id, username, role FROM users WHERE username = '${username}' AND password_demo = '${password}' LIMIT 1`);
  return res.status(rows.length ? 200 : 401).json({ authenticated: rows.length > 0, user: rows[0] || null });
}, { discloseErrors: true });
