#!/usr/bin/env node
/**
 * iOS-style device simulator + same-origin app proxy.
 *
 * Serves an iPhone-framed, fully interactive view of BOTH apps:
 *   • the Checkstar web app (Next.js on :3000)
 *   • the Checkstar native app (Expo/react-native-web on :8081)
 *
 * Architecture note (the important bit): the phone iframe loads the app
 * THROUGH THIS SERVER (same origin) instead of pointing at another
 * preview host. Everything the app requests resolves same-origin, so
 * X-Frame-Options, frame-ancestors CSP, cross-origin dev-asset blocks and
 * mixed-content rules can never blank the screen again.
 *
 *   /            simulator UI            (deep-link with ?p=/products)
 *   /__home      → web app home ("")
 *   /w/…         → proxied to web app    (strip prefix)
 *   /n/…         → proxied to native app (strip prefix)
 *   everything else → routed by Referer, default: web app (so absolute
 *                      asset paths like /_next/* and /api/* just work)
 *   websocket upgrades are forwarded the same way (dev HMR keeps working).
 *
 *   PORT=5173 node scripts/device-preview.mjs
 */
import { createServer, request as httpRequest } from 'node:http'

const PORT = Number(process.env.PORT || 5173)
const WEB_TARGET = { host: '127.0.0.1', port: Number(process.env.WEB_PORT || 3000) }
const NATIVE_TARGET = { host: '127.0.0.1', port: Number(process.env.NATIVE_PORT || 8081) }

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
  header { width: 100%; max-width: 1080px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; margin-bottom: 14px; }
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
  .offline { padding: 40px 24px; text-align: center; color: #52525b; font: 14px ui-sans-serif, system-ui; }
</style>
</head>
<body>
  <header>
    <div class="brand">Checkstar <em>·</em> iOS device simulator</div>
    <div class="controls">
      <span class="lbl">App</span>
      <button data-target="web" class="active" title="Next.js web app">Website</button>
      <button data-target="native" title="React Native app (Expo web)">Native app</button>
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
  <div class="footer">Same-origin live proxy — the app cannot be blocked from rendering · <span class="url" id="url"></span></div>
<script>
  var DEVICES = ${JSON.stringify(DEVICES)};
  var params = new URLSearchParams(location.search);
  var path = params.get('p') || '/';
  var target = params.get('t') === 'native' ? 'native' : 'web';

  var device = document.getElementById('device');
  var screen = document.getElementById('screen');
  var iframe = document.getElementById('app');
  var island = document.getElementById('island');
  var notch = document.getElementById('notch');
  var urlLabel = document.getElementById('url');

  var current = DEVICES[1]; // iPhone 14 Pro
  var landscape = false;

  function frameSrc() {
    if (target === 'native') return '/n' + (path === '/' ? '/__home' : path);
    return path === '/' ? '/__home' : path;
  }
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
    var tabs = document.querySelectorAll('[data-target]');
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.toggle('active', tabs[j].getAttribute('data-target') === target);
    }
    document.getElementById('direct').href = frameSrc();
    urlLabel.textContent = target === 'native' ? 'React Native app · Expo web' : 'Web app · same-origin proxy';
    fit();
    iframe.src = frameSrc();
  }
  var deviceButtons = document.querySelectorAll('[data-device]');
  for (var k = 0; k < deviceButtons.length; k++) {
    (function (b) {
      b.addEventListener('click', function () {
        current = DEVICES.filter(function (d) { return d.id === b.getAttribute('data-device'); })[0];
        landscape = false;
        apply();
      });
    })(deviceButtons[k]);
  }
  var tabButtons = document.querySelectorAll('[data-target]');
  for (var m = 0; m < tabButtons.length; m++) {
    (function (b) {
      b.addEventListener('click', function () {
        target = b.getAttribute('data-target');
        apply();
      });
    })(tabButtons[m]);
  }
  document.getElementById('rotate').addEventListener('click', function () { landscape = !landscape; fit(); iframe.style.width = dims().w + 'px'; iframe.style.height = dims().hh + 'px'; });
  document.getElementById('reload').addEventListener('click', function () { iframe.src = frameSrc(); });
  window.addEventListener('resize', fit);
  apply();
