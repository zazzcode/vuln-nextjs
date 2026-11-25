import { database } from '../../../../lib/workshop/client.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { badge } = req.body ?? {};
  if (typeof badge !== 'string' || badge.length < 2) return problem(res, 400, 'badge is required.');
  const people = (await database()).collection('people');
  const [found] = await people.find({ badge: new RegExp(`^${badge}$`, 'i') }).limit(1).toArray();
  return person(res, found);
});
