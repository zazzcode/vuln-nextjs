import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const by = ['category', 'title'].find((name) => name === req.query.by) ?? 'category';
  const articles = await mongo.collection('articles');
  const rows = await articles.aggregate([
    { $match: { published: true } },
    { $group: { _id: `$${by}`, total: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  return res.status(200).json({ rows });
});
