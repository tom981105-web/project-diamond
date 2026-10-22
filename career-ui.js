// V1.10: presentation only. No career commands, save writes or random draws.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const titles={dashboard:'홈',news:'소식',league:'시즌',training:'선수',career:'기록'};
 const el=(tag,id,html='',cls='')=>{const n=document.createElement(tag);if(id)n.id=id;n.className=cls;n.innerHTML=html;return n;};
 const txt=v=>escapeHtml(String(v??''));
 let decorating=false;
 function face(target,index,fallback){
  const source=window.DiamondVisualAssets?.portraits?.[index];
  if(source&&target.querySelector('.career-portrait-image')?.getAttribute('src')===source)return;
  target.innerHTML=fallback;target.querySelector('svg')?.removeAttribute('hidden');
  if(typeof source!=='string'||!source)return;
  const image=document.createElement('img');image.alt='야구 선수 아바타';image.decoding='async';image.className='career-portrait-image';image.src=source;
  image.onload=()=>{if(image.parentNode===target)target.querySelector('svg')?.setAttribute('hidden','');};
  image.onerror=()=>{image.remove();target.querySelector('svg')?.removeAttribute('hidden');};
  target.append(image);
 }
 function creation(){
  document.body.classList.toggle('creating-player',!state&&!$('create').classList.contains('hidden'));
  const selected=document.querySelector('.avatar-choice.selected');if(!selected)return;
  if(!$('avatarPreview'))document.querySelector('.avatar-grid').before(el('div','avatarPreview','','avatar-preview'));
  face($('avatarPreview'),Number(selected.dataset.avatar),selected.querySelector('svg')?.outerHTML||'');
  for(const button of document.querySelectorAll('.avatar-choice')){face(button,Number(button.dataset.avatar),button.querySelector('svg')?.outerHTML||'');button.setAttribute('aria-pressed',String(button===selected));}
 }
 function stageArt(index){const target=$('landingJourney').querySelector('.journey-placeholder');target.querySelector('img')?.remove();target.classList.remove('has-scene');const src=window.DiamondVisualAssets?.milestones?.[index];if(typeof src!=='string'||!src)return;const image=document.createElement('img');image.alt='야구 커리어 장면';image.decoding='async';image.className='journey-stage-image';target.classList.add('has-scene');image.onerror=()=>{image.remove();target.classList.remove('has-scene');};image.src=src;target.append(image);}
 function landing(){
  if($('landingJourney'))return;
  const section=el('section','landingJourney','<div class="journey-placeholder" aria-hidden="true"><span class="diamond-field"></span><span class="journey-ball">⚾</span></div><p id="landingJourneyCaption">첫 그라운드에 서는 날</p><div id="landingJourneySteps" aria-label="커리어 여정"></div>','landing-journey');
  const stages=['첫 유니폼','프로 데뷔','첫 안타','우승 도전','나의 기록'];
  stages.forEach((title,index)=>{const button=el('button',null,'<span aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>'+title);button.type='button';button.setAttribute('aria-pressed',String(index===0));button.onclick=()=>{for(const b of section.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));$('landingJourneyCaption').textContent=['첫 그라운드에 서는 날','꿈꾸던 첫 프로 경기','기록에 남을 첫 안타','동료들과 도전하는 우승','끝까지 남는 야구 인생'][index];stageArt(index);};section.querySelector('#landingJourneySteps').append(button);});
  $('journeyIntro').querySelector('.landing-sub').after(section);stageArt(0);
 }
 function profile(){
  const hero=$('nameLabel').closest('.hero');
  if(!$('homeIdentity')){
   const identity=el('div','homeIdentity','','identity-main'),copy=el('div','homeIdentityCopy','','identity-copy');
   copy.append($('teamLabel'),$('nameLabel'),$('profileLabel'));identity.append($('playerPortrait'),copy);hero.replaceChildren(identity,$('seasonLabel'),$('headline'),$('homeStats'));hero.append(el('div','homeOverview','','profile-overview'));
   const card=el('section','homeNextCard','','next-step-card');$('journeyAction').before(card);card.append($('journeyTodo'),$('journeyAction'));
   const shortcuts=el('div','homeShortcuts','','home-shortcuts');
   for(const [label,destination] of [['리그 순위','league'],['선수 정보','training'],['시즌 기록','career']]){const button=el('button',null,label+' <span aria-hidden="true">›</span>');button.type='button';button.onclick=()=>{window.DiamondNavigation.show(destination);if(destination==='league'&&!(state.v12?.college&&!state.v12.college.completed)){$('journeyLeagueDetails').open=true;$('journeyLeagueDetails').scrollIntoView({block:'start',behavior:'instant'});}};shortcuts.append(button);}
   card.after(shortcuts);
  }
  $('homeShortcuts').firstElementChild.innerHTML=(state.v12?.college&&!state.v12.college.completed?'대학 시즌':'리그 순위')+' <span aria-hidden="true">›</span>';
  const d=state.development||{},focus=[d.focus,d.secondaryFocus].filter((v,i,a)=>Number.isInteger(v)&&a.indexOf(v)===i).map(i=>ATTR[state.role][i]).join(' · ');
  const base=state.ui13?.baselines?.[state.year],before=Array.isArray(base)&&base.length===6?Math.round(base.reduce((s,v)=>s+v,0)/6):null,delta=before===null?null:overall()-before;
  $('homeOverview').innerHTML='<div><small>종합 능력치</small><strong>'+overall()+(delta?'<em class="'+(delta<0?'down':'up')+'">'+(delta>0?'+':'')+delta+'</em>':'')+'</strong></div><div><small>시즌</small><strong>'+state.year+'</strong></div><div><small>나이</small><strong>'+state.age+'세</strong></div>';
  const portrait=$('playerPortrait'),fallback=portrait.querySelector('svg')?.outerHTML||'';face(portrait,Number(state.ui13?.avatar)||0,fallback);
  if(!$('playerIdentity'))$('screen-training').prepend(el('section','playerIdentity','','player-summary'));
  $('playerIdentity').innerHTML='<div class="identity-main"><div class="summary-portrait"></div><div class="identity-copy"><span class="summary-team">'+txt($('teamLabel').textContent)+'</span><h2>'+txt(state.name)+' <span class="position-tag">'+txt(state.position)+'</span></h2><p>'+txt(state.hand)+' · '+(state.v12?.college&&!state.v12.college.completed?'대학 야구':txt(V5_NAMES[state.globalCareer?.region||'KR']||'한국')+' · 프로')+'</p></div></div><div class="profile-overview"><div><small>종합 능력치</small><strong>'+overall()+'</strong></div><div><small>집중 육성</small><strong class="focus-summary">'+txt(focus||'미설정')+'</strong></div><div><small>나이</small><strong>'+state.age+'세</strong></div></div>';
  face($('playerIdentity').querySelector('.summary-portrait'),Number(state.ui13?.avatar)||0,fallback);
  const attributes=$('attributes').closest('.panel');attributes.classList.add('attribute-card');attributes.querySelector('h2').textContent='능력치';
  if(!$('attributeLegend'))attributes.querySelector('h2').after(el('p','attributeLegend','강조된 항목은 집중 육성 과제입니다.','attribute-legend'));
  for(const [i,node] of [...$('attributes').children].entries()){
   const focused=d.focus===i||d.secondaryFocus===i;node.classList.toggle('is-focused',focused);
   node.querySelectorAll('.attribute-change').forEach(n=>n.remove());
   const old=Array.isArray(base)?base[i]:null,change=old===null?null:state.attributes[i]-old;
   if(change){const value=el('small',null,(change>0?'+':'')+change,'attribute-change '+(change<0?'down':'up'));node.querySelector('strong').append(value);}
  }
  if($('coachPanel')){if(!$('playerCoachDetails'))$('screen-training').append(el('details','playerCoachDetails','<summary>기용 평가와 코치 조언 <span aria-hidden="true">⌄</span></summary>','surface-card'));$('playerCoachDetails').append($('coachPanel'));$('playerCoachDetails').hidden=$('coachPanel').hidden;}
  const heading=$('developmentPane')?.querySelector('h2');if(heading)heading.textContent='훈련과 몸 상태';
 }
 function decorate(){
  if(decorating)return;decorating=true;
  try{
   document.body.classList.add('career-ui');landing();creation();
   const title=document.querySelector('header h1');title.textContent=state?titles[window.DiamondNavigation.active]:'PROJECT DIAMOND';
   if(!state)return;
   profile();
   for(const [id,title] of [['v5Pane','소속과 해외 경력'],['v4Pane','수상과 이적 기록'],['v6Pane','국가대표와 커리어 업적']]){const heading=$(id)?.querySelector('h2');if(heading)heading.textContent=title;}
   for(const id of ['seasonHeading','seasonActions','seasonDecision','journeyLeagueDetails','journeyTimeline','journeyTodo','archiveComparison'])$(id)?.classList.add('surface-card');
  }finally{decorating=false;}
 }
 window.DiamondUI.layout=function(){baseLayout();decorate();};
 render=function(){baseRender();decorate();};setup=function(){baseSetup();decorate();};
 document.addEventListener('click',event=>{if(event.target.closest('.avatar-choice,#wizardNext,#wizardBack,#startJourney'))creation();if(event.target.closest('#startJourney,#wizardBack'))window.scrollTo({top:0,behavior:'instant'});});
 document.addEventListener('keydown',event=>{const current=event.target.closest('.avatar-choice');if(!current||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...document.querySelectorAll('.avatar-choice')],index=buttons.indexOf(current),columns=getComputedStyle(current.parentNode).gridTemplateColumns.split(' ').length;let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[event.key])+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();});
 window.addEventListener('diamond-slot-change',decorate);
})();
