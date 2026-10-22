// V1.12: state-derived navigation and decision feedback. No new save fields or simulation.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=value=>escapeHtml(String(value??''));
 const school=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 const focus=()=>[state.development?.focus,state.development?.secondaryFocus].filter((v,i,a)=>Number.isInteger(v)&&a.indexOf(v)===i).map(i=>ATTR[state.role][i]).join(' · ');
 const trend='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 17 6-6 4 3 6-9m-6 0h6v6"/></svg>';
 const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 21V4m0 1c4-4 8 4 12 0v9c-4 4-8-4-12 0"/></svg>';
 function section(id,parent){let node=$(id);if(!node){node=document.createElement('section');node.id=id;node.className='surface-card';parent.append(node);}return node;}
 function phase(){
  if(state.retired)return {id:'retired',title:'그라운드에 남긴 나의 기록',detail:'선수 생활을 마쳤습니다. 시즌 기록과 선택의 발자취는 계속 확인할 수 있습니다.',action:'커리어 기록 보기'};
  if(school()){const c=state.v12.college;return c.yearIndex>=3?{id:'entry',title:'첫 프로 유니폼을 고를 시간',detail:'대학 36경기의 성적과 스카우트 평가가 입단 제안에 반영됐습니다.',action:'프로 입단 제안 확인'}:{id:'college',title:'프로를 향한 대학 시절',detail:'대학 '+Math.min(3,c.yearIndex+1)+'학년 · '+c.results.length+' / 36경기. 실전과 훈련으로 다음 기회를 준비합니다.',action:'대학 시즌 준비하기'};}
  const p=state.career14?.pending,u=state.ui13||{};
  if(p)return {id:'moment',title:p.title,detail:p.detail,action:'상황과 선택 확인'};
  const story=window.DiamondStories22?.pending();if(window.DiamondStories22?.blocks())return {id:'story',title:story.title,detail:story.detail,action:'이야기와 선택 확인'};
  if(state.game===144){
   if(!u.reviewed?.[state.year])return {id:'review',title:'이번 시즌을 돌아볼 시간',detail:state.year+'년의 출전 기록과 성장, 팀 성과를 확인한 뒤 다음 진로를 결정합니다.',action:'시즌 결산 확인'};
   if(state.age>=40)return {id:'retirement',title:'나의 야구 인생을 마무리하며',detail:'마지막 시즌의 기록을 보관하고 은퇴를 확정할 수 있습니다.',action:'은퇴 전 최종 확인'};
   if(!u.drafts?.[state.year]||($('directionOptions')&&!$('directionOptions').hidden))return {id:'direction',title:'다음 시즌, 어떤 선수로 돌아올까요?',detail:'육성 방향을 고르고 다음 시즌의 계약 조건을 검토하세요.',action:'육성 방향 선택'};
   return {id:'contract',title:'다음 시즌의 소속과 계약',detail:'도착한 제안의 연봉·기간·예상 역할을 비교하세요. 최종 확인 전에는 계약이 적용되지 않습니다.',action:'계약 조건 검토'};
  }
  return {id:'season',title:state.game?'한 시즌의 이야기를 이어갑니다':'새로운 시즌을 준비합니다',detail:state.year+' · '+state.team+' · '+state.game+' / 144팀 경기. 훈련과 몸 상태를 살핀 뒤 진행하세요.',action:state.game?'시즌 이어갈 준비':'이번 시즌 준비하기'};
 }
 function go(target){
  const p=phase();window.DiamondNavigation.show(target==='player'?'training':target==='records'?'career':'league');
  if(target==='player'||target==='records')return;
  if(p.id==='story'){window.DiamondStories22.open();return;}
  if(p.id==='moment'){$('inspectCareerEvent')?.click();return;}
  if(p.id==='review'){window.DiamondUI.openReview();return;}
  const id=p.id==='entry'?'diamondCollege':['direction','contract','retirement'].includes(p.id)?'seasonDecision':'seasonStory';
  const node=$(id);if(id==='seasonStory')window.scrollTo({top:0,behavior:'instant'});else node?.scrollIntoView({block:'start',behavior:'instant'});
  if(node){node.tabIndex=-1;node.focus({preventScroll:true});}
 }
 function row(id,title,detail,target,urgent=false){return '<button type="button" class="flow-task" id="'+id+'" data-flow-target="'+target+'"><span class="flow-task-icon">'+(target==='player'?trend:icon)+'</span><span class="flow-task-copy"><strong>'+text(title)+(urgent?'<i class="task-dot" aria-label="확인 필요"></i>':'')+'</strong><small>'+text(detail)+'</small></span><span class="flow-chevron" aria-hidden="true">›</span></button>';}
 function home(p){
  const copy=$('homeIdentityCopy');if(!$('homeRating')){const rating=document.createElement('div');rating.id='homeRating';copy.append(rating);}
  const base=state.ui13?.baselines?.[state.year],before=Array.isArray(base)&&base.length===6?Math.round(base.reduce((a,b)=>a+b,0)/6):null,delta=before===null?null:overall()-before;
  $('homeRating').innerHTML='<strong>종합 능력치 '+overall()+'</strong>'+(delta?'<small class="'+(delta>0?'up':'down')+'">기록된 기준 대비 '+(delta>0?'+':'')+delta+'</small>':'');
  $('teamLabel').textContent=state.name+' · '+(school()?'대학 야구부':state.team)+' · '+state.age+'세';
  const c=state.career14;
  let detail=p.detail;
  if(p.id==='contract'){const m=state.contract15?.markets?.[state.year];detail=(m?.kind==='continue'?'기존 계약 유지':(m?.offers?.length||0)+'개 제안')+' · 연봉·기간·기용 역할 검토';}
  if(p.id==='season'&&c?.remaining)detail='멈춰 둔 일정 '+c.remaining+'팀 경기 · '+state.game+' / 144팀 경기';
  $('journeyTodo').innerHTML='<h3>확인할 일</h3>'+row('homeCareerTask',p.id==='season'?'이번 시즌의 준비':p.title,detail,p.id==='retired'?'records':'season',['story','moment','review','direction','contract','entry','retirement'].includes(p.id))+row('homeTrainingTask',state.retired?'선수 프로필':'집중 육성 중',focus()||'선수 능력치와 훈련 과제 확인','player');
  for(const button of $('journeyTodo').querySelectorAll('[data-flow-target]'))button.onclick=()=>go(button.dataset.flowTarget);
  $('journeyAction').textContent=p.action;$('journeyAction').onclick=()=>go(p.id==='retired'?'records':'season');
  // Detailed status stays on the player and season pages; the home is an entry point.
  $('homeNextCard').dataset.phase=p.id;
  if(!$('homeHistory')){const history=document.createElement('details');history.id='homeHistory';history.className='surface-card';history.innerHTML='<summary>지나온 시즌 돌아보기</summary>';$('screen-dashboard').append(history);}
  $('homeHistory').append($('journeyTimeline'));
 }
 function feedback(){
  const root=section('seasonChoiceFeedback',$('screen-league')),p=phase(),u=state.ui13||{};
  root.hidden=true;
  if(p.id==='contract'){
   const names={compete:state.role==='batter'?'주전 자리를 향해':'등판 기회를 향해',refine:state.role==='batter'?'타격의 빈틈 메우기':'제구의 완성도를 높이기',recover:state.role==='batter'?'오래 뛸 몸 만들기':'건강한 팔로 새 출발'};
   root.innerHTML='<p class="flow-eyebrow">나의 선택</p><h3>'+text(names[u.drafts[state.year]])+'</h3><p>육성 방향을 저장했습니다. 능력·신뢰·몸 상태 변화는 최종 확인 후 다음 시즌을 시작할 때 한 번 적용됩니다.</p><button type="button" class="secondary" id="goContractTerms">다음 · 계약 조건 살펴보기</button>';
   root.hidden=false;$('seasonDecision').before(root);$('goContractTerms').onclick=()=>{$('contractStage').scrollIntoView({block:'start',behavior:'instant'});$('contractStage').tabIndex=-1;$('contractStage').focus({preventScroll:true});};
  }else if(p.id==='season'){
   const last=state.career14?.history?.at(-1),plan=state.career14?.plan;
   if(last?.year===state.year&&last.game===state.game&&plan){
    const name={rehab:'재활에 집중합니다',rest:'회복을 먼저 챙깁니다',practice:'훈련과 출전 경쟁을 재개합니다'}[last.choice];
    root.innerHTML='<p class="flow-eyebrow">나의 선택</p><h3>'+text(name)+'</h3><p>'+text(last.title)+' · '+(plan.end-state.game)+'팀 경기 계획을 저장했습니다. 아직 경기는 진행하지 않았습니다.</p><p class="screen-intro">'+(last.choice==='practice'?'다음 진행부터 실제 훈련·기용 평가가 적용됩니다.':'다음 진행부터 회복을 계산합니다. 이 계획 중에는 공식 출전 기록이 늘어나지 않습니다.')+'</p>';
    root.hidden=false;if($('careerWeek'))$('careerWeek').before(root);
   }
  }
 }
 function season(p){
  const story=section('seasonStory',$('screen-league'));$('screen-league').prepend(story);story.dataset.phase=p.id;
  const step=['review','direction','contract','retirement'].includes(p.id)?(p.id==='review'?0:p.id==='direction'?1:2):-1;
  story.innerHTML='<p class="flow-eyebrow">'+(step>=0?'다음 이야기':p.id==='moment'?'커리어의 전환점':state.year+' 시즌')+'</p><h2>'+text(p.title)+'</h2><p>'+text(p.detail)+'</p>'+(step>=0?'<ol class="flow-steps" aria-label="다음 시즌 준비 단계">'+['시즌 결산','육성 방향',p.id==='retirement'?'커리어 마무리':'계약과 진로'].map((label,i)=>'<li'+(i===step?' aria-current="step"':'')+' class="'+(i<step?'complete':'')+'"><span>'+(i<step?'✓':i+1)+'</span>'+label+'</li>').join('')+'</ol>':'');
  if(['season','college','entry'].includes(p.id)){
   const count=school()?state.v12.college.results.length:state.game,limit=school()?36:144;
   const bat=state.role==='batter',metrics=school()?[]:(bat?[['출장',state.current.G+'경기'],['안타',state.current.H],['홈런',state.current.HR]]:[['등판',state.current.G+'경기'],['승리',state.current.W],['탈삼진',state.current.PK]]);
   if(!school()){
    const base=state.ui13?.baselines?.[state.year],delta=Array.isArray(base)&&base.length===6?overall()-Math.round(base.reduce((a,b)=>a+b,0)/6):null;
    story.querySelector('.flow-eyebrow').textContent=state.year+' 시즌 · '+state.team;
    story.querySelector('h2').innerHTML='<span class="season-rate-label">'+(bat?'타율':'평균자책점')+'</span> <strong id="seasonPrimaryMetric">'+(bat?(state.current.AB?statline(state.current,state.role).AVG:'—'):(state.current.IPouts?statline(state.current,state.role).ERA:'—'))+'</strong>';
    story.querySelector('h2+p').outerHTML='<p class="season-growth">종합 능력 '+overall()+(delta?' <span class="'+(delta>0?'up':'down')+'">'+(delta>0?'+':'')+delta+'</span>':'')+' <small>· '+(state.game?'시즌 진행 중':'개막 준비')+'</small></p>';
   }
   story.insertAdjacentHTML('beforeend','<div class="chapter-progress" aria-label="시즌 진행"><span>'+count+' / '+limit+'팀 경기</span><strong>'+Math.round(count/limit*100)+'%</strong><progress max="'+limit+'" value="'+count+'" aria-label="시즌 완료 경기"></progress></div>'+(metrics.length?'<div class="chapter-stats">'+metrics.map(([label,value])=>'<div><small>'+label+'</small><strong>'+text(value)+'</strong></div>').join('')+'</div>':''));
  }
  if(p.id==='story'||p.id==='moment'||p.id==='review'){
   const button=document.createElement('button');button.id='seasonStoryAction';button.type='button';button.textContent=p.action;button.onclick=()=>go('season');story.append(button);
  }
  if(p.id==='retirement'){story.querySelectorAll('.flow-steps li')[1].textContent='시즌 기록 보관';}
  feedback();
 }
 let painting=false;
 function paint(){if(painting||!state||!$('homeIdentityCopy'))return;painting=true;try{const p=phase();document.body.dataset.careerPhase=p.id;home(p);season(p);}finally{painting=false;}}
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};
 window.DiamondUI.layout=function(){baseLayout();paint();};
 window.addEventListener('diamond-slot-change',paint);
})();
