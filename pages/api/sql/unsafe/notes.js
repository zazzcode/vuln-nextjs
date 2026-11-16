import database from '../../../../lib/database.cjs';
import http from '../../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint, validText } = http;

export default endpoint(['GET', 'POST'], async (req, res) => {
  const db = await getDatabase();
  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT id, body, visibility FROM notes ORDER BY id');
    return res.status(200).json({ notes: rows });
  }
  const { body } = req.body || {};
  if (!validText(body)) return res.status(400).json({ error: 'body must be a nonempty string of at most 1000 characters.' });
  // SQL-003 / CWE-89: exec accepts multiple statements, enabling stacked SQL.
  const results = await db.exec(`INSERT INTO notes (body, visibility) VALUES ('${body}', 'public') RETURNING id, body, visibility`);
  return res.status(201).json({ notes: results[0].rows });
}, { discloseErrors: true });
