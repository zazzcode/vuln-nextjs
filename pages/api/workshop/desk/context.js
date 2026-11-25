import { first } from '../../../../lib/workshop/queries.js';
import { get, person } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const context = JSON.parse(req.headers['x-desk'] ?? '{}');
  return person(res, await first('people', { login: context.login ?? '', badge: context.badge ?? '' }));
});
