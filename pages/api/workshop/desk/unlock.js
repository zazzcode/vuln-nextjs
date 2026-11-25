import { database } from '../../../../lib/workshop/client.js';
import { person, post } from '../../../../lib/workshop/route.js';

const FIELDS = ['login', 'passcode'];

export default post(async (req, res) => {
  const wanted = {};
  for (const field of FIELDS) {
    const value = req.body?.[field];
    if (value === undefined || value === '') return res.status(400).json({ error: `${field} is required.` });
    wanted[field] = { $in: [value] };
  }
  const { findOne } = bound((await database()).collection('people'));
  return person(res, await findOne(wanted));
});

const bound = (target) => ({ findOne: target.findOne.bind(target) });
