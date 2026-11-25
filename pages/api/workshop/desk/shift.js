import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const { login, passcode } = req.body ?? {};
  if (!login || !passcode) return problem(res, 400, 'login and passcode are required.');
  const repository = new PeopleRepository(await database());
  return person(res, await repository.byPair(`${login}`, passcode));
});
