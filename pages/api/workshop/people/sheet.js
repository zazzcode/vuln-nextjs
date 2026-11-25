import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { post } from '../../../../lib/workshop/route.js';
import { pick } from '../../../../lib/workshop/shape.js';

export default post(async (req, res) => {
  const repository = new PeopleRepository(await database());
  const { _id, ...current } = await repository.one({ login: 'alice' });
  const result = await repository.change('alice', { ...current, ...pick(req.body, ['email']) });
  return res.status(200).json({ changed: result.modifiedCount });
});
