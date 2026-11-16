# Demonstrations (not expected findings)

These pages exist to correct misconceptions from the upstream project's original documentation. They implement **no exploitable sink**; a SAST tool scanning them should report nothing. The catalog marks them `status: "demonstration"`, `expectedFinding: false` — they are negative controls against scanner noise.

---

## DEMO-001 · Request header reflection

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/header-injection.js` |
| Route | `/vulnerable/header-injection` |
| Data flow | request headers → React text output (auto-escaped) |

### What it shows

The page echoes selected request headers into the page body. Reflected *header names and values* appear as text, and React escapes text content — so this is not XSS, and no command/SQL sink consumes the values. The upstream README once claimed a header-injection CVE here; there was none.

### What a scanner should do

Report nothing. If your tool flags this page, that is a false positive worth investigating (usually an over-broad taint rule treating any reflection as a sink).

### Try it

```bash
curl -s http://127.0.0.1:3000/vulnerable/header-injection -H 'X-Lab-Note: harmless'
```

The header value appears in the page as escaped text.

---

## DEMO-002 · Dynamic import explanation

| Field | Value |
| --- | --- |
| Source | `pages/vulnerable/dynamic-import.js` |
| Route | `/vulnerable/dynamic-import` |
| Data flow | none — displayed explanation only |

### What it shows

The page displays and explains a code snippet about dynamic `import()`; no dynamic loader runs and no user input reaches module resolution. The upstream version pointed at a missing components directory and claimed arbitrary server filesystem access / RCE; the claim was inaccurate, so the lab keeps the explanation without the broken import.

### What a scanner should do

Report nothing. A finding here would be a false positive on dead/displayed code.
