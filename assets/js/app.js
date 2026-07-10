const W=window.WariData,names={all:'दोन्ही पालख्या',dnyaneshwar:'श्री संत ज्ञानेश्वर महाराज पालखी',tukaram:'जगद्गुरू श्री संत तुकाराम महाराज पालखी'};
const MUKKAM_DEFAULT_RADIUS=1000;
let POINTS=W.build(),map,userMarker=null,accCircle=null,markers=[],routeLayer=null,userLocation=null,mukkamRef=null,mukkamName='',mukkamLayer=null,cat='all',docSub='all',ambSub='all',watSub='all',haltSub='all',rad=500,currentPalkhi='all',selectedPoint='';
function $(id){return document.getElementById(id)}function tick(){$('clock').textContent=new Date().toLocaleTimeString('mr-IN',{hour:'numeric',minute:'2-digit',hour12:true})}tick();setInterval(tick,3e4);
document.addEventListener('click',e=>{const a=e.target.closest?e.target.closest('a[href^="tel:"]'):null;if(a&&window.top!==window.self){e.preventDefault();try{window.top.location.href=a.getAttribute('href')}catch(_){window.location.href=a.getAttribute('href')}}});
function closeHelpline(){let h=$('helpline');if(h)h.open=false}document.addEventListener('click',e=>{let h=$('helpline');if(h&&h.open&&!h.contains(e.target))h.open=false},true);
function initMap(){if(map)return;if(!window.L){$('map').innerHTML='<div style="padding:18px;font-weight:900">नकाशा ऑफलाइन उपलब्ध नाही. मदत केंद्रांची यादी खाली उपलब्ध आहे.</div>';return}map=L.map('map',{zoomControl:false,minZoom:7,maxBounds:[[17.3,73.4],[19.1,75.7]],maxBoundsViscosity:.7}).setView([18.41936,74.02765],10);L.control.zoom({position:'bottomleft'}).addTo(map);L.tileLayer('./assets/tiles/{z}/{x}/{y}.png',{maxZoom:18,maxNativeZoom:14,attribution:'&copy; OpenStreetMap &copy; CARTO',errorTileUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}).addTo(map);map.on('popupopen',()=>setTimeout(initLive,60));map.on('zoomend',()=>{if((map.getZoom()>=SC_MIN_ZOOM)!==scVis)draw(drawnPts)})}
function hav(a,b,c,d){let R=6371000,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b),q=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}function dev(x){return String(x).replace(/[0-9]/g,d=>'०१२३४५६७८९'[d])}function fd(m){return m==null?'—':m<80?'अगदी जवळ':m<6000?'🚶 '+dev(Math.max(1,Math.round(m/75)))+' मि. चालत':dev((m/1000).toFixed(1))+' किमी'}function refLoc(){return userLocation||mukkamRef}function dist(p){let r=refLoc();return r?hav(r[0],r[1],p.lat,p.lng):null}function dir(p){return`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
const HIRKANI_PHOTO='./assets/img/hirkani-booth.jpg',CHARANSEVA_PHOTO='./assets/img/emblem-crop.png',HIRKANI_VIDEO='./assets/video/hirkani-1.mp4',HIRKANI_VIDEO_LABEL='हिरकणी कक्ष – व्हिडिओ पहा';
function liveBlock(url){url=W.safeExternalUrl(url);if(!url)return'';let head='<div class="live-head">🔴 थेट प्रक्षेपण · LIVE</div>';if(/youtube\.com|youtu\.be/.test(url)){let id=(url.match(/(?:[?&]v=|youtu\.be\/|\/live\/|\/embed\/)([\w-]{6,})/)||[])[1];if(!id)return'';let e='https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1';return`<div class="live-wrap">${head}<iframe class="live-embed" src="${W.escAttr(e)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;}if(!/\.m3u8(?:\?|$)/i.test(url))return'';return`<div class="live-wrap">${head}<video class="live-embed" data-hls="${W.escAttr(url)}" controls autoplay muted playsinline></video><div class="live-note">थेट फीड लोड होत नसल्यास पुन्हा प्रयत्न करा</div></div>`;}
function loadHls(cb){if(window.Hls)return cb();let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';s.onload=cb;s.onerror=()=>{};document.head.appendChild(s);}
function initLive(){document.querySelectorAll('video[data-hls]:not([data-init])').forEach(v=>{v.setAttribute('data-init','1');let url=W.safeExternalUrl(v.getAttribute('data-hls'));if(!url)return;if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=url;}else{loadHls(()=>{if(window.Hls&&Hls.isSupported()){let h=new Hls();h.loadSource(url);h.attachMedia(v);}else{v.src=url;}});}});}
function hirkaniMedia(p){let src=W.safeAsset(p&&p.photo,HIRKANI_PHOTO);return`<div class="hk-media"><img src="${W.escAttr(src)}" alt="छायाचित्र" loading="lazy" onerror="this.remove()"/></div>`}
function clipPreviewUrl(c){return c.yt?('https://www.youtube.com/embed/'+encodeURIComponent(c.yt)):('https://drive.google.com/file/d/'+encodeURIComponent(c.id)+'/preview')}
function clipViewUrl(c){return'https://drive.google.com/file/d/'+encodeURIComponent(c.id)+'/view'}
function renderClips(){let el=$('clipStrip'),feat=$('clipFeatured'),clips=(window.WARI_CLIPS||[]).slice();if(!clips.length)return;
// Marathi-captioned clips first, then the rest (stable — keeps each group's order)
clips.sort((a,b)=>((/[ऀ-ॿ]/.test(a.title||'')?0:1)-(/[ऀ-ॿ]/.test(b.title||'')?0:1)));
// Featured stays the captioned आबिटकर video; a YouTube clip leads the collapsible LIST.
let feats=clips[0];
let listClips=[{yt:'F5SpMrOF2fY',title:'आरोग्य संपन्न वारी'}].concat(clips);
let cc=$('clipCount');if(cc)cc.textContent=dev(listClips.length);
if(feat){let c=feats;feat.innerHTML=`<div class="clip-feature"><div class="clip-feature-head"><span class="clip-ic">▶</span><span class="clip-tt"><b>${W.esc(c.title)}</b>${c.d?`<small class="clip-desig">${W.esc(c.d)}</small>`:''}</span></div><iframe class="clip-frame" src="${W.escAttr(clipPreviewUrl(c))}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;}
// Full list (YouTube first, then all clips) inside the collapsible card — hidden until opened
clips=listClips;
if(el){el.innerHTML=clips.map((c,i)=>`<details class="clip-item"><summary class="clip-sum"><span class="clip-ic">▶</span><span class="clip-tt"><b>${W.esc(c.title)}</b>${c.d?`<small class="clip-desig">${W.esc(c.d)}</small>`:''}</span><span class="clip-chev">⌄</span></summary><div class="clip-body"><iframe class="clip-frame" data-src="${W.escAttr(clipPreviewUrl(c))}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div></details>`).join('');
el.querySelectorAll('details.clip-item').forEach(d=>{d.addEventListener('toggle',()=>{let f=d.querySelector('iframe.clip-frame');if(d.open){if(f)f.src=f.getAttribute('data-src');el.querySelectorAll('details.clip-item').forEach(o=>{if(o!==d&&o.open)o.open=false});}else if(f){f.src='about:blank';}});});}}
function ensureClipModal(){let m=$('clipModal');if(m)return m;m=document.createElement('div');m.id='clipModal';m.className='clip-modal';m.onclick=e=>{if(e.target.id==='clipModal')closeClip()};m.innerHTML='<div class="clip-player"><div class="clip-player-head"><div class="clip-player-title" id="clipTitle"></div><button type="button" onclick="closeClip()">×</button></div><iframe id="clipFrame" class="clip-frame" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="clip-player-actions"><a id="clipOpenDrive" target="_blank" rel="noopener noreferrer">Drive मध्ये उघडा</a><button type="button" onclick="closeClip()">बंद करा</button></div></div>';document.body.appendChild(m);return m}
function openClip(i){let c=(window.WARI_CLIPS||[])[i];if(!c)return;let m=ensureClipModal();$('clipTitle').textContent=c.title;$('clipFrame').src=clipPreviewUrl(c);$('clipOpenDrive').href=clipViewUrl(c);m.classList.add('open')}
function closeClip(){let m=$('clipModal');if(!m)return;m.classList.remove('open');let f=$('clipFrame');if(f)f.src='about:blank'}
function scrollClips(){let e=$('clipStrip');if(e)e.scrollIntoView({behavior:'smooth',block:'center'})}
function inP(p){return currentPalkhi==='all'||p.palkhi===currentPalkhi||p.palkhi==='both'}
function isDocCat(p){return(W.hasHealth(p)||W.hasDoctor(p))&&p.type!=='Ambulance'}
// Urgency rank for list sorting (lower = more critical). Used to break distance
// ties in the mixed view and to order the no-location default.
function catPri(p){if(p.type==='Ambulance')return 0;if(W.isICU(p))return 1;if(isDocCat(p)||W.hasAmb(p))return 2;if(W.hasWater(p))return 3;if(W.isToilet(p))return 4;if(W.hasHirkani(p))return 5;if(W.isPolice(p))return 6;if(W.isCharanseva(p))return 7;if(W.isHalt(p))return 8;return 9}
function inC(p,c=cat){if(c==='near')return!W.hasWater(p);if(c==='all')return!W.hasWater(p);return false
||c==='ambulance'&&W.hasAmb(p)&&(ambSub==='all'||ambSub==='als'&&W.isALS(p)||ambSub==='bls'&&W.isBLS(p)||ambSub==='102'&&W.is102(p)||ambSub==='108'&&W.is108(p))
||c==='doc'&&isDocCat(p)&&(docSub==='all'||docSub==='phc'&&W.isPHC(p)||docSub==='rh'&&W.isRuralHospital(p)||docSub==='pvt'&&W.isPrivateHospital(p)||docSub==='hbt'&&W.isHBT(p)||docSub==='icu'&&W.isICU(p))
||c==='water'&&W.hasWater(p)&&(watSub==='all'||watSub==='actual'&&!W.isApprox(p)||watSub==='approx'&&W.isApprox(p))
||c==='toilet'&&W.isToilet(p)
||c==='police'&&W.isPolice(p)
||c==='charanseva'&&W.isCharanseva(p)
||c==='hirkani'&&W.hasHirkani(p)
||c==='halt'&&W.isHalt(p)&&(haltSub==='all'||haltSub==='mukkam'&&!W.isVisava(p)||haltSub==='visava'&&W.isVisava(p))}
function subCount(forCat,attr,val){let a=POINTS.filter(inP);return a.filter(p=>{
 if(forCat==='ambulance')return W.hasAmb(p)&&(val==='all'||val==='als'&&W.isALS(p)||val==='bls'&&W.isBLS(p)||val==='102'&&W.is102(p)||val==='108'&&W.is108(p));
 if(forCat==='doc')return isDocCat(p)&&(val==='all'||val==='phc'&&W.isPHC(p)||val==='rh'&&W.isRuralHospital(p)||val==='pvt'&&W.isPrivateHospital(p)||val==='hbt'&&W.isHBT(p)||val==='icu'&&W.isICU(p));
 if(forCat==='water')return W.hasWater(p)&&(val==='all'||val==='actual'&&!W.isApprox(p)||val==='approx'&&W.isApprox(p));
 if(forCat==='halt')return W.isHalt(p)&&(val==='all'||val==='mukkam'&&!W.isVisava(p)||val==='visava'&&W.isVisava(p));
 return false;}).length}
function updateSubChips(){[['docsub','doc','doc',()=>docSub,v=>docSub=v],['ambsub','ambulance','amb',()=>ambSub,v=>ambSub=v],['watsub','water','wat',()=>watSub,v=>watSub=v],['haltsub','halt','halt',()=>haltSub,v=>haltSub=v]].forEach(([id,forCat,attr,getv,setv])=>{
 let el=$(id);if(!el)return;let active=getv();
 el.querySelectorAll('.chip').forEach(b=>{let v=b.dataset[attr],n=subCount(forCat,attr,v),off=v!=='all'&&n===0;b.disabled=off;b.classList.toggle('disabled',off);b.title=off?'या पालखीसाठी डेटा उपलब्ध नाही':'';if(off&&active===v){active='all';setv('all')}});
 el.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset[attr]===active));
})}
function visN(pred){let a=POINTS.filter(p=>inP(p)&&okSearch(p)&&pred(p));if(refLoc()&&rad<99999999)a=a.filter(p=>{let d=dist(p);return d!=null&&d<=rad});return a.length}
function setDocSub(s){if(s!=='all'&&!subCount('doc','doc',s))s='all';docSub=s;document.querySelectorAll('#docsub .chip').forEach(b=>b.classList.toggle('active',b.dataset.doc===s));refresh()}
function setWatSub(s){if(s!=='all'&&!subCount('water','wat',s))s='all';watSub=s;document.querySelectorAll('#watsub .chip').forEach(b=>b.classList.toggle('active',b.dataset.wat===s));refresh()}
function setHaltSub(s){if(s!=='all'&&!subCount('halt','halt',s))s='all';haltSub=s;document.querySelectorAll('#haltsub .chip').forEach(b=>b.classList.toggle('active',b.dataset.halt===s));refresh()}
function setAmbSub(s){if(s!=='all'&&!subCount('ambulance','amb',s))s='all';ambSub=s;document.querySelectorAll('#ambsub .chip').forEach(b=>b.classList.toggle('active',b.dataset.amb===s));refresh()}function okSearch(p){let q=$('search').value.trim().toLowerCase();return!q||[p.label,p.type,p.place,p.vehicle,p.doctor,p.pilot,p.base,p.phase,p.date].join(' ').toLowerCase().includes(q)}
function visible(c=cat){let pool=POINTS.map((p,i)=>({...p,_idx:i,dist:dist(p)})).filter(p=>inP(p)&&okSearch(p));let all=pool.filter(p=>inC(p,c));let pts=all;
if(refLoc()&&rad<99999999){pts=all.filter(p=>p.dist!=null&&p.dist<=rad);
 if(userLocation){ // GPS mode should never dead-end; mukkam mode should stay inside the selected area.
  if(c==='near'||c==='all'){const CRIT=[W.hasAmb,isDocCat,W.isToilet,W.hasHirkani];
   for(const test of CRIT){if(pts.some(test))continue;const cand=pool.filter(p=>test(p)&&p.dist!=null).sort((a,b)=>a.dist-b.dist)[0];if(cand){cand._fb=true;pts=pts.concat([cand])}}}
  else if(!pts.length){pts=all.filter(p=>p.dist!=null).sort((a,b)=>a.dist-b.dist).slice(0,3);pts.forEach(p=>p._fb=true)}
 }
}
var mixed=(c==='all'||c==='near'); // mixed view = show urgency within a distance band
return pts.sort(function(a,b){
  if(refLoc()){
    var da=a.dist==null?9e9:a.dist, db=b.dist==null?9e9:b.dist;
    if(mixed){ // nearest-first in ~150m bands, then most-critical category within the band
      var ba=Math.floor(da/150), bb=Math.floor(db/150); if(ba!==bb)return ba-bb;
      var pa=catPri(a), pb=catPri(b); if(pa!==pb)return pa-pb;
    }
    if(da!==db)return da-db;
    return (a.label||'').localeCompare(b.label||''); // stable tie-break
  }
  // no location yet — emergency categories first, then palkhi + name
  var pa=catPri(a), pb=catPri(b); if(pa!==pb)return pa-pb;
  return (a.palkhi+a.label).localeCompare(b.palkhi+b.label);
})}
function counts(){let s=refLoc()?'':' एकूण';let set=(id,n)=>{let e=$(id);if(e)e.textContent=n+s};
let ap=POINTS.filter(p=>inP(p)&&okSearch(p)&&W.hasAmb(p));if(refLoc()&&rad<99999999)ap=ap.filter(p=>{let d=dist(p);return d!=null&&d<=rad});
set('countAmb',W.vehicleCount(ap));set('countDoc',visN(isDocCat));set('countHalt',visN(W.isHalt));set('countHirkani',visN(W.hasHirkani));set('countWater',visN(W.hasWater));set('countPolice',visN(W.isPolice));set('countCharanseva',visN(W.isCharanseva));
let tp=POINTS.filter(p=>inP(p)&&okSearch(p)&&W.isToilet(p));if(refLoc()&&rad<99999999)tp=tp.filter(p=>{let d=dist(p);return d!=null&&d<=rad});
let seats=tp.reduce((n,p)=>n+(parseInt(p.toilet)||0),0);let e=$('countToilet');if(e)e.textContent=seats.toLocaleString('en-IN')+s}
function openMapPanel(){closeHelpline();$('page').classList.add('map-open');initMap();refresh();setTimeout(()=>{if(map){map.invalidateSize(true);fitMappedArea()}$('mapPanel').scrollIntoView({behavior:'smooth',block:'start'})},100)}
function setPalkhi(p){closeHelpline();currentPalkhi=p;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.p===p));$('palkhiTitle').textContent=names[p];refresh();fitMappedArea();try{parent.postMessage({type:'PALKHI_FILTER',palkhi:p},location.origin)}catch(e){}}
function nearAll(){closeHelpline();openMapPanel();rad=1000;document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===1000));if(!userLocation){cat='near';document.querySelectorAll('.help,.legend-btn,.mini[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat==='near'));locateMe(true)}else{chooseHelp('near');if(map)map.setView(userLocation,16)}}
function chooseHelp(c){closeHelpline();cat=c;document.querySelectorAll('.help,.legend-btn,.mini[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===c));
const SUBS=[['docsub','doc','doc',v=>docSub=v],['ambsub','ambulance','amb',v=>ambSub=v],['watsub','water','wat',v=>watSub=v],['haltsub','halt','halt',v=>haltSub=v]];
SUBS.forEach(([id,forCat,attr,setv])=>{let el=$(id);if(!el)return;el.style.display=c===forCat?'flex':'none';if(c!==forCat){setv('all');el.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset[attr]==='all'))}});
openMapPanel()}function drawMukkamFocus(){if(!map||!mukkamRef)return;if(mukkamLayer){map.removeLayer(mukkamLayer)}mukkamLayer=L.layerGroup().addTo(map);L.circle(mukkamRef,{radius:rad<99999999?rad:400,color:'#d92b2b',weight:3,fillOpacity:.08}).addTo(mukkamLayer)}function setRadius(r){rad=r;document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===r));drawMukkamFocus();refresh()}function showMappedArea(){closeHelpline();cat='all';rad=99999999;$('search').value='';document.querySelectorAll('.help').forEach(b=>b.classList.remove('active'));document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===99999999));refresh();fitMappedArea()}
function firstPhone(){for(let v of arguments){let hit=splitContacts(v).find(c=>c.phone);if(hit)return hit.phone}return''}
function popContactRows(p){let rows=[['मुख्य संपर्क',p.call],['वैद्यकीय',p.mo||p.doctor],['डॉक्टर / EMSO',p.mo?p.doctor:''],['पायलट / वाहन',p.pilot]];return rows.map(([title,val])=>{let links=splitContacts(val).filter(c=>c.phone).slice(0,5).map(c=>`<a class="pcall" href="tel:${phoneHref(c.phone)}">📞 ${W.esc(c.name)} <b>${W.esc(c.phone)}</b></a>`).join('');return links?`<div class="pcontacts"><div class="pctitle">${W.esc(title)}</div><div class="pcalls">${links}</div></div>`:''}).join('')}
function popup(p){let c=firstPhone(p.call,p.mo,p.doctor,p.pilot),chips=W.services(p).map(x=>`<span class="pchip">${W.esc(x)}</span>`).join(''),cls=W.cls(p);let d=[];if(p.place&&!(p.label||'').includes(p.place))d.push('📍 '+W.esc(p.place));if(p.vehicle)d.push('🚗 '+W.esc(p.vehicle));if(p.base)d.push('🏷 '+W.esc(p.base));if(p.date)d.push('📅 '+W.esc(p.date)+(p.day?' · '+W.esc(p.day):''));let contacts=popContactRows(p);let hk=(W.hasHirkani(p)&&p.photo)?`<img class="pop-thumb" src="${W.escAttr(W.safeAsset(p.photo,HIRKANI_PHOTO))}" loading="lazy" onerror="this.remove()"/>`:'';return`<div class="pop pop-${cls}"><div class="phead"><span class="picon">${W.icon(p)}</span><div><div class="ptitle">${W.esc(p.label)}</div><div class="psub">${W.esc(W.NAMES[p.palkhi]||p.palkhi)}</div></div></div><div class="pbody"><div class="pchips">${chips}</div>${p.live?liveBlock(p.live):''}${hk}${d.length?`<div class="pdet">${d.join('<br>')}</div>`:''}${contacts}<div class="pact">${W.isHalt(p)?`<button class="pbtn call" style="border:0;cursor:pointer" onclick="nearbyAt(${p._idx})">⭕ जवळची मदत</button>`:''}${c?`<a class="pbtn call" href="tel:${phoneHref(c)}">📞 फोन करा</a>`:''}<a class="pbtn dirbtn" target="_blank" rel="noopener noreferrer" href="${dir(p)}">🧭 दिशा</a></div></div></div>`}
function drawRoute(){if(!map)return;if(routeLayer){map.removeLayer(routeLayer);routeLayer=null}
routeLayer=L.layerGroup().addTo(map);
let dny=(window.WARI_DNYANESHWAR_PUNE_ROUTE||[]).concat(window.WARI_ROUTE_DNY_EXT||[]);
let tuk=window.WARI_ROUTE_TUK||[];
if(currentPalkhi!=='tukaram'&&dny.length)L.polyline(dny,{color:'#1d5fc4',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
if(currentPalkhi!=='dnyaneshwar'&&tuk.length)L.polyline(tuk,{color:'#f4711f',weight:4,opacity:.8,lineCap:'round',lineJoin:'round'}).addTo(routeLayer);
let tr=window.WARI_ROUTE_TUK_RET||[];
if(currentPalkhi!=='dnyaneshwar'&&tr.length)L.polyline(tr,{color:'#f4711f',weight:3,opacity:.55,dashArray:'8 8'}).addTo(routeLayer);}
// Sub-centres (उपकेंद्र, 439 MRSAC pins) clutter the route-level map — show their
// PINS only when zoomed in (>=13). They always remain in the list & near-me results.
const SC_MIN_ZOOM=13;function isSC(p){return /sub-centre/i.test(p.type||'')}
let drawnPts=[],scVis=false;
function draw(pts){if(!map)return;drawnPts=pts;scVis=map.getZoom()>=SC_MIN_ZOOM;markers.forEach(m=>map.removeLayer(m));markers=[];pts.forEach(p=>{if(isSC(p)&&!scVis)return;let m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<div class="pin ${W.cls(p)} pal-${p.palkhi}${p.live?' has-live':''}${W.multi(p)?' multi':''}${W.isApprox(p)?' approx':''}">${W.icon(p)}</div>`,iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map).bindPopup(popup(p),{maxWidth:250});markers.push(m)})}
function fitMappedArea(){if(!map)return;
 // Mukkam mode: always frame the mukkam ± radius circle so the 1 km area (and its circle) is
 // reliably centred, even if 0 points fall inside. Avoids a race where fitting to all visible
 // points would zoom the map right out (to ~zoom 8) and make the cluster an invisible speck.
 if(mukkamRef&&!userLocation&&rad<99999999){var la=rad/111000,ln=rad/(111000*Math.cos(mukkamRef[0]*Math.PI/180));map.fitBounds(L.latLngBounds([mukkamRef[0]-la,mukkamRef[1]-ln],[mukkamRef[0]+la,mukkamRef[1]+ln]).pad(.15));setTimeout(()=>map.invalidateSize(true),150);return;}
 let v=visible().filter(p=>isFinite(p.lat)&&isFinite(p.lng)).map(p=>[p.lat,p.lng]);if(v.length){map.fitBounds(L.latLngBounds(v).pad(.12));setTimeout(()=>map.invalidateSize(true),150)}}
function phoneHref(raw){let s=(raw||'').replace(/[^0-9+]/g,'');return s.length===10&&/^[6-9]/.test(s)?'+91'+s:s}function phoneLink(n){n=(n||'').trim();return`<a class="phone-pill" href="tel:${phoneHref(n)}">📞 ${W.esc(n)}</a>`}function splitContacts(v){return(v||'').split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean).map(x=>{let nums=x.match(/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g)||[];let name=x.replace(/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g,'').replace(/[()]/g,'').replace(/\s+/g,' ').trim();return{name:name||'संपर्क',phone:nums[0]||''}})}
function contactSection(title,val,extra=[]){let arr=[...extra,...splitContacts(val)];if(!arr.length)return'';return`<div class="contact-section"><div class="contact-heading">${W.esc(title)}</div>${arr.map(c=>`<div class="contact-line ${c.cls||''}"><span class="contact-name">${W.esc(c.name)}</span>${c.phone?phoneLink(c.phone):''}</div>`).join('')}</div>`}
function charansevaCard(p){let route=W.NAMES[p.palkhi]||p.palkhi,when=[p.date,p.day].filter(Boolean).join(' · ');return`<article class="card charanseva charanseva-card"><span class="dist">${fd(p.dist)}</span><div class="cs-head"><img src="${W.escAttr(CHARANSEVA_PHOTO)}" alt="चरणसेवा" loading="lazy"><div><div class="cs-kicker">भक्ती विठोबाची · सेवा वारकऱ्यांची</div><div class="formatted-title">${W.esc(p.label)}</div></div></div><div class="badges">${p._fb?'<span class="badge ok">🧭 सर्वात जवळचे</span>':''}<span class="badge">${W.esc(route)}</span></div><div class="formatted-service cs-service"><b>सेवा:</b> भाविकांची चरणसेवा</div>${p.place?`<div class="formatted-field"><b>ठिकाण:</b> ${W.esc(p.place)}</div>`:''}${when?`<div class="formatted-field"><b>तारीख:</b> ${W.esc(when)}</div>`:''}${p.phase?`<div class="formatted-field"><b>पालखी:</b> ${W.esc(p.phase.replace(' चरणसेवा',''))}</div>`:''}<div class="act"><a class="dir" target="_blank" rel="noopener noreferrer" href="${dir(p)}">🧭 दिशा</a><button class="share" onclick="openShare(${p._idx})">📤 शेअर</button></div></article>`}
function card(p){if(W.isCharanseva(p))return charansevaCard(p);let c=W.tel(p.call),mems=W.isHBT(p)?'हिंदुहृदयसम्राट बाळासाहेब ठाकरे आपला दवाखाना':W.isPolice(p)?'पोलीस स्टेशन':p.mems,service=[W.NAMES[p.palkhi],mems?`(${mems})`:'' ].filter(Boolean).join(' – ');let extra=c&&W.hasAmb(p)?[{name:'रुग्णवाहिका संपर्क',phone:c,cls:'ambulance-main'}]:[];return`<article class="card ${W.cls(p)}"><span class="dist">${fd(p.dist)}</span><div class="formatted-title">${W.esc(W.hasHirkani(p)||W.isToilet(p)||W.isPolice(p)||W.isHalt(p)?p.label:(t=>{let b=p.label.replace(/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{3,4}\b/ig,'').replace(/\s*[|–-]\s*$/,'').trim();return b.startsWith(t)||/^(प्रा\.? ?आ\.? ?केंद्र|ग्रामीण रुग्णालय|उपजिल्हा रुग्णालय|महानगरपालिका रुग्णालय|खाजगी रुग्णालय|हिंदुहृदयसम्राट बाळासाहेब ठाकरे आपला दवाखाना|HBT|रुग्णालय|दवाखाना)/.test(b)?b:t+' – '+b})(W.hasAmb(p)?'रुग्णवाहिका सेवा':W.hasHospital(p)?'रुग्णालय सेवा':W.hasDoc(p)?'डॉक्टर / आरोग्य सेवा':W.hasWater(p)?'पाणी':'मदत केंद्र'))}</div><div class="badges">${p._fb?'<span class="badge ok">🧭 सर्वात जवळचे</span>':''}<span class="badge">${W.esc(W.NAMES[p.palkhi])}</span></div>${p.vehicle?`<div class="formatted-vehicle"><b>वाहन क्रमांक:</b> ${W.esc(p.vehicle)}</div>`:''}<div class="formatted-service"><b>सेवा:</b> ${W.esc(service)}</div>${p.place?`<div class="formatted-field"><b>ठिकाण:</b> ${W.esc(p.place)}</div>`:''}${p.base?`<div class="formatted-field"><b>बेस:</b> ${W.esc(p.base)}</div>`:''}${p.toilet?`<div class="formatted-field"><b>🚻 एकूण शौचालये:</b> ${W.esc(p.toilet)}${p.sites?` <b>· ठिकाणे:</b> ${W.esc(p.sites)}`:''}</div>`:''}${p.mo?contactSection('वैद्यकीय अधिकारी (MO)',p.mo):''}${contactSection(W.isPolice(p)?'पोलीस अधिकारी':W.hasHirkani(p)?'हिरकणी कक्ष संपर्क':'डॉक्टर / EMSO',p.doctor)}${contactSection('पायलट / EA / रुग्णवाहिका संपर्क',p.pilot,extra)}${p.date?`<div class="formatted-field"><b>तारीख:</b> ${W.esc(p.date)}${p.day?` · ${W.esc(p.day)}`:''}</div>`:''}${p.phase?`<div class="formatted-field"><b>टप्पा:</b> ${W.esc(p.phase)}</div>`:''}${p.live?liveBlock(p.live):''}${p.photo?hirkaniMedia(p):''}<div class="act">${W.isHalt(p)?`<button style="grid-column:1/-1;border:0;border-radius:13px;padding:10px 6px;font-weight:950;background:#f27405;color:#fff" onclick="nearbyAt(${p._idx})">⭕ या मुक्कामाजवळील सर्व मदत (१ किमी)</button>`:''}<a class="dir" target="_blank" rel="noopener noreferrer" href="${dir(p)}">🧭 दिशा</a><button class="share" onclick="openShare(${p._idx})">📤 शेअर</button></div></article>`}
// "All services from here" glance panel — the single nearest point of every
// category from the current location/mukkam, each with distance + call + directions.
var NEAR_CATS=[
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
function nearestOf(pred){let best=null,bd=Infinity;POINTS.forEach(p=>{if(!inP(p)||!pred(p))return;let d=dist(p);if(d==null)return;if(d<bd){bd=d;best=p}});return best?{p:best,d:bd}:null}
function focusNear(i){let o=(window._near||[])[i];if(!o)return;cat='all';document.querySelectorAll('.help,.legend-btn,.mini[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));openMapPanel();refresh();if(map)map.setView([o.p.lat,o.p.lng],16)}
function renderNearSummary(){let el=$('nearSummary');if(!el)return;
  if(!refLoc()){el.innerHTML='';return;}
  let where=userLocation?'तुमचे स्थान':('मुक्काम '+(mukkamName||''));
  let list=[],rows='';
  NEAR_CATS.forEach(cat_=>{let n=nearestOf(cat_.m);if(!n)return;let i=list.length;list.push(n);
    let ph=firstPhone(n.p.call,n.p.mo,n.p.doctor,n.p.pilot);
    let nm=(n.p.label||'').replace(/\s*\|\s*MH[\s\S]*$/i,'').trim();
    rows+='<div class="nrow" style="background:#fffef9;border:1px solid #eadfce;border-left:7px solid '+cat_.c+';border-radius:14px;padding:9px 11px;display:flex;align-items:center;gap:10px;margin-bottom:8px">'
      +'<div onclick="focusNear('+i+')" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer">'
        +'<div style="width:38px;height:38px;flex:0 0 auto;border-radius:12px;background:'+cat_.bg+';display:flex;align-items:center;justify-content:center;font-size:20px">'+cat_.ic+'</div>'
        +'<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:950;color:#23160d">'+cat_.s+'</div>'
        +'<div style="font-size:11.5px;color:#6b5238;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+W.esc(nm)+'</div>'
        +'<div style="font-size:11px;color:#9a3a00;font-weight:900;margin-top:1px">'+fd(n.d)+'</div></div></div>'
      +'<div style="display:flex;gap:6px;flex:0 0 auto">'
        +(ph?'<a href="tel:'+phoneHref(ph)+'" aria-label="फोन करा" style="width:38px;height:38px;border-radius:11px;background:#159653;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;text-decoration:none">📞</a>':'')
        +'<a href="'+dir(n.p)+'" target="_blank" rel="noopener noreferrer" aria-label="दिशा" style="width:38px;height:38px;border-radius:11px;background:#2f6fd6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;text-decoration:none">🧭</a>'
      +'</div></div>';
  });
  window._near=list;
  el.innerHTML=list.length?('<div style="background:#f27405;border-radius:14px;padding:11px 13px;color:#fff;margin-bottom:9px"><div style="font-size:15px;font-weight:950">📍 इथून सर्व सेवा</div><div style="font-size:12px;opacity:.92">'+W.esc(where)+' · प्रत्येक सेवेतील सर्वात जवळचे</div></div>'+rows):'';
}
function render(pts){$('list').innerHTML=pts.length?pts.slice(0,100).map(card).join(''):'<div class="card">या फिल्टरमध्ये कोणतेही मदत केंद्र सापडले नाही.</div>';initLive()}
function refresh(){updateSubChips();let pts=visible();$('count').textContent=pts.length;$('gps').textContent=(refLoc()&&rad<99999999&&!pts.length)?'या अंतरात काही नाही — मोठे अंतर निवडा':userLocation?(cat==='near'?('आसपासच्या सर्व सेवा — '+(rad<99999999?dev(rad)+' मी. परिसर':'संपूर्ण मार्ग')):'अंतरानुसार क्रम'):mukkamRef?('मुक्काम '+mukkamName+' — '+(rad<99999999?dev(rad)+' मी. परिसर':'संपूर्ण मार्ग')):'GPS सुरू नाही';drawRoute();draw(pts);render(pts);counts();renderNearSummary();if(map)setTimeout(()=>map.invalidateSize(true),100)}
// Detect the user's device so we can show the right "enable location" steps.
function deviceOS(){var ua=navigator.userAgent||'';if(/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return'ios';if(/Android/i.test(ua))return'android';return'other';}
function locHelpSteps(){var os=deviceOS(),st,head;
  if(os==='ios'){head='iPhone (Safari)';st=['फोनची <b>Settings</b> (सेटिंग्ज) उघडा','<b>Privacy &amp; Security → Location Services</b> चालू करा','त्याच यादीत खाली <b>Safari Websites</b> → <b>While Using the App</b> निवडा','या पेजवर परत येऊन खालील <b>पुन्हा प्रयत्न करा</b> दाबा'];}
  else if(os==='android'){head='Android (Chrome)';st=['स्क्रीन वरून खाली स्वाइप करा → <b>Location</b> 📍 चालू करा','पत्त्याच्या (address bar) डावीकडे <b>🔒 / ⓘ</b> दाबा → <b>Permissions → Location → Allow</b>','किंवा <b>Settings → Apps → Chrome → Permissions → Location</b> → <b>Allow</b>','परत येऊन खालील <b>पुन्हा प्रयत्न करा</b> दाबा'];}
  else{head='तुमचे डिव्हाइस';st=['फोन / ब्राउझरमध्ये <b>Location</b> सुरू करा','या साइटला स्थानाची <b>अनुमती</b> द्या','<b>पुन्हा प्रयत्न करा</b> दाबा'];}
  return{head:head,steps:st};}
function showLocHelp(){var h=locHelpSteps();var old=document.getElementById('lochelp');if(old)old.remove();
  var rows=h.steps.map(function(s,i){return '<div style="display:flex;gap:10px;align-items:flex-start;margin-top:10px"><span style="flex:0 0 22px;height:22px;border-radius:50%;background:#f2740522;color:#a44900;font-weight:900;font-size:12px;display:grid;place-items:center">'+(i+1)+'</span><span style="font-size:13px;color:#3a2b1d;font-weight:700;line-height:1.45">'+s+'</span></div>';}).join('');
  var d=document.createElement('div');d.id='lochelp';d.setAttribute('style','position:fixed;inset:0;background:rgba(35,22,13,.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center');d.setAttribute('onclick','closeLocHelp(event)');
  d.innerHTML='<div onclick="event.stopPropagation()" style="background:#fffef9;width:100%;max-width:470px;border-radius:22px 22px 0 0;padding:20px 18px 22px;max-height:85dvh;overflow:auto"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:26px">📍</span><b style="font-size:18px;color:#23160d">स्थान (Location) बंद आहे</b></div><p style="font-size:12.5px;color:#5a4430;font-weight:800;margin:0 0 4px">जवळची मदत दाखवण्यासाठी स्थान सुरू करा · <b>'+h.head+'</b></p>'+rows+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px"><button onclick="closeLocHelp()" style="border:0;border-radius:13px;padding:12px;font-weight:900;background:#f4ecd9;color:#24170c">बंद करा</button><button onclick="closeLocHelp();locateMe(true)" style="border:0;border-radius:13px;padding:12px;font-weight:900;background:#f27405;color:#fff">📍 पुन्हा प्रयत्न करा</button></div></div>';
  document.body.appendChild(d);}
function closeLocHelp(e){if(e&&e.target&&e.target.id!=='lochelp')return;var d=document.getElementById('lochelp');if(d)d.remove();}
function locateMe(quiet){closeHelpline();if(!quiet)openMapPanel();if(!navigator.geolocation){$('gps').textContent='या फोनवर स्थान सुविधा उपलब्ध नाही';showLocHelp();return}$('gps').textContent='GPS स्थान घेत आहोत…';navigator.geolocation.getCurrentPosition(pos=>{userLocation=[pos.coords.latitude,pos.coords.longitude];loadWeather(userLocation[0],userLocation[1],'तुमचे स्थान');try{window.wariLoc&&window.wariLoc(userLocation[0],userLocation[1])}catch(e){}mukkamRef=null;mukkamName='';if(mukkamLayer&&map){map.removeLayer(mukkamLayer);mukkamLayer=null}document.querySelectorAll('#mukkams .mchip').forEach(b=>b.classList.remove('active'));rad=1000;document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===1000));if(map){if(userMarker)map.removeLayer(userMarker);if(accCircle)map.removeLayer(accCircle);accCircle=L.circle(userLocation,{radius:Math.max(pos.coords.accuracy||30,30),className:'accuracy'}).addTo(map);userMarker=L.marker(userLocation,{icon:L.divIcon({className:'',html:'<div class="userpin"></div>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(map).bindPopup('📍 आपण येथे आहात').openPopup();map.setView(userLocation,cat==='near'?16:14)}refresh();$('gps').textContent=`तुमच्या जवळची मदत · अचूकता ${Math.round(pos.coords.accuracy)} मी.`},err=>{$('gps').textContent=err&&err.code===1?'स्थान परवानगी नाकारली. सेटिंग्जमध्ये परवानगी द्या.':err&&err.code===3?'GPS वेळेत मिळाले नाही. पुन्हा प्रयत्न करा.':'GPS मिळाले नाही. पुन्हा प्रयत्न करा.';if(err&&(err.code===1||err.code===2))showLocHelp()},{enableHighAccuracy:true,timeout:15000,maximumAge:20000})}
// Dept requirement: tapping a halt/mukkam point anchors there and shows ALL
// services (except water) within 1 km — on the map and in the cards below.
function nearbyAt(i){let p=POINTS[i];if(!p)return;closeHelpline();
mukkamRef=[p.lat,p.lng];mukkamName=p.label;userLocation=null;rad=1000;try{window.wariLoc&&window.wariLoc(p.lat,p.lng)}catch(e){}
document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===1000));
document.querySelectorAll('#mukkams .mchip').forEach(b=>b.classList.remove('active'));
cat='all';document.querySelectorAll('.help,.legend-btn,.mini[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
openMapPanel();if(map){drawMukkamFocus();map.setView(mukkamRef,14)}
refresh();$('gps').textContent=(p.label||'मुक्काम')+' — १ किमी परिसरातील सर्व मदत'}
function openShare(i){selectedPoint=POINTS[i]?.label||'';$('modal').classList.add('open')}function closeModal(e){if(!e||e.target.id==='modal'||e.target.textContent==='रद्द करा')$('modal').classList.remove('open')}function shareCurrentLocation(){let d=$('dindi').value.trim(),issue=$('issue').value,loc=userLocation?`https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`:'स्थान उपलब्ध नाही',msg=`वारी मदत विनंती%0A${encodeURIComponent(issue)}%0A${d?encodeURIComponent('दिंडी/नाव: '+d)+'%0A':''}${selectedPoint?encodeURIComponent('जवळचे मदत केंद्र: '+selectedPoint)+'%0A':''}${encodeURIComponent('माझे स्थान: ')}${encodeURIComponent(loc)}`;if(navigator.share)navigator.share({title:'वारी मदत विनंती',text:decodeURIComponent(msg.replaceAll('%0A','\n'))}).catch(()=>{});else window.open('https://wa.me/?text='+msg,'_blank','noopener,noreferrer');closeModal()}
function chooseMukkam(i){closeHelpline();let m=window.WARI_MUKKAMS[i];if(!m)return;
mukkamRef=[m.lat,m.lng];mukkamName=m.n;userLocation=null;rad=MUKKAM_DEFAULT_RADIUS;try{window.wariLoc&&window.wariLoc(m.lat,m.lng)}catch(e){}
document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===MUKKAM_DEFAULT_RADIUS));
// Dept requirement: mukkam click shows ALL services (except water) within 1 km, not just the active category
cat='all';document.querySelectorAll('.help,.legend-btn,.mini[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat==='all'));
document.querySelectorAll('#mukkams .mchip').forEach(b=>b.classList.toggle('active',b.dataset.mukkam===String(i)));
if(currentPalkhi!==m.pal)setPalkhi(m.pal);
openMapPanel();
if(map){drawMukkamFocus();map.setView(mukkamRef,13)}
refresh();$('gps').textContent='मुक्काम '+m.n+' ('+(m.d||'तारीख निश्चित नाही')+') — '+dev(rad)+' मी. परिसर';}
function clearMukkam(){mukkamRef=null;mukkamName='';if(mukkamLayer&&map){map.removeLayer(mukkamLayer);mukkamLayer=null}
document.querySelectorAll('#mukkams .mchip').forEach(b=>b.classList.remove('active'));
let R=cat==='near'?300:500;rad=R;document.querySelectorAll('#rads .chip').forEach(b=>b.classList.toggle('active',+b.dataset.r===R));refresh();if(cat!=='near')fitMappedArea()}
(function(){let el=$('mukkams');if(!el||!window.WARI_MUKKAMS)return;
let h='<button class="mchip clear" onclick="clearMukkam()">🗺 सर्व मार्ग</button>';
window.WARI_MUKKAMS.forEach((m,i)=>{let ic=m.pal==='tukaram'?'🟠':'🔵';
h+='<button class="mchip" data-mukkam="'+i+'" onclick="chooseMukkam('+i+')">'+ic+' '+(m.d?m.d+' · ':'')+m.n+'</button>'});
el.innerHTML=h})();
(function(){try{if(localStorage.getItem('wariLocAsk'))return;}catch(e){return}
let b=document.createElement('div');b.id='locask';
b.innerHTML='<div class="locask-card"><div class="locask-ic">📍</div><b>जवळची मदत दाखवण्यासाठी<br>तुमचे स्थान (GPS) सुरू करा</b><small>रुग्णवाहिका, डॉक्टर, पाणी — तुमच्या अंतरानुसार दिसतील</small><div class="locask-btns"><button class="la-yes" onclick="locAskYes()">📍 स्थान द्या</button><button class="la-no" onclick="locAskNo()">नंतर</button></div></div>';
document.body.appendChild(b)})();
function locAskDone(){try{localStorage.setItem('wariLocAsk','1')}catch(e){}let b=document.getElementById('locask');if(b)b.remove()}
function locAskYes(){locAskDone();locateMe(true);window.scrollTo({top:0})}
function locAskNo(){locAskDone()}
initMap();refresh();renderClips();setTimeout(fitMappedArea,300);addEventListener('resize',()=>{if(map)setTimeout(()=>map.invalidateSize(true),150)});

/* Weather card — open-meteo (no key). Rain-focused, degrades to a plain AccuWeather link if offline/blocked. */
function wxDesc(c){if(c===0)return['☀️','स्वच्छ'];if(c<=2)return['🌤️','थोडे ढग'];if(c===3)return['☁️','ढगाळ'];if(c===45||c===48)return['🌫️','धुके'];if(c>=51&&c<=57)return['🌦️','रिमझिम'];if(c>=61&&c<=67)return['🌧️','पाऊस'];if(c>=71&&c<=77)return['🌨️','बर्फ'];if(c>=80&&c<=82)return['🌧️','सरी'];if(c>=95)return['⛈️','गडगडाटी पाऊस'];return['🌡️','—']}
function loadWeather(lat,lng,place){var u='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lng+'&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=1';fetch(u).then(r=>r.json()).then(d=>{if(!d||!d.current)throw 0;var wd=wxDesc(d.current.weather_code),set=function(id,v){var e=$(id);if(e)e.textContent=v};var ic=$('wxIcon');if(ic)ic.textContent=wd[0];if(place)set('wxPlace',place);set('wxCond',wd[1]);set('wxTemp',Math.round(d.current.temperature_2m)+'°');var rp=(d.daily&&d.daily.precipitation_probability_max)?d.daily.precipitation_probability_max[0]:null;set('wxRain',rp!=null?rp+'%':'—')}).catch(()=>{var co=$('wxCond'),tm=$('wxTemp');if(co)co.textContent='तपशीलांसाठी दाबा ↗';if(tm)tm.textContent=''})}
loadWeather(18.5204,73.8567,'पुणे');

/* ---- Offline maps: one-time background download of route-corridor tiles ----
   Government-deployment requirement: the map must work with NO network. Leaflet is bundled
   locally; here we pre-download OpenStreetMap tiles along both palkhi routes so the map is
   usable offline. Runs once, only when online, in the background via the service worker
   (which stores them in a persistent cache that survives app updates). ~20 MB. */
(function(){
  var FLAG='wariTilesPrecached_v4';
  function lon2t(lon,z){return Math.floor((lon+180)/360*Math.pow(2,z));}
  function lat2t(lat,z){var r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*Math.pow(2,z));}
  function buildTileList(){
    var pts=(window.WARI_MUKKAMS||[]).filter(function(m){return isFinite(m.lat)&&isFinite(m.lng);});
    if(!pts.length)return [];
    var set={}, cap=2600;
    function add(z,x,y){var n=Math.pow(2,z);if(x<0||y<0||x>=n||y>=n)return;set[z+'/'+x+'/'+y]=1;}
    // Overview: PADDED bounding box of the whole route at low zoom so the wide desktop
    // overview is fully covered (no blank / OSM-blocked tiles).
    var PAD=0.35;
    var lats=pts.map(function(p){return p.lat;}),lngs=pts.map(function(p){return p.lng;});
    var minLa=Math.min.apply(null,lats)-PAD,maxLa=Math.max.apply(null,lats)+PAD,minLo=Math.min.apply(null,lngs)-PAD,maxLo=Math.max.apply(null,lngs)+PAD;
    [6,7,8,9,10,11].forEach(function(z){
      var x0=lon2t(minLo,z),x1=lon2t(maxLo,z),y0=lat2t(maxLa,z),y1=lat2t(minLa,z);
      for(var x=x0;x<=x1;x++)for(var y=y0;y<=y1;y++)add(z,x,y);
    });
    // Corridor: 3×3 tile block around each mukkam at the zooms used for the 1 km view
    pts.forEach(function(p){
      [12,13,14].forEach(function(z){
        var cx=lon2t(p.lng,z),cy=lat2t(p.lat,z);
        for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)add(z,cx+dx,cy+dy);
      });
    });
    // Continuous corridor: follow the route polylines so the map is covered BETWEEN mukkams too
    // (a warkari walking the road, not only at overnight stops). Dense vertices → contiguous tiles.
    [window.WARI_ROUTE_TUK,window.WARI_ROUTE_TUK_RET,window.WARI_ROUTE_DNY_EXT,window.WARI_DNYANESHWAR_PUNE_ROUTE].forEach(function(route){
      if(!Array.isArray(route))return;
      route.forEach(function(c){
        if(!c||!isFinite(c[0])||!isFinite(c[1]))return;
        [12,13,14].forEach(function(z){add(z,lon2t(c[1],z),lat2t(c[0],z));});
      });
    });
    var keys=Object.keys(set).slice(0,cap);
    // Local bundled tiles (served by our own server) — absolute URLs so the SW caches them
    // under a stable key. SW falls back to OSM only if a local tile is genuinely missing.
    return keys.map(function(k){return new URL('./assets/tiles/'+k+'.png',location.href).href;});
  }
  function setStatus(t){var e=document.getElementById('offlineStatus');if(e)e.textContent=t;}
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('message',function(e){
      if(!e.data)return;
      if(e.data.type==='TILES_PROGRESS'){setStatus('नकाशा उतरवत आहे… '+Math.round(e.data.done/e.data.total*100)+'%');}
      if(e.data.type==='TILES_DONE'){localStorage.setItem(FLAG,'1');setStatus('✓ ऑफलाइन नकाशा तयार');}
    });
  }
  function kick(){
    try{
      if(!navigator.onLine)return;
      if(localStorage.getItem(FLAG))return;
      if(!navigator.serviceWorker||!navigator.serviceWorker.controller)return;
      var urls=buildTileList();
      if(!urls.length)return;
      navigator.serviceWorker.controller.postMessage({type:'PRECACHE_TILES',urls:urls});
    }catch(e){}
  }
  // give the SW time to take control on first load, then start in the background
  if(navigator.serviceWorker&&navigator.serviceWorker.controller){setTimeout(kick,4000);}
  else if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',function(){setTimeout(kick,4000);});}
  window.addEventListener('online',kick);
})();
