import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const chosen = Object.fromEntries(['category', 'title']
    .filter((name) => typeof req.body?.[name] === 'string')
    .map((name) => [name, req.body[name]]));
  const articles = await mongo.collection('articles');
  const found = await articles.find({ published: true, ...chosen }).project({ _id: 0, title: 1, category: 1, price: 1 }).sort({ title: 1 }).toArray();
  return res.status(200).json({ articles: found });
});
