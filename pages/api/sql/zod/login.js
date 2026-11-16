import { z } from 'zod';
import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase, verifyPassword } = database;
const { endpoint } = http;

// Library control for SQL-001: Zod validates the payload shape before any
// query runs. Validation complements parameterization; it does not replace it.
const Credentials = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export default endpoint(['POST'], async (req, res) => {
  const parsed = Credentials.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials payload.', issues: parsed.error.issues.length });
  const { username, password } = parsed.data;
  const db = await getDatabase();
  const { rows } = await db.query('SELECT id, username, role, password_hash FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ authenticated: false });
  const { password_hash, ...identity } = user;
  return res.status(200).json({ authenticated: true, user: identity, validatedWith: 'zod' });
}, { discloseErrors: false });
