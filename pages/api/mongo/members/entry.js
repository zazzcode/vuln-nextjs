import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { changes } = req.body || {};
  if (!changes) return res.status(400).json({ error: 'changes is required.' });
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: { displayName: String(changes.$set?.displayName) } });
  return res.status(200).json({ changed: result.modifiedCount });
});
