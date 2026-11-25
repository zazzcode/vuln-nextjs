import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post } from '../../../../lib/workshop/route.js';

export default post(async (req, res) => {
  const without = ['board'].concat(req.body?.without ?? []);
  return res.status(200).json({ people: await new PeopleRepository(await database()).many({ team: { $nin: without } }) });
});
