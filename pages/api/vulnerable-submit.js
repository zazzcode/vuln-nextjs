// ⚠️ EXTREMELY VULNERABLE API ENDPOINT - FOR TESTING ONLY!
// JS-002: application-level server-side eval injection (not React2Shell)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message } = req.body;

  try {
    // EXTREMELY DANGEROUS: Using eval with user input
    // This is the core vulnerability - attackers can break out of the string
    // and execute arbitrary JavaScript code
    const result = eval(`({
      name: '${name}',
      message: '${message}',
      timestamp: Date.now(),
      processedBy: 'vulnerable-submit API'
    })`);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
