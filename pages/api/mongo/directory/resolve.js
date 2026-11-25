import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const { by = 'username', value = '' } = req.query;
  const accounts = await mongo.collection('accounts');
  const account = await accounts.findOne({ [by]: value }, { projection: { _id: 0, username: 1, email: 1 } });
  return account ? res.status(200).json({ account }) : res.status(404).json({ error: 'No match.' });
});
