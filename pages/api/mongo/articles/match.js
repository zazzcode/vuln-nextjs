import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const filter = JSON.parse(req.query.filter || '{}');
  const articles = await mongo.collection('articles');
  const found = await articles.find({ published: true, category: String(filter.category) }).project({ _id: 0, title: 1, category: 1, price: 1 }).sort({ title: 1 }).toArray();
  return res.status(200).json({ articles: found });
});
