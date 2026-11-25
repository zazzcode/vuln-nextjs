import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const bookings = await mongo.collection('bookings');
  const result = await bookings.deleteOne({ holder: 'alice', reference: { $eq: req.body?.reference } });
  return res.status(200).json({ removed: result.deletedCount });
});
