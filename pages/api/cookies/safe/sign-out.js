import http from '../../../../lib/http.cjs';
import sessions from '../../../../lib/sessions.cjs';
const { endpoint } = http;
const { closeSession } = sessions;

// Hard negative for COOKIE-001 and COOKIE-002: the header expires the session
// cookie and carries no credential, so its missing flags expose nothing.
export default endpoint(['POST'], (req, res) => {
  closeSession(req.cookies.lab_sid_safe);
  res.setHeader('Set-Cookie', 'lab_sid_safe=; Path=/; Max-Age=0');
  return res.status(200).json({ signedOut: true });
}, { discloseErrors: false });
