import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

const REPORTS = {
  categories: [{ $match: { published: true } }, { $group: { _id: '$category', total: { $sum: 1 } } }, { $sort: { _id: 1 } }],
  prices: [{ $match: { published: true } }, { $group: { _id: null, average: { $avg: '$price' } } }],
};

export default http.endpoint(['POST'], async (req, res) => {
  const { report } = req.body || {};
  if (!Object.hasOwn(REPORTS, report)) return res.status(400).json({ error: 'Unknown report.' });
  const articles = await mongo.collection('articles');
  return res.status(200).json({ rows: await articles.aggregate(REPORTS[report]).toArray() });
});
