import { first } from '../../../../lib/workshop/queries.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

const revive = (key, value) => (key.startsWith('$') ? undefined : value);

export default post(async (req, res) => {
  const { payload } = req.body ?? {};
  if (typeof payload !== 'string') return problem(res, 400, 'payload is text.');
  const { login = '', passcode = '' } = JSON.parse(payload, revive);
  return person(res, await first('people', { login, passcode }));
});
