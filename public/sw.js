const CACHE='salt-origin-v5';
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/site.webmanifest'])))});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(event.notification.data?.url||'/admin/inquiries'))});
