import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const { category } = req.query;
  if (typeof category !== 'string') return res.status(400).json({ error: 'category is required.' });
  const articles = await mongo.collection('articles');
  const found = await articles.find({ $where: `this.published && this.category === ${JSON.stringify(category)}` }).project({ _id: 0, title: 1, category: 1, price: 1 }).sort({ title: 1 }).toArray();
  return res.status(200).json({ articles: found });
});
