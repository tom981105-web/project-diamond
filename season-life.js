// V3.1: current priorities and completed-block changes. No save, RNG or game calls.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),list=v=>Array.isArray(v)?v:[];
 const modes={practice:'집중 과제 훈련',rest:'휴식',rehab:'재활'};
 const modeName=m=>m==='defense'?(state.role==='batter'?'수비 훈련':'변화구 훈련'):modes[m]||'계획 미확인';
 function situation(){
  const c=state.career14||{},d=state.development,p=c.plan,story=window.DiamondStories22?.pending();
  if(c.pending)return {kind:'choice',title:c.pending.title,detail:c.pending.detail,action:'상황과 선택 확인',target:'event'};
  if(window.DiamondStories22?.blocks())return {kind:'choice',title:story.title,detail:'일정을 멈추고 기다리는 선택이 있습니다. 선택 후 보관된 일정을 이어갈 수 있습니다.',action:'이야기와 선택 확인',target:'story'};
  if(d.injury>0)return {kind:'rehab',title:'복귀를 준비하는 시간',detail:'남은 부상 기간 '+d.injury+'팀 경기. 이 기간의 공식 출전 기록은 늘어나지 않습니다.',action:'회복 계획 살펴보기',target:'plan'};
  if(p&&p.end>state.game&&['rest','rehab'].includes(p.mode))return {kind:'rest',title:'지금은 몸을 회복할 때',detail:modeName(p.mode)+' 계획 '+(p.end-state.game)+'팀 경기 남음 · 계획 중에는 공식 출전과 훈련 성장을 쌓지 않습니다.',action:'확정한 계획 보기',target:'plan'};
  if((!p||p.end<=state.game)&&d.intensity==='rest')return {kind:'rest',title:'기본 휴식으로 몸을 회복하며',detail:'현재 기본 설정은 휴식입니다. 공식 출전과 훈련 성장을 쉬며, 준비를 재개하려면 훈련 계획을 확인하세요.',action:'훈련·휴식 계획 보기',target:'plan'};
  if(d.level==='2군')return {kind:'reserve',title:'다음 기회를 준비합니다',detail:'2군 훈련 중입니다. 구단 신뢰와 컨디션을 쌓아 1군 복귀 평가를 준비합니다.',action:'훈련 계획 살펴보기',target:'plan'};
  if(d.fatigue>60||d.condition<45)return {kind:'health',title:'다음 일정 전, 몸 상태 점검',detail:'컨디션 '+Math.round(d.condition)+' · 피로 '+Math.round(d.fatigue)+'. 훈련 강도와 회복 계획을 함께 살펴보세요.',action:'훈련·휴식 계획 보기',target:'plan'};
  return {kind:'prepare',title:c.role==='starter'?(state.role==='batter'?'출전 기회를 이어 가며':'다음 등판을 준비하며'):'출전 경쟁을 이어 갑니다',detail:p&&p.end>state.game?modeName(p.mode)+' 계획 '+(p.end-state.game)+'팀 경기 남음':'현재 집중 과제를 이어가며 실제 경기 기용 평가를 받습니다.',action:'훈련 계획 살펴보기',target:'plan'};
 }
 function jump(id){const n=$(id);if(!n)return;if(n.tagName==='DETAILS')n.open=true;n.tabIndex=-1;n.focus({preventScroll:true});n.scrollIntoView({block:'center',behavior:'instant'});}
 function block(){
  return list(state.career14?.weeks).filter(w=>w?.year===state.year&&Number.isInteger(w.start)&&Number.isInteger(w.end)&&w.start>=0&&w.end>w.start&&w.end<=state.game&&w.before&&w.after&&Array.isArray(w.before.attributes)&&w.before.attributes.length===6&&Array.isArray(w.after.attributes)&&w.after.attributes.length===6).at(-1);
 }
 function report(root){
  const w=block();root.hidden=!w;if(!w)return;
  const finite=Number.isFinite,number=n=>finite(n)?String(Math.round(n)):'미기록';
  const diff=(a,b)=>finite(a)&&finite(b)?number(a)+' → '+number(b):'미기록';
  const growth=w.after.attributes.map((n,i)=>finite(n)&&finite(w.before.attributes[i])&&n!==w.before.attributes[i]?'<div><span>'+text(ATTR[state.role][i])+'</span><strong>'+diff(w.before.attributes[i],n)+'</strong><b>'+(n-w.before.attributes[i]>0?'+':'')+(n-w.before.attributes[i])+'</b></div>':'').join('');
  root.innerHTML='<div class="section-title-row"><h3>지나온 구간의 변화</h3><small>'+text(w.start+1)+'–'+text(w.end)+'팀 경기</small></div><div class="life-report-top31"><span>이 구간의 공식 '+(state.role==='pitcher'?'등판':'출장')+'</span><strong>'+(finite(w.after.G)&&finite(w.before.G)?w.after.G-w.before.G+'경기':'미기록')+'</strong></div><div class="life-report-growth31">'+(growth||'<p>이 구간의 능력 변화 없음</p>')+'</div><div class="life-report-health31">'+[['컨디션','condition'],['피로','fatigue'],['구단 신뢰','trust']].map(([label,key])=>'<div><span>'+label+'</span><strong>'+diff(w.before[key],w.after[key])+'</strong></div>').join('')+'</div><details class="life-report-detail31"><summary>이 구간의 준비 내역</summary><p>'+text(list(w.plans).map(modeName).join(' · ')||'계획 미보관')+'</p><p>구간 안의 실제 기록 변화입니다. 훈련·실전 등 여러 영향이 함께 포함됩니다.'+(w.end<state.game?' 현재는 '+state.game+'팀 경기까지 진행했습니다.':'')+'</p></details><button type="button" class="secondary" id="backToPreparation31">다음 준비 확인하기 <span aria-hidden="true">↑</span></button>';
  $('backToPreparation31').onclick=()=>jump('seasonSituation31');
 }
 function paint(){
  if(!state||!$('seasonStory')){for(const id of ['seasonSituation31','seasonChange31'])if($(id))$(id).hidden=true;return;}
  const active=!state.retired&&state.game<144&&!(state.v12?.college&&!state.v12.college.completed);
  let root=$('seasonSituation31'),changes=$('seasonChange31');
  if(!root){root=document.createElement('section');root.id='seasonSituation31';root.className='surface-card';}
  if(!changes){changes=document.createElement('section');changes.id='seasonChange31';changes.className='surface-card';}
  $('seasonStory').after(root);$('seasonActions').after(changes);root.hidden=!active;changes.hidden=true;
  $('careerWeek')?.classList.toggle('life-week31',active);
  if(!active)return;
  const s=situation(),d=state.development,c=state.career14||{},focus=[...new Set([d.focus,d.secondaryFocus].filter(i=>Number.isInteger(i)&&i>=0&&i<6))];
  const role=c.role==='starter'?(state.role==='batter'?'주전 경쟁 우위':'주요 등판 후보'):c.role==='reserve'?'출전 경쟁 중':'기용 평가 대기';
  root.dataset.situation=s.kind;
  root.innerHTML='<div class="life-situation-heading31"><span>지금의 선수 생활</span><small>'+text(d.level)+' · '+text(role)+'</small></div><h3>'+text(s.title)+'</h3><p>'+text(s.detail)+'</p><div class="life-focus31"><small>현재 집중 과제</small><strong>'+text(focus.map(i=>ATTR[state.role][i]).join(' · ')||'미설정')+'</strong><span>신뢰 '+text(Math.round(d.trust))+'</span></div><button type="button" id="prepareAction31">'+text(s.action)+' <span aria-hidden="true">›</span></button>';
  $('prepareAction31').onclick=()=>{if(s.target==='story')window.DiamondStories22.open();else if(s.target==='event')$('inspectCareerEvent')?.click();else jump('weeklyPlans');};
  report(changes);
 }
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',paint);
})();
