const W=window.WariData, POINTS=W.build();
const map=L.map('map',{zoomControl:false}).setView([18.42,74.10],9);L.control.zoom({position:'bottomright'}).addTo(map);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
function liveBlock(url){url=W.safeExternalUrl(url);if(!url)return'';let head='<div class="live-head">🔴 थेट प्रक्षेपण · LIVE</div>';if(/youtube\.com|youtu\.be/.test(url)){let id=(url.match(/(?:[?&]v=|youtu\.be\/|\/live\/|\/embed\/)([\w-]{6,})/)||[])[1];if(!id)return'';let e='https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1';return`<div class="live-wrap">${head}<iframe class="live-embed" src="${W.escAttr(e)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;}if(!/\.m3u8(?:\?|$)/i.test(url))return'';return`<div class="live-wrap">${head}<video class="live-embed" data-hls="${W.escAttr(url)}" controls autoplay muted playsinline></video></div>`;}
function loadHls(cb){if(window.Hls)return cb();let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';s.onload=cb;s.onerror=()=>{};document.head.appendChild(s);}
function initLive(){document.querySelectorAll('video[data-hls]:not([data-init])').forEach(v=>{v.setAttribute('data-init','1');let url=W.safeExternalUrl(v.getAttribute('data-hls'));if(!url)return;if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;}else{loadHls(()=>{if(window.Hls&&Hls.isSupported()){let h=new Hls();h.loadSource(url);h.attachMedia(v);}else{v.src=url;}});}});}
map.on('popupopen',()=>setTimeout(initLive,60));
let routeLayer=L.layerGroup().addTo(map),layer=L.layerGroup().addTo(map),userLayer=L.layerGroup().addTo(map),typeFilter='all',docSub='all',ambSub='all',watSub='all',haltSub='all',palkhiFilter='all',silent=false,userLocation=null;
function isDocCat(p){return(W.hasHealth(p)||W.hasDoctor(p))&&p.type!=='Ambulance'}
function typeKeep(p){if(typeFilter==='all')return!W.hasWater(p);return false
||typeFilter==='ambulance'&&W.hasAmb(p)&&(ambSub==='all'||ambSub==='als'&&W.isALS(p)||ambSub==='bls'&&W.isBLS(p)||ambSub==='102'&&W.is102(p)||ambSub==='108'&&W.is108(p))
||typeFilter==='doc'&&isDocCat(p)&&(docSub==='all'||docSub==='phc'&&W.isPHC(p)||docSub==='rh'&&W.isRuralHospital(p)||docSub==='pvt'&&W.isPrivateHospital(p)||docSub==='hbt'&&W.isHBT(p)||docSub==='icu'&&W.isICU(p))
||typeFilter==='water'&&W.hasWater(p)&&(watSub==='all'||watSub==='actual'&&!W.isApprox(p)||watSub==='approx'&&W.isApprox(p))
||typeFilter==='toilet'&&W.isToilet(p)
||typeFilter==='police'&&W.isPolice(p)
||typeFilter==='charanseva'&&W.isCharanseva(p)
||typeFilter==='hirkani'&&W.hasHirkani(p)
||typeFilter==='halt'&&W.isHalt(p)&&(haltSub==='all'||haltSub==='mukkam'&&!W.isVisava(p)||haltSub==='visava'&&W.isVisava(p))}
function subCount(forCat,attr,val){return POINTS.filter(palkhiKeep).filter(p=>{
 if(forCat==='ambulance')return W.hasAmb(p)&&(val==='all'||val==='als'&&W.isALS(p)||val==='bls'&&W.isBLS(p)||val==='102'&&W.is102(p)||val==='108'&&W.is108(p));
 if(forCat==='doc')return isDocCat(p)&&(val==='all'||val==='phc'&&W.isPHC(p)||val==='rh'&&W.isRuralHospital(p)||val==='pvt'&&W.isPrivateHospital(p)||val==='hbt'&&W.isHBT(p)||val==='icu'&&W.isICU(p));
 if(forCat==='water')return W.hasWater(p)&&(val==='all'||val==='actual'&&!W.isApprox(p)||val==='approx'&&W.isApprox(p));
 if(forCat==='halt')return W.isHalt(p)&&(val==='all'||val==='mukkam'&&!W.isVisava(p)||val==='visava'&&W.isVisava(p));
 return false;}).length}
function updateSubChips(){[['docsubChips','doc','doc',()=>docSub,v=>docSub=v],['ambsubChips','ambulance','amb',()=>ambSub,v=>ambSub=v],['watsubChips','water','wat',()=>watSub,v=>watSub=v],['haltsubChips','halt','halt',()=>haltSub,v=>haltSub=v]].forEach(function(row){
 var id=row[0],forCat=row[1],attr=row[2],getv=row[3],setv=row[4],el=document.getElementById(id);if(!el)return;var active=getv();
 el.querySelectorAll('.chip').forEach(function(b){var v=b.dataset[attr],n=subCount(forCat,attr,v),off=v!=='all'&&n===0;b.disabled=off;b.classList.toggle('disabled',off);b.title=off?'या पालखीसाठी डेटा उपलब्ध नाही':'';if(off&&active===v){active='all';setv('all')}});
 el.querySelectorAll('.chip').forEach(function(b){b.classList.toggle('active',b.dataset[attr]===active)});
})}
function togglePanel(){const pn=document.getElementById('panel'),tg=document.getElementById('ptoggle'),open=pn.classList.toggle('collapsed');tg.textContent=open?'नियंत्रण ▾':'बंद करा ▴';tg.setAttribute('aria-expanded',String(!open));setTimeout(()=>map.invalidateSize(true),220)}
function palkhiKeep(p){return palkhiFilter==='all'||p.palkhi===palkhiFilter||p.palkhi==='both'}
let searchQ='';function setSearch(v){searchQ=(v||'').trim().toLowerCase();draw()}
function searchKeep(p){if(!searchQ)return true;return [p.label,p.place,p.vehicle,p.doctor,p.pilot,p.base,p.call,p.mo].some(f=>f&&String(f).toLowerCase().includes(searchQ))}
function keep(p){return palkhiKeep(p)&&searchKeep(p)&&typeKeep(p)}
function dir(p){return`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
function notifyParent(){if(silent)return;try{parent.postMessage({type:'DESKTOP_MAP_FILTER',palkhi:palkhiFilter,typeFilter:typeFilter},location.origin)}catch(e){}}
const HK_PHOTO='./assets/img/hirkani-booth.jpg',HK_VIDEO='./assets/video/hirkani-1.mp4';
function phoneHref(raw){let s=(raw||'').replace(/[^0-9+]/g,'');return s.length===10&&/^[6-9]/.test(s)?'+91'+s:s}
function splitContacts(v){return(v||'').split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean).map(x=>{let nums=x.match(/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g)||[];let name=x.replace(/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g,'').replace(/[()]/g,'').replace(/\s+/g,' ').trim();return{name:name||'संपर्क',phone:nums[0]||''}})}
function firstPhone(){for(let v of arguments){let hit=splitContacts(v).find(c=>c.phone);if(hit)return hit.phone}return''}
function popContactRows(p){let rows=[['मुख्य संपर्क',p.call],['वैद्यकीय',p.mo||p.doctor],['डॉक्टर / EMSO',p.mo?p.doctor:''],['पायलट / वाहन',p.pilot]];return rows.map(([title,val])=>{let links=splitContacts(val).filter(c=>c.phone).slice(0,5).map(c=>`<a class="pcall" href="tel:${phoneHref(c.phone)}">📞 ${W.esc(c.name)} <b>${W.esc(c.phone)}</b></a>`).join('');return links?`<div class="pcontacts"><div class="pctitle">${W.esc(title)}</div><div class="pcalls">${links}</div></div>`:''}).join('')}
function popup(p){let c=firstPhone(p.call,p.mo,p.doctor,p.pilot),chips=W.services(p).map(x=>`<span class="pchip">${W.esc(x)}</span>`).join(''),cls=W.cls(p);let d=[];if(p.place&&!(p.label||'').includes(p.place))d.push('📍 '+W.esc(p.place));if(p.vehicle)d.push('🚗 '+W.esc(p.vehicle));if(p.base)d.push('🏷 '+W.esc(p.base));if(p.date)d.push('📅 '+W.esc(p.date)+(p.day?' · '+W.esc(p.day):''));let contacts=popContactRows(p);let hk=p.photo?`<img class="pop-thumb" src="${W.escAttr(W.safeAsset(p.photo,HK_PHOTO))}" loading="lazy" onerror="this.remove()"/>`:'';return `<div class="pop pop-${cls}"><div class="phead"><span class="picon">${W.icon(p)}</span><div><div class="ptitle">${W.esc(p.label)}</div><div class="psub">${W.esc(W.NAMES[p.palkhi]||p.palkhi)}</div></div></div><div class="pbody"><div class="pchips">${chips}</div>${p.live?liveBlock(p.live):''}${hk}${d.length?`<div class="pdet">${d.join('<br>')}</div>`:''}${contacts}<div class="pact">${c?`<a class="pbtn call" href="tel:${phoneHref(c)}">📞 फोन करा</a>`:''}<a class="pbtn dirbtn" target="_blank" rel="noopener noreferrer" href="${dir(p)}">🧭 दिशा</a></div></div></div>`}
function drawRoute(){routeLayer.clearLayers();
let dny=(window.WARI_DNYANESHWAR_PUNE_ROUTE||[]).concat(window.WARI_ROUTE_DNY_EXT||[]);
let tuk=window.WARI_ROUTE_TUK||[];
if(palkhiFilter!=='tukaram'&&dny.length)L.polyline(dny,{color:'#1d5fc4',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
if(palkhiFilter!=='dnyaneshwar'&&tuk.length)L.polyline(tuk,{color:'#f4711f',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
let tr=window.WARI_ROUTE_TUK_RET||[];
if(palkhiFilter!=='dnyaneshwar'&&tr.length)L.polyline(tr,{color:'#f4711f',weight:3,opacity:.55,dashArray:'8 8'}).addTo(routeLayer);}
// SC (उपकेंद्र) pins only at zoom>=13 — kept in counts/lists, hidden at route-level zoom
const SC_MIN_ZOOM=13;let scVis=false;function isSC(p){return /sub-centre/i.test(p.type||'')}
let zoomRedraw=false;map.on('zoomend',()=>{if((map.getZoom()>=SC_MIN_ZOOM)!==scVis){zoomRedraw=true;try{draw()}finally{zoomRedraw=false}}});
function draw(){updateSubChips();scVis=map.getZoom()>=SC_MIN_ZOOM;routeLayer.clearLayers();layer.clearLayers();drawRoute();let pts=POINTS.filter(keep);document.getElementById('count').textContent=pts.length;pts.forEach(p=>{if(isSC(p)&&!scVis)return;return L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="pin ${W.cls(p)} pal-${p.palkhi}${p.live?' has-live':''}${W.multi(p)?' multi':''}${W.isApprox(p)?' approx':''}">${W.icon(p)}</div>`,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(popup(p),{maxWidth:250}).addTo(layer)});if(!zoomRedraw&&pts.length&&!userLocation){map.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])).pad(.1));}if(typeof renderNearSummaryM==='function')renderNearSummaryM();}
function showUser(lat,lng,acc){userLocation=[lat,lng];userLayer.clearLayers();L.circle([lat,lng],{radius:Math.max(acc||20,20),className:'accuracy'}).addTo(userLayer);L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="userpin"></div>',iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup('आपण येथे आहात').addTo(userLayer).openPopup();document.getElementById('locStatus').textContent='माझे स्थान दिसत आहे';map.setView([lat,lng],16);renderNearSummaryM();setTimeout(()=>map.invalidateSize(true),120)}
function locateMe(){if(!navigator.geolocation){document.getElementById('locStatus').textContent='Location सुविधा उपलब्ध नाही';return;}document.getElementById('locStatus').textContent='GPS स्थान घेत आहोत…';navigator.geolocation.getCurrentPosition(pos=>showUser(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy),()=>{document.getElementById('locStatus').textContent='GPS permission द्या';},{enableHighAccuracy:true,timeout:15000,maximumAge:20000})}
function setPalkhi(p,fromParent){silent=!!fromParent;palkhiFilter=p||'all';document.querySelectorAll('#palkhiChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.palkhi===palkhiFilter));draw();notifyParent();silent=false}
const SUBROWS=[['docsubChips','doc','doc',v=>docSub=v],['ambsubChips','ambulance','amb',v=>ambSub=v],['watsubChips','water','wat',v=>watSub=v],['haltsubChips','halt','halt',v=>haltSub=v]];
function setType(f,fromParent){silent=!!fromParent;typeFilter=/^(all|ambulance|doc|water|toilet|police|charanseva|hirkani|halt)$/.test(f||'')?f:'all';document.querySelectorAll('#typeChips .chip,.legend-btn[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===typeFilter));
SUBROWS.forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;el.style.display=typeFilter===row[1]?'flex':'none';if(typeFilter!==row[1]){row[3]('all');el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset[row[2]]==='all'))}});
draw();notifyParent();silent=false}
function setDocSub(s){if(s!=='all'&&!subCount('doc','doc',s))s='all';docSub=s;document.querySelectorAll('#docsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.doc===s));draw()}
function setAmbSub(s){if(s!=='all'&&!subCount('ambulance','amb',s))s='all';ambSub=s;document.querySelectorAll('#ambsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.amb===s));draw()}
function setWatSub(s){if(s!=='all'&&!subCount('water','wat',s))s='all';watSub=s;document.querySelectorAll('#watsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.wat===s));draw()}
function setHaltSub(s){if(s!=='all'&&!subCount('halt','halt',s))s='all';haltSub=s;document.querySelectorAll('#haltsubChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.halt===s));draw()}
function resetMap(fromParent){silent=!!fromParent;palkhiFilter='all';typeFilter='all';docSub='all';ambSub='all';watSub='all';haltSub='all';userLocation=null;mkRef=null;mkName='';if(typeof renderNearSummaryM==='function')renderNearSummaryM();
SUBROWS.forEach(function(row){var el=document.getElementById(row[0]);if(!el)return;el.style.display='none';el.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active',x.dataset[row[2]]==='all'))});
document.querySelectorAll('#palkhiChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.palkhi==='all'));document.querySelectorAll('#typeChips .chip').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));draw();notifyParent();silent=false}
document.querySelectorAll('#palkhiChips .chip').forEach(b=>b.addEventListener('click',()=>setPalkhi(b.dataset.palkhi,false)));
document.querySelectorAll('#typeChips .chip').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.filter,false)));
document.querySelectorAll('#docsubChips .chip').forEach(b=>b.addEventListener('click',()=>setDocSub(b.dataset.doc)));
document.querySelectorAll('#ambsubChips .chip').forEach(b=>b.addEventListener('click',()=>setAmbSub(b.dataset.amb)));
document.querySelectorAll('#watsubChips .chip').forEach(b=>b.addEventListener('click',()=>setWatSub(b.dataset.wat)));
document.querySelectorAll('#haltsubChips .chip').forEach(b=>b.addEventListener('click',()=>setHaltSub(b.dataset.halt)));
window.addEventListener('message',e=>{if(e.origin!==location.origin||!e.data)return;if(e.data.type==='PALKHI_FILTER')setPalkhi(e.data.palkhi||'all',true);if(e.data.type==='TYPE_FILTER')setType(e.data.typeFilter||'all',true);if(e.data.type==='RESET_MAP')resetMap(true);if(e.data.type==='LOCATE_ME')locateMe()});
let mkLayer=null;
(function(){let sel=document.getElementById('mukkamSel');if(!sel||!window.WARI_MUKKAMS)return;
let h='<option value="">— मुक्काम निवडा (सर्व मार्ग) —</option>';
window.WARI_MUKKAMS.forEach((m,i)=>{h+='<option value="'+i+'">'+(m.pal==='tukaram'?'तुका':'ज्ञा')+' · '+(m.d?m.d+' · ':'')+m.n+'</option>'});
sel.innerHTML=h})();
function gotoMukkam(v){if(mkLayer){map.removeLayer(mkLayer);mkLayer=null}
if(v===''){mkRef=null;mkName='';resetMap(false);renderNearSummaryM();return}
let m=window.WARI_MUKKAMS[+v];if(!m)return;
setPalkhi(m.pal);
mkRef=[m.lat,m.lng];mkName=m.n||'';
mkLayer=L.layerGroup().addTo(map);
L.circle([m.lat,m.lng],{radius:1000,color:'#d92b2b',weight:3,fillOpacity:.08}).addTo(mkLayer);
map.setView([m.lat,m.lng],13);renderNearSummaryM();}
draw();

/* ---- Desktop-map parity: "इथून सर्व सेवा" nearest-of-each panel (mirrors app.js) ---- */
var mkRef=null,mkName='';
function refLocM(){return (typeof userLocation!=='undefined'&&userLocation)?userLocation:mkRef}
function havM(a,b,c,d){var R=6371000,p=Math.PI/180,x=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function distM(p){var r=refLocM();return r?havM(r[0],r[1],p.lat,p.lng):null}
function devM(x){return String(x).replace(/[0-9]/g,d=>'०१२३४५६७८९'[d])}
function fdM(m){return m==null?'—':m<80?'अगदी जवळ':m<6000?'🚶 '+devM(Math.max(1,Math.round(m/75)))+' मि. चालत':devM((m/1000).toFixed(1))+' किमी'}
var NEAR_CATS_M=[
  {s:'रुग्णवाहिका',ic:'🚑',c:'#e52920',bg:'#ffe9e8',m:p=>p.type==='Ambulance'},
  {s:'अतिदक्षता (ICU)',ic:'⛑',c:'#b51d18',bg:'#fdecec',m:p=>W.isICU(p)},
  {s:'डॉक्टर / रुग्णालय',ic:'🩺',c:'#159653',bg:'#e9f8f0',m:p=>isDocCat(p)&&!W.isICU(p)},
  {s:'पाणी',ic:'💧',c:'#2f8fcf',bg:'#e9f1ff',m:p=>W.hasWater(p)},
  {s:'शौचालय',ic:'🚻',c:'#7c3aed',bg:'#f1eafe',m:p=>W.isToilet(p)},
  {s:'हिरकणी कक्ष',ic:'🤱',c:'#e5399b',bg:'#fdeaf4',m:p=>W.hasHirkani(p)},
  {s:'चरणसेवा',ic:'🙏',c:'#c2740a',bg:'#fff3dc',m:p=>W.isCharanseva(p)},
  {s:'मुक्काम / विसावा',ic:'⛺',c:'#9b5b00',bg:'#fff3dc',m:p=>W.isHalt(p)},
  {s:'पोलीस',ic:'🚔',c:'#1a2f6e',bg:'#e7ecfa',m:p=>W.isPolice(p)}
];
function nearestOfM(pred){let best=null,bd=Infinity;POINTS.forEach(p=>{if(!palkhiKeep(p)||!pred(p))return;let d=distM(p);if(d==null)return;if(d<bd){bd=d;best=p}});return best?{p:best,d:bd}:null}
function focusNearM(i){let o=(window._nearM||[])[i];if(o)map.setView([o.p.lat,o.p.lng],16)}
function renderNearSummaryM(){var el=document.getElementById('nearSummary');if(!el)return;
  if(!refLocM()){el.innerHTML='';return;}
  var where=(typeof userLocation!=='undefined'&&userLocation)?'तुमचे स्थान':('मुक्काम '+(mkName||'')),list=[],rows='';
  NEAR_CATS_M.forEach(function(cat_){var n=nearestOfM(cat_.m);if(!n)return;var i=list.length;list.push(n);
    var ph=firstPhone(n.p.call,n.p.mo,n.p.doctor,n.p.pilot);
    var nm=(n.p.label||'').replace(/\s*\|\s*MH[\s\S]*$/i,'').trim();
    rows+='<div style="background:#fffef9;border:1px solid #eadfce;border-left:7px solid '+cat_.c+';border-radius:12px;padding:8px 10px;display:flex;align-items:center;gap:9px;margin-bottom:7px">'
      +'<div onclick="focusNearM('+i+')" style="display:flex;align-items:center;gap:9px;flex:1;min-width:0;cursor:pointer">'
        +'<div style="width:34px;height:34px;flex:0 0 auto;border-radius:11px;background:'+cat_.bg+';display:flex;align-items:center;justify-content:center;font-size:18px">'+cat_.ic+'</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:900;color:#23160d">'+cat_.s+'</div>'
        +'<div style="font-size:11px;color:#6b5238;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+W.esc(nm)+'</div>'
        +'<div style="font-size:10.5px;color:#9a3a00;font-weight:900;margin-top:1px">'+fdM(n.d)+'</div></div></div>'
      +'<div style="display:flex;gap:5px;flex:0 0 auto">'
        +(ph?'<a href="tel:'+phoneHref(ph)+'" aria-label="फोन" style="width:34px;height:34px;border-radius:10px;background:#159653;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;text-decoration:none">📞</a>':'')
        +'<a href="'+dir(n.p)+'" target="_blank" rel="noopener noreferrer" aria-label="दिशा" style="width:34px;height:34px;border-radius:10px;background:#2f6fd6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;text-decoration:none">🧭</a>'
      +'</div></div>';
  });
  window._nearM=list;
  el.innerHTML=list.length?('<div style="background:#f27405;border-radius:12px;padding:9px 11px;color:#fff;margin:2px 0 8px"><div style="font-size:14px;font-weight:900">📍 इथून सर्व सेवा</div><div style="font-size:11px;opacity:.92">'+W.esc(where)+' · प्रत्येक सेवेतील सर्वात जवळचे</div></div>'+rows):'';
}
