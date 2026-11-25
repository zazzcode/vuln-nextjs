import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const bookings = await mongo.collection('bookings');
  const result = await bookings.updateOne({ reference: String(req.body?.booking?.reference), holder: 'alice' }, { $set: { status: 'closed' } });
  return res.status(200).json({ changed: result.modifiedCount });
});
