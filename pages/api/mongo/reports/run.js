import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { stages } = req.body || {};
  if (!Array.isArray(stages)) return res.status(400).json({ error: 'stages is required.' });
  const articles = await mongo.collection('articles');
  return res.status(200).json({ rows: await articles.aggregate(stages).toArray() });
});
