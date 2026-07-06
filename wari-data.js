window.WariData=(function(){
  const RE_PHONE=/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g;
  const NAMES={all:'दोन्ही पालख्या',both:'दोन्ही पालख्या',dnyaneshwar:'श्री संत ज्ञानेश्वर महाराज',tukaram:'जगद्गुरू श्री संत तुकाराम महाराज'};
  const MN={1:'जानेवारी',2:'फेब्रुवारी',3:'मार्च',4:'एप्रिल',5:'मे',6:'जून',7:'जुलै',8:'ऑगस्ट',9:'सप्टेंबर',10:'ऑक्टोबर',11:'नोव्हेंबर',12:'डिसेंबर'};
  function nd(s){return String(s).replace(/[०-९]/g,ch=>'०१२३४५६७८९'.indexOf(ch))}
  function md(n){return String(n).replace(/[0-9]/g,d=>'०१२३४५६७८९'[d])}
  function cleanInfo(v){
    return (v||'').toString()
      .replace(/अधिकृत MEMS\/संस्थान वेळापत्रकाशी जुळवले \(जाताना\)\s*·\s*परतीचा: SBM संदर्भ/g,'')
      .replace(/अधिकृत MEMS\/संस्थान वेळापत्रक/g,'')
      .replace(/MEMS पुस्तिका\s*[०-९0-9.\/-]+/g,'')
      .replace(/मागील वर्ष\s*[–-]\s*संदर्भ यादी\s*\(पडताळणी करा\)/g,'')
      .replace(/पुढील मुक्काम\s*[–-]\s*तारीख विभागाकडून/g,'')
      .replace(/\s*·\s*[^·]*(?:जि\.प\. My Maps GPS|My Maps GPS)[^·]*/g,'')
      .replace(/जि\.प\. My Maps:\s*/g,'')
      .replace(/\s*·\s*जि\.प\. My Maps\b/g,'')
      .replace(/जि\.प\. My Maps\s*[—-]\s*/g,'')
      .replace(/\s*\(जि\.प\. नकाशा\)/g,'')
      .replace(/\s*\(?अचूक GPS\)?/g,'')
      .replace(/\s*\(SOP पान [^)]+\)/g,'')
      .replace(/SOP पान\s*[०-९0-9-]+/g,'')
      .replace(/([०-९0-9]{1,2})\.([०-९0-9]{2})(?=\s|$)/g,(m,d,mo)=>{let mm=+nd(mo);return MN[mm]?md(+nd(d))+' '+MN[mm]:m})
      .replace(/\s*·\s*$/,'')
      .replace(/^\s*·\s*/,'')
      .replace(/\s{2,}/g,' ')
      .trim()
  }
  function cleanVeh(v){v=(v||'').trim();return /\d{3,4}/.test(v)?v:''}
  function norm(x,def){return{palkhi:x.p||x.palkhi||def||'dnyaneshwar',type:x.type||x.t||'',label:cleanInfo(x.label||x.l||''),place:cleanInfo(x.place||x.pl||''),base:cleanInfo(x.base||x.b||''),vehicle:cleanVeh(x.vehicle||x.v||''),mems:x.mems||x.m||'',call:x.call||x.c||'',doctor:x.doctor||x.d||'',pilot:x.pilot||x.pi||'',mo:x.mo||'',live:x.live||'',photo:x.photo||'',toilet:x.toilet||'',sites:x.sites||'',lat:+x.lat,lng:+x.lng,ready:x.ready||x.r||'',date:cleanInfo(x.date||x.dt||''),day:x.day||'',phase:cleanInfo(x.phase||x.ph||'')}}
  function txt(p){return[p.type,p.label,p.place,p.base,p.mems,p.phase].join(' ').toLowerCase()}
  function isHalt(p){return /halt|mukkam|मुक्काम/i.test(p.type||'')}
  function hasAmb(p){return /ambulance|102|108|रुग्णवाहिका/i.test([p.type,p.label,p.mems].join(' '))||/\b[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{3,4}\b/i.test(p.vehicle||'')}
  function hasDoc(p){return isPHC(p)||isHBT(p)}
  function hasHospital(p){return isRuralHospital(p)||isPrivateHospital(p)}
  function hasHealth(p){return hasDoc(p)||hasHospital(p)}
  function hasWater(p){return /water|पाणी/i.test([p.type,p.label].join(' '))}
  function hasHirkani(p){return /hirkani|हिरकणी/i.test([p.type,p.label,p.mems].join(' '))}
  function isSatara(p){return /satara|lonand|tardgaon|taradgaon|phaltan|barad|khandala|dahiwadi|koregaon|sakharwadi|girvi|rajale/i.test([p.mems,p.phase,p.place,p.base,p.label].join(' '))}
  function isPHC(p){return /\bphc\b/i.test(p.type||'')}
  function isRuralHospital(p){var t=p.type||'';return /rural/i.test(t)&&/hospital/i.test(t)}
  function isHBT(p){return p.type==='HBT'}
  function isPrivateHospital(p){return p.type==='Hospital'}
  function isMO(p){return isPHC(p)||isRuralHospital(p)||isHBT(p)}
  function isEMS(p){return hasAmb(p)&&!isMO(p)}
  function hasDoctor(p){return isMO(p)||isEMS(p)}
  function isALS(p){return hasAmb(p)&&/\bALS\b/i.test(p.mems||'')}
  function isBLS(p){return hasAmb(p)&&/\bBLS\b/i.test(p.mems||'')}
  function is102(p){return hasAmb(p)&&/102|१०२/.test([p.mems,p.type,p.label].join(' '))}
  function is108(p){return hasAmb(p)&&/108|१०८/.test([p.mems,p.type,p.label].join(' '))}
  function isToilet(p){return /शौचालये|toilet/i.test(p.type||'')}
  function isPolice(p){return /police|पोलीस/i.test(p.type||'')}
  function isCharanseva(p){return /charanseva|चरणसेवा/i.test([p.type,p.label,p.mems].join(' '))}
  function isICU(p){return /\bicu\b|trauma|ट्रॉमा/i.test([p.type,p.label,p.place,p.base].join(' '))}
  function isApprox(p){return /अंदाजे/.test([p.type,p.label].join(' '))}
  function isVisava(p){return isHalt(p)&&/rest|विश्रांती|विसावा/i.test([p.type,p.label].join(' '))}
  function cls(p){return isCharanseva(p)?'charanseva':isPolice(p)?'police':hasHirkani(p)?'hirkani':isToilet(p)?'toilet':isHalt(p)?'halt':hasHealth(p)?'health':hasAmb(p)?'ambulance':hasWater(p)?'water':'other'}
  function services(p){var s=[];
    if(isCharanseva(p))s.push('🙏 चरणसेवा');
    if(isICU(p))s.push('⛑ ICU/ट्रॉमा');
    if(isPolice(p))s.push('🚔 पोलीस स्टेशन');
    if(isRuralHospital(p))s.push('🏥 ग्रामीण रुग्णालय');
    if(isPHC(p))s.push('🩺 प्रा. आ. केंद्र');
    if(isHBT(p))s.push('🏩 हिंदुहृदयसम्राट बाळासाहेब ठाकरे आपला दवाखाना');
    if(isPrivateHospital(p))s.push('🏨 खाजगी रुग्णालय');
    if(hasAmb(p)){if(is108(p))s.push('🚑 १०८');if(is102(p))s.push('🚑 १०२');if(isALS(p))s.push('🚑 ALS');if(isBLS(p))s.push('🚑 BLS');if(!is108(p)&&!is102(p)&&!isALS(p)&&!isBLS(p))s.push('🚑 रुग्णवाहिका');}
    if(hasHirkani(p))s.push('🤱 हिरकणी कक्ष');
    if(isHalt(p))s.push('⛺ मुक्काम');
    if(hasWater(p))s.push(/अंदाजे/.test((p.type||''))?'💧 पाणी — अंदाजे ठिकाण':'💧 पाणी टँकर');
    if(p.toilet)s.push('🚻 शौचालये: '+p.toilet+(p.sites?' · ठिकाणे: '+p.sites:''));
    if(p.mo)s.push('🧑‍⚕️ वैद्यकीय अधिकारी');
    return s;}
  function multi(p){return services(p).filter(x=>!/शौचालये|वैद्यकीय अधिकारी/.test(x)).length>1}
  function icon(p){return isCharanseva(p)?'🙏':isPolice(p)?'🚔':hasHirkani(p)?'🤱':isToilet(p)?'🚻':isHalt(p)?'⛺':hasHospital(p)?'🏥':hasDoc(p)?'🩺':hasAmb(p)?'🚑':hasWater(p)?'💧':'📍'}
  function esc(s){return(s||'').toString().replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function escAttr(s){return esc(s)}
  function safeAsset(src,fallback){src=(src||'').toString().trim();return /^\.\/assets\/[A-Za-z0-9/_.,% -]+\.(?:png|jpe?g|webp|gif|mp4)$/i.test(src)?src:(fallback||'')}
  function safeExternalUrl(url){url=(url||'').toString().trim();try{let u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return''}}
  function tel(s){return(s||'').replace(/[^0-9+]/g,'')}
  function vehKey(v){return(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
  function vehicleKeys(v){let m=(v||'').toUpperCase().match(/MH\s*-?\s*\d{1,2}\s*-?\s*[A-Z]{1,3}\s*-?\s*\d{3,4}/g)||[];return m.map(vehKey)}
  function vehicleCount(arr){let s=new Set();arr.forEach(p=>{(p.vehicle||'').toUpperCase().replace(/[\s-]/g,'').replace(/[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4}/g,m=>{s.add(m);return m})});return s.size}
  function countContacts(v){return(v||'').split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean).reduce((n,x)=>n+((x.match(RE_PHONE)||[x]).length),0)}
  function uniqueCount(arr,fn){let s=new Set();arr.forEach(p=>{let k=fn(p);if(k)s.add(k)});return s.size}
  function applyAmbContacts(pts){let src=window.WARI_AMB_CONTACTS_2026||[];if(!src.length)return pts;let by={};src.forEach(c=>{let k=c.key||vehKey(c.vehicle);if(k)by[k]=c});pts.forEach(p=>{let c=vehicleKeys(p.vehicle).map(k=>by[k]).find(Boolean);if(!c)return;p.doctor=c.doctor||p.doctor;p.pilot=c.pilot||p.pilot;p.call=c.call||p.call;if(c.mems)p.mems=c.mems;if(c.base){if(!p.base)p.base=c.base;else if(!p.base.includes(c.base))p.base+=' · वाहन बेस: '+c.base;}});return pts}
  function build(){
    let rawD=[];try{rawD=JSON.parse((window.WARI_POINT_CHUNKS||[]).join('')).map(x=>norm(x,'dnyaneshwar'))}catch(e){rawD=[]}
    let rawT=(window.WARI_TUKARAM_POINTS||[]).map(x=>norm(x,'tukaram'));
    let rawHD=(window.WARI_DNYANESHWAR_HALT_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawHT=(window.WARI_TUKARAM_HALT_POINTS||[]).map(x=>norm(x,'tukaram'));
    let rawS=(window.WARI_SATARA_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawHK=(window.WARI_HIRKANI_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawPV=(window.WARI_PRIVATE_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawSOL=(window.WARI_SOLAPUR_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawW=(window.WARI_WATER_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawTL=(window.WARI_TOILET_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawPO=(window.WARI_POLICE_POINTS||[]).map(x=>norm(x,x.p||'both'));
    let rawCS=(window.WARI_CHARANSEVA_POINTS||[]).map(x=>norm(x,x.p||'both'));
    let rawFP=(window.WARI_FILLING_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawP2=(window.WARI_PHC102_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let rawVS=(window.WARI_VISAVA_POINTS||[]).map(x=>norm(x,x.p||'dnyaneshwar'));
    let rawMM=(window.WARI_MYMAPS_POINTS||[]).map(x=>norm(x,x.p||'dnyaneshwar'));
    let rawMB=(window.WARI_MEMSBOOK_POINTS||[]).map(x=>norm(x,x.p||'dnyaneshwar'));
    let notHaltType=p=>!/halt|mukkam|मुक्काम/i.test(p.type||'');
    let pts=[...rawD.filter(notHaltType),...rawT.filter(notHaltType),...rawHD,...rawHT,...rawS.filter(notHaltType),...rawHK,...rawPV,...rawSOL,...rawW,...rawTL,...rawPO,...rawCS,...rawFP,...rawP2,...rawVS,...rawMM,...rawMB]
      .filter(p=>isFinite(p.lat)&&isFinite(p.lng));
    let seen=new Set();
    pts=pts.filter(p=>{let key=[p.palkhi,p.type,p.label,p.place,p.vehicle,p.date,p.day,p.lat.toFixed(5),p.lng.toFixed(5)].join('|').toLowerCase();if(seen.has(key))return false;seen.add(key);return true});
    // field-verified 04/07: MEMS route waypoints are real deployment positions (e.g. दिवे घाट chain) —
    // keep ALL of them, incl. no-contact staging points; ambulance card counts distinct vehicles, not pins.
    pts.forEach(p=>{if(/रुग्णवाहिका सेवा/.test(p.label)&&!p.vehicle&&!p.call&&!/अंदाजे|पडताळणी|तैनाती/.test(p.label))p.label+=' (तैनाती बिंदू — संपर्क विभागाकडे)';});
    // merge pins with identical label+coords (e.g. two ambulances staged at one point) into one pin
    (function(){const bykey={},out=[];pts.forEach(p=>{const k=(p.label||'')+'|'+(p.date||'')+'|'+(p.day||'')+'@'+p.lat.toFixed(5)+','+p.lng.toFixed(5);const t=bykey[k];if(t){['vehicle','doctor','pilot'].forEach(f=>{if(p[f]&&!(t[f]||'').includes(p[f]))t[f]=t[f]?t[f]+'; '+p[f]:p[f]});if(!t.call&&p.call)t.call=p.call;}else{bykey[k]=p;out.push(p)}});pts=out})();
    // attach 102-fleet vehicles/drivers to existing facility pins (exact label-prefix match)
    (window.WARI_AMB_SUPPLEMENT||[]).forEach(sup=>{
      let t=pts.find(p=>(p.label||'').indexOf(sup.m)===0);
      if(!t)return;
      t.vehicle=t.vehicle?t.vehicle+'; '+sup.v:sup.v;
      t.pilot=t.pilot?t.pilot+'; '+sup.d:sup.d;
      if(!/102|१०२/.test(t.mems||''))t.mems=(t.mems?t.mems+' ':'')+'102';
    });
    applyAmbContacts(pts);
    return pts;
  }
  return{NAMES,build,isHalt,hasAmb,hasDoc,hasHospital,hasHealth,hasWater,hasHirkani,isSatara,isPHC,isRuralHospital,isHBT,isPrivateHospital,hasDoctor,isEMS,isMO,isALS,isBLS,is102,is108,cls,icon,isToilet,isPolice,isCharanseva,isICU,isApprox,isVisava,services,multi,esc,escAttr,safeAsset,safeExternalUrl,tel,countContacts,uniqueCount,vehicleCount};
})();
