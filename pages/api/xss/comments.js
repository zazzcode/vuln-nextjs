import database from '../../../lib/database.cjs';
import http from '../../../lib/http.cjs';
const { getDatabase } = database;
const { endpoint, validText } = http;

// Guestbook storage for XSS-004. Storage is deliberately SAFE (parameterized
// INSERT): the scenario's flaw is how pages render the stored rows, so both
// the unsafe and the sanitized page share this endpoint.
export default endpoint(['GET', 'POST'], async (req, res) => {
  const db = await getDatabase();
  if (req.method === 'GET') {
    const { rows } = await db.query('SELECT id, author, body, created_at FROM comments ORDER BY id');
    return res.status(200).json({ comments: rows });
  }
  const { author, body } = req.body || {};
  if (!validText(author, 100) || !validText(body, 1000)) {
    return res.status(400).json({ error: 'author and body must be nonempty strings (100/1000 characters maximum).' });
  }
  const result = await db.query('INSERT INTO comments (author, body) VALUES ($1, $2) RETURNING id, author, body, created_at', [author, body]);
  return res.status(201).json({ comments: result.rows });
}, { discloseErrors: false });
