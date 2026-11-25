import { drop } from '../../../../lib/workshop/queries.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const number = Number.parseInt(req.body?.number, 10);
  const gone = await drop('loans', { number, borrower: 'alice' });
  return res.status(200).json({ gone: gone?.number ?? null });
});
