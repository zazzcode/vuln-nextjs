import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

export default http.endpoint(['POST'], async (req, res) => {
  const { reference } = req.body || {};
  if (typeof reference !== 'string') return res.status(400).json({ error: 'reference must be text.' });
  const bookings = await mongo.collection('bookings');
  const result = await bookings.updateMany({ reference }, { $set: { status: 'confirmed' } });
  return res.status(200).json({ changed: result.modifiedCount });
});
