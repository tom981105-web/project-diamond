// PROJECT DIAMOND V0.6.2 — resilient saves, visible status, backup management
'use strict';
(() => {
  const DATABASE='project-diamond-careers';
  const STORE='saves';
  const SLOT='active';
  const SAVE_KEY='project-diamond-save-v1';
  let dbPromise, saving=Promise.resolve(), warned=false, lastStatus='초기화 중';
  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB) return reject(new Error('IndexedDB를 사용할 수 없습니다.'));
      const request=indexedDB.open(DATABASE,1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('데이터베이스 연결 실패'));
    });
    return dbPromise;
  }
  async function readDB(){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).get(SLOT);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  async function writeDB(snapshot){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(snapshot,SLOT);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('저장 오류'));
      tx.onabort=()=>reject(tx.error||new Error('저장 중단'));
    });
  }
  async function deleteDB(){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(SLOT);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
  }
  function status(message,isError=false){
    lastStatus=message;
    const target=document.getElementById('diamondSaveStatus');
    if(target){target.textContent=message;target.dataset.problem=String(isError);}
  }
  function ensureStatus(){
    if(document.getElementById('diamondSaveTools'))return;
    const target=document.querySelector('#game #exportBtn');
    if(!target)return;
    const root=target.closest('.panel');
    const tools=document.createElement('div');
    tools.id='diamondSaveTools';
    tools.innerHTML='<p id="diamondSaveStatus" role="status" aria-live="polite" style="font-size:13px">저장 상태를 확인하고 있습니다.</p><div class="row"><button type="button" id="diamondBackupNow" class="secondary small">JSON 백업 받기</button><button type="button" id="diamondSaveNow" class="secondary small">지금 저장</button></div><p class="muted" style="font-size:12px">기록은 이 브라우저에 보관됩니다. 시크릿 모드·사이트 데이터 삭제 시 사라질 수 있으니 JSON 백업을 권장합니다.</p>';
    root.appendChild(tools);
    tools.querySelector('#diamondBackupNow').onclick=()=>exportSave();
    tools.querySelector('#diamondSaveNow').onclick=()=>save();
    status(lastStatus);
  }
  function saveReliable(){
    if(!state) return;
    let json;
    try{json=JSON.stringify(state);}catch(e){status('저장 데이터 생성 실패: '+e.message,true);return;}
    let localOK=false;
    try{localStorage.setItem(SAVE_KEY,json);localOK=true;}catch(e){/* IndexedDB fallback below */}
    status(localOK?'저장 중…':'브라우저 기본 저장 공간 부족 · 보조 저장소 확인 중');
    const snapshot={data:json,updatedAt:Date.now()};
    saving=saving.catch(()=>{}).then(()=>writeDB(snapshot)).then(()=>{
      status(localOK?'자동 저장 완료 · 이중 저장':'자동 저장 완료 · 대용량 저장소(IndexedDB)');
    }).catch(e=>{
      if(localOK){status('기본 저장 완료 · 보조 백업 실패');return;}
      status('자동 저장 불가 · JSON 백업을 받아 주세요',true);
      if(!warned){warned=true;alert('브라우저 자동 저장이 차단되었어요. 먼저 [기록 백업]을 눌러 JSON 파일을 보관해 주세요. 시크릿 모드 또는 사이트 데이터 저장 제한을 확인해 주세요.');}
      console.error('Project Diamond: save failed',e);
    });
  }
  save=saveReliable;
  const oldRender=render;
  render=function(){oldRender();ensureStatus();};
  const oldFresh=startFresh;
  startFresh=function(){
    const before=state;
    oldFresh();
    if(before && !state){
      saving=saving.catch(()=>{}).then(()=>deleteDB()).then(()=>status('새 커리어 준비됨')).catch(e=>console.warn('IndexedDB reset',e));
    }
  };
  const oldSetup=setup;
  setup=function(){
    oldSetup();
    ensureStatus();
    // Existing localStorage data is loaded synchronously by the original setup.
    // Restore larger backups only when that synchronous source has no valid career.
    const bootState=state;
    readDB().then(record=>{
      if(!record || state!==bootState)return;
      const restored=JSON.parse(record.data);
      if(state && JSON.stringify(state)===record.data)return;
      if(!valid(restored))throw Error('유효하지 않은 이전 저장 파일');
      state=restored;
      render();
      status('대용량 저장소에서 커리어 복구 완료');
    }).catch(err=>{
      if(state)status('기존 커리어 로드 완료 · 대용량 저장소 확인 불가');
      else status('새 선수 생성 가능 · 저장소 상태 확인 필요');
      console.warn('Project Diamond restore:',err);
    });
  };
})();
