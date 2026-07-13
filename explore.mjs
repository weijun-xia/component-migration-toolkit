// 发现工具：打印某个页面的 a11y 语义树（role + 名称），用来照抄进 journey.mjs，免得猜名字。
// 用法: node explore.mjs <html文件或 http地址>
// 例:   node explore.mjs http://旧版地址/login
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const target = process.argv[2];
if (!target) { console.error('用法: node explore.mjs <html文件或 http地址>'); process.exit(1); }
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;

const b = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}); // 默认内置 chromium；PW_CHANNEL=chrome/msedge 走系统浏览器
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(800);
console.log('===== a11y 语义树（把下面的 role + "名称" 照抄进 journey.mjs）=====\n');
console.log(await p.locator('body').ariaSnapshot());
await b.close();

// 说明：
// - 登录页直接跑本工具，就能看到 textbox "用户名" / button "登录" 这类真实名称。
// - 登录后的页面：先用带登录步骤的 journey 跑一次 capture-semantic，它输出的 JSON 里 snapshots 就是登录后各检查点的语义树，同样照抄。