</script>
</body>
</html>`

// ── reverse proxy ──────────────────────────────────────────────────────────
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length',
])
const FRAMING_BLOCKERS = new Set(['x-frame-options', 'content-security-policy'])

function proxy(req, res, target, prefixToStrip) {
  let path = req.url
  if (prefixToStrip) {
    path = path.slice(prefixToStrip.length) || '/'
  }
  if (path === '/__home') path = '/'

  const headers = { ...req.headers }
  headers.host = `${target.host}:${target.port}`
  const upstream = httpRequest(
    { host: target.host, port: target.port, method: req.method, path, headers },
    (upRes) => {
      const out = {}
      for (const [key, value] of Object.entries(upRes.headers)) {
        if (HOP_BY_HOP.has(key) || FRAMING_BLOCKERS.has(key)) continue
        out[key] = value
      }
      res.writeHead(upRes.statusCode || 502, out)
      upRes.pipe(res)
    }
  )
  upstream.on('error', (error) => {
    res.writeHead(502, { 'content-type': 'text/html; charset=utf-8' })
    res.end(
      `<!doctype html><div class="offline"><h2>⏳ ${target.port === NATIVE_TARGET.port ? 'Native app' : 'Web app'} is starting…</h2><p>Upstream ${target.host}:${target.port} — ${error.message}</p><script>setTimeout(function(){location.reload()},3000)</script></div>`
    )
  })
  req.pipe(upstream)
}

function route(req) {
  const url = new URL(req.url, 'http://sim')
  const pathname = url.pathname

  if (pathname === '/healthz') return { kind: 'health' }
  // The simulator UI owns "/" — with ANY query string (?t=native, ?p=…).
  // Falling through would serve the web app in place of the simulator.
  if (pathname === '/' || pathname === '/__sim') return { kind: 'simulator' }

  if (pathname === '/n' || pathname.startsWith('/n/')) {
    return { kind: 'proxy', target: NATIVE_TARGET, strip: '/n' }
  }
  if (pathname.startsWith('/w/')) {
    return { kind: 'proxy', target: WEB_TARGET, strip: '/w' }
  }

  // Referer-based routing: absolute asset paths from the native app
  // (/assets/..., /node_modules/...) arrive unprefixed.
  const referer = req.headers.referer
  if (referer) {
    try {
      const refPath = new URL(referer).pathname
      if (refPath === '/n' || refPath.startsWith('/n/')) {
        // The native app calls the API same-origin (/api/...) — serve it
        // straight from the API server rather than Metro (which has no /api).
        if (pathname.startsWith('/api/')) {
          return { kind: 'proxy', target: { host: '127.0.0.1', port: 8000 }, strip: null }
        }
        return { kind: 'proxy', target: NATIVE_TARGET, strip: null }
      }
    } catch { /* malformed referer — fall through */ }
  }

  // Native client-side routes arrive unprefixed after history pushes
  // (e.g. /Onboarding). All web routes are lowercase, so a leading
  // uppercase segment unambiguously belongs to the native app.
  if (/^\/[A-Z]/.test(pathname)) {
    return { kind: 'proxy', target: NATIVE_TARGET, strip: null }
  }

  return { kind: 'proxy', target: WEB_TARGET, strip: null }
}

const server = createServer((req, res) => {
  const route_ = route(req)
  if (route_.kind === 'health') {
    res.writeHead(200)
    res.end('ok')
    return
  }
  if (route_.kind === 'simulator') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }
  proxy(req, res, route_.target, route_.strip)
})

// Dev HMR websockets: forward by the same rules. Every socket gets an
// error handler — an unhandled 'error' (e.g. ECONNRESET from HMR churn)
// would otherwise take the whole simulator down.
server.on('upgrade', (req, socket, head) => {
  const route_ = route(req)
  if (route_.kind !== 'proxy') {
    socket.destroy()
    return
  }
  const target = route_.target
  let path = req.url
  if (route_.strip) path = path.slice(route_.strip.length) || '/'
  socket.on('error', () => socket.destroy())
  const upstream = httpRequest({
    host: target.host,
    port: target.port,
    method: req.method,
    path,
    headers: { ...req.headers, host: `${target.host}:${target.port}` },
  })
  upstream.on('upgrade', (upRes, upSocket, upHead) => {
    upSocket.on('error', () => { upSocket.destroy(); socket.destroy() })
    socket.on('close', () => upSocket.destroy())
    upSocket.on('close', () => socket.destroy())
    // A 101 response MUST carry Upgrade/Connection; everything else
    // hop-by-hop is dropped.
    const lines = ['HTTP/1.1 101 Switching Protocols']
    for (const [key, value] of Object.entries(upRes.headers)) {
      const k = key.toLowerCase()
      if (k === 'upgrade' || k === 'connection') {
        lines.push(`${key}: ${value}`)
        continue
      }
      if (!HOP_BY_HOP.has(key)) lines.push(`${key}: ${value}`)
    }
    socket.write(lines.join('\r\n') + '\r\n\r\n')
    if (upHead && upHead.length) upSocket.write(upHead)
    upSocket.pipe(socket)
    socket.pipe(upSocket)
  })
  upstream.on('error', () => socket.destroy())
  upstream.end(head)
})

// Last-resort guard for a long-lived dev service: log and keep serving
// rather than dying between turns.
process.on('uncaughtException', (error) => {
  console.error('[simulator] uncaught exception (kept alive):', error.message)
})
process.on('unhandledRejection', (error) => {
  console.error('[simulator] unhandled rejection (kept alive):', error)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`iOS device simulator on http://localhost:${PORT} · web→${WEB_TARGET.port} · native→${NATIVE_TARGET.port}`)
})
