import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('file:///C:/Users/donth/AppData/Local/Packages/Microsoft.ScreenSketch_8wekyb3d8bbwe/TempState/Recordings/20261108-1513-56.1058267.mp4');
await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
const duration = await page.locator('video').evaluate(v => v.duration);
console.log({ duration });
await mkdir('recording-review', { recursive: true });
for (const fraction of [0.25, 0.5, 0.7, 0.85, 0.95]) {
  await page.locator('video').evaluate((v, t) => { v.pause(); v.currentTime = t; }, duration * fraction);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `recording-review/frame-${fraction}.png` });
}
await browser.close();
