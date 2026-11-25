import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const fields = String(req.query.fields ?? 'displayName').split(',').filter((name) => ['displayName', 'email'].includes(name));
  const accounts = await mongo.collection('accounts');
  const people = await accounts.find({}).project({ _id: 0, displayName: 1, ...Object.fromEntries(fields.map((name) => [name, 1])) }).sort({ username: 1 }).toArray();
  return res.status(200).json({ people });
});
