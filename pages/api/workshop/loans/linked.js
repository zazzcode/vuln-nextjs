import { database } from '../../../../lib/workshop/client.js';
import { post, problem } from '../../../../lib/workshop/route.js';

const LINKS = {
  part: { from: 'parts', localField: 'sku', foreignField: 'sku', pipeline: [{ $project: { _id: 0, name: 1 } }], as: 'extra' },
  person: { from: 'people', localField: 'borrower', foreignField: 'login', pipeline: [{ $project: { _id: 0, email: 1 } }], as: 'extra' },
};

export default post(async (req, res) => {
  const link = Object.hasOwn(LINKS, req.body?.link) ? LINKS[req.body.link] : null;
  if (!link) return problem(res, 400, 'Unknown link.');
  const rows = await (await database()).collection('loans').aggregate([
    { $match: { borrower: 'alice' } },
    { $lookup: link },
    { $project: { _id: 0, number: 1, extra: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
