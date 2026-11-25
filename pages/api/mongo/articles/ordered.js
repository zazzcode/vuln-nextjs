import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['GET'], async (req, res) => {
  const { order = 'title' } = req.query;
  const articles = await mongo.collection('articles');
  const found = await articles.find({ published: true }).project({ _id: 0, title: 1 }).sort(order).toArray();
  return res.status(200).json({ articles: found });
});
