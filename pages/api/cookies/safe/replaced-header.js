import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// Tricky control for COOKIE-007: the first header has no flags, but setHeader
// replaces it before anything is sent. Only the last value reaches the client.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_sid_final);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  res.setHeader('Set-Cookie', `lab_sid_final=${token}; Path=/`);
  res.setHeader('Set-Cookie', `lab_sid_final=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
