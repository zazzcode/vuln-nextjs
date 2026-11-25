import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { weight } = req.body || {};
  if (!weight) return res.status(400).json({ error: 'weight is required.' });
  const articles = await mongo.collection('articles');
  const rows = await articles.aggregate([
    { $match: { published: true } },
    { $project: { _id: 0, title: 1, score: { $function: { body: `function (price) { return price * ${weight}; }`, args: ['$price'], lang: 'js' } } } },
    { $sort: { title: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
