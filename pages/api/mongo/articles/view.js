import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

const MODES = { cheap: 'this.price < 10', regular: 'this.price >= 10' };

export default http.endpoint(['GET'], async (req, res) => {
  const { mode } = req.query;
  if (!Object.hasOwn(MODES, mode)) return res.status(400).json({ error: 'Unknown mode.' });
  const articles = await mongo.collection('articles');
  const found = await articles.find({ published: true, $where: MODES[mode] }).project({ _id: 0, title: 1, category: 1, price: 1 }).sort({ title: 1 }).toArray();
  return res.status(200).json({ articles: found });
});
