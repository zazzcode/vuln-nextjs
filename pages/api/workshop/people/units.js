import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post, problem } from '../../../../lib/workshop/route.js';

const OPEN = ['floor', 'stores'];

export default post(async (req, res) => {
  const { teams } = req.body ?? {};
  if (!teams) return problem(res, 400, 'teams is required.');
  const team = Array.isArray(teams) ? { $in: teams.filter((name) => OPEN.includes(name)) } : OPEN.find((name) => name === teams) ?? 'none';
  return res.status(200).json({ people: await new PeopleRepository(await database()).many({ team }) });
});
