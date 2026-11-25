import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const key = () => (globalThis.__zazzlesWorkshopKey ??= randomBytes(32));
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const mark = (body) => createHmac('sha256', key()).update(body).digest('base64url');

export function issue(claims) {
  const body = encode(claims);
  return `${body}.${mark(body)}`;
}

export function decode(token) {
  return JSON.parse(Buffer.from(String(token).split('.')[0], 'base64url').toString());
}

export function open(token) {
  const [body, seal = ''] = String(token).split('.');
  const expected = Buffer.from(mark(body));
  const given = Buffer.from(seal);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return decode(token);
}
