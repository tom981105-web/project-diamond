// V2.4: career presentation uses actual draft choices, training and recorded results.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),school=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 const list=v=>Array.isArray(v)?v:[];
 const names=()=>[state.development.focus,state.development.secondaryFocus].filter((i,n,a)=>Number.isInteger(i)&&i>=0&&i<6&&a.indexOf(i)===n).map(i=>ATTR[state.role][i]);
 const portrait=()=>window.DiamondVisualAssets?.portraits?.[Number(state?.ui13?.avatar)||0];
 function preview(){
  const host=$('wizardSummary');if(!host)return;
  let card=$('creationPreview24');if(!card){card=document.createElement('div');card.id='creationPreview24';host.before(card);}
  const avatar=Number(document.querySelector('.avatar-choice.selected')?.dataset.avatar)||0,src=window.DiamondVisualAssets?.portraits?.[avatar],role=$('role').value,labels=ATTR[role];
  const focuses=[$('journeyFocus')?.value,$('journeyFocusSecond')?.value].map(Number).filter((i,n,a)=>i>=0&&i<6&&a.indexOf(i)===n);
  const college=document.querySelector('[name=amateurPath]:checked')?.value==='college';
  card.innerHTML='<div class="creation-identity">'+(src?'<img src="'+text(src)+'" alt="선택한 선수 모습">':'')+'<div><small>나의 첫 유니폼</small><h3>'+text($('playerName').value||'나의 선수')+'</h3><p>'+text($('position').value)+' · '+text($('hand').value)+'</p></div></div><div class="creation-route"><span>첫 무대</span><strong>'+(college?'대학 36경기 → 프로 도전':'고교 유망주 → 프로 신인')+'</strong></div><div class="creation-route"><span>집중 과제</span><strong>'+focuses.map(i=>'<i>'+text(labels[i])+'</i>').join('')+'</strong></div>';
  host.hidden=true;
 }
 function coachScene(p){
  const src=portrait(),focus=names();
  return '<div class="coach-scene24" aria-label="코치와 함께 확인하는 현재 육성 과제"><div class="coach-scene-player">'+(src?'<img src="'+text(src)+'" alt="나의 선수">':'')+'</div><div class="coach-board"><span>TRAINING NOTES</span><svg viewBox="0 0 140 85" aria-hidden="true"><path d="M70 76 18 24Q70-15 122 24Z" fill="#ffffff0c" stroke="#a4c4bb"/><path d="m70 76-31-31 31-31 31 31Z" stroke="#a4c4bb" fill="none"/><circle cx="70" cy="48" r="3" fill="#e8c891"/><path d="m39 45 10-8m52 8-10-8" stroke="#e8c891" stroke-width="2"/></svg><strong>'+text(p.key==='coach-review'?'지나온 훈련 돌아보기':'다음 훈련의 방향')+'</strong><small>'+focus.map(text).join(' · ')+'</small></div></div>';
 }
 function trainingReport(p){
  const rows=list(p.trainingReport).filter(r=>r&&Number.isInteger(r.index)&&r.index>=0&&r.index<6&&Number.isFinite(r.before)&&Number.isFinite(r.now));
  if(!rows.length)return '';
  return '<div class="coaching-result24"><small>약속 당시 → 이번 점검 시점</small>'+rows.map(r=>'<div><span>'+text(ATTR[state.role][r.index])+'</span><strong>'+r.before+' → '+r.now+'</strong><b>'+((r.now-r.before)>0?'+':'')+(r.now-r.before)+'</b></div>').join('')+'<p>이미 기록된 실제 변화입니다. 이 화면을 열어 추가 성장을 지급하지 않습니다.</p></div>';
 }
 function coaching(){
  let root=$('careerCoach24');if(!root){root=document.createElement('section');root.id='careerCoach24';root.className='surface-card';$('screen-league').append(root);}
  root.hidden=school()||state.retired||state.game>=144;if(root.hidden)return;
  // Keep the season's primary action in its established place.
  $('lifeChapter').before(root);
  const reason=window.DiamondStories22.consultReason(),enabled=state.narrative22?.enabled===true;
  root.innerHTML='<div class="section-title-row"><h3>나의 육성 방향</h3><span>'+text(window.DiamondPresentation.speaker('coach-path',state.team).name)+' 코치</span></div><div class="training-chips24">'+names().map(n=>'<span>'+text(n)+'</span>').join('')+'</div><button type="button" class="secondary" id="openCoach24" '+(reason?'disabled':'')+'>'+(enabled?'코치와 육성 상담':'육성 상담 · 시즌 이야기 켜기')+'</button>'+(reason?'<p class="coach-reason24">'+text(reason)+'</p>':'<p class="coach-reason24">시즌당 한 번 · 두 과제와 7팀 경기 훈련을 함께 정합니다.</p>');
  $('openCoach24').onclick=()=>window.DiamondStories22.consult();
 }
 function liveFeed(){
  const host=$('journeyArticles');if(!host)return;
  let root=$('liveSeason24');if(!root){root=document.createElement('article');root.id='liveSeason24';root.className='news-article';}host.prepend(root);
  root.hidden=school()||state.retired||state.game<1||state.game>=144;if(root.hidden)return;
  const s=state.current,bat=state.role==='batter',rate=statline(s,state.role),history=list(state.narrative22?.history).filter(h=>h&&h.year===state.year&&h.team===state.team&&h.status==='chosen'),last=history.at(-1),coach=window.DiamondPresentation.speaker('coach-path',state.team);
  const facts=bat?s.G+'출장 · '+s.H+'안타 · '+s.HR+'홈런 · 타율 '+(s.AB?rate.AVG:'—'):s.G+'등판 · '+s.PK+'탈삼진 · 평균자책점 '+(s.IPouts?rate.ERA:'—');
  const advice=state.development.injury?'재활 중입니다. 공식 복귀 일정을 먼저 마쳐야 합니다.':state.development.fatigue>60?'다음 일정 전에는 피로와 회복 계획을 함께 살펴보겠습니다.':'다음에도 '+names().join(' · ')+' 과제를 실제 훈련에서 이어갑시다.';
  root.innerHTML='<p class="flow-eyebrow">지금 쓰는 시즌 · '+state.year+' · '+state.game+' / 144팀 경기</p><h2>'+text(state.name)+', 오늘까지의 이야기</h2><div class="live-facts24">'+text(facts)+'</div><div class="live-response24"><span class="speaker-mark">'+text(coach.name.slice(-2))+'</span><div><strong>'+text(coach.name)+' <small>담당 코치</small></strong><p>'+text(advice)+'</p></div></div>'+(last?'<div class="live-choice24"><small>최근 선택의 발자취</small><strong>'+text(last.title)+'</strong><p>'+text(last.label)+'</p><small>'+text(last.effect)+'</small></div>':'<p class="screen-intro">첫 선택이 생기면 이 시즌의 이야기도 함께 기록합니다.</p>')+'<button type="button" class="secondary" id="liveSeasonLink24">이번 시즌으로 돌아가기</button><p class="fiction-note">실제 기록을 바탕으로 구성한 게임 속 반응입니다.</p>';
  $('liveSeasonLink24').onclick=()=>window.DiamondNavigation.show('league');
 }
 function review(){
  const root=$('reviewContent');if(!root||!root.querySelector('.review-title')||root.querySelector('#reviewTabs24'))return;
  const heading=root.querySelector('h2');if(!heading)return;
  const tabs=document.createElement('div');tabs.id='reviewTabs24';tabs.className='chapter-tabs24';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','시즌 결산 항목');
  const panels=['성적과 팀','실제 성장','이야기와 반응'].map((title,i)=>{const panel=document.createElement('section');panel.id='reviewPanel24-'+i;panel.className='review-panel24';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','reviewTab24-'+i);panel.hidden=i!==0;const b=document.createElement('button');b.type='button';b.id='reviewTab24-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.setAttribute('aria-selected',String(i===0));b.tabIndex=i===0?0:-1;b.textContent=title;tabs.append(b);return panel;});
  let section=0;const nodes=[...root.children],first=nodes.indexOf(heading);
  for(const node of nodes.slice(first)){
   if(node.tagName==='H2')section=node.textContent==='성장의 기록'?1:0;
   if(node.classList.contains('experience-report'))section=2;
   panels[section].append(node);
  }
  root.append(tabs,...panels);
  function select(i,focus=false){[...tabs.children].forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});if(focus)tabs.children[i].focus();}
  [...tabs.children].forEach((b,i)=>{b.onclick=()=>select(i);b.onkeydown=e=>{const next=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(next!==null){e.preventDefault();select(next,true);}};});
 }
 function paint(){preview();if(!state)return;coaching();liveFeed();if($('journeyReview')?.open)review();}
 window.DiamondChapters24=Object.freeze({coachScene,trainingReport,review});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};
 document.addEventListener('click',e=>{if(e.target.closest('#wizardNext,#wizardBack,.avatar-choice'))preview();});
 document.addEventListener('change',e=>{if(['journeyFocus','journeyFocusSecond','role','position','hand','playerName'].includes(e.target.id))preview();});
 window.addEventListener('diamond-slot-change',paint);
})();
