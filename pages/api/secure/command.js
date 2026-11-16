import { execFile } from 'child_process';
import http from '../../../lib/http.cjs';
const { endpoint, validText } = http;

// Safe control for OS-001: a fixed executable and an argument vector with no
// shell. User text can only become echo's single argument, so metacharacters
// such as ; | && $( ) ` stay inert data. Scoped to this flaw only.
export default endpoint(['POST'], (req, res) => {
  const { text } = req.body || {};
  if (!validText(text, 200)) return res.status(400).json({ error: 'text must be a nonempty string of at most 200 characters.' });
  execFile('/bin/echo', [text], { shell: false, timeout: 5000, maxBuffer: 64 * 1024 }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Echo failed.', stderr });
    return res.status(200).json({ echoed: stdout.trimEnd() });
  });
}, { discloseErrors: false });
