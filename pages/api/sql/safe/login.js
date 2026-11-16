import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase, verifyPassword } = database;
const { endpoint, validText } = http;

export default endpoint(['POST'], async (req, res) => {
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const db = await getDatabase();
  const { rows } = await db.query('SELECT id, username, role, password_hash FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ authenticated: false });
  const { password_hash, ...identity } = user;
  return res.status(200).json({ authenticated: true, user: identity });
}, { discloseErrors: false });
