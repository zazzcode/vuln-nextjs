import { listParts } from '../../../../lib/workshop/queries.js';
import { post, problem } from '../../../../lib/workshop/route.js';
import { tidy } from '../../../../lib/workshop/shape.js';

export default post(async (req, res) => {
  const { terms } = tidy(req.body ?? {});
  if (!Array.isArray(terms) || !terms.length) return problem(res, 400, 'terms is required.');
  return res.status(200).json({ parts: await listParts({ listed: true, $and: terms }) });
});
