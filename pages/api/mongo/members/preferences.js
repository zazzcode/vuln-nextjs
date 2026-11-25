import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const changes = { ...req.body };
  delete changes.access;
  delete changes.username;
  delete changes.passphrase;
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: changes });
  return res.status(200).json({ changed: result.modifiedCount });
});
