const W=window.WariData, POINTS=W.build();
const map=L.map('map',{zoomControl:false}).setView([18.42,74.10],9);L.control.zoom({position:'bottomright'}).addTo(map);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
function liveBlock(url){let head='<div class="live-head">🔴 थेट प्रक्षेपण · LIVE</div>';if(/youtube\.com|youtu\.be/.test(url)){let id=(url.match(/(?:[?&]v=|youtu\.be\/|\/live\/|\/embed\/)([\w-]{6,})/)||[])[1];let e=id?('https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1'):url;return`<div class="live-wrap">${head}<iframe class="live-embed" src="${e}" allow="autoplay;encrypted-media;fullscreen;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;}return`<div class="live-wrap">${head}<video class="live-embed" data-hls="${W.esc(url)}" controls autoplay muted playsinline></video></div>`;}
function loadHls(cb){if(window.Hls)return cb();let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';s.onload=cb;s.onerror=()=>{};document.head.appendChild(s);}
function initLive(){document.querySelectorAll('video[data-hls]:not([data-init])').forEach(v=>{v.setAttribute('data-init','1');let url=v.getAttribute('data-hls');if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;}else{loadHls(()=>{if(window.Hls&&Hls.isSupported()){let h=new Hls();h.loadSource(url);h.attachMedia(v);}else{v.src=url;}});}});}
map.on('popupopen',()=>setTimeout(initLive,60));
let routeLayer=L.layerGroup().addTo(map),layer=L.layerGroup().addTo(map),userLayer=L.layerGroup().addTo(map),typeFilter='all',docSub='all',ambSub='all',watSub='all',haltSub='all',palkhiFilter='all',silent=false,userLocation=null;
function isDocCat(p){return(W.hasHealth(p)||W.hasDoctor(p))&&p.type!=='Ambulance'}
function typeKeep(p){if(typeFilter==='all')return!W.hasWater(p);return false
||typeFilter==='ambulance'&&W.hasAmb(p)&&(ambSub==='all'||ambSub==='als'&&W.isALS(p)||ambSub==='bls'&&W.isBLS(p)||ambSub==='102'&&W.is102(p)||ambSub==='108'&&W.is108(p))
||typeFilter==='doc'&&isDocCat(p)&&(docSub==='all'||docSub==='phc'&&W.isPHC(p)||docSub==='rh'&&W.isRuralHospital(p)||docSub==='pvt'&&W.isPrivateHospital(p)||docSub==='hbt'&&W.isHBT(p)||docSub==='icu'&&W.isICU(p))
||typeFilter==='water'&&W.hasWater(p)&&(watSub==='all'||watSub==='actual'&&!W.isApprox(p)||watSub==='approx'&&W.isApprox(p))
||typeFilter==='toilet'&&W.isToilet(p)
||typeFilter==='hirkani'&&W.hasHirkani(p)
||typeFilter==='halt'&&W.isHalt(p)&&(haltSub==='all'||haltSub==='mukkam'&&!W.isVisava(p)||haltSub==='visava'&&W.isVisava(p))}
function togglePanel(){const pn=document.getElementById('panel'),tg=document.getElementById('ptoggle'),open=pn.classList.toggle('collapsed');tg.textContent=open?'नियंत्रण ▾':'बंद करा ▴';tg.setAttribute('aria-expanded',String(!open));setTimeout(()=>map.invalidateSize(true),220)}
function palkhiKeep(p){return palkhiFilter==='all'||p.palkhi===palkhiFilter||p.palkhi==='both'}
function keep(p){return palkhiKeep(p)&&typeKeep(p)}
function dir(p){return`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
function notifyParent(){if(silent)return;try{parent.postMessage({type:'DESKTOP_MAP_FILTER',palkhi:palkhiFilter,typeFilter:typeFilter},'*')}catch(e){}}
const HK_PHOTO='./assets/img/hirkani-booth.jpg',HK_VIDEO='./assets/video/hirkani-1.mp4';
function popup(p){let c=W.tel(p.call),chips=W.services(p).map(x=>`<span class="pchip">${W.esc(x)}</span>`).join('');let d=[];if(p.place&&!(p.label||'').includes(p.place))d.push(W.esc(p.place));if(p.vehicle)d.push('🚗 '+W.esc(p.vehicle));if(p.mo)d.push('🧑‍⚕️ '+W.esc(p.mo));if(p.doctor)d.push(W.esc(p.doctor));if(p.pilot)d.push(W.esc(p.pilot));if(p.base)d.push(W.esc(p.base));if(p.date)d.push('📅 '+W.esc(p.date));let hk=W.hasHirkani(p)?`<img class="pop-thumb" src="${HK_PHOTO}" loading="lazy" onerror="this.remove()"/>`:'';return `<div class="pop"><div class="ptitle">${W.icon(p)} ${W.esc(p.label)}</div><div class="psub">${W.esc(W.NAMES[p.palkhi]||p.palkhi)}</div><div class="pchips">${chips}</div>${p.live?liveBlock(p.live):''}${hk}${d.length?`<div class="pdet">${d.join('<br>')}</div>`:''}<div class="pact">${c?`<a class="pbtn call" href="tel:${c}">📞 फोन</a>`:''}<a class="pbtn" target="_blank" href="${dir(p)}">🧭 दिशा</a>${W.hasHirkani(p)?`<a class="pbtn" href="${HK_VIDEO}" target="_blank" rel="noopener">🎬 व्हिडिओ</a>`:''}</div></div>`}
function drawRoute(){routeLayer.clearLayers();
let dny=(window.WARI_DNYANESHWAR_PUNE_ROUTE||[]).concat(window.WARI_ROUTE_DNY_EXT||[]);
let tuk=window.WARI_ROUTE_TUK||[];
if(palkhiFilter!=='tukaram'&&dny.length)L.polyline(dny,{color:'#1d5fc4',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
if(palkhiFilter!=='dnyaneshwar'&&tuk.length)L.polyline(tuk,{color:'#f4711f',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
let tr=window.WARI_ROUTE_TUK_RET||[];
if(palkhiFilter!=='dnyaneshwar'&&tr.length)L.polyline(tr,{color:'#f4711f',weight:3,opacity:.55,dashArray:'8 8'}).addTo(routeLayer);}
function draw(){routeLayer.clearLayers();layer.clearLayers();drawRoute();let pts=POINTS.filter(keep);document.getElementById('count').textContent=pts.length;pts.forEach(p=>L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="pin ${W.cls(p)} pal-${p.palkhi}${p.live?' has-live':''}${W.multi(p)?' multi':''}${W.isApprox(p)?' approx':''}">${W.icon(p)}</div>`,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(popup(p),{maxWidth:250}).addTo(layer));if(pts.length&&!userLocation){map.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])).pad(.1));}}
function showUser(lat,lng,acc){userLocation=[lat,lng];userLayer.clearLayers();L.circle([lat,lng],{radius:Math.max(acc||20,20),className:'accuracy'}).addTo(userLayer);L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="userpin"></div>',iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup('आपण येथे आहात').addTo(userLayer).openPopup();document.getElementById('locStatus').textContent='माझे स्थान दिसत आहे';map.setView([lat,lng],16);setTimeout(()=>map.invalidateSize(true),120)}
function locateMe(){if(!navigator.geolocation){document.getElementById('locStatus').textContent='Location सुविधा उपलब्ध नाही';return;}document.getElementById('locStatus').textContent='GPS स्थान घेत आहोत…';navigator.geolocation.getCurrentPosition(pos=>showUser(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy),()=>{document.getElementById('locStatus').textContent='GPS permission द्या';},{enableHighAccuracy:true,timeout:15000,maximumAge:20000})}
function setPalkhi(p,fromParent){silent=!!fromParent;palkhiFilter=p||'all';document.querySelectorAll('#palkhiChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.palkhi===palkhiFilter));draw();notifyParent();silent=false}
const SUBROWS=[['docsubChips','doc','doc',v=>docSub=v],['ambsubChips','ambulance','amb',v=>ambSub=v],['watsubChips','water','wat',v=>watSub=v],['haltsubChips','halt','halt',v=>haltSub=v]];
function setType(f,fromParent){silent=!!fromParent;typeFilter=f||'all';document.querySelectorAll('#typeChips .chip,.legend-btn[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===typeFilter));
SUBROWS.forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;el.style.display=typeFilter===row[1]?'flex':'none';if(typeFilter!==row[1]){row[3]('all');el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset[row[2]]==='all'))}});
draw();notifyParent();silent=false}
function setDocSub(s){docSub=s;document.querySelectorAll('#docsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.doc===s));draw()}
function setAmbSub(s){ambSub=s;document.querySelectorAll('#ambsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.amb===s));draw()}
function setWatSub(s){watSub=s;document.querySelectorAll('#watsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.wat===s));draw()}
function setHaltSub(s){haltSub=s;document.querySelectorAll('#haltsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.halt===s));draw()}
function resetMap(fromParent){silent=!!fromParent;palkhiFilter='all';typeFilter='all';docSub='all';ambSub='all';watSub='all';haltSub='all';userLocation=null;
SUBROWS.forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;el.style.display='none';el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset[row[2]]==='all'))});
document.querySelectorAll('#palkhiChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.palkhi==='all'));document.querySelectorAll('#typeChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));draw();notifyParent();silent=false}
document.querySelectorAll('#palkhiChips .chip').forEach(b=>b.addEventListener('click',()=>setPalkhi(b.dataset.palkhi,false)));
document.querySelectorAll('#typeChips .chip').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.filter,false)));
document.querySelectorAll('#docsubChips .chip').forEach(b=>b.addEventListener('click',()=>setDocSub(b.dataset.doc)));
document.querySelectorAll('#ambsubChips .chip').forEach(b=>b.addEventListener('click',()=>setAmbSub(b.dataset.amb)));
document.querySelectorAll('#watsubChips .chip').forEach(b=>b.addEventListener('click',()=>setWatSub(b.dataset.wat)));
document.querySelectorAll('#haltsubChips .chip').forEach(b=>b.addEventListener('click',()=>setHaltSub(b.dataset.halt)));
window.addEventListener('message',e=>{if(!e.data)return;if(e.data.type==='PALKHI_FILTER')setPalkhi(e.data.palkhi||'all',true);if(e.data.type==='TYPE_FILTER')setType(e.data.typeFilter||'all',true);if(e.data.type==='RESET_MAP')resetMap(true);if(e.data.type==='LOCATE_ME')locateMe()});
let mkLayer=null;
(function(){let sel=document.getElementById('mukkamSel');if(!sel||!window.WARI_MUKKAMS)return;
let h='<option value="">— मुक्काम निवडा (सर्व मार्ग) —</option>';
window.WARI_MUKKAMS.forEach((m,i)=>{h+='<option value="'+i+'">'+(m.pal==='tukaram'?'तुका':'ज्ञा')+' · '+(m.d?m.d+' · ':'')+m.n+'</option>'});
sel.innerHTML=h})();
function gotoMukkam(v){if(mkLayer){map.removeLayer(mkLayer);mkLayer=null}
if(v===''){resetMap(false);return}
let m=window.WARI_MUKKAMS[+v];if(!m)return;
setPalkhi(m.pal);
mkLayer=L.layerGroup().addTo(map);
L.circle([m.lat,m.lng],{radius:500,color:'#d92b2b',weight:3,fillOpacity:.08}).addTo(mkLayer);
map.setView([m.lat,m.lng],13);}
draw();
