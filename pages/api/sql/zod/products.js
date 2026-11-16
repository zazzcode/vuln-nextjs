import { z } from 'zod';
import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint } = http;

// Library control for SQL-002: Zod-validated search term feeds a bound parameter.
const Search = z.object({ q: z.string().max(200).default('') });

export default endpoint(['GET'], async (req, res) => {
  const parsed = Search.safeParse({ q: req.query.q ?? '' });
  if (!parsed.success) return res.status(400).json({ error: 'Invalid search payload.', issues: parsed.error.issues.length });
  const db = await getDatabase();
  const { rows } = await db.query('SELECT id, name, price, public FROM products WHERE public = true AND name ILIKE $1 ORDER BY id', [`%${parsed.data.q}%`]);
  return res.status(200).json({ products: rows, validatedWith: 'zod' });
}, { discloseErrors: false });
