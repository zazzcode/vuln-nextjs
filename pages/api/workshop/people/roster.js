import connect from '../../../../lib/workshop/client.js';
import { get, person } from '../../../../lib/workshop/route.js';

const FIELDS = new Set(['login', 'email']);

export default get(async (req, res) => {
  const wanted = Object.fromEntries(Object.entries(req.query).filter(([field]) => FIELDS.has(field)));
  if (!Object.keys(wanted).length) return res.status(400).json({ error: 'login or email is required.' });
  const client = await connect();
  const found = await client.db('zazzles_workshop').collection('people').findOne(wanted);
  return person(res, found);
});
