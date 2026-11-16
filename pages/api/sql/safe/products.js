import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint } = http;

export default endpoint(['GET'], async (req, res) => {
  const q = req.query.q ?? '';
  if (typeof q !== 'string' || q.length > 200) return res.status(400).json({ error: 'q must be a string of at most 200 characters.' });
  const db = await getDatabase();
  const { rows } = await db.query('SELECT id, name, price, public FROM products WHERE public = true AND name ILIKE $1 ORDER BY id', [`%${q}%`]);
  return res.status(200).json({ products: rows });
}, { discloseErrors: false });
