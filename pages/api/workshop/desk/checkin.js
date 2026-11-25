import { first } from '../../../../lib/workshop/queries.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const otp = req.body?.otp;
  if (!/^\d{6}$/.test(otp)) return problem(res, 400, 'otp has six digits.');
  return person(res, await first('people', { otp }));
});
