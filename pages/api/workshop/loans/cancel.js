import { drop } from '../../../../lib/workshop/queries.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { number } = req.body ?? {};
  if (number === undefined) return res.status(400).json({ error: 'number is required.' });
  const gone = await drop('loans', { number });
  return res.status(200).json({ gone: gone?.number ?? null });
});
