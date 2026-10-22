// V2.7: original scene staging from real preparation and appearance state. No save/RNG.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??''));
 let owner=null;
 const atlases=new Map();
 function pose(s){
  if(['rest','rehab'].includes(s.mode))return 2;
  if(s.mode==='retired')return null;
  if(s.mode==='practice'&&state.role==='batter'&&state.development.focus>=3)return null;
  return state.role==='pitcher'?1:0;
 }
 function atlas(index){
  if(!atlases.has(index)){
   const image=new Image(),record={ready:false};atlases.set(index,record);
   image.onload=()=>{record.ready=image.naturalWidth===image.naturalHeight*3;if(record.ready)document.querySelectorAll('[data-avatar28="'+index+'"]').forEach(n=>{if(n.querySelector('.action-pose28'))n.classList.add('pose-ready28');});};
   image.src=window.DiamondVisualAssets?.actions?.[index]||'';
  }
  return atlases.get(index).ready;
 }
 function status(){
  const d=state.development||{},p=state.career14?.plan,active=p&&p.end>state.game;
  if(state.retired)return {mode:'retired',title:'그라운드를 돌아보며',detail:'선수 생활을 마친 뒤의 기록을 돌아봅니다.'};
  if(d.injury>0)return {mode:'rehab',title:'회복을 준비하는 시간',detail:'남은 부상 기간 '+d.injury+'팀 경기 · 재활과 공식 복귀 일정을 먼저 확인합니다.'};
  if(active&&['rest','rehab'].includes(p.mode))return {mode:'rest',title:'몸을 쉬게 하는 시간',detail:'확정한 회복 계획 '+(p.end-state.game)+'팀 경기 남음'};
  if(state.v12?.college&&!state.v12.college.completed)return {mode:'practice',title:'대학 무대에서 준비하며',detail:state.v12.college.results.length+' / 36경기 · 훈련과 실전으로 프로를 준비합니다.'};
  if(active&&p.mode==='practice')return {mode:'practice',title:'함께 정한 과제를 준비하며',detail:'확정한 훈련 계획 '+(p.end-state.game)+'팀 경기 남음'};
  if(d.level==='2군')return {mode:'practice',title:'다음 기회를 향한 훈련',detail:'현재 2군 · 훈련과 기용 평가를 이어갑니다.'};
  return {mode:state.role==='pitcher'?'pitcher':'batter',title:state.role==='pitcher'?'다음 등판을 준비하며':'다음 타석을 준비하며',detail:'현재 컨디션 '+Math.round(d.condition)+' · 피로 '+Math.round(d.fatigue)};
 }
 function art(s){
  const indoor=['rest','rehab','practice'].includes(s.mode),index=Number(state.ui13?.avatar)||0,src=window.DiamondVisualAssets?.portraits?.[index],frame=pose(s),action=window.DiamondVisualAssets?.actions?.[index],ready=frame!==null&&action&&atlas(index),left=frame===0?state.hand?.includes('좌타'):frame===1?state.hand?.startsWith('좌투'):false;
  return '<div class="player-scene27'+(ready?' pose-ready28':'')+'" data-avatar28="'+index+'" data-scene="'+s.mode+'"><svg viewBox="0 0 480 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+(indoor?'<rect width="480" height="170" fill="#edf2f3"/><path d="M0 111H480V170H0Z" fill="#e0e8e9"/><path d="M20 20H140V87H20ZM340 20H460V87H340Z" fill="#f9fbfc" stroke="#d4dfe3"/><path d="M80 20V87M400 20V87M20 53H140M340 53H460" stroke="#d4dfe3"/><path d="M300 118H410V130H300ZM313 130V148M399 130V148" stroke="#8da9a0" stroke-width="5" fill="none"/>':'<rect width="480" height="170" fill="#edf4fa"/><path d="M0 76Q240 25 480 76V170H0Z" fill="#dcebe1"/><path d="M240 160 166 111 240 62 314 111Z" fill="#e7d9c2"/><path d="M240 160 166 111 240 62 314 111Z" stroke="#fff" stroke-width="2" fill="none"/><circle cx="240" cy="111" r="5" fill="#cbb598"/><path d="M0 73Q240 21 480 73" fill="none" stroke="#adc6b6" stroke-width="4"/>')+'</svg>'+(src?'<img class="scene-portrait28" src="'+text(src)+'" alt="선택한 선수의 준비 모습">':'')+(frame!==null&&action?'<span class="action-pose28'+(left?' pose-left28':'')+'" role="img" aria-label="'+['스윙 연습 자세','투구 준비 자세','앉아서 쉬는 자세'][frame]+'" data-pose="'+frame+'" style="background-image:url(&quot;'+text(action)+'&quot;)"></span>':'')+'<span class="scene-shadow27" aria-hidden="true"></span></div>';
 }
 function facts(s){
  const d=state.development,focus=[d.focus,d.secondaryFocus].filter((v,i,a)=>Number.isInteger(v)&&v>=0&&v<6&&a.indexOf(v)===i).map(i=>ATTR[state.role][i]);
  const a=state.career14?.lastAppearance,known=a&&a.year===state.year&&a.game===state.game;
  return '<h3>'+text(s.title)+'</h3><p>'+text(s.detail)+'</p><div class="scene-tasks27"><span>현재 집중 과제</span><strong>'+text(focus.join(' · ')||'미설정')+'</strong></div>'+(known?'<div class="scene-last27"><small>마지막 완료 경기 · '+a.game+'팀 경기</small><p>'+(a.played?'공식 출전 기록 있음':text(a.reason||'공식 출전 기록 없음'))+'</p></div>':'')+'<p class="scene-note27">현재 준비 상태를 보여 줍니다. 실제 출전 여부는 완료한 경기 기록으로 확인합니다.</p>';
 }
 function paintDialog(){const s=status();$('playerSceneDialog27').querySelector('.experience-body').innerHTML=art(s)+facts(s);}
 function open(){if(!state)return;owner=state;paintDialog();$('playerSceneDialog27').showModal();}
 function paint(){
  let dialog=$('playerSceneDialog27');if(!dialog){dialog=document.createElement('dialog');dialog.id='playerSceneDialog27';dialog.className='career-dialog experience-dialog';dialog.setAttribute('aria-labelledby','playerSceneTitle27');dialog.innerHTML='<div class="dialog-top"><h2 id="playerSceneTitle27">지금의 나</h2><button type="button" id="closePlayerScene27" aria-label="선수 장면 닫기">닫기</button></div><div class="experience-body"></div>';document.querySelector('main').append(dialog);$('closePlayerScene27').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{owner=null;});}
  if(!state||owner&&owner!==state){dialog.close();owner=null;}if(!state)return;
  const s=status(),story=$('seasonStory');
  if(story){let b=$('openPlayerScene27');if(!b){b=document.createElement('button');b.id='openPlayerScene27';b.type='button';story.append(b);}b.hidden=!story.classList.contains('has-player25');b.textContent='지금의 나 ›';b.onclick=open;}
  const profile=$('playerIdentity');if(profile){let b=$('playerSceneEntry27');if(!b){b=document.createElement('button');b.id='playerSceneEntry27';b.type='button';b.className='secondary';}b.textContent=s.title+' ›';b.onclick=open;profile.append(b);}
  if(dialog.open)paintDialog();
 }
 window.DiamondScenes27=Object.freeze({progress:()=>state?art(status()):''});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',paint);
})();
