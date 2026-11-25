import connect from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const factor = Number(req.body?.factor ?? 1);
  const db = (await connect()).db('zazzles_workshop');
  const { results } = await db.command({
    mapReduce: 'parts',
    query: { listed: true },
    map: 'function () { emit(this.bin, this.quantity * factor); }',
    reduce: 'function (key, values) { return Array.sum(values); }',
    out: { inline: 1 },
    scope: { factor },
  });
  return res.status(200).json({ totals: results.map(({ _id, value }) => ({ bin: _id, value })) });
});
