import './style.css';

const APP_VERSION = '0.6.0-webvm-graphics';
const CHEERPX_VERSION = '1.3.9';
const BASE_IMAGE = 'https://disks.webvm.io/alpine_20251007.ext2';
const CONSENT_KEY = 'browser-ubuntu-consent';
const IDB_DEVICE_NAME = 'browser-ubuntu-cheerpx-overlay-v1';

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
  app.innerHTML = `<main class="home"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><section class="welcome"><p class="eyebrow">CHEERPX · LINUX REAL · PROTOTIPO</p><h1>Linux,<br>right here.</h1><p>Linux ejecutándose directamente en tu navegador.</p><div class="home-actions"><button class="start" id="start">Iniciar Linux <span>↗</span></button><button class="restore-home" id="restore" hidden>Continuar sesión</button></div></section><footer>CheerpX · WebAssembly · almacenamiento local</footer><div class="consent" id="consent" hidden><strong>Guardar tu sesión</strong><p>Browser Ubuntu guardará localmente los cambios del filesystem Linux en este navegador para poder continuar después. No usamos cookies de terceros, analytics ni trackers.</p><div><button id="accept">Aceptar</button><button id="reject">Rechazar</button></div></div></main>`;
  const restore = document.querySelector('#restore');
  if (consent === 'accepted') restore.hidden = false;
  document.querySelector('#start').onclick = () => launch();
  restore.onclick = () => launch();
  const banner = document.querySelector('#consent');
  if (!consent) banner.hidden = false;
  document.querySelector('#accept').onclick = () => { consent = 'accepted'; localStorage.setItem(CONSENT_KEY, consent); banner.hidden = true; restore.hidden = false; };
  document.querySelector('#reject').onclick = () => { consent = 'rejected'; localStorage.setItem(CONSENT_KEY, consent); banner.hidden = true; };
}

function launch() {
  app.innerHTML = `<main class="vm"><header class="toolbar"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><span class="state" id="state">Iniciando Alpine…</span><div class="controls"><button id="fullscreen">Pantalla completa</button><button id="new">Nueva sesión</button><button id="shutdown">Apagar</button></div></header><section class="screen-wrap" id="screen-wrap"><canvas id="display" aria-label="Escritorio Linux"></canvas><pre id="console" class="console" hidden></pre></section><footer class="vm-footer">Alpine Linux · Xorg · i3 · escritorio gráfico real · CheerpX</footer></main>`;
  const display = document.querySelector('#display');
  const consoleElement = document.querySelector('#console');
  const screenWrap = document.querySelector('#screen-wrap');
  const state = document.querySelector('#state');
  consoleElement.focus();
  document.querySelector('#fullscreen').onclick = async () => { const target = document.querySelector('.vm'); if (!document.fullscreenElement) await target.requestFullscreen?.(); else await document.exitFullscreen?.(); };
  document.querySelector('#shutdown').onclick = () => home();
  document.querySelector('#new').onclick = async () => { if (!confirm('¿Borrar el filesystem local y empezar de cero?')) return; await idbDevice?.reset(); home(); };
  boot(display, consoleElement, screenWrap, state);
}

async function boot(display, consoleElement, screenWrap, state) {
  try {
    if (!crossOriginIsolated) throw new Error('CheerpX necesita aislamiento de origen (COOP/COEP) y SharedArrayBuffer.');
    const CheerpX = await import(/* @vite-ignore */ `https://cxrtnc.leaningtech.com/${CHEERPX_VERSION}/cx.esm.js`);
    let cloud;
    try {
      cloud = await CheerpX.CloudDevice.create(BASE_IMAGE);
    } catch (error) {
      cloud = await CheerpX.CloudDevice.create(BASE_IMAGE.replace('wss:', 'https:'));
    }
    idbDevice = await CheerpX.IDBDevice.create(IDB_DEVICE_NAME);
    overlay = await CheerpX.OverlayDevice.create(cloud, idbDevice);
    const webDevice = await CheerpX.WebDevice.create('');
    const dataDevice = await CheerpX.DataDevice.create();
    linux = await CheerpX.Linux.create({ mounts: [
      { type: 'ext2', dev: overlay, path: '/' },
      { type: 'dir', dev: webDevice, path: '/web' },
      { type: 'dir', dev: dataDevice, path: '/data' },
      { type: 'devs', path: '/dev' },
      { type: 'devpts', path: '/dev/pts' },
      { type: 'proc', path: '/proc' },
      { type: 'sys', path: '/sys' },
    ] });
    const resize = () => {
      const displayWidth = display.offsetWidth || 1024;
      const displayHeight = display.offsetHeight || 768;
      const scale = Math.max(1024 / displayWidth, 768 / displayHeight, 1);
      const width = Math.floor(displayWidth * scale);
      const height = Math.floor(displayHeight * scale);
      linux.setKmsCanvas(display, width, height);
      display.dataset.kmsSize = `${width}x${height}`;
    };
    resize();
    new ResizeObserver(resize).observe(display);
    let currentVt = 0;
    linux.setActivateConsole((vt) => {
      currentVt = vt;
      screenWrap.dataset.virtualTerminal = String(vt);
      screenWrap.style.zIndex = vt === 7 ? '5' : '1';
      state.textContent = vt === 7 ? 'Linux listo · Alpine + Xorg + i3' : 'Iniciando Xorg y escritorio…';
    });
    linux.setCustomConsole((data) => {
      const text = typeof data === 'string'
        ? data
        : new TextDecoder().decode(data instanceof Uint8Array ? data : new Uint8Array(data));
      consoleElement.textContent += text;
      if (consoleElement.textContent.length > 12000) consoleElement.textContent = consoleElement.textContent.slice(-12000);
    }, 80, 24);
    state.textContent = 'Iniciando Xorg y escritorio…';
    // Start only the graphical services that this WebVM image needs.
    while (true) await linux.run('/bin/sh', ['-c', 'mkdir -p /run /run/lock /run/dbus /run/lightdm; chown lightdm:lightdm /run/lightdm; /usr/bin/dbus-daemon --system --fork; exec /usr/bin/lightdm --debug'], { cwd: '/', uid: 0, gid: 0 });
  } catch (error) {
    state.textContent = 'No se pudo iniciar Linux';
    consoleElement.hidden = false;
    consoleElement.textContent = `${error.message}\n\nRevisa COOP/COEP, la imagen Alpine gráfica y la consola del navegador.`;
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.__BROWSER_UBUNTU__ = { APP_VERSION, CHEERPX_VERSION, getLinux: () => linux };
home();
