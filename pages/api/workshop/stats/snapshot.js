import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const target = req.body?.name ?? 'snapshot';
  const db = await database();
  await db.collection('parts').aggregate([
    { $match: { listed: true } },
    { $project: { sku: 1, quantity: 1 } },
    { $out: target },
  ]).toArray();
  return res.status(200).json({ saved: target });
});
