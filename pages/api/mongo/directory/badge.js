import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';
import queryTree from '../../../../lib/query-tree.cjs';
const { parseQuery } = queryTree;

export default http.endpoint(['GET'], async (req, res) => {
  const { username, inviteCode } = parseQuery(req.url);
  if (!username || inviteCode === undefined) return res.status(400).json({ error: 'username and inviteCode are required.' });
  const accounts = await mongo.collection('accounts');
  const account = await accounts.findOne({ username, inviteCode }, { projection: { _id: 0, username: 1, email: 1 } });
  return account ? res.status(200).json({ account }) : res.status(404).json({ error: 'No match.' });
});
