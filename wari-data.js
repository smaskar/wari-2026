window.WariData=(function(){
  const RE_PHONE=/(?:\+?91[\s-]?)?[6-9]\d{9}|0\d{2,4}[\s-]?\d{6,8}|1800[\s-]?\d{2,4}[\s-]?\d{3,4}|155388|1075|1077|104|102/g;
  const NAMES={all:'दोन्ही पालख्या',both:'दोन्ही पालख्या',dnyaneshwar:'श्री संत ज्ञानेश्वर महाराज',tukaram:'जगद्गुरू श्री संत तुकाराम महाराज'};
  function cleanVeh(v){v=(v||'').trim();return /\d{3,4}/.test(v)?v:''}
  function norm(x,def){return{palkhi:x.p||x.palkhi||def||'dnyaneshwar',type:x.type||x.t||'',label:x.label||x.l||'',place:x.place||x.pl||'',base:x.base||x.b||'',vehicle:cleanVeh(x.vehicle||x.v||''),mems:x.mems||x.m||'',call:x.call||x.c||'',doctor:x.doctor||x.d||'',pilot:x.pilot||x.pi||'',mo:x.mo||'',live:x.live||'',toilet:x.toilet||'',sites:x.sites||'',lat:+x.lat,lng:+x.lng,ready:x.ready||x.r||'',date:x.date||x.dt||'',phase:x.phase||x.ph||''}}
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
  function isICU(p){return /\bicu\b|trauma|ट्रॉमा/i.test([p.type,p.label,p.place,p.base].join(' '))}
  function isApprox(p){return /अंदाजे/.test([p.type,p.label].join(' '))}
  function isVisava(p){return isHalt(p)&&/rest|विश्रांती|विसावा/i.test([p.type,p.label].join(' '))}
  function cls(p){return hasHirkani(p)?'hirkani':isToilet(p)?'toilet':isHalt(p)?'halt':hasHealth(p)?'health':hasAmb(p)?'ambulance':hasWater(p)?'water':'other'}
  function services(p){var s=[];
    if(isICU(p))s.push('⛑ ICU/ट्रॉमा');
    if(isRuralHospital(p))s.push('🏥 ग्रामीण रुग्णालय');
    if(isPHC(p))s.push('🩺 प्रा. आ. केंद्र');
    if(isHBT(p))s.push('🏩 HBT दवाखाना');
    if(isPrivateHospital(p))s.push('🏨 खाजगी रुग्णालय');
    if(hasAmb(p)){if(is108(p))s.push('🚑 १०८');if(is102(p))s.push('🚑 १०२');if(isALS(p))s.push('🚑 ALS');if(isBLS(p))s.push('🚑 BLS');if(!is108(p)&&!is102(p)&&!isALS(p)&&!isBLS(p))s.push('🚑 रुग्णवाहिका');}
    if(hasHirkani(p))s.push('🤱 हिरकणी कक्ष');
    if(isHalt(p))s.push('⛺ मुक्काम');
    if(hasWater(p))s.push(/अंदाजे/.test((p.type||''))?'💧 पाणी — अंदाजे ठिकाण':'💧 पाणी टँकर');
    if(p.toilet)s.push('🚻 शौचालये: '+p.toilet+(p.sites?' · ठिकाणे: '+p.sites:''));
    if(p.mo)s.push('🧑‍⚕️ वैद्यकीय अधिकारी');
    return s;}
  function multi(p){return services(p).filter(x=>!/शौचालये|वैद्यकीय अधिकारी/.test(x)).length>1}
  function icon(p){return hasHirkani(p)?'🤱':isToilet(p)?'🚻':isHalt(p)?'⛺':hasHospital(p)?'🏥':hasDoc(p)?'🩺':hasAmb(p)?'🚑':hasWater(p)?'💧':'📍'}
  function esc(s){return(s||'').toString().replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}
  function tel(s){return(s||'').replace(/[^0-9+]/g,'')}
  function countContacts(v){return(v||'').split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean).reduce((n,x)=>n+((x.match(RE_PHONE)||[x]).length),0)}
  function uniqueCount(arr,fn){let s=new Set();arr.forEach(p=>{let k=fn(p);if(k)s.add(k)});return s.size}
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
    let rawFP=(window.WARI_FILLING_POINTS||[]).map(x=>norm(x,'dnyaneshwar'));
    let notHaltType=p=>!/halt|mukkam|मुक्काम/i.test(p.type||'');
    let pts=[...rawD.filter(notHaltType),...rawT.filter(notHaltType),...rawHD,...rawHT,...rawS.filter(notHaltType),...rawHK,...rawPV,...rawSOL,...rawW,...rawTL,...rawFP]
      .filter(p=>isFinite(p.lat)&&isFinite(p.lng));
    let seen=new Set();
    pts=pts.filter(p=>{let key=[p.palkhi,p.type,p.label,p.place,p.vehicle,p.lat.toFixed(5),p.lng.toFixed(5)].join('|').toLowerCase();if(seen.has(key))return false;seen.add(key);return true});
    // drop uncallable ambulance markers (no vehicle number AND no phone)
    pts=pts.filter(p=>!(/रुग्णवाहिका सेवा/.test(p.label)&&!p.vehicle&&!p.call));
    // one pin per ambulance: collapse repeated route-waypoints of the same vehicle (per palkhi)
    let vseen=new Set(),vkeep=new Array(pts.length).fill(true);
    pts.map((p,i)=>[p,i]).sort((a,b)=>(hasHealth(a[0])?0:1)-(hasHealth(b[0])?0:1)||a[1]-b[1]).forEach(([p,i])=>{
      if(!hasAmb(p)||!p.vehicle)return;
      let vk=p.palkhi+'|'+p.vehicle.replace(/[\s-]/g,'').toUpperCase();
      if(vseen.has(vk))vkeep[i]=false;else vseen.add(vk);
    });
    pts=pts.filter((p,i)=>vkeep[i]);
    return pts;
  }
  return{NAMES,build,isHalt,hasAmb,hasDoc,hasHospital,hasHealth,hasWater,hasHirkani,isSatara,isPHC,isRuralHospital,isHBT,isPrivateHospital,hasDoctor,isEMS,isMO,isALS,isBLS,is102,is108,cls,icon,isToilet,isICU,isApprox,isVisava,services,multi,esc,tel,countContacts,uniqueCount};
})();