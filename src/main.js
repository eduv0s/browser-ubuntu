import './style.css';

const APP_VERSION = '0.9.4-webvm';
const CHEERPX_VERSION = '1.3.9';
// WebVM official Alpine + i3 graphical image.
// Per https://webvm.io/alpine.html the demo uses this exact URL.
const BASE_IMAGE = 'wss://disks.webvm.io/alpine_20251007.ext2';
const CONSENT_KEY = 'browser-ubuntu-consent';
const IDB_DEVICE_NAME = 'browser-ubuntu-cheerpx-overlay-v1';
const BOOT_COMMAND = '/bin/sh -c "dbus-daemon --system --fork; lightdm"';

const app = document.querySelector('#app');
let linux, overlay, idbDevice;
let consent = localStorage.getItem(CONSENT_KEY);

function home() {
  linux?.close?.();
  linux = overlay = idbDevice = undefined;
  app.innerHTML = `<main class="home"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><section class="welcome"><p class="eyebrow">CHEERPX · LINUX REAL</p><h1>Linux,<br>right here.</h1><p>Linux ejecutándose directamente en tu navegador.</p><div class="home-actions"><button class="start" id="start">Iniciar Linux <span>↗</span></button><button class="restore-home" id="restore" hidden>Continuar sesión</button></div></section><footer>CheerpX · WebAssembly · almacenamiento local</footer><div class="consent" id="consent" hidden><strong>Guardar tu sesión</strong><p>Browser Ubuntu guardará los cambios del filesystem en tu navegador.</p><div><button id="accept">Aceptar</button><button id="reject">Rechazar</button></div></div></main>`;
  const restore = document.querySelector('#restore');
  if (consent === 'accepted') restore.hidden = false;
  document.querySelector('#start').onclick = () => launch();
  restore.onclick = () => launch();
  const banner = document.querySelector('#consent');
  if (!consent) banner.hidden = false;
  document.querySelector('#accept').onclick = () => { consent='accepted'; localStorage.setItem(CONSENT_KEY,consent); banner.hidden=true; restore.hidden=false; };
  document.querySelector('#reject').onclick = () => { consent='rejected'; localStorage.setItem(CONSENT_KEY,consent); banner.hidden=true; };
}

function launch() {
  app.innerHTML = `<main class="vm"><header class="toolbar"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><span class="state" id="state">Iniciando…</span><div class="controls"><button id="fullscreen">Pantalla completa</button><button id="shutdown">Apagar</button></div></header><section class="screen-wrap" id="screen-wrap"><canvas id="display"></canvas><pre id="console" class="console" hidden></pre></section></main>`;
  const display = document.querySelector('#display');
  const consoleElement = document.querySelector('#console');
  const screenWrap = document.querySelector('#screen-wrap');
  const state = document.querySelector('#state');
  consoleElement.focus();
  document.querySelector('#fullscreen').onclick = async () => { const t=document.querySelector('.vm'); if(!document.fullscreenElement) await t.requestFullscreen?.(); else await document.exitFullscreen?.(); };
  document.querySelector('#shutdown').onclick = () => home();
  boot(display, consoleElement, screenWrap, state);
}

function errStr(e) { return e instanceof Error ? `${e.name}: ${e.message}` : String(e); }
function log(el, m) { el.textContent += m + '\n'; if (el.textContent.length > 15000) el.textContent = el.textContent.slice(-15000); }
function setState(el, m) { el.textContent = m; }

async function boot(display, consoleElement, screenWrap, state) {
  consoleElement.hidden = false;
  log(consoleElement, '=== Boot ===');
  try {
    if (!crossOriginIsolated) throw new Error('Necesita COOP/COEP. Recarga con Chrome/Chromium.');

    setState(state, 'Cargando CheerpX…');
    const CheerpX = await import(/* @vite-ignore */ `https://cxrtnc.leaningtech.com/${CHEERPX_VERSION}/cx.esm.js`);
    log(consoleElement, `CheerpX ${CHEERPX_VERSION}`);

    setState(state, 'Conectando imagen Alpine…');
    const cloud = await CheerpX.CloudDevice.create(BASE_IMAGE);
    log(consoleElement, 'CloudDevice OK');

    idbDevice = await CheerpX.IDBDevice.create(IDB_DEVICE_NAME);
    overlay = await CheerpX.OverlayDevice.create(cloud, idbDevice);
    const web = await CheerpX.WebDevice.create('');
    const data = await CheerpX.DataDevice.create('');

    setState(state, 'Iniciando Linux…');
    linux = await CheerpX.Linux.create({
      mounts: [
        { type: 'ext2', dev: overlay, path: '/' },
        { type: 'dir', dev: web, path: '/web' },
        { type: 'dir', dev: data, path: '/data' },
        { type: 'devs', path: '/dev' },
        { type: 'devpts', path: '/dev/pts' },
        { type: 'proc', path: '/proc' },
        { type: 'sys', path: '/sys' },
      ],
      diskImageType: 'cloud',
      diskImageUrl: BASE_IMAGE,
    });
    log(consoleElement, 'Linux OK');

    const resize = () => {
      const w = display.offsetWidth || 1024, h = display.offsetHeight || 768;
      const s = Math.max(1024/w, 768/h, 1);
      linux.setKmsCanvas(display, Math.floor(w*s), Math.floor(h*s));
    };
    resize();
    new ResizeObserver(resize).observe(display);

    linux.setActivateConsole((vt) => {
      screenWrap.dataset.virtualTerminal = String(vt);
      screenWrap.style.zIndex = vt === 7 ? '5' : '1';
      setState(state, vt === 7 ? 'Linux listo' : 'Arrancando escritorio…');
    });
    linux.setCustomConsole((d) => {
      const t = typeof d === 'string' ? d : new TextDecoder().decode(d instanceof Uint8Array ? d : new Uint8Array(d));
      log(consoleElement, t);
    }, 80, 24);

    setState(state, 'Arrancando escritorio…');
    while (true) await linux.run('/bin/sh', ['-c', BOOT_COMMAND], { cwd: '/', uid: 0, gid: 0 });
  } catch (error) {
    setState(state, 'Error');
    consoleElement.hidden = false;
    log(consoleElement, errStr(error));
    console.error('[BU]', error);
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.__BROWSER_UBUNTU__ = { APP_VERSION, CHEERPX_VERSION };
home();
