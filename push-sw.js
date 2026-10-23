// Service worker SOLO para avisos con la pantalla apagada (Web Push sin carga).
// Va en la raíz del repo junto a index.html; se registra con scope ./push-scope/
var CK='mitca-rem',RK=self.registration.scope+'rem-list';
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('push',function(e){
e.waitUntil((async function(){
var c=await caches.open(CK),r=await c.match(RK),l=[];try{l=r?await r.json():[]}catch(x){}
var now=Date.now(),due=l.filter(function(x){return x.at<=now+12e4}).sort(function(a,b){return a.at-b.at})[0];
if(due){l=l.filter(function(x){return x.id!==due.id});await c.put(RK,new Response(JSON.stringify(l)))}
await self.registration.showNotification('Mitca',{body:due?due.text:'Tienes un aviso de Mitca.',icon:'icon-192.png',tag:'mitca-'+(due?due.id:'aviso'),vibrate:[300,150,300],requireInteraction:true})
})())});
self.addEventListener('notificationclick',function(e){e.notification.close();
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(w){for(var i=0;i<w.length;i++){if('focus' in w[i])return w[i].focus()}return self.clients.openWindow('./')}))});
