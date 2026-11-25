import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const changes = { ...req.body };
  const allowed = Object.entries(changes).every(([name, value]) => ['displayName', 'email'].includes(name) && typeof value === 'string');
  if (!allowed || !Object.keys(changes).length) return res.status(400).json({ error: 'Unknown option.' });
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: changes });
  return res.status(200).json({ changed: result.modifiedCount });
});
