import { first } from '../../../../lib/workshop/queries.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

const revive = (key, value) => (typeof value === 'object' && key !== '' ? String(value) : /^\/.*\/$/.test(value) ? new RegExp(value.slice(1, -1)) : value);

export default post(async (req, res) => {
  const { payload } = req.body ?? {};
  if (typeof payload !== 'string') return problem(res, 400, 'payload is text.');
  const { login = '', passcode = '' } = JSON.parse(payload, revive);
  return person(res, await first('people', { login, passcode }));
});
