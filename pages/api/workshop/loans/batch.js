import { database } from '../../../../lib/workshop/client.js';
import { post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || !items.length) return problem(res, 400, 'items is required.');
  const operations = items.map((item) => ({ updateOne: { filter: item.where, update: { $set: { state: 'in' } } } }));
  const result = await (await database()).collection('loans').bulkWrite(operations);
  return res.status(200).json({ changed: result.modifiedCount });
});
