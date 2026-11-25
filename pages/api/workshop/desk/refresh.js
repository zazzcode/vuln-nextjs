import { MongoClient } from 'mongodb';
import { address } from '../../../../lib/workshop/client.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';
import { digest } from '../../../../lib/workshop/seed.js';

let client;

export default post(async (req, res) => {
  const { code, next } = req.body ?? {};
  if (!code || typeof next !== 'string' || next.length < 8) return problem(res, 400, 'code and next are required.');
  client ??= new MongoClient(await address());
  const people = client.db('zazzles_workshop').collection('people');
  const found = await people.findOne({ resetHash: digest(code) });
  if (found) await people.updateOne({ _id: found._id }, { $set: { passcode: next } });
  return person(res, found);
});
