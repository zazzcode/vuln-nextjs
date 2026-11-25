import { listParts } from '../../../../lib/workshop/queries.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const { mode = 'and', bin = 'A' } = req.query;
  const parts = await listParts({ [`$${mode}`]: [{ listed: true }, { bin: String(bin) }] });
  return res.status(200).json({ parts });
});
