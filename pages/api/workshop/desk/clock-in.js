import { z } from 'zod';
import { database } from '../../../../lib/workshop/client.js';
import { person, post, problem } from '../../../../lib/workshop/route.js';

const Entry = z.object({ login: z.coerce.string().min(1), passcode: z.union([z.string(), z.number()]) });

export default post(async (req, res) => {
  const parsed = Entry.safeParse(req.body);
  if (!parsed.success) return problem(res, 400, 'login and passcode are required.');
  return person(res, await (await database()).collection('people').findOne(parsed.data));
});
