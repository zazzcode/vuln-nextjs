import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// Sign-in (POST) and current user (GET) on one route: the cookie set here is the
// cookie read here to identify the caller, so it is a session cookie by use.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_readable);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  // COOKIE-001 / CWE-1004: session cookie without HttpOnly; any script on the origin can read it.
  res.setHeader('Set-Cookie', `lab_sid_readable=${token}; Path=/; Secure; SameSite=Lax`);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
