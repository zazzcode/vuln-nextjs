import { randomBytes } from 'node:crypto';
import http from '../../../../lib/http.cjs';
const { endpoint } = http;

// Hard negative for COOKIE-001 and COOKIE-003: a double-submit CSRF token. Page
// script must copy it into a header, so HttpOnly would break the defense. It
// gates a request but identifies nobody.
export default endpoint(['GET', 'POST'], (req, res) => {
  if (req.method === 'GET') {
    const token = randomBytes(24).toString('hex');
    res.setHeader('Set-Cookie', `lab_csrf=${token}; Path=/; Secure; SameSite=Strict`);
    return res.status(200).json({ issued: true });
  }
  const token = req.cookies.lab_csrf;
  if (!token || req.headers['x-csrf-token'] !== token) return res.status(403).json({ error: 'CSRF token mismatch.' });
  return res.status(200).json({ accepted: true });
}, { discloseErrors: false });
