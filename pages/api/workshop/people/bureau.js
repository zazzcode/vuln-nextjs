import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post, problem } from '../../../../lib/workshop/route.js';

const VIEWS = { floor: { team: 'floor' }, board: { team: 'board' } };

export default post(async (req, res) => {
  const view = Object.hasOwn(VIEWS, req.body?.view) ? VIEWS[req.body.view] : null;
  if (!view) return problem(res, 400, 'view is required.');
  return res.status(200).json({ people: await new PeopleRepository(await database()).many({ ...view, ...req.body?.only }) });
});
