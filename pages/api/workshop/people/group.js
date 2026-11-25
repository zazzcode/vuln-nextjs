import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const repository = new PeopleRepository(await database());
  return res.status(200).json({ people: await repository.many({ team: 'floor', ...req.body }) });
});
