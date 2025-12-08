// ⚠️ EXTREMELY VULNERABLE API ENDPOINT - FOR TESTING ONLY!
// This endpoint executes arbitrary system commands

import { exec } from 'child_process';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }

  console.log(`[VULNERABLE] Executing command: ${command}`);

  // EXTREMELY DANGEROUS: Executing user input directly!
  // This allows Remote Code Execution (RCE)
  exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[VULNERABLE] Command error:`, error);
      return res.status(500).json({
        error: error.message,
        stderr: stderr,
        code: error.code,
        killed: error.killed
      });
    }

    console.log(`[VULNERABLE] Command output:`, stdout);

    res.status(200).json({
      success: true,
      command: command,
      output: stdout,
      stderr: stderr,
      timestamp: Date.now()
    });
  });
}
