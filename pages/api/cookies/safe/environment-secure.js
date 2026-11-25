import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// Safe control for COOKIE-002: Secure is present in every production build and
// left out only for plain-HTTP development, a common and correct pattern.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_env);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `lab_sid_env=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
