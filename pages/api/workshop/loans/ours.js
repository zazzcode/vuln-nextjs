import { database } from '../../../../lib/workshop/client.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { loans } = await collections();
  const also = [].concat(req.body?.also ?? []).map((entry) => ({ number: Number(entry?.number), borrower: 'alice' }));
  const rows = await loans.find({ $or: [{ borrower: 'alice', state: 'out' }, ...also] }, { projection: { _id: 0, number: 1, borrower: 1 } }).sort({ number: 1 }).toArray();
  return res.status(200).json({ loans: rows });
});

async function collections() {
  const db = await database();
  return { loans: db.collection('loans'), parts: db.collection('parts') };
}
