// V2.6: recorded choice feedback. Presentation reads history; it never resolves choices.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??''));
 let context=null;
 function last(){
  if(!state||state.retired||(state.v12?.college&&!state.v12.college.completed)||state.career14?.pending||window.DiamondStories22?.pending())return null;
  const history=state.narrative22?.history,h=Array.isArray(history)?history.at(-1):null;
  return h&&['chosen','skipped'].includes(h.status)&&h.year===state.year&&h.team===state.team&&h.game===state.game?h:null;
 }
 function identity(){
  const src=window.DiamondVisualAssets?.portraits?.[Number(state.ui13?.avatar)||0];
  return '<div class="choice-player26">'+(src?'<img src="'+text(src)+'" alt="나의 선수">':'')+'<div><small>나의 선택</small><strong>'+text(state.name)+'</strong></div></div>';
 }
 function decorate(){
  const body=$('storyDialog22')?.querySelector('.experience-body'),options=body?.querySelector('.life-options');
  if(!state||!options||body.querySelector('.choice-player26'))return;
  options.insertAdjacentHTML('beforebegin',identity());
 }
 function shell(){
  if($('storyResultDialog26'))return;
  const d=document.createElement('dialog');d.id='storyResultDialog26';d.className='career-dialog experience-dialog';d.setAttribute('aria-labelledby','storyResultTitle26');
  d.innerHTML='<div class="dialog-top"><h2 id="storyResultTitle26">선택의 기록</h2><button type="button" aria-label="선택 기록 닫기" id="closeStoryResult26">닫기</button></div><div class="experience-body"></div>';
  document.querySelector('main').append(d);$('closeStoryResult26').onclick=()=>d.close();d.addEventListener('close',()=>{context=null;});
 }
 function open(){
  const h=last();if(!h)return;context={owner:state,entry:h};const d=$('storyResultDialog26');
  const speaker=h.speaker&&typeof h.speaker.name==='string'?h.speaker:null;
  d.querySelector('.experience-body').innerHTML='<p class="flow-eyebrow">'+h.year+' · '+h.game+'팀 경기 · '+text(h.team)+'</p><h3>'+text(h.title)+'</h3>'+identity()+'<blockquote class="chosen-line26">'+text(h.label)+'</blockquote><section class="choice-effect26"><h3>기록된 적용 결과</h3><p>'+text(h.effect)+'</p></section>'+(speaker?'<p class="choice-witness26">함께한 사람 · '+text(speaker.name)+' · '+text(speaker.role)+'</p>':'')+'<p class="decision-note">저장된 선택의 기록입니다. 다시 읽어도 효과를 추가 적용하거나 경기를 진행하지 않습니다.</p><button type="button" id="backToSeason26">시즌으로 돌아가기</button>';
  $('backToSeason26').onclick=()=>d.close();if(!d.open)d.showModal();
 }
 function paint(){
  shell();const h=last(),d=$('storyResultDialog26');
  if(context&&(context.owner!==state||context.entry!==h)){d.close();context=null;}
  let root=$('storyResult26');if(!root){root=document.createElement('section');root.id='storyResult26';root.className='surface-card';$('screen-league').append(root);}
  root.hidden=!h;if(!h)return;
  $('careerStory22').before(root);
  root.innerHTML='<p class="flow-eyebrow">'+(h.status==='skipped'?'이야기를 넘겼습니다':'선택을 기록했습니다')+'</p><h3>'+text(h.label)+'</h3><p>'+text(h.effect)+'</p><button type="button" class="secondary" id="openStoryResult26">선택 결과 다시 보기 <span aria-hidden="true">›</span></button>';
  $('openStoryResult26').onclick=open;
 }
 window.DiamondConversation26=Object.freeze({decorate,focusResult:()=>{if(!$('storyResult26')?.hidden){$('storyResult26')?.scrollIntoView({block:'center',behavior:'instant'});$('openStoryResult26')?.focus({preventScroll:true});}}});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};
 window.addEventListener('diamond-slot-change',paint);
})();
