import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const code = String(req.body?.code ?? '');
  if (!code) return res.status(400).json({ error: 'code is required.' });
  const exact = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const accounts = await mongo.collection('accounts');
  const account = await accounts.findOne({ inviteCode: { $regex: `^${exact}$`, $options: 'i' } }, { projection: { _id: 0, username: 1, email: 1 } });
  return account ? res.status(200).json({ account }) : res.status(404).json({ error: 'No match.' });
});
