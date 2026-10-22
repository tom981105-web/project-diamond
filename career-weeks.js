// V1.4 — original baseball selection, weekly plans and interruptible career events.
'use strict';
(() => {
 const baseRender=render,basePlay=play,baseNext=nextSeason;
 const modes=['practice','defense','rest','rehab'];
 const pro=()=>!!state&&!(state.v12?.college&&!state.v12.college.completed);
 const label=role=>role==='starter'?(state.role==='batter'?'주전 경쟁 우위':'주요 등판 후보'):'출전 경쟁 중';
 function ensure(){
  ensureV3();
  if(!state.career14||typeof state.career14!=='object'||Array.isArray(state.career14))state.career14={};
  const c=state.career14;
  for(const key of ['history','growth','weeks','recent'])if(!Array.isArray(c[key]))c[key]=[];
  if(c.year!==state.year){
   c.year=state.year;c.recent=[];c.role=null;c.pending=null;c.remaining=0;c.plan=null;c.week=null;c.practiceDays=0;c.hardDays=0;c.experience=0;
  }
  if(!Number.isFinite(c.experience)||c.experience<0)c.experience=0;
  if(!Number.isInteger(c.practiceDays))c.practiceDays=0;
  if(!Number.isInteger(c.hardDays))c.hardDays=0;
  if(!Number.isInteger(c.remaining)||c.remaining<0)c.remaining=0;
  return c;
 }
 function roleScore(){
  const c=ensure(),d=state.development,rows=c.recent;
  const total=key=>rows.reduce((n,x)=>n+(x[key]||0),0);
  let form=0,summary='최근 출전 표본을 쌓는 중';
  if(state.role==='batter'&&total('AB')>=12){const avg=total('H')/total('AB');form=clamp((avg-.25)*55,-8,8);summary='최근 '+rows.length+'팀 경기 타율 '+avg.toFixed(3);}
  if(state.role==='pitcher'&&total('IPouts')>=9){const era=total('ER')*27/total('IPouts');form=clamp((4.3-era)*2,-8,8);summary='최근 '+rows.length+'팀 경기 ERA '+era.toFixed(2);}
  const score=clamp(overall()*.45+d.trust*.35+d.condition*.2-d.fatigue*.15+form,0,100);
  return {score:Math.round(score*10)/10,form,summary};
 }
 function factor(){const d=state.development;return clamp(1+(d.condition-85)*.0015-d.fatigue*.001,.75,1.025);}
 function planNow(){
  const c=ensure(),d=state.development,p=c.plan;
  if(p&&p.end>state.game&&modes.includes(p.mode))return p;
  return {mode:d.intensity==='rest'?'rest':'practice',focus:d.focus,intensity:d.intensity,end:Math.min(144,state.game+7),automatic:true};
 }
 function trainingFocus(plan){
  if(plan.mode==='defense')return state.role==='batter'?4:3;
  const d=state.development;
  return Number.isInteger(d.secondaryFocus)&&d.secondaryFocus>=0&&d.secondaryFocus<6&&state.game%24===0?d.secondaryFocus:plan.focus;
 }
 function grow(index,amount,source){
  const c=ensure(),before=state.attributes[index],cap=Math.max(before,Math.min(99,state.potential));
  state.attributes[index]=clamp(before+amount,1,cap);
  const gain=state.attributes[index]-before;
  if(gain){c.growth.push({year:state.year,game:state.game,index,amount:gain,source});c.growth=c.growth.slice(-120);v3Event(`${source}: ${ATTR[state.role][index]} +${gain}`);}
  return gain;
 }
 function interrupt(type,title,detail){
  const c=ensure();if(c.pending||state.game>=144)return;
  c.pending={id:state.year+'-'+state.game+'-'+type,type,title,detail,year:state.year,game:state.game};
  v3Event(title+' · 선택을 기다립니다.');
 }
 function snapshot(){const d=state.development;return {attributes:[...state.attributes],condition:d.condition,fatigue:d.fatigue,trust:d.trust,G:state.current.G};}
 let round=null;
 function prepare(){
  const c=ensure(),d=state.development;
  if(!c.role)c.role=roleScore().score>=62?'starter':'reserve';
  const plan=planNow();
  if(!c.week)c.week={year:state.year,start:state.game,before:snapshot(),plans:[]};
  const resting=plan.mode==='rest'||plan.mode==='rehab';
  let reason=d.injury?'부상 재활':d.level==='2군'?'2군 훈련':resting?'회복 계획':d.condition<18?'컨디션 저하':'';
  if(!reason){
   const score=roleScore().score;
   // Starting pitchers retain the five-team-game rotation in the match engine.
   const opportunity=c.role==='starter'?clamp(.86+(score-62)*.003,.82,.98):clamp(.28+(score-35)*.008,.28,.68);
   if(!chance(opportunity))reason='기용 경쟁';
  }
  round={plan,injured:d.injury>0,resting,unavailable:!!reason};
  state._unavailable=!!reason;state._unavailableReason=reason;state._performanceFactor=factor();
 }
 function complete(before){
  const c=ensure(),d=state.development,r=round;if(!r)return;
  const delta={};for(const k of Object.keys(empty()))delta[k]=state.current[k]-before[k];
  c.recent.push(delta);c.recent=c.recent.slice(-12);
  c.lastAppearance={year:state.year,game:state.game,played:delta.G>0,reason:r.injured?'부상 재활':d.level==='2군'?'2군 훈련':r.resting?'회복 계획':delta.G?'출전':state.role==='pitcher'?'기용 경쟁 또는 등판 휴식':'기용 경쟁 또는 컨디션',factor:factor()};
  const wasInjured=r.injured;
  if(wasInjured){
   d.injury=Math.max(0,d.injury-1);d.condition=clamp(d.condition+2,0,100);d.fatigue=clamp(d.fatigue-3,0,100);
   if(d.injury===0)interrupt('return','재활을 마쳤습니다','다음 경기부터 출전 경쟁에 합류할 수 있습니다. 복귀 계획을 정해 주세요.');
  }else if(r.resting){d.fatigue=clamp(d.fatigue-5,0,100);d.condition=clamp(d.condition+3,0,100);}
  else{
   const hard=r.plan.intensity==='hard';
   d.fatigue=clamp(d.fatigue+(delta.G?1:0)+(hard?2:0)-(state.game%4===0?3:0),0,100);
   d.condition=clamp(d.condition-(hard?1.1:.6)+(state.game%6===0?2:0),0,100);
   c.practiceDays++;if(hard)c.hardDays++;
  }
  // The scheduled training award is proportional to actual practice days in the block.
  if(state.game%12===0){
   if(state.age<=32&&c.practiceDays>=6){const points=c.hardDays>=6?2:1;d.lastTraining=grow(trainingFocus(r.plan),points,'훈련 성장');}
   else d.lastTraining=0;
   c.practiceDays=0;c.hardDays=0;
  }
  // Only actual major-league appearances/outs earn experience; no retroactive awards.
  c.experience+=state.role==='batter'?delta.G:delta.IPouts/3;
  while(c.experience>=24){if(state.age<=32)grow(trainingFocus(r.plan),1,'실전 경험');c.experience-=24;}
  if(!wasInjured&&d.injury===0&&d.fatigue>65&&!r.resting&&state.game<144&&chance((d.fatigue-55)*.0005+(r.plan.intensity==='hard'?.001:0))){
   d.injury=integer(5,17);d.injuries=(Number(d.injuries)||0)+1;
   interrupt('injury','부상이 발생했습니다',`${d.injury}팀 경기 재활이 필요합니다. 이 기간의 프로 출전 기록은 늘어나지 않습니다.`);
  }
  if(c.week&&!c.week.plans.includes(r.plan.mode))c.week.plans.push(r.plan.mode);
  if(state.game%7===0||state.game===144){
   const oldLevel=d.level,oldRole=c.role,e=roleScore();
   if(!d.injury){
    if(d.level==='2군')d.trust=clamp(d.trust+(r.resting?1:r.plan.intensity==='hard'?4:3),0,100);
    else if(!r.resting&&state.game%14===0){
     const recentPlayed=c.recent.reduce((n,x)=>n+x.G,0);
     d.trust=clamp(d.trust+(recentPlayed?e.form>=1?4:e.form<=-1?-3:1:1)+(d.condition<40?-2:0),0,100);
    }
    if(d.level==='1군'&&d.trust<22){d.level='2군';c.role='reserve';interrupt('demotion','2군에서 다시 준비합니다','프로 출전은 중단됩니다. 훈련 평가로 신뢰 48 이상과 컨디션 45 이상을 회복하면 1군 복귀 후보가 됩니다.');}
    else if(d.level==='2군'&&d.trust>=48&&d.condition>=45){d.level='1군';interrupt('promotion','1군 복귀가 결정됐습니다','2군 훈련 평가와 몸 상태가 복귀 기준을 충족했습니다. 프로 기용 경쟁을 다시 시작합니다.');}
    if(d.level==='1군'){const s=roleScore().score;c.role=oldRole==='starter'?(s<54?'reserve':'starter'):(s>=62?'starter':'reserve');}
    if(oldLevel===d.level&&d.level==='1군'&&oldRole!==c.role)interrupt('role','출전 역할이 바뀌었습니다',label(c.role)+' · '+e.summary+'. 기량·신뢰·몸 상태를 함께 평가한 결과입니다.');
   }
   if(c.week){
    c.weeks.push({year:state.year,start:c.week.start,end:state.game,before:c.week.before,after:snapshot(),plans:c.week.plans});c.weeks=c.weeks.slice(-60);c.week=null;
   }
  }
  if(c.plan&&state.game>=c.plan.end)c.plan=null;
  round=null;
 }
 function choosePlan(mode){
  if(!pro()||state.retired||state.game>=144||!modes.includes(mode))return;
  const c=ensure(),d=state.development;if(c.pending||(c.plan&&c.plan.end>state.game))return;
  if(mode==='rehab'&&!d.injury)return;
  c.plan={mode,focus:d.focus,intensity:d.intensity,end:Math.min(144,state.game+7)};
  save();render();
 }
 function resolve(id,choice){
  if(!pro())return;const c=ensure(),p=c.pending,d=state.development;
  if(!p||p.id!==id||!['train','rest'].includes(choice))return;
  // A fixed pending outcome is acknowledged once. No reroll or instant recovery.
  const mode=p.type==='injury'?'rehab':choice==='rest'?'rest':'practice';
  c.plan={mode,focus:d.focus,intensity:mode==='practice'?d.intensity:'rest',end:Math.min(144,state.game+7)};
  c.history.push({...p,choice:mode});c.history=c.history.slice(-120);c.pending=null;
  v3Event(p.title+' → '+(mode==='rehab'?'재활 집중':mode==='rest'?'회복 우선':'훈련과 경쟁 재개'));save();render();
 }
 function node(id,parent){let el=$(id);if(!el){el=document.createElement('section');el.id=id;el.className='panel week-panel';}if(el.parentNode!==parent)parent.append(el);return el;}
 function view(){
  for(const id of ['careerWeek','coachPanel','developmentHistory'])if($(id))$(id).hidden=!pro();
  if(!pro())return;
  const c=ensure(),d=state.development,e=roleScore(),p=planNow();
  const root=node('careerWeek',$('screen-league'));$('seasonHeading').after(root);root.hidden=state.retired||state.game===144;
  const status=d.injury?'재활 '+d.injury+'경기':d.level==='2군'?'2군 훈련':label(c.role||(e.score>=62?'starter':'reserve'));
  const names={practice:state.role==='batter'?'타격 집중':'투구 집중',defense:state.role==='batter'?'수비 집중':'변화구 집중',rest:'휴식',rehab:'재활'};
  const descriptions={practice:FOCI[state.role][d.focus][1]+' · 설정한 강도 적용',defense:(state.role==='batter'?'수비':'변화구')+' 훈련에 집중',rest:'출전·훈련 없이 몸 상태 회복',rehab:'부상 기간 회복 · 프로 출전 없음'};
  let html='<div class="section-title-row"><h3>다음 7경기의 준비</h3><span class="roster-chip">'+escapeHtml(status)+'</span></div>';
  if(c.pending){
   const event=c.pending;
   html+='<div id="careerEvent" class="career-event" role="status"><p class="page-eyebrow">CAREER MOMENT · '+event.game+'경기</p><h3>'+escapeHtml(event.title)+'</h3><p>'+escapeHtml(event.detail)+'</p><p class="screen-intro">요청한 일정을 멈췄습니다. 남은 '+c.remaining+'팀 경기'+(c.remaining?'는 선택 후 이어갈 수 있습니다.':'입니다.')+'</p><div class="row">';
   const options=event.type==='injury'?[['rest','재활 계획 확인']]:[['train','훈련과 경쟁 재개'],['rest','7경기 회복 우선']];
   html+=options.map(([id,title])=>'<button type="button" data-career-choice="'+id+'">'+title+'</button>').join('')+'</div></div>';
  }else{
   html+='<p class="screen-intro">'+(c.plan?'확정한 계획 · '+(c.plan.end-state.game)+'팀 경기 남음':'현재 기본 계획: '+names[p.mode]+' · 필요할 때 7경기 계획을 확정하세요.')+'</p><div class="week-plans">';
   for(const mode of modes){const disabled=!!c.plan||(mode==='rehab'&&!d.injury);html+='<button type="button" class="week-plan'+(c.plan?.mode===mode?' selected':'')+'" data-week-plan="'+mode+'" aria-pressed="'+(c.plan?.mode===mode)+'" '+(disabled?'disabled':'')+'><strong>'+names[mode]+'</strong><small>'+escapeHtml(descriptions[mode])+'</small></button>';}
   html+='</div><p class="screen-intro">확정한 계획은 7팀 경기 동안 유지됩니다. 훈련 성과는 실제 훈련일을, 실전 성장은 실제 출장·투구 이닝을 계산합니다.</p>';
   if(c.remaining>0)html+='<button type="button" id="continueCareer" class="main-action">남은 '+c.remaining+'경기 이어가기</button>';
  }
  const w=c.weeks.at(-1);
  if(w?.year===state.year){const changes=w.after.attributes.map((x,i)=>x-w.before.attributes[i]?ATTR[state.role][i]+' '+(x-w.before.attributes[i]>0?'+':'')+(x-w.before.attributes[i]):'').filter(Boolean).join(' · ')||'능력 변화 없음';html+='<div id="weekReport" class="week-report"><h3>최근 진행 결과 · '+(w.start+1)+'–'+w.end+'경기</h3><p>프로 출장 '+(w.after.G-w.before.G)+'경기 · '+escapeHtml(changes)+'</p><p>컨디션 '+Math.round(w.before.condition)+' → '+Math.round(w.after.condition)+' · 피로 '+Math.round(w.before.fatigue)+' → '+Math.round(w.after.fatigue)+' · 신뢰 '+w.before.trust+' → '+w.after.trust+'</p></div>';}
  root.innerHTML=html;
  root.querySelectorAll('[data-week-plan]').forEach(b=>b.onclick=()=>choosePlan(b.dataset.weekPlan));
  root.querySelectorAll('[data-career-choice]').forEach(b=>b.onclick=()=>resolve(c.pending?.id,b.dataset.careerChoice));
  if($('continueCareer'))$('continueCareer').onclick=()=>{const n=c.remaining;c.remaining=0;play(n);};
  for(const id of ['seasonBtn','weekBtn','oneBtn'])if($(id))$(id).disabled=!!c.pending||state.retired||state.game>=144;
  if(!root.hidden){$('seasonBtn').textContent='중요한 선택까지 시즌 진행';$('weekBtn').textContent='7경기 진행';}
  const coach=node('coachPanel',$('screen-training'));$('attributes').closest('.panel').before(coach);coach.hidden=false;
  const rate=state.role==='batter'?'주전이면 약 82–98%, 경쟁 중이면 평가에 따라 28–68%의 경기 기용 기회':'기용 평가 후 선발은 5팀 경기 간격, 구원은 경기 상황별 기존 등판 판정';
  coach.innerHTML='<p class="page-eyebrow">COACH REPORT</p><h2>'+escapeHtml(status)+'</h2><p>'+escapeHtml(e.summary)+'</p><div class="report-rows"><div class="report-row"><span>현재 기용 평가</span><b>'+e.score+' / 100</b></div><div class="report-row"><span>기량 · 구단 신뢰</span><b>'+overall()+' · '+d.trust+'</b></div><div class="report-row"><span>컨디션 · 피로</span><b>'+Math.round(d.condition)+' · '+Math.round(d.fatigue)+'</b></div><div class="report-row"><span>경기 능력 적용</span><b>'+Math.round(factor()*100)+'%</b></div></div><p class="screen-intro">'+rate+'. 기용 평가는 7팀 경기마다 갱신합니다. 경쟁 우위 진입 62, 유지 54 이상. 2군은 신뢰 48·컨디션 45 이상에서 복귀합니다.</p><p class="coach-advice">'+(d.injury?'재활을 마치기 전에는 공식 경기에 출전할 수 없습니다.':d.level==='2군'?'2군 훈련으로 매주 신뢰를 회복하세요. 프로 누적 성적으로 복귀를 막지 않습니다.':d.fatigue>60||d.condition<45?'피로를 낮추고 컨디션을 회복하면 기용 평가와 경기 능력이 함께 개선됩니다.':e.form<0?'최근 부진이 평가에 반영되고 있습니다. 선택한 과제를 훈련하고 다음 기회를 준비하세요.':'기량과 신뢰를 쌓아 기용 평가 62를 목표로 하세요.')+'</p>';
  const history=node('developmentHistory',$('screen-training'));history.hidden=false;
  const gains=c.growth.filter(x=>x.year===state.year),sum=source=>gains.filter(x=>x.source===source).reduce((n,x)=>n+x.amount,0);
  history.innerHTML='<h3>이번 시즌 성장 내역</h3><p>훈련 +'+sum('훈련 성장')+' · 실전 경험 +'+sum('실전 경험')+' <span class="screen-intro">(능력 합계)</span></p><p class="screen-intro">훈련은 12팀 경기 구간 중 실제 훈련 6일 이상일 때 지급합니다. 강훈련 6일 이상이면 +2, 그 외 +1. 실전 경험은 타자 24출장·투수 24이닝마다 +1입니다. 잠재력 상한과 32세 이하 조건을 적용합니다.</p>'+gains.slice(-8).reverse().map(x=>'<div class="growth-row">'+x.game+'경기 · '+x.source+' · '+escapeHtml(ATTR[state.role][x.index])+' +'+x.amount+'</div>').join('');
  if(c.pending){$('journeyAction').textContent=c.pending.title+' · 선택하기';}
  if($('headline')&&!state.retired)$('headline').textContent='정규 시즌 '+state.game+' / 144팀 경기 · 프로 출장 '+state.current.G+'경기';
  if($('intensitySelect')){$('intensitySelect').disabled=!!c.plan||!!c.pending;$('focusSelect').disabled=!!c.plan||!!c.pending;$('secondaryFocusSelect').disabled=!!c.plan||!!c.pending;}
  $('growthMessage').textContent='종합 '+overall()+' · 훈련과 실전 경험을 구분해 성장합니다.';
 }
 window.DiamondCareer14=Object.freeze({prepare,complete,pending:()=>!!ensure().pending,setRemaining:n=>{ensure().remaining=n;},score:roleScore,factor});
 play=function(n){
  if(!pro())return basePlay(n);
  if(state.retired||state.game>=144)return;
  const c=ensure();if(c.pending){window.DiamondNavigation.show('league');view();return;}
  c.remaining=0;return basePlay(n);
 };
 nextSeason=function(){if(pro()&&ensure().pending)return;return baseNext();};
 render=function(){baseRender();view();};
 document.addEventListener('change',e=>{if(['focusSelect','secondaryFocusSelect','intensitySelect'].includes(e.target.id))render();});
 window.addEventListener('diamond-slot-change',()=>view());
})();
