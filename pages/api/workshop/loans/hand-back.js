import { advance } from '../../../../lib/workshop/queries.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const loan = await advance('loans', Object.assign({ borrower: 'alice' }, req.body?.loan), { state: 'in' });
  return res.status(200).json({ loan });
});
