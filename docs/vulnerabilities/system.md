# Module: System interaction (CWE-78, CWE-22)

## Contents

| Scenario | Agent ref | Student guide | Exploit lab | Vuln vs protected | Tests |
| --- | --- | --- | --- | --- | --- |
| [OS-001 · Shell command execution](#os-001) | [expected finding](#os-001-agent) | [guide](#os-001-student) | [Burp · Postman · curl](#os-001-exploit) | [comparison](#os-001-safe) | [tests](#os-001-tests) |
| [FS-001 · Arbitrary file read](#fs-001) | [expected finding](#fs-001-agent) | [guide](#fs-001-student) | [Burp · Postman · curl](#fs-001-exploit) | [comparison](#fs-001-safe) | [tests](#fs-001-tests) |

---

<a id="os-001"></a>
## OS-001 · Unrestricted shell command execution

<a id="os-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-exec.js` |
| Safe control | `pages/api/secure/command.js` |
| Endpoint | `POST /api/vulnerable-exec` |
| Sink | `child_process.exec` (shell command line) |
| Flow | JSON `command` → `exec(command)` |
| Tests | `tests/unit/command.test.mjs`; `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports OS command injection (CWE-78): the entire request field becomes a shell command line.

[Student guide](#os-001-student) · [Exploit lab](#os-001-exploit) · [Vuln vs protected](#os-001-safe) · [Tests](#os-001-tests)

<a id="os-001-student"></a>
### Student guide

```js
const { command } = req.body;
exec(command, { timeout: 5000, ... }, (error, stdout) => { ... });
```

`exec` spawns `/bin/sh -c <string>`, so metacharacters — characters a shell treats as instructions rather than data (`;`, `&&`, `|`, `$()`, backticks) — are interpreted by a shell running with the server process's permissions. The two-command marker payload below is the gentlest proof that a *shell* is parsing the string.

<a id="os-001-exploit"></a>
### Exploit lab

Payload A (marker): `{"command":"printf zazzles-command-marker"}` → `"output": "zazzles-command-marker"`.
Payload B (shell proof): `{"command":"printf zazzles-one; printf zazzles-two"}` → `"output": "zazzles-onezazzles-two"` — two commands ran.

**Burp Suite**

1. Intercept a `POST /api/vulnerable-exec` from `/vulnerable/api-route` (its console submits one), send it to Repeater.
2. Replace the JSON body with payload B and **Send**.
3. The response shows `zazzles-onezazzles-two` — the semicolon chained two commands server-side.

**Postman**

1. `POST http://127.0.0.1:3000/api/vulnerable-exec`, header `Content-Type: application/json`.
2. Body → raw → JSON: payload B. Send → same concatenated output.
3. Repeat against `http://127.0.0.1:3000/api/secure/command` with `{"text":"printf zazzles-one; printf zazzles-two"}` → the string is echoed back verbatim.

**curl**

```bash
# vulnerable: shell interprets the semicolon
curl -s http://127.0.0.1:3000/api/vulnerable-exec \
  -H 'Content-Type: application/json' \
  -d '{"command":"printf zazzles-one; printf zazzles-two"}'
# → "output": "zazzles-onezazzles-two"

# protected: identical string is inert data
curl -s http://127.0.0.1:3000/api/secure/command \
  -H 'Content-Type: application/json' \
  -d '{"text":"printf zazzles-one; printf zazzles-two"}'
# → "echoed": "printf zazzles-one; printf zazzles-two"
```

**Observation that proves exploitation:** concatenation of two commands' output (unsafe) vs the literal string (safe).

<a id="os-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `POST /api/vulnerable-exec` | `POST /api/secure/command` |
| Source | `pages/api/vulnerable-exec.js` | `pages/api/secure/command.js` |
| Mechanism | `exec(command)` — one shell string | `execFile('/bin/echo', [text], { shell: false })` — fixed binary + argument vector |
| Same metacharacter string → | both commands execute | echoed as literal data |

**Why the control works:** injection needs a parser that re-interprets data as code. `execFile` with an **argument vector** (the plain list of arguments passed to a program — no shell involved) and `shell: false` removes the shell parser entirely: the text can only ever be `echo`'s single argument, so `; | && $( )` have no special meaning. Scoping note: this control defeats command injection; it is not a claim that the endpoint is "secure" in general.

<a id="os-001-tests"></a>
### Automated tests

- `tests/unit/command.test.mjs`: marker execution, two-command chaining (unsafe); literal echo of metacharacter strings, method/type/length validation (safe).
- `tests/api/lab.api.test.mjs` repeats the pair over HTTP.

---

<a id="fs-001"></a>
## FS-001 · Arbitrary file read

<a id="fs-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/api/vulnerable-file-read.js` |
| Safe control | `pages/api/secure/file-read.js` |
| Endpoint | `POST /api/vulnerable-file-read` |
| Sink | `fs.readFileSync(filePath)` |
| Flow | JSON `filePath` → unrestricted filesystem read |
| Tests | `tests/unit/file-read.test.mjs`; `tests/api/lab.api.test.mjs` |

**Expected finding:** SAST reports path traversal / arbitrary file read (CWE-22): the caller controls the entire path.

[Student guide](#fs-001-student) · [Exploit lab](#fs-001-exploit) · [Vuln vs protected](#fs-001-safe) · [Tests](#fs-001-tests)

<a id="fs-001-student"></a>
### Student guide

```js
const { filePath } = req.body;
const content = fs.readFileSync(filePath, 'utf8');
```

No confinement: relative traversals (`../../…`) and absolute paths both resolve against the server process's permissions, so anything it can read can be exfiltrated.

<a id="fs-001-exploit"></a>
### Exploit lab

Harmless demonstration payload: `{"filePath":"./package.json"}` (shows unrestricted relative reads). The lab deliberately avoids reading sensitive system files — the traversal capability is identical.

**Burp Suite**

1. Capture a `POST /api/vulnerable-file-read` from `/vulnerable/file-read` and send it to Repeater.
2. Try `{"filePath":"./package.json"}` → response contains the lab manifest.
3. Swap the target to `/api/secure/file-read` (right-click → Change request URL or new tab) with `{"file":"../../../etc/passwd"}` → `403 File is not published by this lab.`

**Postman**

1. `POST http://127.0.0.1:3000/api/vulnerable-file-read`, JSON body `{"filePath":"./package.json"}` → file contents.
2. Second tab: `POST http://127.0.0.1:3000/api/secure/file-read`, body `{"file":"../../../etc/passwd"}` → 403; body `{"file":"package.json"}` → 200 with contents.

**curl**

```bash
curl -s http://127.0.0.1:3000/api/vulnerable-file-read \
  -H 'Content-Type: application/json' -d '{"filePath":"./package.json"}'
# → manifest contents

curl -s -w '\n%{http_code}\n' http://127.0.0.1:3000/api/secure/file-read \
  -H 'Content-Type: application/json' -d '{"file":"../../../etc/passwd"}'
# → 403 {"error":"File is not published by this lab."}
```

**Observation that proves exploitation:** arbitrary server-readable content returned (unsafe) vs 403 before any I/O (safe).

<a id="fs-001-safe"></a>
### Vulnerable vs protected — and why

| | Vulnerable | Protected |
| --- | --- | --- |
| Route | `POST /api/vulnerable-file-read` | `POST /api/secure/file-read` |
| Source | `pages/api/vulnerable-file-read.js` | `pages/api/secure/file-read.js` |
| Mechanism | `readFileSync(userPath)` | exact-string allowlist (`package.json`, `README.md`) → `readFile(join(cwd, file))` |
| Traversal payload → | file contents | `403` — never reaches the filesystem |

**Why the control works:** user input never *joins* a path. The allowlist is compared as whole strings, so `../` sequences, absolute paths, trailing slashes, and partial names fail the lookup before any I/O — there is no normalization step to trick. (A prefix/`startsWith` check would *not* be safe; `path.normalize` alone would *not* be safe against absolute paths. Exact set membership is.)

<a id="fs-001-tests"></a>
### Automated tests

- `tests/unit/file-read.test.mjs`: unsafe reads `./package.json`; safe publishes exactly the allowlist and rejects traversal/absolute/partial/malformed inputs.
- `tests/api/lab.api.test.mjs` repeats the pair over HTTP.
