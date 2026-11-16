import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint } = http;

export default endpoint(['GET'], async (req, res) => {
  const q = req.query.q ?? '';
  if (typeof q !== 'string' || q.length > 200) return res.status(400).json({ error: 'q must be a string of at most 200 characters.' });
  const db = await getDatabase();
  // SQL-002 / CWE-89: query syntax can override the public-only predicate.
  const { rows } = await db.query(`SELECT id, name, price, public FROM products WHERE public = true AND name ILIKE '%${q}%' ORDER BY id`);
  return res.status(200).json({ products: rows });
}, { discloseErrors: true });
