import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const weight = Number(req.body?.weight);
  if (!Number.isFinite(weight)) return res.status(400).json({ error: 'weight must be a number.' });
  const articles = await mongo.collection('articles');
  const rows = await articles.aggregate([
    { $match: { published: true } },
    { $project: { _id: 0, title: 1, score: { $function: { body: 'function (price, weight) { return price * weight; }', args: ['$price', weight], lang: 'js' } } } },
    { $sort: { title: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
