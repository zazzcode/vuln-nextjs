import { listParts } from '../../../../lib/workshop/queries.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const { mode = 'and', bin = 'A' } = req.query;
  const parts = await listParts({ listed: true, [mode === 'or' ? '$or' : '$and']: [{ bin: String(bin) }, { quantity: { $gte: 1 } }] });
  return res.status(200).json({ parts });
});
