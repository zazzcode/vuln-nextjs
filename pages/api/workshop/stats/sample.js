import { database } from '../../../../lib/workshop/client.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const { of: name = 'parts' } = req.query;
  const db = await database();
  const [total, rows] = await Promise.all([
    db.collection(name).estimatedDocumentCount(),
    db.collection(name).find().limit(1).toArray(),
  ]);
  return res.status(200).json({ total, rows });
});
