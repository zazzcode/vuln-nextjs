import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';
import requestKeys from '../../../../lib/request-keys.cjs';
const { pruneTree } = requestKeys;

export default http.endpoint(['POST'], async (req, res) => {
  const { username, passphrase } = pruneTree(req.body) || {};
  if (!username || !passphrase) return res.status(400).json({ error: 'Username and passphrase are required.' });
  const accounts = await mongo.collection('accounts');
  const user = await accounts.findOne({ username, passphrase });
  if (!user) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, user: { username: user.username, role: user.access.role } });
});
