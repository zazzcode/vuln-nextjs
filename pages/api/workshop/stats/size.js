import { database } from '../../../../lib/workshop/client.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const name = ['parts', 'loans'].includes(req.query.of) ? req.query.of : 'parts';
  return res.status(200).json({ total: await (await database()).collection(name).estimatedDocumentCount() });
});
