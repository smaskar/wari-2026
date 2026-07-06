// Leadership strip — names/designations as provided 2026-07-03 (hoarding order = protocol order).
// Photos cropped from campaign hoarding (low-res); swap files in assets/img/leaders/ when originals arrive.
window.WARI_DIGNITARIES=[
 {n:"मा. ना. देवेंद्र फडणवीस",d:"मुख्यमंत्री, महाराष्ट्र राज्य",img:"./assets/img/leaders/l1.jpg"},
 {n:"मा. ना. एकनाथ शिंदे",d:"उपमुख्यमंत्री, महाराष्ट्र राज्य",img:"./assets/img/leaders/l2.jpg"},
 {n:"मा. ना. सुनेत्रा अजित पवार",d:"उपमुख्यमंत्री, महाराष्ट्र राज्य",img:"./assets/img/leaders/l3.jpg"},
 {n:"मा. ना. प्रकाश आबिटकर",d:"मंत्री, सार्वजनिक आरोग्य व कुटुंब कल्याण, महाराष्ट्र राज्य",img:"./assets/img/leaders/l4.jpg"},
 {n:"मा. ना. श्रीमती मेघना साकोरे-बोर्डीकर",d:"राज्यमंत्री, सार्वजनिक आरोग्य व कुटुंब कल्याण, महाराष्ट्र राज्य",img:"./assets/img/leaders/l5.jpg"}
];
window.WARI_SECRETARIES=[
 {n:"डॉ. निपुण विनायक (भा.प्र.से.)",d:"प्रधान सचिव, सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन"},
 {n:"श्री. ई. रविंद्रन (भा.प्र.से.)",d:"सचिव-२, सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन"},
 {n:"श्री. संजय श्रीपतराव काटकर (भा.प्र.से.)",d:"आयुक्त, आरोग्य सेवा तथा संचालक, राष्ट्रीय आरोग्य अभियान (NHM), महाराष्ट्र शासन"},
 {n:"डॉ. सुनील भोकरे (भा.प्र.से.)",d:"आयुक्त, नागरी आरोग्य, महाराष्ट्र शासन"}
];
(function(){
  function render(){
    var sec=document.getElementById('secretaries-strip');
    if(sec) sec.innerHTML=window.WARI_SECRETARIES.map(function(o){
      return '<div class="offcard"><b>'+o.n+'</b><small>'+o.d.replace(/, महाराष्ट्र (शासन|राज्य)/,'<br>महाराष्ट्र $1')+'</small></div>';
    }).join('');
    var el=document.getElementById('leaders-strip'); if(!el) return;
    el.innerHTML=window.WARI_DIGNITARIES.map(function(o,i){
      var cm=i===0; // Chief Minister — emphasised: larger than peers, smaller than PM
      // Boxes keep the photo's own 208x256 (0.8125) ratio + object-fit:contain
      // so the FULL photo always shows — nothing is cropped. Peers a touch smaller.
      var imgS=(cm?'max-width:60px;width:60px;height:74px':'max-width:48px;width:48px;height:59px')+';object-fit:contain';
      var nmS=cm?' style="font-size:11px"':'';
      var dsS=cm?' style="font-size:9.5px"':'';
      return '<div class="ldr'+(cm?' ldr-cm':'')+'"><img style="'+imgS+'" src="'+o.img+'" alt="'+o.n+'" loading="lazy"/><div><b'+nmS+'>'+o.n+'</b><small'+dsS+'>'+o.d.replace(/, महाराष्ट्र (शासन|राज्य)/,'<br>महाराष्ट्र $1')+'</small></div></div>';
    }).join('');
  }
  if(document.readyState!=='loading') render(); else document.addEventListener('DOMContentLoaded', render);
})();
