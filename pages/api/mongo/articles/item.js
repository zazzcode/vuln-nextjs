import { ObjectId } from 'mongodb';
import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  let key = req.body?.id;
  if (!key) return res.status(400).json({ error: 'id is required.' });
  try { key = new ObjectId(key); }
  catch { return res.status(400).json({ error: 'id is not valid.' }); }
  const articles = await mongo.collection('articles');
  const article = await articles.findOne({ _id: key }, { projection: { _id: 0, title: 1 } });
  return article ? res.status(200).json({ article }) : res.status(404).json({ error: 'No match.' });
});
