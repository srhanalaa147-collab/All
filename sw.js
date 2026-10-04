const C='mosaed-v5';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./", "./index.html", "./manifest.webmanifest","./storage.js", "./apple-touch-icon.png", "./favicon-32.png", "./icon-192.png", "./icon-512.png", "./maskable-192.png", "./maskable-512.png"])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
e.respondWith(caches.match(r,{ignoreSearch:true}).then(h=>{
const n=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>h||(r.mode==='navigate'?caches.match('./index.html'):Response.error()));
return h||n}))});
