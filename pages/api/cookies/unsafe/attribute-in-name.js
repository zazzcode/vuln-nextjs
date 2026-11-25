import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint, validText } = http;
const { openSession, findSession } = sessions;

// The word HttpOnly appears in the cookie name, not as an attribute. A tool that
// searches the header text for the word clears this one.
export default endpoint(['GET', 'POST'], async (req, res) => {
  if (req.method === 'GET') {
    const session = findSession(req.cookies.lab_HttpOnly_sid);
    if (!session) return res.status(401).json({ error: 'Sign in first.' });
    return res.status(200).json({ user: session });
  }
  const { username, password } = req.body || {};
  if (!validText(username, 100) || !validText(password, 200)) return res.status(400).json({ error: 'Username and password must be nonempty strings (100/200 characters maximum).' });
  const token = await openSession(username, password);
  if (!token) return res.status(401).json({ error: 'Invalid credentials.' });
  // COOKIE-006 / CWE-1004: no HttpOnly attribute; the match is part of the name.
  res.setHeader('Set-Cookie', `lab_HttpOnly_sid=${token}; Path=/; Secure; SameSite=Lax`);
  return res.status(200).json({ signedIn: true });
}, { discloseErrors: false });
