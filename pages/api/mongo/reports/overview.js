import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const articles = await mongo.collection('articles');
  const rows = await articles.aggregate([
    { $match: { published: true } },
    { $match: { category: String(req.body?.only?.category) } },
    { $project: { _id: 0, title: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
