import http from '../../../../lib/http.cjs';
const { endpoint } = http;
const THEMES = new Set(['light', 'dark']);

// Hard negative for COOKIE-001 and COOKIE-003: a display preference that browser
// code may read. It is checked and can end the response, but it never
// identifies a caller, so missing HttpOnly and Secure is not a session flaw.
export default endpoint(['GET', 'POST'], (req, res) => {
  if (req.method === 'GET') {
    const theme = req.cookies.lab_theme;
    if (!THEMES.has(theme)) return res.status(400).json({ error: 'Unknown theme.' });
    return res.status(200).json({ theme });
  }
  const { theme } = req.body || {};
  if (typeof theme !== 'string' || !THEMES.has(theme)) return res.status(400).json({ error: 'theme must be light or dark.' });
  res.setHeader('Set-Cookie', `lab_theme=${theme}; Path=/; SameSite=Lax`);
  return res.status(200).json({ theme });
}, { discloseErrors: false });
