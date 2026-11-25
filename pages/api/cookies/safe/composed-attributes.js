import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// Tricky control for COOKIE-001 and COOKIE-002: no single literal holds the whole
// header. The attributes come from a constant list joined at run time.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_composed);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  const attributes = ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  res.setHeader('Set-Cookie', [`lab_sid_composed=${token}`, ...attributes].join('; '));
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
