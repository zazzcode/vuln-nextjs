# Cross-site scripting scenarios (CWE-79)

Both scenarios render attacker-controlled strings as raw HTML through `dangerouslySetInnerHTML`. Each has a safe counterpart page that renders the **identical payload** as a React text node. Browser tests execute the payloads in a real browser and assert the difference.

Payload shape note: markup inserted via `innerHTML` does not run `<script>` elements, but event-handler attributes fire normally — so the lab sample uses an image error handler as its harmless marker:

```html
<img src=x onerror="window.__zazzlesXss='reflected-marker'">
```

---

## XSS-001 · Reflected XSS

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/reflected.js` |
| Safe control | `pages/xss/safe/reflected.js` |
| Route | `/xss/unsafe/reflected?payload=...` vs `/xss/safe/reflected?payload=...` |
| Data flow | `query.payload` → `getServerSideProps` → `dangerouslySetInnerHTML` |
| Runtime | browser (markup served in SSR HTML, executes on load) |
| Expected finding | SAST: unsafe raw HTML rendering of user input, CWE-79 |

### The flaw

```jsx
<div id="xss-output" className="xss-output" dangerouslySetInnerHTML={{ __html: payload }} />
```

The query parameter is emitted as raw HTML, so event handlers in the URL execute in the browser of whoever follows the link — a single-request, link-shareable attack.

### Exploit it

With the server running on `127.0.0.1:3000`, open:

```
http://127.0.0.1:3000/xss/unsafe/reflected?payload=%3Cimg%20src%3Dx%20onerror%3D%22window.__zazzlesXss%3D%27reflected-marker%27%22%3E
```

(URL-decoded: `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`.)

Then check the JavaScript console:

```js
window.__zazzlesXss   // → 'reflected-marker'   (the payload executed)
```

The page also provides a textarea plus a **Load XSS sample** button that submits this payload through the normal form.

### Safe control

`pages/xss/safe/reflected.js` renders the same prop as a React text node:

```jsx
<div id="xss-output" className="xss-output">{payload}</div>
```

Open the same URL on `/xss/safe/reflected`: the payload is **displayed as literal text**, and `window.__zazzlesXss` stays `undefined`. React escapes text content, so no sanitizer is required — untrusted text is never parsed as HTML.

### Tests

- `tests/browser/xss.browser.test.mjs`: loads both URLs in Chromium; asserts the marker property is set on the unsafe page and remains undefined on the safe page with the payload visible as text.
- `scripts/test-http.mjs`: asserts the SSR HTML contains the raw `<img ...>` markup on the unsafe route and the escaped `&lt;img` text on the safe route.

---

## XSS-002 · Stored XSS

| Field | Value |
| --- | --- |
| Source | `pages/xss/unsafe/stored.js` |
| Safe control | `pages/xss/safe/stored.js` |
| Route | `/xss/unsafe/stored` vs `/xss/safe/stored` |
| Data flow | note `body` → parameterized INSERT → `GET /api/sql/safe/notes` → `dangerouslySetInnerHTML` per note |
| Runtime | browser (executes for every visitor of the list) |
| Expected finding | SAST: unsafe raw HTML rendering of stored data, CWE-79 |

### The flaw

Storage is **not** the flaw here — notes are written through the parameterized endpoint from SQL-003. Rendering is:

```jsx
{notes.map((note) => (
  <div key={note.id} className="xss-output note" dangerouslySetInnerHTML={{ __html: note.body }} />
))}
```

A payload saved once executes for every visitor who loads the list — the classic stored/XSS-of-second-order shape.

### Exploit it

Save the payload (the page's **Load XSS sample** button fills the same string):

```bash
curl -s http://127.0.0.1:3000/api/sql/safe/notes \
  -H 'Content-Type: application/json' \
  -d '{"body":"<img src=x onerror=\"window.__zazzlesXss='"'"'stored-marker'"'"'\">"}'
```

Open `http://127.0.0.1:3000/xss/unsafe/stored` and check the console:

```js
window.__zazzlesXss   // → 'stored-marker'
```

Restore the seed data afterwards with `POST /api/lab/reset` (also available as a button on the page).

### Safe control

`pages/xss/safe/stored.js` uses the identical storage and identical fetch, but renders each body as text:

```jsx
{notes.map((note) => <div key={note.id} className="xss-output note">{note.body}</div>)}
```

Open `/xss/safe/stored` after storing the same payload: the markup is visible as text for every visitor and `window.__zazzlesXss` stays `undefined`.

### Tests

- `tests/browser/xss.browser.test.mjs`: resets the lab, stores the payload through the real API, then asserts marker execution on `/xss/unsafe/stored` and non-execution with visible text on `/xss/safe/stored`.
- `scripts/test-http.mjs`: both stored pages return 200 and their SSR output differs exactly in raw vs escaped note markup.
