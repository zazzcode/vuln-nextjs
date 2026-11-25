import { advance } from '../../../../lib/workshop/queries.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const wanted = Object.assign({}, { number: Number(req.body?.loan?.number) }, { borrower: 'alice' });
  const loan = await advance('loans', wanted, { state: 'in' });
  return res.status(200).json({ loan });
});
