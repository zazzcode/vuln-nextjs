import { first } from '../../../../lib/workshop/queries.js';
import { post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { login, start } = req.body ?? {};
  if (!start) return problem(res, 400, 'login and start are required.');
  const found = await first('people', { login: { $eq: login } });
  return res.status(200).json({ right: found?.passcode === start });
});
