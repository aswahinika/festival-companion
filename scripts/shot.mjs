// Dev-only: capture a true mobile screenshot via Chrome DevTools Protocol with
// real device emulation, and report whether the page overflows horizontally.
// Usage: node scripts/shot.mjs <url> <outfile> [width] [height] [dpr] [mobile]
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const [url, out, w = '390', h = '844', dpr = '2', mobile = '1'] =
  process.argv.slice(2);
const width = Number(w),
  height = Number(h);

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9223;

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.env.TEMP + '/fc-chrome-shot',
  'about:blank',
]);

async function cdpTargets() {
  const res = await fetch(`http://localhost:${PORT}/json/list`);
  return res.json();
}

// wait for devtools
let pageWs;
for (let i = 0; i < 50; i++) {
  try {
    const targets = await cdpTargets();
    const page = targets.find((t) => t.type === 'page');
    if (page) {
      pageWs = page.webSocketDebuggerUrl;
      break;
    }
  } catch {
    /* not up yet */
  }
  await sleep(200);
}
if (!pageWs) throw new Error('DevTools not reachable');

const ws = new WebSocket(pageWs);
let id = 0;
const pending = new Map();
const eventWaiters = [];

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  } else if (msg.method) {
    for (let i = eventWaiters.length - 1; i >= 0; i--) {
      if (eventWaiters[i].method === msg.method) {
        eventWaiters[i].resolve(msg.params);
        eventWaiters.splice(i, 1);
      }
    }
  }
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const myId = ++id;
    pending.set(myId, resolve);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
}
function waitEvent(method) {
  return new Promise((resolve) => eventWaiters.push({ method, resolve }));
}

await new Promise((r) => ws.addEventListener('open', r));

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: Number(dpr),
  mobile: mobile === '1',
});

const loaded = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url });
await loaded;
await sleep(1500); // let fetch + render settle

const check = await send('Runtime.evaluate', {
  expression: `JSON.stringify({
    innerWidth: window.innerWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    title: document.querySelector('h2.festival-title')?.textContent || null
  })`,
  returnByValue: true,
});
console.log('layout:', check.result.value);

const metrics = await send('Page.getLayoutMetrics');
const cw = Math.ceil(metrics.cssContentSize.width);
const ch = Math.ceil(metrics.cssContentSize.height);

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: cw, height: ch, scale: 1 },
});
await writeFile(out, Buffer.from(shot.data, 'base64'));
console.log(`wrote ${out} (${cw}x${ch})`);

ws.close();
chrome.kill();
process.exit(0);
