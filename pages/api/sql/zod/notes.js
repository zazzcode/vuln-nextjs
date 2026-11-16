import { z } from 'zod';
import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint } = http;

// Library control for SQL-003: Zod-validated note body feeds a single
// parameterized INSERT (db.query, never the multi-statement db.exec).
const Note = z.object({ body: z.string().min(1).max(1000) });

export default endpoint(['GET', 'POST'], async (req, res) => {
  const db = await getDatabase();
  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT id, body, visibility FROM notes ORDER BY id');
    return res.status(200).json({ notes: rows });
  }
  const parsed = Note.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid note payload.', issues: parsed.error.issues.length });
  const result = await db.query('INSERT INTO notes (body, visibility) VALUES ($1, $2) RETURNING id, body, visibility', [parsed.data.body, 'public']);
  return res.status(201).json({ notes: result.rows, validatedWith: 'zod' });
}, { discloseErrors: false });
