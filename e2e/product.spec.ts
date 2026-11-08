import { test, expect } from '@playwright/test';
const key = 'FVen3X669xLzsi6N2V91DoiyzHzg1uAgqiT8jZ9nS96Z';
test('request round trip preserves manual inspection and review gates', async ({ page }) => {
  await page.goto('/request');
  await page.getByLabel('Full recipient wallet').fill(key);
  await page.getByRole('button', { name:'Create Devnet request link' }).click();
  const link = await page.getByLabel('Copy this shareable link').inputValue();
  await page.goto(link);
  await page.getByRole('button', { name:'Load request for review' }).click();
  await expect(page.getByRole('heading', { name:'Request parsed — verification required' })).toBeVisible();
  await page.getByRole('link', { name:'Continue to Verify & send' }).click();
  await expect(page.getByRole('heading', { name:'Verify first. Send with care.' })).toBeVisible();
  await page.getByRole('button', { name:'Load request for review' }).click();
  await expect(page.getByLabel('Full Solana address')).toHaveValue(key);
  await expect(page.getByLabel('Amount in SOL')).toHaveValue('0.001');
  await expect(page.getByRole('button', { name:'Review payment' })).toBeDisabled();
  await expect(page.getByText('Every address has a story.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('proof page fails closed without wallet and rejects malformed proof', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/prove');
  await expect(page.getByRole('button', { name:'Sign wallet-control proof' })).toBeDisabled();
  await page.getByLabel('Expected full wallet address').fill(key);
  await page.getByLabel('Proof JSON').fill('{}');
  await page.getByRole('button', { name:'Verify exact message & signature' }).click();
  await expect(page.locator('main [role="alert"]')).toBeVisible();
  await expect(page.getByRole('heading', { name:'Key-control signature verified' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('empty request import gives an actionable instruction and generated link opens', async ({ page }) => {
  await page.goto('/request');
  await page.getByRole('button', { name:'Load request for review' }).click();
  await expect(page.locator('main [role="alert"]')).toContainText('Paste the complete generated link first');
  await page.getByLabel('Full recipient wallet').fill(key);
  await page.getByRole('button', { name:'Create Devnet request link' }).click();
  await page.getByRole('link', { name:'Open generated request' }).click();
  await page.getByRole('button', { name:'Load request for review' }).click();
  await expect(page.getByRole('heading', { name:'Request parsed — verification required' })).toBeVisible();
});

// Only the browser's saved history is seeded. Settlement is read from REAL Devnet RPC;
// this is recovery of the owner's already recorded transaction, not a new payment.
test('LIVE recovery rechecks an existing real payment without wallet signing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sendshield:v1', JSON.stringify({ version:1, contacts:[], attempts:[{
    id:'recovery-existing-real-payment', status:'confirmed', cluster:'devnet', lamports:'1000000',
    walletAddress:'2Mkgp89nuhWf7PLZDCwc9H3FGsyNmBnsKR1e43mZHjF2', recipientAddress:'5qnGNxRAhCn3DLP76KVmDCfv1KjRs1iNURZ4YpK2jE6a',
    transactionSignature:'2qNjF9VBhwb8vfe9X2Gbr78vV8ouzMkgdC8KAaaXXquJzKP79BmmXBCMwLmN5AbENhjpVS7xUPvW7upQPeN2uU8K',
    createdAt:'2026-11-08T16:00:00.000Z', updatedAt:'2026-11-08T16:00:00.000Z', slot:'520065222', fee:'5000',
  }] })));
  await page.goto('/app');
  await expect(page.getByRole('heading', { name:'Resolve the earlier payment' })).toBeVisible();
  await page.getByRole('button', { name:'Recheck earlier payments' }).click();
  await expect(page.getByText('Earlier payments reconciled.', { exact:false })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sendshield:v1')!).attempts[0]);
  expect(stored.status).toBe('confirmed'); expect(stored.fee).toBe('5000');
  await expect(page.getByRole('button', { name:'Review payment' })).toBeDisabled();
});
