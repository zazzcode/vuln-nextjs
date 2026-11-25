import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const target = `copy_${String(req.body?.name ?? 'default').replace(/[^a-z]/g, '').slice(0, 12)}`;
  const db = await database();
  await db.collection('parts').aggregate([
    { $match: { listed: true } },
    { $project: { sku: 1, quantity: 1 } },
    { $merge: { into: target, whenMatched: 'replace' } },
  ]).toArray();
  return res.status(200).json({ saved: target });
});
