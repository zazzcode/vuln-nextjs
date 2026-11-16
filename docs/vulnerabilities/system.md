# System interaction scenarios (CWE-78, CWE-22)

---

## OS-001 · Unrestricted shell command execution

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-exec.js` |
| Safe control | `pages/api/secure/command.js` |
| Route / endpoint | `/vulnerable/api-route` → `POST /api/vulnerable-exec` |
| Data flow | JSON `command` → `child_process.exec` (shell string) |
| Runtime | server |
| Expected finding | SAST: OS command injection, CWE-78 |

### The flaw

```js
const { command } = req.body;
exec(command, { timeout: 5000, ... }, (error, stdout, stderr) => { ... });
```

The entire request field is passed as a shell command line. Whatever the process account can do, the caller can do.

### Exploit it

Harmless marker (single command):

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-exec \
  -H 'Content-Type: application/json' \
  -d '{"command":"printf zazzles-command-marker"}'
# → "output": "zazzles-command-marker"
```

Proof that a *shell* interprets the string (two commands in one request):

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-exec \
  -H 'Content-Type: application/json' \
  -d '{"command":"printf zazzles-one; printf zazzles-two"}'
# → "output": "zazzles-onezazzles-two"   (both commands ran)
```

### Safe control

`POST /api/secure/command` (`pages/api/secure/command.js`) runs a **fixed executable** through `execFile` with an **argument vector** and `shell: false`. User text can only become `echo`'s single argument:

```js
execFile('/bin/echo', [text], { shell: false, timeout: 5000, ... }, ...)
```

Send the exact two-command string to the safe endpoint:

```bash
curl -s http://127.0.0.1:3000/api/secure/command \
  -H 'Content-Type: application/json' \
  -d '{"text":"printf zazzles-one; printf zazzles-two"}'
# → "echoed": "printf zazzles-one; printf zazzles-two"   (literal data)
```

The semicolon is echoed, not interpreted. Substitutions (`$(whoami)`, backticks), pipes, and `&&` behave the same way. This control is scoped to command injection: the lab makes no broader security claims about the endpoint.

### Tests

- `tests/unit/command.test.mjs`: marker execution and two-command concatenation on the unsafe handler; literal echo of metacharacter strings, method/type/length validation on the safe handler.
- `scripts/test-http.mjs` repeats the pair over HTTP.

---

## FS-001 · Arbitrary file read

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-file-read.js` |
| Safe control | `pages/api/secure/file-read.js` |
| Route / endpoint | `/vulnerable/file-read` → `POST /api/vulnerable-file-read` |
| Data flow | JSON `filePath` → `fs.readFileSync` |
| Runtime | server |
| Expected finding | SAST: path traversal / arbitrary file read, CWE-22 |

### The flaw

```js
const { filePath } = req.body;
const content = fs.readFileSync(filePath, 'utf8');
```

The caller chooses the whole path, relative or absolute, with no confinement to a fixture directory. Anything readable by the server process can be exfiltrated.

### Exploit it

Read a project file (harmless demonstration of unrestricted relative paths):

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-file-read \
  -H 'Content-Type: application/json' \
  -d '{"filePath":"./package.json"}'
# → "content" contains the lab manifest
```

Traversal works the same way (`../../../../etc/passwd` on Unix hosts) — do that only against your own isolated lab VM. The UI page `/vulnerable/file-read` provides a console for the harmless form.

### Safe control

`POST /api/secure/file-read` (`pages/api/secure/file-read.js`) matches the request against an **exact-string allowlist** of published files and resolves them against the project root:

```js
const ALLOWED_FILES = new Set(['package.json', 'README.md']);
if (typeof file !== 'string' || !ALLOWED_FILES.has(file)) return res.status(403)...
const content = await readFile(path.join(process.cwd(), file), 'utf8');
```

User input never joins a filesystem path, so `../` sequences, absolute paths, trailing slashes, and partial names all fail the set lookup before any I/O:

```bash
curl -s http://127.0.0.1:3000/api/secure/file-read \
  -H 'Content-Type: application/json' \
  -d '{"file":"../../../etc/passwd"}'
# → 403 {"error":"File is not published by this lab."}
```

### Tests

- `tests/unit/file-read.test.mjs`: unsafe handler reads `./package.json`; safe handler publishes exactly the allowlist and rejects traversal, absolute, partial, and malformed inputs with 403.
- `scripts/test-http.mjs` repeats the pair over HTTP.
