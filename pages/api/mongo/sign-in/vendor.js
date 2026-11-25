import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { username, passphrase } = req.body || {};
  if (typeof username !== 'string' || typeof passphrase !== 'string') return res.status(400).json({ authenticated: false });
  const accounts = await mongo.collection('accounts');
  const user = await accounts.findOne({ username, passphrase });
  return res.json({ authenticated: Boolean(user), user: user && { username: user.username, role: user.access.role } });
});
