// ⚠️ EXTREMELY VULNERABLE API ENDPOINT - FOR TESTING ONLY!
// This endpoint reads arbitrary files from the filesystem

import fs from 'fs';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'No file path provided' });
  }

  console.log(`[VULNERABLE] Reading file: ${filePath}`);

  try {
    // EXTREMELY DANGEROUS: Reading user-specified files without validation!
    // This allows attackers to read any file the server has access to
    const fileContent = fs.readFileSync(filePath, 'utf8');

    res.status(200).json({
      success: true,
      filePath: filePath,
      content: fileContent,
      size: fileContent.length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: error.code,
      filePath: filePath
    });
  }
}
