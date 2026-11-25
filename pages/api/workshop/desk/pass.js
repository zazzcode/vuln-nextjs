import http from '../../../../lib/http.cjs';
import { database } from '../../../../lib/workshop/client.js';
import { person } from '../../../../lib/workshop/route.js';
import { issue, decode } from '../../../../lib/workshop/token.js';

export default http.endpoint(['GET', 'POST'], async (req, res) => {
  const people = (await database()).collection('people');
  if (req.method === 'POST') {
    const found = await people.findOne({ login: String(req.body?.login), passcode: String(req.body?.passcode) });
    return found ? res.status(200).json({ pass: issue({ sub: found.login }) }) : res.status(401).json({ pass: null });
  }
  const claims = req.headers['x-pass'] ? decode(req.headers['x-pass']) : null;
  if (!claims?.sub) return res.status(401).json({ person: null });
  return person(res, await people.findOne({ login: claims.sub }));
});
