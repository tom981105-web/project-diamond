// PROJECT DIAMOND V0.7 - multi-career slots and comparison
'use strict';
window.__diamondSlotsEnabled=true;
(() => {
 const DB='project-diamond-slot-manager', STORE='slots', META='diamond-active-slot-v07', MIGRATED='diamond-slots-migrated-v07', LEGACY='project-diamond-save-v1', JOURNAL='diamond-slot-journal-v1';
 let activeId='slot-1', booting=true, busy=false, dbPromise=null, sync=Promise.resolve(), slotError=false;
 const byId=id=>document.getElementById(id);
 function openDb(name=DB,version=1){
  if(name===DB && dbPromise)return dbPromise;
  const promise=new Promise((ok,no)=>{
   const q=indexedDB.open(name,version);
   q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(name===DB?STORE:'saves'))q.result.createObjectStore(name===DB?STORE:'saves');};
   q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);
  });if(name===DB)dbPromise=promise;return promise;
 }
 async function get(id){
  const db=await openDb();return new Promise((ok,no)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(id);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>no(r.error);});
 }
 async function put(id,data,updated=Date.now()){
  const db=await openDb();return new Promise((ok,no)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({data,updated},id);tx.oncomplete=ok;tx.onerror=()=>no(tx.error);});
 }
 async function remove(id){
  const db=await openDb();return new Promise((ok,no)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=ok;tx.onerror=()=>no(tx.error);});
 }
 async function legacyBackup(){
  try{
   const db=await openDb('project-diamond-careers');
   return await new Promise((ok,no)=>{const r=db.transaction('saves','readonly').objectStore('saves').get('active');r.onsuccess=()=>ok(r.result?.data||null);r.onerror=()=>no(r.error);});
  }catch(e){return null;}
 }
 function isCareer(data){return data&&valid(data);}
 function snapshot(){return state?JSON.parse(JSON.stringify(state)):null;}
 const oldSave=save,oldRender=render,oldSetup=setup,oldFresh=startFresh;
 function saveSlot(){
  if(!state||booting)return;
  oldSave();
  const id=activeId,data=snapshot(),updated=Date.now();
  try{localStorage.setItem(JOURNAL,JSON.stringify({id,data,updated}));}catch(e){}
  sync=sync.catch(()=>{}).then(()=>put(id,data,updated)).then(()=>{slotError=false;setMessage('커리어 슬롯 저장 완료');return updatePanel();}).catch(e=>{slotError=true;setMessage('슬롯 저장 오류: JSON 백업을 받아 주세요',true);});
 }
 save=saveSlot;
 function setMessage(message,err=false){const p=byId('diamondSlotsStatus');if(p){p.textContent=message;p.style.color=err?'#ffb4b4':'#aeeed0';}}
 function ensurePanel(){
  if(byId('diamondSlots'))return;
  const parent=(state?document.getElementById('diamondNav')||document.querySelector('#game .hero'):document.getElementById('create'))||document.getElementById('game');
  if(!parent)return;
  const panel=document.createElement('section');
  panel.id='diamondSlots';panel.className='panel';
  panel.innerHTML='<h2>💾 선수 커리어 저장 슬롯</h2><p class="muted">선수별 기록을 따로 보관하고 언제든지 전환할 수 있습니다.</p><div class="row"><select id="diamondSlotSelect" aria-label="저장 슬롯 선택" style="max-width:280px"></select><button type="button" class="secondary small" id="diamondSwitch">선수 불러오기</button><button type="button" class="secondary small" id="diamondNew">새 선수 슬롯</button><button type="button" class="danger small" id="diamondDelete">현재 슬롯 삭제</button></div><p id="diamondSlotsStatus" role="status" aria-live="polite" class="muted"></p><div id="diamondSlotCompare" class="tablewrap"></div>';
  parent.after(panel);
  byId('diamondSwitch').onclick=async()=>{await switchTo(byId('diamondSlotSelect').value);};
  byId('diamondNew').onclick=async()=>{const ids=await allSlots();const free=Array.from({length:10},(_,i)=>'slot-'+(i+1)).find(x=>!ids.includes(x));if(!free){alert('최대 10명의 커리어를 보관할 수 있어요.');return;}await switchTo(free);};
  byId('diamondDelete').onclick=async()=>{
   if(!confirm('현재 슬롯의 커리어를 영구적으로 삭제할까요? 먼저 JSON 백업을 권장합니다.'))return;
   try{await sync;await remove(activeId);try{localStorage.removeItem(JOURNAL);}catch(e){}try{localStorage.setItem(MIGRATED,'1');}catch(e){}const ids=await allSlots();activeId=ids[0]||'slot-1';state=(await get(activeId))?.data||null;try{localStorage.setItem(META,activeId);localStorage.removeItem(LEGACY);}catch(e){}if(state)oldSave();render();await updatePanel();}catch(e){alert('삭제 실패: '+e.message);}
  };
 }
 async function allSlots(){
  const db=await openDb();return new Promise((ok,no)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAllKeys();req.onsuccess=()=>ok(req.result);req.onerror=()=>no(req.error);});
 }
 async function switchTo(id){
  if(busy||!/^slot-(10|[1-9])$/.test(id)||id===activeId)return;
  busy=true;
  try{
   if(state)saveSlot();
   await sync;
   if(slotError)throw Error('현재 선수를 저장하지 못했습니다. JSON 백업 후 다시 시도하세요.');
   const entry=await get(id);
   if(entry&&!isCareer(entry.data))throw Error('저장 데이터가 유효하지 않습니다. 원본 슬롯을 보존합니다.');
   activeId=id;
   state=entry?.data||null;
   try{localStorage.setItem(META,id);localStorage.removeItem(LEGACY);}catch(e){}
   if(state)oldSave();
   try{localStorage.removeItem(JOURNAL);}catch(e){}
   render();
   if(!state){window.scrollTo({top:0,behavior:'smooth'});}
   await updatePanel();
   setMessage(entry?'저장된 선수를 불러왔습니다.':'비어 있는 슬롯입니다. 새 선수를 생성하세요.');
  }catch(e){alert('슬롯 전환 실패: '+e.message);}finally{busy=false;}
 }
 async function updatePanel(){
  const select=byId('diamondSlotSelect');if(!select)return;
  const ids=await allSlots(), infos=[];
  for(const id of ids){const record=await get(id),player=record?.data;if(isCareer(player))infos.push({id,player,updated:record.updated});}
  const candidates=[...new Set([...ids,activeId])].sort((a,b)=>Number(a.split('-')[1])-Number(b.split('-')[1]));
  select.innerHTML=candidates.map(id=>{const entry=infos.find(x=>x.id===id);return '<option value="'+id+'"'+(id===activeId?' selected':'')+'>'+id.replace('slot-','슬롯 ')+' · '+(entry?escapeHtml(entry.player.name)+' ('+entry.player.year+')':'빈 슬롯')+'</option>';}).join('');
  const compare=byId('diamondSlotCompare');
  if(compare){compare.innerHTML=infos.length?'<h3>저장 선수 비교</h3><table><thead><tr><th>선수</th><th>유형</th><th>나이</th><th>소속</th><th>시즌</th></tr></thead><tbody>'+infos.map(x=>'<tr><td>'+escapeHtml(x.player.name)+'</td><td>'+(x.player.role==='batter'?'타자':'투수')+'</td><td>'+x.player.age+'</td><td>'+escapeHtml(x.player.team)+'</td><td>'+x.player.year+'</td></tr>').join('')+'</tbody></table>':'<p class="muted">아직 저장된 선수가 없습니다.</p>';}
 }
 render=function(){oldRender();ensurePanel();const panel=byId('diamondSlots');const target=(state?document.getElementById('diamondNav')||document.querySelector('#game .hero'):document.getElementById('create'));if(panel&&target&&panel.previousElementSibling!==target)target.after(panel);void updatePanel().catch(console.error);};
 // Starting a fresh career should create a new slot, not erase existing careers.
 startFresh=function(){
  void (async()=>{
   const ids=await allSlots();const free=Array.from({length:10},(_,i)=>'slot-'+(i+1)).find(x=>!ids.includes(x));
   if(!free){alert('슬롯이 모두 사용 중입니다. JSON 백업 후 불필요한 슬롯을 삭제해 주세요.');return;}
   if(state){saveSlot();await sync;if(slotError)throw Error('현재 슬롯 저장 실패. JSON 백업을 받아 주세요.');}
   activeId=free;state=null;try{localStorage.removeItem(JOURNAL);}catch(e){}try{localStorage.setItem(META,activeId);localStorage.removeItem(LEGACY);}catch(e){}
   render();window.scrollTo({top:0,behavior:'smooth'});
  })().catch(e=>alert('새 슬롯 생성 실패: '+e.message));
 };
 setup=function(){
  oldSetup();
  const form=byId('createForm');
  form?.addEventListener('submit',e=>{if(booting){e.preventDefault();e.stopImmediatePropagation();}},true);
  if(form)form.inert=true;
  for(const id of ['oneBtn','weekBtn','seasonBtn','nextBtn','freshBtn','diamondNew','diamondSwitch','diamondDelete']){const b=byId(id);if(b)b.disabled=true;}
  void (async()=>{
   const loaded=state;
   try{
    let chosen=null;try{chosen=localStorage.getItem(META);}catch(e){}
    const ids=await allSlots();
    let alreadyMigrated=false;try{alreadyMigrated=localStorage.getItem(MIGRATED)==='1';}catch(e){}
    if(!ids.length&&!alreadyMigrated){
     const legacy=await legacyBackup();
     let backup=null;try{backup=legacy?JSON.parse(legacy):null;}catch(e){}
     const restored=isCareer(loaded)?loaded:backup;
     if(isCareer(restored)){await put('slot-1',restored);chosen='slot-1';}
     try{localStorage.setItem(MIGRATED,'1');}catch(e){}
    }
    if(!chosen&&ids.length){let newest=0;for(const id of ids){const record=await get(id);if(record?.updated>=newest&&isCareer(record.data)){newest=record.updated;chosen=id;}}}
    activeId=/^slot-(10|[1-9])$/.test(chosen||'')?chosen:'slot-1';
    let row=await get(activeId);
    let journal=null;try{journal=JSON.parse(localStorage.getItem(JOURNAL));}catch(e){}
    if(journal?.id===activeId&&isCareer(journal.data)&&journal.updated>=(row?.updated||0)){await put(activeId,journal.data);row=await get(activeId);}
    state=isCareer(row?.data)?row.data:null;
    try{localStorage.setItem(META,activeId);}catch(e){}
    booting=false;render();await updatePanel();
    setMessage(state?'커리어 불러오기 완료':'새 선수 슬롯을 준비했습니다.');
   }catch(e){booting=false;state=loaded;render();console.error('슬롯 초기화 오류',e);}
   finally{if(form)form.inert=false;for(const id of ['freshBtn','diamondNew','diamondSwitch','diamondDelete']){const b=byId(id);if(b)b.disabled=false;}}
  })();
 };
})();
