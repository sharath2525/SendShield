import { chromium } from 'playwright';
const browser = await chromium.launch();
const findings = [];
const baseUrl = process.env.SENDSHIELD_SMOKE_URL ?? 'https://send-shield-solana.vercel.app';
for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const route of ['/', '/app', '/contacts', '/activity', '/learn', '/prove', '/request']) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    const headers = response.headers();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    findings.push({ route, width, status: response.status(), overflow, commit: headers['x-sendshield-commit'], framePolicy: headers['x-frame-options'], contentTypePolicy: headers['x-content-type-options'] });
  }
  findings.push({ width, browserErrors: errors });
  await page.close();
}
console.log(JSON.stringify({ testedAt: new Date().toISOString(), baseUrl, findings }, null, 2));
await browser.close();
if (findings.some(r => r.status >= 400 || r.overflow || r.browserErrors?.length || (r.route && (r.framePolicy !== 'DENY' || r.contentTypePolicy !== 'nosniff' || (process.argv[2] && r.commit !== process.argv[2]))))) process.exitCode = 1;
