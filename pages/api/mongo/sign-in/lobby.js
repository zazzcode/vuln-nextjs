import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { username, passphrase, code } = req.body || {};
  const secret = code ?? passphrase;
  if (typeof username !== 'string' || typeof secret !== 'string') return res.status(400).json({ error: 'Username and passphrase must be text.' });
  const accounts = await mongo.collection('accounts');
  const user = await accounts.findOne(code ? { username, inviteCode: secret } : { username, passphrase: secret });
  if (!user) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, user: { username: user.username, role: user.access.role } });
});
