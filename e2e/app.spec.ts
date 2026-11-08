import { test, expect } from '@playwright/test';
const TEST_KEY = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
test('landing, navigation and responsive layout', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toContainText('Verify the address.');
  await page.getByRole('link', { name: 'Launch SendShield' }).click();
  await expect(page.getByRole('heading', { name: 'Verify first. Send with care.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Review payment' })).toBeDisabled();
  expect(errors).toEqual([]);
});
test('strict invalid input and stale result clearing', async ({ page }) => {
  await page.goto('/app'); await page.getByLabel('Full Solana address').fill('not-an-address');
  await page.getByRole('button', { name: 'Inspect address', exact: true }).click();
  await expect(page.getByText('BLOCKED', { exact: true })).toBeVisible();
  await page.getByLabel('Full Solana address').fill(TEST_KEY);
  await expect(page.getByText('Every address has a story.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review payment' })).toBeDisabled();
});
test('contacts CRUD persists and prevents duplicates', async ({ page }) => {
  await page.goto('/contacts'); await page.getByLabel('Name or alias').fill('Test recipient');
  await page.getByLabel('Full address', { exact: true }).fill(TEST_KEY);
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Save contact', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test recipient', exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Test recipient', exact: true })).toBeVisible();
  await page.getByLabel('Name or alias').fill('Duplicate'); await page.getByLabel('Full address', { exact: true }).fill(TEST_KEY); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Save contact', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'already saved' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click(); await page.getByLabel('Name or alias').fill('Renamed recipient'); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Renamed recipient', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Remove', exact: true }).click(); await page.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(page.getByRole('heading', { name: 'Renamed recipient', exact: true })).toHaveCount(0);
});
test('isolated lookalike simulation and honest empty activity', async ({ page }) => {
  await page.goto('/learn'); await page.getByRole('button', { name: 'Compare simulated addresses' }).click();
  await expect(page.getByText('SIMULATED LOOKALIKE EXAMPLE — NO REAL ON-CHAIN ATTACK DETECTED')).toBeVisible();
  await expect(page.getByText('LOOKALIKE_REVIEW · These are different addresses.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/activity'); await expect(page.getByRole('heading', { name: 'No payments initiated here yet' })).toBeVisible();
});
test('RPC outage fails closed (injected browser network failure)', async ({ page }) => {
  await page.route('https://api.devnet.solana.com/**', route => route.abort());
  await page.goto('/app'); await page.getByRole('button', { name: 'Load wrapped SOL mint' }).click();
  await page.getByRole('button', { name: 'Inspect address', exact: true }).click();
  await expect(page.getByText('CHECK UNAVAILABLE', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review payment' })).toBeDisabled();
});
test('LIVE Devnet mint inspection blocks native SOL, no RPC fixtures', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/app'); await page.getByRole('button', { name: 'Load wrapped SOL mint' }).click();
  await page.getByRole('button', { name: 'Inspect address', exact: true }).click();
  await expect(page.getByText('BLOCKED', { exact: true })).toBeVisible({ timeout: 35_000 });
  await expect(page.getByText('This is a token mint, not a recipient wallet.', { exact: false })).toBeVisible();
  await page.getByText('Raw evidence & RPC source').click();
  await expect(page.getByText('TOKEN_MINT', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review payment' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/live-mint-${test.info().project.name}.png`, fullPage: true });
});
