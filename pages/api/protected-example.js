// ✅ SECURE API ENDPOINT - This shows how to properly validate input

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message } = req.body;

  // Validate inputs
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Sanitize inputs - only allow alphanumeric and basic punctuation
  const sanitizedName = name.replace(/[^a-zA-Z0-9\s\-_.]/g, '');
  const sanitizedMessage = message.replace(/[^a-zA-Z0-9\s\-_.!?,]/g, '');

  // Validate length
  if (sanitizedName.length > 100) {
    return res.status(400).json({ error: 'Name too long' });
  }

  if (sanitizedMessage.length > 1000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // Safe processing - no eval, no exec
  const result = {
    name: sanitizedName,
    message: sanitizedMessage,
    timestamp: Date.now(),
    processedBy: 'protected API'
  };

  res.status(200).json(result);
}
