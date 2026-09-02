import './style.css';

const APP_VERSION = '0.2.0';
const ASSETS = { wasm:'/assets/emulator/v86.wasm', bios:'/assets/bios/seabios.bin', vgaBios:'/assets/bios/vgabios.bin', linux:'/assets/images/TinyCore-11.0.iso' };
const DB_NAME = 'browser-ubuntu'; const STORE = 'session'; const SNAPSHOT = 'vm-state';
const app = document.querySelector('#app'); let machine; let consent = localStorage.getItem('browser-ubuntu-consent');

function db() { return new Promise((resolve,reject)=>{ const request=indexedDB.open(DB_NAME,1); request.onupgradeneeded=()=>request.result.createObjectStore(STORE); request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error); }); }
async function readState() { const d=await db(); return new Promise((resolve,reject)=>{ const r=d.transaction(STORE).objectStore(STORE).get(SNAPSHOT); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>reject(r.error); }); }
async function writeState(value) { const d=await db(); return new Promise((resolve,reject)=>{ const t=d.transaction(STORE,'readwrite'); t.objectStore(STORE).put(value,SNAPSHOT); t.oncomplete=resolve; t.onerror=()=>reject(t.error); }); }
async function clearState() { const d=await db(); return new Promise((resolve,reject)=>{ const t=d.transaction(STORE,'readwrite'); t.objectStore(STORE).delete(SNAPSHOT); t.oncomplete=resolve; t.onerror=()=>reject(t.error); }); }

function home() {
  machine?.stop(); machine = undefined;
  app.innerHTML = `<main class="home"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><section class="welcome"><p class="eyebrow">TINY CORE LINUX · I386</p><h1>Linux,<br>right here.</h1><p>Linux ejecutándose directamente en tu navegador.</p><div class="home-actions"><button class="start" id="start">Iniciar Ubuntu <span>↗</span></button><button class="restore-home" id="restore-home" hidden>Restaurar sesión</button></div></section><footer>WebAssembly · v86 · Tiny Core Linux</footer><div class="consent" id="consent" hidden><strong>Guardar tu sesión</strong><p>Browser Ubuntu puede guardar localmente el estado de la máquina virtual para restaurarlo en este navegador. No usamos cookies de terceros ni enviamos datos.</p><div><button id="accept">Aceptar</button><button id="reject">Rechazar</button></div></div></main>`;
  const restoreButton=document.querySelector('#restore-home'); readState().then(state=>{ if(state && consent==='accepted') restoreButton.hidden=false; }).catch(()=>{});
  document.querySelector('#start').onclick=()=>launch(false); restoreButton.onclick=()=>launch(true);
  const banner=document.querySelector('#consent'); if(!consent) banner.hidden=false;
  document.querySelector('#accept').onclick=()=>{consent='accepted';localStorage.setItem('browser-ubuntu-consent',consent);banner.hidden=true;restoreButton.hidden=false;};
  document.querySelector('#reject').onclick=()=>{consent='rejected';localStorage.setItem('browser-ubuntu-consent',consent);banner.hidden=true;};
}

function launch(restore) {
  app.innerHTML = `<main class="vm"><header class="toolbar"><div class="brand"><span class="logo">⌁</span>Browser Ubuntu</div><span class="state" id="state">Iniciando Linux…</span><div class="controls"><button id="fullscreen">Pantalla completa</button><button id="save">Guardar sesión</button><button id="new">Nueva sesión</button><button id="shutdown">Apagar</button></div></header><section class="screen-wrap"><div id="screen_container" class="screen"><div></div><canvas></canvas></div></section><footer class="vm-footer">Tiny Core Linux i386 · Haz clic en la pantalla para capturar el ratón.</footer></main>`;
  const screen=document.querySelector('#screen_container');
  document.querySelector('#fullscreen').onclick=()=>{ if(machine?.screen_go_fullscreen) machine.screen_go_fullscreen(); else screen.requestFullscreen?.(); };
  document.querySelector('#shutdown').onclick=()=>{ releaseMouse(); home(); };
  document.querySelector('#new').onclick=async()=>{ if(confirm('¿Borrar la sesión guardada y empezar de cero?')){ await clearState(); releaseMouse(); home(); } };
  screen.addEventListener('click',()=>{ if(machine){ machine.mouse_set_enabled(true); machine.lock_mouse(); } });
  document.addEventListener('pointerlockchange',()=>screen.classList.toggle('mouse-locked',Boolean(document.pointerLockElement)));
  document.addEventListener('fullscreenchange',()=>{ const button=document.querySelector('#fullscreen'); if(button) button.textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa'; if(!document.fullscreenElement && document.pointerLockElement) document.exitPointerLock?.(); });
  boot(restore);
}

function releaseMouse(){ if(document.pointerLockElement) document.exitPointerLock?.(); if(document.fullscreenElement) document.exitFullscreen?.(); machine?.mouse_set_enabled(false); }

async function boot(restore) {
  const state=document.querySelector('#state');
  try {
    const {default:V86}=await import(/* @vite-ignore */ new URL('/assets/emulator/libv86.mjs',window.location.origin).href);
    machine=new V86({wasm_path:ASSETS.wasm,memory_size:128*1024*1024,vga_memory_size:8*1024*1024,screen_container:document.querySelector('#screen_container'),bios:{url:ASSETS.bios},vga_bios:{url:ASSETS.vgaBios},cdrom:{url:ASSETS.linux,async:true,size:19922944},hda:{buffer:new ArrayBuffer(64*1024*1024)},acpi:false,autostart:true});
    machine.mouse_set_enabled(true);
    machine.add_listener('emulator-ready',async()=>{ state.textContent='Linux ejecutándose'; if(restore && consent==='accepted'){ const saved=await readState(); if(saved){ state.textContent='Restaurando sesión…'; await machine.restore_state(saved); state.textContent='Sesión restaurada'; } } });
  } catch(error) { state.textContent='No se pudo iniciar Linux'; document.querySelector('#screen_container').innerHTML=`<p class="error">${error.message}</p>`; }
  document.querySelector('#save').onclick=async()=>{ if(consent!=='accepted'){alert('Acepta el almacenamiento local para guardar la sesión.');return;} state.textContent='Guardando sesión…'; const saved=await machine.save_state(); await writeState(saved); state.textContent=`Sesión guardada · ${Math.round(saved.byteLength/1024/1024)} MB`; };
}

if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
home();
