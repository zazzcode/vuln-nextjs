import { database } from '../../../../lib/workshop/client.js';
import { get } from '../../../../lib/workshop/route.js';

const NAMES = { place: 'bin', title: 'name' };

export default get(async (req, res) => {
  const { by = 'place' } = req.query;
  const field = Object.hasOwn(NAMES, by) ? NAMES[by] : NAMES.place;
  const values = await (await database()).collection('parts').distinct(field, { listed: true });
  return res.status(200).json({ values });
});
