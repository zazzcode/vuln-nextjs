// Minimal Set-Cookie serializer for the COOKIE scenarios. Later keys of the
// options object win, exactly as JavaScript object spread defines.
const HARDENED = Object.freeze({ httpOnly: true, secure: true, sameSite: 'Lax' });

function cookieHeader(name, value, options = {}) {
  const parts = [`${name}=${value}`, 'Path=/'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
}

module.exports = { HARDENED, cookieHeader };
