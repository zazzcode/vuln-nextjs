import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// The name says preference, the use says session: findSession() identifies the
// caller from it. A tool that judges by name misses this one.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.ui_prefs);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  // COOKIE-003 / CWE-1004: session cookie under a preference-like name, without HttpOnly.
  res.setHeader('Set-Cookie', `ui_prefs=${token}; Path=/; Secure; SameSite=Lax`);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
