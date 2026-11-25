import { database } from '../../../../lib/workshop/client.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const { plus = 'loans' } = req.query;
  const rows = await (await database()).collection('parts').aggregate([
    { $match: { listed: true } },
    { $unionWith: { coll: plus } },
    { $unset: ['_id', 'supplier'] },
  ]).toArray();
  return res.status(200).json({ rows });
});
