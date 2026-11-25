import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
import cookieHeaders from '../../../../lib/cookie-header.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;
const { HARDENED, cookieHeader } = cookieHeaders;

// Near twin of safe/overridden-options: the hardened options are spread first,
// so the later explicit false wins.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_order);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  // COOKIE-005 / CWE-1004: httpOnly: false overrides the hardened default.
  res.setHeader('Set-Cookie', cookieHeader('lab_sid_order', token, { ...HARDENED, httpOnly: false }));
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
