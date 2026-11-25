import { test, expect } from '@playwright/test';

// Signs in from the page itself, then asks what page script can see. Values are
// synthetic session tokens of the in-memory lab.
const credentials = { username: 'alice', password: 'alice-lab-only' };
async function signInAndReadCookies(page, endpoint) {
  await page.goto('/cookies/script-readable');
  return page.evaluate(async ({ url, body }) => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, cookies: document.cookie };
  }, { url: endpoint, body: credentials });
}

for (const [id, slug, name] of [['COOKIE-001', 'script-readable', 'lab_sid_readable'], ['COOKIE-003', 'misleading-name', 'ui_prefs'],
  ['COOKIE-005', 'overridden-options', 'lab_sid_order'], ['COOKIE-006', 'attribute-in-name', 'lab_HttpOnly_sid']]) {
  test(`${id}: page script reads the session token`, async ({ page }) => {
    const result = await signInAndReadCookies(page, `/api/cookies/unsafe/${slug}`);
    expect(result.status).toBe(200);
    expect(result.cookies).toMatch(new RegExp(`${name}=[0-9a-f]{48}`));
  });
}

for (const [slug, name] of [['session', 'lab_sid_safe'], ['overridden-options', 'lab_sid_order_safe'], ['lowercase-attributes', 'lab_sid_lower'], ['composed-attributes', 'lab_sid_composed'], ['replaced-header', 'lab_sid_final']]) {
  test(`safe control ${slug}: the same sign-in leaves nothing for page script to read`, async ({ page, context }) => {
    const result = await signInAndReadCookies(page, `/api/cookies/safe/${slug}`);
    expect(result.status).toBe(200);
    expect(result.cookies).not.toContain(name);
    const stored = (await context.cookies()).find((cookie) => cookie.name === name);
    expect(stored?.httpOnly, 'the browser did store the cookie').toBe(true);
  });
}
