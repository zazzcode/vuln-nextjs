import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
import cookieHeaders from '../../../../lib/cookie-header.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;
const { HARDENED, cookieHeader } = cookieHeaders;

// Tricky control for COOKIE-005: the same two ingredients in the safe order. The
// explicit false is a default that the hardened options override.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_order_safe);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  res.setHeader('Set-Cookie', cookieHeader('lab_sid_order_safe', token, { httpOnly: false, secure: false, ...HARDENED }));
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
