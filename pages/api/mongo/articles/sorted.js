import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

const ORDERS = { title: { title: 1 }, price: { price: 1 }, newest: { _id: -1 } };

export default http.endpoint(['GET'], async (req, res) => {
  const order = Object.hasOwn(ORDERS, req.query.order) ? ORDERS[req.query.order] : ORDERS.title;
  const articles = await mongo.collection('articles');
  const found = await articles.find({ published: true }).project({ _id: 0, title: 1 }).sort(order).toArray();
  return res.status(200).json({ articles: found });
});
