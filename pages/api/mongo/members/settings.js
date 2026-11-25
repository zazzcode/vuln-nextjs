import { z } from 'zod';
import http from '../../../../lib/http.cjs';
import mongo from '../../../../lib/mongo.cjs';

const Settings = z.object({ displayName: z.string().max(80), email: z.string().max(120).optional() });

export default http.endpoint(['POST'], async (req, res) => {
  const parsed = Settings.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid settings.' });
  const accounts = await mongo.collection('accounts');
  const result = await accounts.updateOne({ username: 'alice' }, { $set: parsed.data });
  return res.status(200).json({ changed: result.modifiedCount });
});
