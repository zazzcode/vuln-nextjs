import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { start = 0 } = req.body ?? {};
  const parts = (await database()).collection('parts');
  const [row] = await parts.aggregate([
    { $match: { listed: true } },
    { $group: { _id: null, total: { $accumulator: {
      init: `function () { return ${start}; }`,
      initArgs: [],
      accumulate: 'function (sum, quantity) { return sum + quantity; }',
      accumulateArgs: ['$quantity'],
      merge: 'function (a, b) { return a + b; }',
      lang: 'js',
    } } } },
  ]).toArray();
  return res.status(200).json({ total: row?.total });
});
