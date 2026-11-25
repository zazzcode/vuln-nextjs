import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { displayName } = req.body || {};
  if (typeof displayName !== 'string') return res.status(400).json({ error: 'displayName must be text.' });
  const accounts = await mongo.collection('accounts');
  const account = await accounts.findOneAndUpdate({ username: 'alice' }, [{ $set: { displayName } }], { returnDocument: 'after', projection: { _id: 0, displayName: 1 } });
  return res.status(200).json({ account });
});
