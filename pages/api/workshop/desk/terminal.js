import { first } from '../../../../lib/workshop/queries.js';
import { get, person } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const [login = '', badge = ''] = (req.headers['x-desk'] ?? '').split(':');
  return person(res, await first('people', { login, badge }));
});
