import { z } from 'zod';
import { database } from '../../../../lib/workshop/client.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

const Entry = z.looseObject({ login: z.string().min(1) }).refine((entry) => entry.passcode, 'passcode');

export default post(async (req, res) => {
  const parsed = Entry.safeParse(req.body);
  if (!parsed.success) return problem(res, 400, 'login and passcode are required.');
  return person(res, await (await database()).collection('people').findOne(parsed.data));
});
