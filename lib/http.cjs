function endpoint(methods, run, { discloseErrors = false } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try { return await run(req, res); }
    catch (error) {
      return res.status(500).json({ error: discloseErrors ? error.message : 'Request failed; reset the lab database if needed.' });
    }
  };
}
function validText(value, max = 1000) {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}
module.exports = { endpoint, validText };
