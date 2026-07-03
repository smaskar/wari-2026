// Leadership strip — names/designations as provided 2026-07-03 (hoarding order = protocol order).
// Photos cropped from campaign hoarding (low-res); swap files in assets/img/leaders/ when originals arrive.
window.WARI_DIGNITARIES=[
 {n:"श्री. देवेंद्र फडणवीस",d:"मा. मुख्यमंत्री, महाराष्ट्र शासन",img:"./assets/img/leaders/l1.jpg"},
 {n:"श्री. एकनाथ शिंदे",d:"मा. उपमुख्यमंत्री, महाराष्ट्र शासन",img:"./assets/img/leaders/l2.jpg"},
 {n:"सौ. सुनेत्रा अजित पवार",d:"मा. उपमुख्यमंत्री, महाराष्ट्र शासन",img:"./assets/img/leaders/l3.jpg"},
 {n:"श्री. प्रकाश आबिटकर",d:"मा. मंत्री, सार्वजनिक आरोग्य व कुटुंब कल्याण, महाराष्ट्र शासन",img:"./assets/img/leaders/l4.jpg"},
 {n:"श्रीमती मेघना साकोरे-बोर्डीकर",d:"मा. राज्यमंत्री, सार्वजनिक आरोग्य व कुटुंब कल्याण, महाराष्ट्र शासन",img:"./assets/img/leaders/l5.jpg"}
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
      return '<div class="offcard"><b>'+o.n+'</b><small>'+o.d+'</small></div>';
    }).join('');
    var el=document.getElementById('leaders-strip'); if(!el) return;
    el.innerHTML=window.WARI_DIGNITARIES.map(function(o){
      return '<div class="ldr"><img src="'+o.img+'" alt="'+o.n+'" loading="lazy"/><b>'+o.n+'</b><small>'+o.d+'</small></div>';
    }).join('');
  }
  if(document.readyState!=='loading') render(); else document.addEventListener('DOMContentLoaded', render);
})();
