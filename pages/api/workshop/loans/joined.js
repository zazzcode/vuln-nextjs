import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { from = 'parts', mine = 'sku', theirs = 'sku' } = req.body ?? {};
  const rows = await (await database()).collection('loans').aggregate([
    { $match: { borrower: 'alice' } },
    { $lookup: { from, localField: mine, foreignField: theirs, as: 'extra' } },
    { $project: { _id: 0, number: 1, extra: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
