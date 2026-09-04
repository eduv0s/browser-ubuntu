import './style.css';

const APP_VERSION = '0.9.2-webvm';
const CHEERPX_VERSION = '1.3.9';
// Official WebVM Alpine graphical image. The disks.webvm.io server
// exposes both wss:// and https:// for the same ext2. HttpBytesDevice
// is the correct API for the HTTPS URL. wss:// is the CloudDevice fallback.
const BASE_IMAGE = 'https://disks.webvm.io/alpine_20251007.ext2';
const WSS_FALLBACK = 'wss://disks.webvm.io/alpine_20251007.ext2';
const CONSENT_KEY = 'browser-ubuntu-consent';
const IDB_DEVICE_NAME = 'browser-ubuntu-cheerpx-overlay-v1';
const BOOT_COMMAND =
  'mkdir -p /run/lock /run/dbus /run/lightdm; ' +
  'chown lightdm:lightdm /run/lightdm; ' +
  '/usr/bin/dbus-daemon --system --fork; ' +
  'exec /usr/bin/lightdm --debug';

const app = document.querySelector('#app');
let linux;
let overlay;
let idbDevice;
let consent = localStorage.getItem(CONSENT_KEY);

function home() {
  linux?.close?.();
  linux = undefined;
  overlay = undefined;
  idbDevice = undefined;
  app.innerHTML = `<main class="home"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><section class="welcome"><p class="eyebrow">CHEERPX · LINUX REAL</p><h1>Linux,<br>right here.</h1><p>Linux ejecutándose directamente en tu navegador.</p><div class="home-actions"><button class="start" id="start">Iniciar Linux <span>↗</span></button><button class="restore-home" id="restore" hidden>Continuar sesión</button></div></section><footer>CheerpX · WebAssembly · almacenamiento local</footer><div class="consent" id="consent" hidden><strong>Guardar tu sesión</strong><p>Browser Ubuntu guardará localmente los cambios del filesystem Linux en este navegador para poder continuar después.</p><div><button id="accept">Aceptar</button><button id="reject">Rechazar</button></div></div></main>`;
  const restore = document.querySelector('#restore');
  if (consent === 'accepted') restore.hidden = false;
  document.querySelector('#start').onclick = () => launch();
  restore.onclick = () => launch();
  const banner = document.querySelector('#consent');
  if (!consent) banner.hidden = false;
  document.querySelector('#accept').onclick = () => {
    consent = 'accepted'; localStorage.setItem(CONSENT_KEY, consent);
    banner.hidden = true; restore.hidden = false;
  };
  document.querySelector('#reject').onclick = () => {
    consent = 'rejected'; localStorage.setItem(CONSENT_KEY, consent);
    banner.hidden = true;
  };
}

function launch() {
  app.innerHTML = `<main class="vm"><header class="toolbar"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><span class="state" id="state">Iniciando…</span><div class="controls"><button id="fullscreen">Pantalla completa</button><button id="shutdown">Apagar</button></div></header><section class="screen-wrap" id="screen-wrap"><canvas id="display"></canvas><pre id="console" class="console" hidden></pre></section></main>`;
  const display = document.querySelector('#display');
  const consoleElement = document.querySelector('#console');
  const screenWrap = document.querySelector('#screen-wrap');
  const state = document.querySelector('#state');
  consoleElement.focus();
  document.querySelector('#fullscreen').onclick = async () => {
    const t = document.querySelector('.vm');
    if (!document.fullscreenElement) await t.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };
  document.querySelector('#shutdown').onclick = () => home();
  boot(display, consoleElement, screenWrap, state);
}

function setState(el, msg) { el.textContent = msg; }
function errStr(e) {
  if (!e) return 'null';
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  try { return JSON.stringify(e); } catch { return String(e); }
}
function log(consoleElement, msg) {
  consoleElement.textContent += msg + '\n';
  if (consoleElement.textContent.length > 15000)
    consoleElement.textContent = consoleElement.textContent.slice(-15000);
}

