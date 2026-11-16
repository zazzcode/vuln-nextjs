import { test, expect } from '@playwright/test';

// Payloads are harmless markers: an image that fails to load and sets a
// window property from its onerror handler. Script elements inserted via
// innerHTML do not execute, event-handler attributes do.
const reflectedPayload = `<img src=x onerror="window.__zazzlesXss='reflected-marker'">`;
const storedPayload = `<img src=x onerror="window.__zazzlesXss='stored-marker'">`;
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
});

test.describe('XSS-002 · stored', () => {
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

test('JS-001 · browser eval injection evaluates the arithmetic payload', async ({ page }) => {
  await page.goto(`/vulnerable/eval-injection?input=${encodeURIComponent("' + (6 * 7) + '")}`);
  await expect(page.locator('pre')).toHaveText('42');
});
