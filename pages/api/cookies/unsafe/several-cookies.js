import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// Two cookies in one response: the theme cookie needs no flags, the session
// cookie does. A tool must judge each entry of the array, not the call.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_multi);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  // COOKIE-004 / CWE-614: the session entry of the array has no Secure attribute.
  res.setHeader('Set-Cookie', ['lab_theme=dark; Path=/; SameSite=Lax', `lab_sid_multi=${token}; Path=/; HttpOnly; SameSite=Lax`]);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