async function boot(display, consoleElement, screenWrap, state) {
  consoleElement.hidden = false;
  log(consoleElement, '=== Browser Ubuntu boot ===');
  try {
    if (!crossOriginIsolated)
      throw new Error('Necesita COOP/COEP. Recarga la página.');

    setState(state, 'Cargando CheerpX…');
    log(consoleElement, `CheerpX ${CHEERPX_VERSION}`);
    const CheerpX = await import(/* @vite-ignore */ `https://cxrtnc.leaningtech.com/${CHEERPX_VERSION}/cx.esm.js`);
    log(consoleElement, 'Runtime OK');

    // HttpBytesDevice for https:// (CORS + range support)
    let baseDevice;
    let activeUrl;
    try {
      setState(state, 'Conectando con la imagen…');
      log(consoleElement, `HttpBytesDevice(${BASE_IMAGE})`);
      baseDevice = await CheerpX.HttpBytesDevice.create(BASE_IMAGE);
      activeUrl = BASE_IMAGE;
      log(consoleElement, 'HttpBytesDevice OK');
    } catch (httpErr) {
      log(consoleElement, `HttpBytesDevice falló: ${errStr(httpErr)}`);
      // Fallback: wss:// via CloudDevice
      log(consoleElement, `CloudDevice(${WSS_FALLBACK})`);
      baseDevice = await CheerpX.CloudDevice.create(WSS_FALLBACK);
      activeUrl = WSS_FALLBACK;
      log(consoleElement, 'CloudDevice OK');
    }

    idbDevice = await CheerpX.IDBDevice.create(IDB_DEVICE_NAME);
    overlay = await CheerpX.OverlayDevice.create(baseDevice, idbDevice);
    const webDevice = await CheerpX.WebDevice.create('');
    const dataDevice = await CheerpX.DataDevice.create('');

    const isWss = activeUrl.startsWith('wss://') || activeUrl.startsWith('ws://');

    setState(state, 'Inicializando Linux…');
    log(consoleElement, `diskImageType=${isWss ? 'cloud' : 'bytes'}`);
    linux = await CheerpX.Linux.create({
      mounts: [
        { type: 'ext2', dev: overlay, path: '/' },
        { type: 'dir', dev: webDevice, path: '/web' },
        { type: 'dir', dev: dataDevice, path: '/data' },
        { type: 'devs', path: '/dev' },
        { type: 'devpts', path: '/dev/pts' },
        { type: 'proc', path: '/proc' },
        { type: 'sys', path: '/sys' },
      ],
      diskImageType: isWss ? 'cloud' : 'bytes',
      diskImageUrl: activeUrl,
    });
    log(consoleElement, 'Linux OK');

    const resize = () => {
      const w = display.offsetWidth || 1024;
      const h = display.offsetHeight || 768;
      const s = Math.max(1024 / w, 768 / h, 1);
      linux.setKmsCanvas(display, Math.floor(w * s), Math.floor(h * s));
    };
    resize();
    new ResizeObserver(resize).observe(display);

    linux.setActivateConsole((vt) => {
      screenWrap.dataset.virtualTerminal = String(vt);
      screenWrap.style.zIndex = vt === 7 ? '5' : '1';
      setState(state, vt === 7 ? 'Linux listo' : 'Arrancando escritorio…');
    });
    linux.setCustomConsole((data) => {
      const text = typeof data === 'string' ? data
        : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data));
      log(consoleElement, text);
    }, 80, 24);

    setState(state, 'Arrancando Alpine…');
    log(consoleElement, `Boot: ${BOOT_COMMAND}`);
    while (true) await linux.run('/bin/sh', ['-c', BOOT_COMMAND], { cwd: '/', uid: 0, gid: 0 });
  } catch (error) {
    setState(state, 'Error al iniciar');
    consoleElement.hidden = false;
    log(consoleElement, `ERROR: ${errStr(error)}`);
    console.error('[BrowserUbuntu]', error);
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.__BROWSER_UBUNTU__ = { APP_VERSION, CHEERPX_VERSION };
home();
