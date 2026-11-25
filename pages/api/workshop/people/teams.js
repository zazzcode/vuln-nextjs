import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { teams } = req.body ?? {};
  if (!teams) return problem(res, 400, 'teams is required.');
  const team = Array.isArray(teams) ? { $in: teams.filter((name) => name !== 'board') } : teams;
  if (team === 'board') return problem(res, 403, 'Not available.');
  return res.status(200).json({ people: await new PeopleRepository(await database()).many({ team }) });
});
