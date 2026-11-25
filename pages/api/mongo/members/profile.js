import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: req.body });
  return res.status(200).json({ changed: result.modifiedCount });
});
