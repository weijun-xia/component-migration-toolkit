// 状态矩阵采集：单浏览器串行，遍历 路由 × 元素 × 交互态，逐态驱动并记录几何/样式/是否打开。
// 用法: node capture-matrix.mjs <before|after> [config.mjs]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const variant = process.argv[2] || 'before';
const configPath = process.argv[3] || './matrix.config.mjs';
const { ROUTES, VIEWPORT, STYLE_PROPS } = await import(pathToFileURL(path.resolve(configPath)).href);

async function measure(page, selector, visibleOnly = false) {
  return await page.evaluate(({ sel, props, visibleOnly }) => {
    const els = [...document.querySelectorAll(sel)];
    const isVis = (e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0; };
    const el = visibleOnly ? (els.find(isVis) || null) : (els[0] || null);
    if (!el) return { present: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const style = {};
    props.forEach((p) => { style[p] = cs[p]; });
    return {
      present: true,
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      style,
      cls: typeof el.className === 'string' ? el.className : ''
    };
  }, { sel: selector, props: STYLE_PROPS, visibleOnly });
}

async function isVisible(page, selector) {
  return await page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].some((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0;
    });
  }, selector);
}

async function reset(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.mouse.click(3, 3);
  await page.waitForTimeout(180);
}

async function driveAndMeasure(page, target, state) {
  await reset(page);
  const sel = target.selector;
  if (state.kind === 'default' || state.kind === 'disabled') {
    return { measure: await measure(page, sel) };
  }
  if (state.kind === 'hover') {
    await page.hover(sel, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(160);
    return { measure: await measure(page, sel) };
  }
  if (state.kind === 'focus') {
    await page.locator(sel).first().focus({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(160);
    return { measure: await measure(page, sel) };
  }
  if (state.kind === 'open') {
    await page.click(state.trigger, { force: true, timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    const opened = await isVisible(page, state.panel);
    const m = await measure(page, state.panel, true);
    await reset(page);
    return { measure: m, opened };
  }
  return { measure: { present: false } };
}

async function run() {
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const archive = { variant, capturedAt: new Date().toISOString(), routes: {} };

  for (const route of ROUTES) {
    const file = variant === 'before' ? route.before : route.after;
    const url = pathToFileURL(path.resolve(file)).href;
    const consoleErrors = [];
    const onErr = (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); };
    const onPageErr = (e) => consoleErrors.push('pageerror: ' + e.message);
    page.on('console', onErr);
    page.on('pageerror', onPageErr);

    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector(route.ready, { timeout: 20000 });
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
    await page.waitForTimeout(500);

    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/matrix-${variant}-${route.id}.png`, fullPage: true });

    const targets = {};
    for (const target of route.targets) {
      const states = {};
      for (const state of target.states) {
        states[state.kind] = await driveAndMeasure(page, target, state);
      }
      targets[target.id] = { states };
    }
    archive.routes[route.id] = { url, consoleErrors, targets };

    page.off('console', onErr);
    page.off('pageerror', onPageErr);
    const stateCount = route.targets.reduce((n, t) => n + t.states.length, 0);
    console.log(`[capture:${variant}] 路由=${route.name} 元素=${route.targets.length} 态数=${stateCount} 控制台错误=${consoleErrors.length}`);
  }

  fs.writeFileSync(`matrix-${variant}.json`, JSON.stringify(archive, null, 2));
  console.log(`  -> matrix-${variant}.json`);
  await browser.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
