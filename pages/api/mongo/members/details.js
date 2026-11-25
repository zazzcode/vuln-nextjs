import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { displayName, email } = req.body || {};
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: { displayName: String(displayName), email: String(email) } });
  return res.status(200).json({ changed: result.modifiedCount });
});
