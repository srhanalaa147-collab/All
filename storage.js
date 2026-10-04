/* مساعد — تخزين دائم: طلب تثبيت التخزين + نسخة احتياطية تلقائية لـ localStorage داخل IndexedDB + استرجاع تلقائي */
(function(){
'use strict';
var DB='mosaed_persist_v1',ST='kv',KEY='snapshot',RS='mosaed_restored_once';
var ls;try{ls=window.localStorage;ls.length}catch(e){return}
var proto=Storage.prototype,oSet=proto.setItem,oRem=proto.removeItem,oClr=proto.clear,timer=0,restoring=false;
function open(){return new Promise(function(res,rej){var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST)};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
function idb(mode,fn){return open().then(function(db){return new Promise(function(res,rej){var t=db.transaction(ST,mode),s=t.objectStore(ST),q=fn(s);t.oncomplete=function(){res(q&&q.result);db.close()};t.onerror=t.onabort=function(){rej(t.error);db.close()}})})}
function snap(){var o={};for(var i=0;i<ls.length;i++){var k=ls.key(i);o[k]=ls.getItem(k)}return o}
function save(){if(restoring)return;idb('readwrite',function(s){return s.put({t:Date.now(),d:snap()},KEY)}).catch(function(){})}
function later(){clearTimeout(timer);timer=setTimeout(save,400)}
proto.setItem=function(k,v){var r=oSet.apply(this,arguments);if(this===ls)later();return r};
proto.removeItem=function(k){var r=oRem.apply(this,arguments);if(this===ls)later();return r};
proto.clear=function(){var r=oClr.apply(this,arguments);if(this===ls)later();return r};
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save()});
/* استرجاع: إذا مُسح localStorage (تنظيف المتصفح) وبقيت النسخة في IndexedDB */
if(ls.length===0&&!sessionStorage.getItem(RS)){
  restoring=true;
  idb('readonly',function(s){return s.get(KEY)}).then(function(v){
    if(v&&v.d&&Object.keys(v.d).length){Object.keys(v.d).forEach(function(k){oSet.call(ls,k,v.d[k])});try{sessionStorage.setItem(RS,'1')}catch(e){}restoring=false;location.reload()}
    else restoring=false;
  }).catch(function(){restoring=false});
}else{window.addEventListener('load',function(){setTimeout(save,1500)})}
/* طلب تثبيت التخزين حتى لا يمسحه المتصفح */
function persist(){try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}
persist();window.addEventListener('load',persist);
/* أدوات يدوية: نسخة احتياطية كملف / استيراد */
window.MosaedStorage={
  export:function(){var b=new Blob([JSON.stringify({app:'mosaed',t:Date.now(),d:snap()})],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mosaed-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)},
  import:function(file){return file.text().then(function(t){var j=JSON.parse(t);if(!j||!j.d)throw new Error('ملف غير صالح');Object.keys(j.d).forEach(function(k){oSet.call(ls,k,j.d[k])});save();setTimeout(function(){location.reload()},300)})},
  isPersisted:function(){return navigator.storage&&navigator.storage.persisted?navigator.storage.persisted():Promise.resolve(false)},
  usage:function(){return navigator.storage&&navigator.storage.estimate?navigator.storage.estimate():Promise.resolve({})}
};
})();
