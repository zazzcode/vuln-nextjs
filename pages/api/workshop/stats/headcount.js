import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const people = (await database()).collection('people');
  const total = await people.count({ ...req.body, team: 'board' });
  return res.status(200).json({ total });
});
