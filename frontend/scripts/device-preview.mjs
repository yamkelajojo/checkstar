#!/usr/bin/env node
/**
 * iOS-style device simulator for the Checkstar web app.
 *
 * Serves an iPhone-framed, fully interactive live view of the site running on
 * :3000 so the mobile experience can be checked on demand from any browser —
 * no physical phone needed. (This is a Linux sandbox, so the Xcode Simulator
 * itself cannot run here; this is the faithful browser-based equivalent, and
 * the automated E2E suite additionally emulates real iPhone UA/touch/DPR.)
 *
 *   npm run preview:mobile        -> http://localhost:5173
 *   PORT=5173 node scripts/device-preview.mjs
 *   Deep-link the app:  http://localhost:5173/?p=/products
 *
 * Behind the Arena preview proxy the page auto-resolves the app origin from
 * the proxied hostname (…-5173-<sandbox>.e2b.app -> 3000-<sandbox>.e2b.app).
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 5173)

const DEVICES = [
  { id: 'se', label: 'SE', name: 'iPhone SE', w: 375, h: 667, notch: false },
  { id: 'pro', label: '14 Pro', name: 'iPhone 14 Pro', w: 393, h: 852, notch: true },
  { id: 'max', label: '15 Pro Max', name: 'iPhone 15 Pro Max', w: 430, h: 932, notch: true },
]

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Checkstar · iOS device simulator</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center;
    background: radial-gradient(1200px 600px at 50% -10%, rgba(249,115,22,.12), transparent 60%), #09090b;
    color: #fafafa; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
    padding: 18px 12px 28px;
  }
  header { width: 100%; max-width: 980px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .brand { font-weight: 700; font-size: 15px; letter-spacing: .2px; }
  .brand em { color: #f97316; font-style: normal; }
  .controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .controls .lbl { font-size: 12px; color: #71717a; }
  button, a.btn {
    appearance: none; border: 1px solid #27272a; background: #18181b; color: #e4e4e7;
    font: inherit; font-size: 12.5px; padding: 6px 12px; border-radius: 999px; cursor: pointer;
    text-decoration: none; transition: border-color .15s, color .15s, background .15s;
  }
  button:hover, a.btn:hover { border-color: #f97316; color: #fdba74; }
  button.active { background: #f97316; border-color: #f97316; color: #fff; font-weight: 600; }
  .stage { flex: 1; display: flex; align-items: flex-start; justify-content: center; }
  .device {
    background: #1c1c1f; padding: 10px; border-radius: 54px;
    box-shadow: 0 0 0 2px #3f3f46, 0 30px 80px rgba(0,0,0,.55), inset 0 0 6px rgba(255,255,255,.06);
    transform-origin: top center;
  }
  .screen { position: relative; border-radius: 44px; overflow: hidden; background: #fff; }
  .statusbar {
    height: 44px; background: #fff; display: flex; align-items: center; justify-content: space-between;
    padding: 0 22px 0 28px; font-size: 13px; font-weight: 600; color: #0a0a0a; position: relative;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  .island { position: absolute; left: 50%; top: 9px; transform: translateX(-50%); width: 108px; height: 26px; background: #0a0a0a; border-radius: 999px; }
  .notch { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 150px; height: 24px; background: #0a0a0a; border-radius: 0 0 18px 18px; }
  .statusbar .right { display: flex; align-items: center; gap: 6px; }
  .signal { display: inline-flex; align-items: flex-end; gap: 1.5px; }
  .signal i { width: 3px; background: #0a0a0a; border-radius: 1px; display: inline-block; }
  .battery { width: 22px; height: 11px; border: 1.5px solid rgba(10,10,10,.5); border-radius: 3.5px; padding: 1.5px; position: relative; }
  .battery::before { content: ''; display: block; height: 100%; width: 75%; background: #0a0a0a; border-radius: 1.5px; }
  .battery::after { content: ''; position: absolute; right: -4px; top: 3px; width: 2px; height: 5px; background: rgba(10,10,10,.5); border-radius: 0 2px 2px 0; }
  iframe { border: 0; display: block; background: #fff; }
  .home { position: absolute; left: 50%; bottom: 7px; transform: translateX(-50%); width: 34%; height: 5px; border-radius: 999px; background: rgba(10,10,10,.85); pointer-events: none; }
  .footer { margin-top: 16px; color: #71717a; font-size: 12px; text-align: center; }
  .url { color: #a1a1aa; }
</style>
</head>
<body>
  <header>
    <div class="brand">Checkstar <em>·</em> iOS device simulator</div>
    <div class="controls">
      <span class="lbl">Device</span>
      ${DEVICES.map((d) => `<button data-device="${d.id}" title="${d.name}">${d.label}</button>`).join('')}
      <button id="rotate" title="Rotate">⟳ Rotate</button>
      <button id="reload" title="Reload app">↻ Reload</button>
      <a class="btn" id="direct" target="_blank" rel="noreferrer">Open app ↗</a>
    </div>
  </header>
  <div class="stage"><div class="device" id="device"><div class="screen" id="screen">
    <div class="statusbar">
      <span>9:41</span>
      <div class="island" id="island" style="display:none"></div>
      <div class="notch" id="notch" style="display:none"></div>
      <span class="right">
        <span class="signal"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i></span>
        <span style="font-size:11px">5G</span>
        <span class="battery"></span>
      </span>
    </div>
    <iframe id="app" title="Checkstar app"></iframe>
    <div class="home"></div>
  </div></div></div>
  <div class="footer">Live app in an iPhone shell · Safari-on-iPhone layout · <span class="url" id="url"></span></div>
<script>
  var DEVICES = ${JSON.stringify(DEVICES)};
  var h = location.hostname;
  var proxied = h.match(/^\\d+-(.+\\.e2b\\.app)$/);
  var APP = proxied ? (location.protocol + '//3000-' + proxied[1]) : (location.protocol + '//' + h + ':3000');
  var initialPath = new URLSearchParams(location.search).get('p') || '/';

  var device = document.getElementById('device');
  var screen = document.getElementById('screen');
  var iframe = document.getElementById('app');
  var island = document.getElementById('island');
  var notch = document.getElementById('notch');
  var urlLabel = document.getElementById('url');

  var current = DEVICES[1]; // iPhone 14 Pro
  var landscape = false;

  function appUrl() { return APP + (initialPath === '/' ? '/' : initialPath); }
  function dims() { return landscape ? { w: current.h, hh: current.w } : { w: current.w, hh: current.h }; }
  function fit() {
    var d = dims();
    var budget = Math.max(320, window.innerHeight - 190);
    var frameH = d.hh + 20 + 44;
    var scale = Math.min(1, budget / frameH);
    device.style.transform = 'scale(' + scale + ')';
    device.style.marginBottom = -(frameH * (1 - scale)) + 'px';
  }
  function apply() {
    var d = dims();
    screen.style.width = d.w + 'px';
    island.style.display = current.notch ? 'block' : 'none';
    notch.style.display = current.notch ? 'block' : 'none';
    iframe.style.width = d.w + 'px';
    iframe.style.height = d.hh + 'px';
    var buttons = document.querySelectorAll('[data-device]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('active', buttons[i].getAttribute('data-device') === current.id);
    }
    urlLabel.textContent = APP;
    document.getElementById('direct').href = appUrl();
    fit();
    if (!iframe.src) iframe.src = appUrl();
  }
  var deviceButtons = document.querySelectorAll('[data-device]');
  for (var j = 0; j < deviceButtons.length; j++) {
    (function (b) {
      b.addEventListener('click', function () {
        current = DEVICES.filter(function (d) { return d.id === b.getAttribute('data-device'); })[0];
        landscape = false;
        apply();
      });
    })(deviceButtons[j]);
  }
  document.getElementById('rotate').addEventListener('click', function () { landscape = !landscape; apply(); });
  document.getElementById('reload').addEventListener('click', function () { iframe.src = appUrl(); });
  window.addEventListener('resize', fit);
  apply();
</script>
</body>
</html>`

const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200)
    res.end('ok')
    return
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(html)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`iOS device simulator ready on http://localhost:${PORT} (targeting app on :3000)`)
})
