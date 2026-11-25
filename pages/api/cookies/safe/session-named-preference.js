import http from '../../../../lib/http.cjs';
const { endpoint } = http;

// Tricky control for COOKIE-003, its mirror image: the name says session, the use
// is a dismissed banner. No caller is identified and nothing is protected by it.
export default endpoint(['GET', 'POST'], (req, res) => {
  if (req.method === 'GET') return res.status(200).json({ showBanner: req.cookies.session_banner !== 'dismissed' });
  res.setHeader('Set-Cookie', 'session_banner=dismissed; Path=/; SameSite=Lax');
  return res.status(200).json({ showBanner: false });
}, { discloseErrors: false });
