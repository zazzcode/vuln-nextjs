import { database } from '../../../../lib/workshop/client.js';
import { get } from '../../../../lib/workshop/route.js';

const EXTRA = new Map([['loans', [{ $match: { borrower: 'alice' } }]], ['parts', [{ $match: { listed: true } }]]]);

export default get(async (req, res) => {
  const plus = EXTRA.has(req.query.plus) ? req.query.plus : 'loans';
  const rows = await (await database()).collection('parts').aggregate([
    { $match: { listed: true } },
    { $unionWith: { coll: plus, pipeline: EXTRA.get(plus) } },
    { $unset: ['_id', 'supplier'] },
  ]).toArray();
  return res.status(200).json({ rows });
});
