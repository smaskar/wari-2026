function postToDesktopMap(msg){var m=document.getElementById('osmFrame');if(m&&m.contentWindow)m.contentWindow.postMessage(msg,'*');}
function setDesktopPalkhi(p){postToDesktopMap({type:'PALKHI_FILTER',palkhi:p||'all'});}
function setDesktopType(t){postToDesktopMap({type:'TYPE_FILTER',typeFilter:t||'all'});}
function showDesktopMap(){postToDesktopMap({type:'RESET_MAP'});var m=document.getElementById('osmFrame');if(m)m.focus();}
function locateDesktopMap(){postToDesktopMap({type:'LOCATE_ME'});var m=document.getElementById('osmFrame');if(m)m.focus();}
function locateBothMaps(){callApp('locateMe');setTimeout(locateDesktopMap,200);}
function backToAppMap(frame, keepFilter){
  try{
    var w=frame.contentWindow, doc=frame.contentDocument || w.document;
    if(!w || !doc) return;
    if(typeof w.openMapPanel==='function') w.openMapPanel();
    if(!keepFilter && typeof w.showMappedArea==='function') w.showMappedArea();
    setTimeout(function(){
      try{
        var panel=doc.getElementById('mapPanel');
        var map=w.map;
        if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
        if(map && map.invalidateSize) map.invalidateSize(true);
        if(typeof w.fitMappedArea==='function') w.fitMappedArea();
      }catch(e){}
    },120);
  }catch(e){console.warn('Unable to go back to app map',e);}
}
function applyDesktopFilterToApp(data){
  var frame=document.getElementById('appFrame');
  if(!frame || !frame.contentWindow) return;
  try{
    var w=frame.contentWindow;
    if(data.palkhi && typeof w.setPalkhi==='function') w.setPalkhi(data.palkhi);
    var t=data.typeFilter||'all';
    if(t==='health') t='doc';
    if(t==='all' || t==='satara'){
      if(typeof w.showMappedArea==='function') w.showMappedArea();
    }else if(/^(ambulance|doc|water|toilet|hirkani|halt)$/.test(t) && typeof w.chooseHelp==='function'){
      w.chooseHelp(t);
    }
    setTimeout(function(){backToAppMap(frame,true);},80);
  }catch(e){console.warn('Unable to apply desktop filter to app',e);}
}
window.addEventListener('message',function(e){
  if(!e.data) return;
  if(e.data.type==='DESKTOP_MAP_FILTER') applyDesktopFilterToApp(e.data);
});
function installAppButtons(frame){
  try{
    var doc=frame.contentDocument || frame.contentWindow.document;
    if(!doc || !doc.body || doc.body.dataset.backMapReady==='yes') return;
    doc.body.dataset.backMapReady='yes';
    doc.addEventListener('click',function(e){
      var b=e.target.closest && e.target.closest('button');
      if(!b) return;
      var t=(b.textContent||'').trim();
      if(/मार्गावर परत|सर्व points|नकाशा दाखवा/.test(t)){
        setTimeout(function(){backToAppMap(frame);},40);
      }
      if(b.dataset && b.dataset.cat){
        var cat=b.dataset.cat;
        var mapType=cat==='near'?'all':cat==='doctor'||cat==='hospital'?'doc':cat;
        setDesktopType(mapType);
      }
    },true);
  }catch(e){console.warn('Unable to install back-to-map buttons',e);}
}
function installPalkhiSync(frame){
  try{
    var doc=frame.contentDocument || frame.contentWindow.document;
    if(!doc || !doc.body || doc.body.dataset.palkhiSyncReady==='yes') return;
    doc.body.dataset.palkhiSyncReady='yes';
    doc.addEventListener('click',function(e){
      var tab=e.target.closest && e.target.closest('.tab');
      if(tab && tab.dataset && tab.dataset.p){setDesktopPalkhi(tab.dataset.p);}
    },true);
  }catch(e){console.warn('Unable to sync palkhi tabs',e);}
}
function installFrame(frame){
  function run(){installPalkhiSync(frame);installAppButtons(frame);}
  frame.addEventListener('load',run);
  setTimeout(run,500);
  setTimeout(run,1600);
}
document.querySelectorAll('iframe').forEach(installFrame);
function callApp(fn){
  var frame=document.getElementById('appFrame');
  if(!frame || !frame.contentWindow) return;
  try{
    if(typeof frame.contentWindow[fn]==='function') frame.contentWindow[fn]();
    if(fn==='openMapPanel') setTimeout(function(){backToAppMap(frame);},80);
    frame.focus();
  }catch(e){console.warn('Unable to call app function', e);}
}
function forceHelpMap(){
  document.querySelectorAll('iframe').forEach(function(frame){
    var src=frame.getAttribute('src')||'';
    if(src.indexOf('google.com/maps')>-1 || src.indexOf('maps/d/u')>-1){
      frame.setAttribute('src','./map.html?v=osm12');
      frame.setAttribute('title','वारी सहाय्य मदत नकाशा');
    }
  });
}
forceHelpMap();
setTimeout(forceHelpMap,500);
setTimeout(forceHelpMap,1500);
function registerOfflineSupport(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js?v=osm12').then(function(reg){
      function syncNow(){
        if(reg.update) reg.update();
        if(navigator.serviceWorker.controller){navigator.serviceWorker.controller.postMessage({type:'SYNC_NOW'});}
      }
      if(navigator.onLine) syncNow();
      window.addEventListener('online', syncNow);
    }).catch(function(e){console.warn('Offline support not installed', e);});
  });
}
registerOfflineSupport();
