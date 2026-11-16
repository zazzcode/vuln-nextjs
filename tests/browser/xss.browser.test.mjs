import { test, expect } from '@playwright/test';

// Payloads are harmless markers: an image that fails to load and sets a
// window property from its onerror handler. Script elements inserted via
// innerHTML do not execute; event-handler attributes do.
const reflectedPayload = `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`;
const storedPayload = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
const guestbookPayload = `<img src=x onerror="window.__zazzlesXss='guestbook-marker'">`;
// No double quotes in the payload: JSON.stringify escapes them to \" which
// corrupts the handler after breaking out of the inline script element.
const scriptContextPayload = `</script><img src=x onerror='window.__zazzlesXss=\`script-marker\`'>`;
const reflectedUrl = (mode) => `/xss/${mode}/reflected?payload=${encodeURIComponent(reflectedPayload)}`;

// Generous settle window for the negative assertions: any handler that was
// going to fire has had ample time before we declare non-execution.
const settleMs = 700;

test.describe('XSS-001 · reflected', () => {
  test('unsafe page executes the identical payload', async ({ page }) => {
    await page.goto(reflectedUrl('unsafe'));
    await expect.poll(() => page.evaluate(() => window.__zazzlesXss)).toBe('reflected-marker');
  });

  test('safe page renders the identical payload as inert text', async ({ page }) => {
    await page.goto(reflectedUrl('safe'));
    await page.waitForTimeout(settleMs);
    expect(await page.evaluate(() => window.__zazzlesXss)).toBeUndefined();
    await expect(page.locator('#xss-output')).toContainText('<img');
  });

  test('sanitized page strips the handler and does not execute', async ({ page }) => {
    await page.goto(reflectedUrl('sanitized'));
    await page.waitForTimeout(settleMs);
    expect(await page.evaluate(() => window.__zazzlesXss)).toBeUndefined();
    await expect(page.locator('#xss-output img')).toHaveAttribute('src', 'x');
    await expect(page.locator('#xss-output img')).not.toHaveAttribute('onerror');
  });
});

test.describe('XSS-002 · stored (notes)', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/lab/reset', { data: {} });
  });

  test('unsafe listing executes the stored payload', async ({ request, page }) => {
    await request.post('/api/sql/safe/notes', { data: { body: storedPayload } });
    await page.goto('/xss/unsafe/stored');
    await expect.poll(() => page.evaluate(() => window.__zazzlesXss)).toBe('stored-marker');
  });

  test('safe listing shows the identical stored payload as text', async ({ request, page }) => {
    await request.post('/api/sql/safe/notes', { data: { body: storedPayload } });
    await page.goto('/xss/safe/stored');
    await expect(page.locator('.note').filter({ hasText: '<img' })).toBeVisible();
    await page.waitForTimeout(settleMs);
    expect(await page.evaluate(() => window.__zazzlesXss)).toBeUndefined();
  });
});

test.describe('XSS-003 · script-context injection', () => {
  const url = (mode) => `/xss/${mode}/script-context?data=${encodeURIComponent(scriptContextPayload)}`;

  test('unsafe page breaks out of the inline script and executes', async ({ page }) => {
    await page.goto(url('unsafe'));
    await expect.poll(() => page.evaluate(() => window.__zazzlesXss)).toBe('script-marker');
    expect(await page.evaluate(() => window.__labData)).toBeUndefined(); // script died mid-string
  });

  test('safe page keeps the payload verbatim inside the script, no execution', async ({ page }) => {
    await page.goto(url('safe'));
    await page.waitForTimeout(settleMs);
    expect(await page.evaluate(() => window.__zazzlesXss)).toBeUndefined();
    expect(await page.evaluate(() => window.__labData?.data)).toBe(scriptContextPayload);
  });
});

test.describe('XSS-004 · stored guestbook', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/lab/reset', { data: {} });
  });

  test('unsafe guestbook executes the stored payload for every visitor', async ({ request, page }) => {
    await request.post('/api/xss/comments', { data: { author: 'tester', body: guestbookPayload } });
    await page.goto('/xss/unsafe/comments');
    await expect.poll(() => page.evaluate(() => window.__zazzlesXss)).toBe('guestbook-marker');
  });

  test('sanitized guestbook strips the handler and keeps benign markup', async ({ request, page }) => {
    await request.post('/api/xss/comments', { data: { author: 'tester', body: guestbookPayload } });
    await page.goto('/xss/sanitized/comments');
    await page.waitForTimeout(settleMs);
    expect(await page.evaluate(() => window.__zazzlesXss)).toBeUndefined();
    await expect(page.locator('.comment-body img').last()).toHaveAttribute('src', 'x');
    await expect(page.locator('.comment-body img').last()).not.toHaveAttribute('onerror');
    await expect(page.locator('.comment-body b').first()).toBeVisible(); // seeded benign markup survives
  });
});

test('JS-001 · browser eval injection evaluates the arithmetic payload', async ({ page }) => {
  await page.goto(`/vulnerable/eval-injection?input=${encodeURIComponent("' + (6 * 7) + '")}`);
  await expect(page.locator('pre')).toHaveText('42');
});
