import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { username, role } = req.body?.filter ?? {};
  const accounts = await mongo.collection('accounts');
  return res.status(200).json({ total: await accounts.countDocuments({ username: { $eq: username }, 'access.role': { $eq: role } }) });
});
