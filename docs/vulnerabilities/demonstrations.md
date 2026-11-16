# Module: Demonstrations (negative controls — no expected findings)

These pages exist to correct misconceptions from the upstream project's original documentation. They implement **no exploitable sink**; a SAST tool scanning them should report nothing. The catalog marks them `status: "demonstration"`, `expectedFinding: false` — they are negative controls against scanner noise.

## Contents

| Scenario | Agent ref | Student guide | Try it |
| --- | --- | --- | --- |
| [DEMO-001 · Header reflection](#demo-001) | [expected finding](#demo-001-agent) | [guide](#demo-001-student) | [steps](#demo-001-exploit) |
| [DEMO-002 · Dynamic import](#demo-002) | [expected finding](#demo-002-agent) | [guide](#demo-002-student) | [steps](#demo-002-exploit) |

---

<a id="demo-001"></a>
## DEMO-001 · Request header reflection

<a id="demo-001-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/header-injection.js` |
| Route | `/vulnerable/header-injection` |
| Flow | request headers → React text output (auto-escaped) |

**Expected finding: none.** If your tool flags this page, that is a false positive worth investigating (usually an over-broad taint rule treating any reflection as a sink).

<a id="demo-001-student"></a>
### Student guide

The page echoes selected request headers into the page body as React text nodes, which React escapes — so this is not XSS, and no command/SQL sink consumes the values. The upstream README once claimed a header-injection CVE here; there was none. Reflection alone is not a vulnerability; a **sink** that re-interprets the reflected data is.

<a id="demo-001-exploit"></a>
### Try it

```bash
curl -s http://127.0.0.1:3000/vulnerable/header-injection -H 'X-Lab-Note: harmless'
```

The header value appears in the page as escaped text.

---

<a id="demo-002"></a>
## DEMO-002 · Dynamic import explanation

<a id="demo-002-agent"></a>
### Agent reference — expected finding

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/dynamic-import.js` |
| Route | `/vulnerable/dynamic-import` |
| Flow | none — displayed explanation only |

**Expected finding: none.** A finding here would be a false positive on dead/displayed code.

<a id="demo-002-student"></a>
### Student guide

The page displays and explains a snippet about dynamic `import()`; no dynamic loader runs and no user input reaches module resolution. The upstream version pointed at a missing components directory and claimed arbitrary server filesystem access / RCE; the claim was inaccurate, so the lab keeps the explanation without the broken import.

<a id="demo-002-exploit"></a>
### Try it

Open `http://127.0.0.1:3000/vulnerable/dynamic-import` — static explanatory content only.
