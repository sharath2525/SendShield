import { chromium } from 'playwright';
const browser = await chromium.launch();
const findings = [];
for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const route of ['/', '/app', '/contacts', '/activity', '/learn']) {
    const response = await page.goto(`https://send-shield-solana.vercel.app${route}`, { waitUntil: 'networkidle' });
    const headers = response.headers();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    findings.push({ route, width, status: response.status(), overflow, framePolicy: headers['x-frame-options'], contentTypePolicy: headers['x-content-type-options'] });
  }
  findings.push({ width, browserErrors: errors });
  await page.close();
}
console.log(JSON.stringify({ testedAt: new Date().toISOString(), existingProductionOnly: true, patchedDeploymentVerified: false, findings }, null, 2));
await browser.close();
if (findings.some(r => r.status >= 400 || r.overflow || r.browserErrors?.length)) process.exitCode = 1;
