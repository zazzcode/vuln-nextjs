import connect from '../../../../lib/workshop/client.js';
import { get, person } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const client = await connect();
  const found = await client.db('zazzles_workshop').collection('people').findOne(req.query);
  return person(res, found);
});
