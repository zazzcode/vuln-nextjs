import { readFile } from 'node:fs/promises';
import path from 'node:path';
import http from '../../../lib/http.cjs';

// Safe control for FS-001: an exact-string allowlist of published files.
// User input never joins a filesystem path, so ../ sequences, absolute paths
// and encoded traversals all fail the lookup instead of resolving.
const ALLOWED_FILES = new Set(['package.json', 'README.md']);

export default http.endpoint(['POST'], async (req, res) => {
  const { file } = req.body || {};
  if (typeof file !== 'string' || !ALLOWED_FILES.has(file)) {
    return res.status(403).json({ error: 'File is not published by this lab.' });
  }
  const content = await readFile(path.join(process.cwd(), file), 'utf8');
  return res.status(200).json({ file, content });
}, { discloseErrors: false });
