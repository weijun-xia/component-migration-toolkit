// 语义采集：按 journey 用角色/名称定位驱动页面，抓 a11y 树(ariaSnapshot) + 网络请求 + 交互成败 + 控制台错误。
// 用法: node capture-semantic.mjs <html或URL> <label>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { journey } from './journey.mjs';

const target = process.argv[2];
const label = process.argv[3] || 'old';
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;

const locator = (page, s) => (s.by === 'label' ? page.getByLabel(s.name) : page.getByRole(s.role, { name: s.name }));
const describe = (s) => `${s.type} ${s.role || s.by} "${s.name || s.label || ''}"${s.nth != null ? '#' + s.nth : ''}`;

async function run() {
  // 默认用 Playwright 内置 chromium（先 npx playwright install chromium）。
  // 想用系统已装浏览器：设 PW_CHANNEL=chrome / msedge。
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const network = new Set();
  page.on('request', (r) => { try { network.add(new URL(r.url()).pathname); } catch {} });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  await page.goto(url, { waitUntil: 'load' });
  const steps = [];
  const snapshots = {};
  for (const s of journey) {
    let ok = true, err = null;
    try {
      if (s.type === 'fill') await locator(page, s).fill(s.value, { timeout: 4000 });
      else if (s.type === 'click') { let l = locator(page, s); if (s.nth != null) l = l.nth(s.nth); await l.click({ timeout: 4000 }); }
      else if (s.type === 'expect') await locator(page, s).first().waitFor({ state: 'visible', timeout: 4000 });
      else if (s.type === 'snapshot') snapshots[s.label] = await page.locator('body').ariaSnapshot();
    } catch (e) { ok = false; err = (e.message || '').split('\n')[0]; }
    steps.push({ step: describe(s), ok, err });
    await page.waitForTimeout(120);
  }
  const apiNet = [...network].filter((p) => p.startsWith('/api')).sort();
  fs.writeFileSync(`${label}.json`, JSON.stringify({ label, url, steps, snapshots, network: apiNet, consoleErrors }, null, 2));
  console.log(`[capture:${label}] 步骤 ${steps.length}(失败 ${steps.filter((s) => !s.ok).length}) · 快照 ${Object.keys(snapshots).length} · api请求 ${apiNet.length} · 控制台错误 ${consoleErrors.length}`);
  await browser.close();
}
run().catch((e) => { console.error(e); process.exit(1); });
