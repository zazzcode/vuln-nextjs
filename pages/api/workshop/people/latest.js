import { database } from '../../../../lib/workshop/client.js';
import { PeopleRepository } from '../../../../lib/workshop/people-repository.js';
import { get } from '../../../../lib/workshop/route.js';

export default get(async (req, res) => {
  const view = req.cookies.view ? JSON.parse(req.cookies.view) : {};
  const team = `${view?.team ?? 'floor'}`;
  return res.status(200).json({ people: await new PeopleRepository(await database()).many({ $and: [{ team }, { team: { $ne: 'board' } }] }) });
});
