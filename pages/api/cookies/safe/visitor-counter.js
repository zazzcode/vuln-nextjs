import { randomBytes } from 'node:crypto';
import http from '../../../../lib/http.cjs';
const { endpoint } = http;

function visits() {
  if (!globalThis.__zazzlesLabVisits) globalThis.__zazzlesLabVisits = new Map();
  return globalThis.__zazzlesLabVisits;
}

// Tricky control for COOKIE-001 and COOKIE-003: a random token that the server
// looks up in a map, like a session. It only counts page views of an anonymous
// visitor; it signs nobody in and grants nothing.
export default endpoint(['GET'], (req, res) => {
  const known = req.cookies.lab_visitor;
  const id = visits().has(known) ? known : randomBytes(24).toString('hex');
  visits().set(id, (visits().get(id) ?? 0) + 1);
  res.setHeader('Set-Cookie', `lab_visitor=${id}; Path=/; SameSite=Lax`);
  return res.status(200).json({ views: visits().get(id) });
}, { discloseErrors: false });
