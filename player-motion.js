// V3.7: presentation-only animated illustrations. Never writes career state or uses RNG.
'use strict';
(() => {
 const media=matchMedia('(prefers-reduced-motion: reduce)'), key='diamond-motion37';
 let paused=false;
 try{paused=sessionStorage.getItem(key)==='paused';}catch{}
 const visible=new WeakSet(),bound=new WeakSet();
 const running=()=>!paused&&!media.matches&&document.visibilityState!=='hidden';
 const text=v=>escapeHtml(String(v));
 function asset(kind,index){return window.DiamondVisualAssets?.motion?.[index]?.[kind];}
 function art(kind,index,left=false){
  const a=asset(kind,index);if(!a)return '';
  const label={swing:'스윙 연습 동작',pitch:'투구 연습 동작',rest:'앉아서 쉬는 모습'}[kind];
  return '<img class="player-motion37'+(left?' motion-left37':'')+'" src="'+text(a.poster)+'" data-motion-kind="'+kind+'" data-poster="'+text(a.poster)+'" data-webp="'+text(a.webp)+'" data-gif="'+text(a.gif)+'" width="256" height="256" alt="'+label+'" decoding="async">';
 }
 function button(){return '<button type="button" class="motion-toggle37" aria-pressed="false">움직임 끄기</button>';}
 function updateImage(img){
  const active=running()&&visible.has(img),target=active?(img.dataset.webpFailed?img.dataset.gif:img.dataset.webp):img.dataset.poster;
  if(img.dataset.target===target)return;
  img.dataset.target=target;img.src=target;
 }
 function refresh(){
  document.documentElement.dataset.motion37=running()?'playing':'paused';
  document.querySelectorAll('.player-motion37').forEach(updateImage);
  document.querySelectorAll('.motion-toggle37').forEach(b=>{
   b.disabled=media.matches;b.setAttribute('aria-pressed',String(!paused&&!media.matches));
   const label=media.matches?'움직임 줄임':paused?'움직임 켜기':'움직임 끄기';
   if(b.textContent!==label)b.textContent=label;
  });
 }
 const observer=new IntersectionObserver(entries=>{
  for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);updateImage(e.target);}
 });
 function mount(root=document){
  root.querySelectorAll('.player-motion37').forEach(img=>{
   if(bound.has(img))return;bound.add(img);
   img.addEventListener('load',()=>{img.classList.add('motion-loaded37');img.closest('.player-scene27')?.classList.add('motion-ready37');});
   img.addEventListener('error',()=>{
    if(img.dataset.target===img.dataset.webp){img.dataset.webpFailed='true';updateImage(img);}
    else if(img.dataset.target===img.dataset.gif){img.dataset.webpFailed='true';img.dataset.gif=img.dataset.poster;updateImage(img);}
    else{img.classList.remove('motion-loaded37');img.closest('.player-scene27')?.classList.remove('motion-ready37');}
   });
   if(img.complete&&img.naturalWidth){img.classList.add('motion-loaded37');img.closest('.player-scene27')?.classList.add('motion-ready37');}
   observer.observe(img);
  });
  refresh();
 }
 document.addEventListener('click',e=>{
  if(!e.target.closest('.motion-toggle37')||media.matches)return;
  paused=!paused;try{sessionStorage.setItem(key,paused?'paused':'playing');}catch{}refresh();
 });
 media.addEventListener('change',refresh);
 document.addEventListener('visibilitychange',refresh);
 const changes=new MutationObserver(records=>{
  let added=false;
  for(const r of records){for(const n of r.removedNodes)if(n.nodeType===1){if(n.matches('.player-motion37'))observer.unobserve(n);n.querySelectorAll('.player-motion37').forEach(i=>observer.unobserve(i));}
   for(const n of r.addedNodes)if(n.nodeType===1&&(n.matches('.player-motion37,.motion-toggle37')||n.querySelector('.player-motion37,.motion-toggle37')))added=true;
  }
  if(added)mount();
 });
 changes.observe(document.body,{childList:true,subtree:true});
 function replay(play){
  if(!play||!state||(!play.user&&!play.pitchUser)||(!play.pitchUser&&['BB','SF'].includes(play.kind)))return '';
  const kind=play.pitchUser?'pitch':'swing',left=kind==='pitch'?state.hand?.startsWith('좌투'):state.hand?.includes('좌타');
  return '<div class="replay-action37">'+art(kind,Number(state.ui13?.avatar)||0,left)+'<span>내 '+(kind==='pitch'?'투구':'타석')+' · 장면 연출</span>'+button()+'</div>';
 }
 window.DiamondMotion37=Object.freeze({art,button,replay});mount();
})();
