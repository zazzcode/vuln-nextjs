import { database } from '../../../../lib/workshop/client.js';
import { post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { items } = req.body ?? {};
  if (!Array.isArray(items) || !items.length) return problem(res, 400, 'items is required.');
  const operations = items.map(({ number, state }) => ({
    updateOne: { filter: { borrower: 'alice', number: { $in: [number] } }, update: { $set: { state: state === 'in' ? 'in' : 'out' } } },
  }));
  const result = await (await database()).collection('loans').bulkWrite(operations);
  return res.status(200).json({ changed: result.modifiedCount });
});
