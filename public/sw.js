const CACHE='browser-ubuntu-v2';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/index.html','/assets/bios/seabios.bin','/assets/bios/vgabios.bin','/assets/emulator/libv86.mjs','/assets/emulator/v86.wasm']))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res;})));});
