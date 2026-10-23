// V3.3: inspect a real training plan before committing through the existing engine.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??''));
 let context=null;
 const pro=()=>!!state&&!state.retired&&state.game<144&&!(state.v12?.college&&!state.v12.college.completed);
 const names=()=>({practice:'집중 과제 훈련',defense:state.role==='batter'?'수비 집중':'변화구 집중',rest:'휴식',rehab:'재활'});
 const focus=()=>[...new Set([state.development.focus,state.development.secondaryFocus].filter(i=>Number.isInteger(i)&&i>=0&&i<6))].map(i=>ATTR[state.role][i]).join(' · ');
 function close(){const c=context;context=null;const d=$('trainingPlanDialog33');if(d?.open)d.close();if(c?.opener?.isConnected)c.opener.focus();}
 function shell(){
  if($('trainingPlanDialog33'))return;
  const d=document.createElement('dialog');d.id='trainingPlanDialog33';d.className='career-dialog training-dialog33';d.setAttribute('aria-labelledby','trainingPlanTitle33');
  d.innerHTML='<div class="dialog-top"><span class="page-eyebrow">나의 다음 준비</span><button type="button" id="closeTraining33" aria-label="훈련 계획 닫기">닫기</button></div><h2 id="trainingPlanTitle33">어떻게 준비할까요?</h2><div id="trainingPlanBody33"></div><div class="decision-actions"><button type="button" class="secondary" id="cancelTraining33">돌아가기</button><button type="button" id="confirmTraining33">계획 확정</button></div>';
  document.querySelector('main').append(d);$('closeTraining33').onclick=$('cancelTraining33').onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.addEventListener('close',()=>{context=null;});
  $('confirmTraining33').onclick=()=>{
   const c=context;if(!c||state!==c.owner||state.year!==c.year||state.game!==c.game||!pro()){close();return;}
   if(!canChoose(c.mode)){paintDialog();return;}
   const mode=c.mode;close();window.DiamondCareer14.choosePlan(mode);$(c.opener?.id)?.focus();
  };
 }
 function canChoose(mode){return pro()&&!state.career14?.pending&&!window.DiamondStories22?.blocks()&&!(state.career14?.plan?.end>state.game)&&(mode!=='rehab'||state.development.injury>0);}
 function effect(mode){
  const d=state.development,hard=d.intensity==='hard',injured=d.injury>0;
  if(injured)return '부상 중에는 모든 계획보다 재활 처리가 우선합니다. 매 팀 경기 컨디션 +2 · 피로 −3, 부상 기간 1 감소. 공식 출전 없음.';
  if(mode==='rest'||mode==='rehab')return '매 팀 경기 컨디션 +3 · 피로 −5. 공식 출전과 훈련 성장은 쉬어갑니다. 몸 상태 수치는 0–100 범위로 적용됩니다.';
  return (mode==='defense'?(state.role==='batter'?'수비':'변화구'):focus())+' 훈련 · '+(hard?'강훈련':'일반 훈련')+'. '+(state.age>32?'33세 이상은 훈련·실전 경험 성장 지급 대상이 아닙니다.':'12팀 경기 구간에서 실제 훈련 6일 이상이면 +1, 강훈련 6일 이상이면 +2. 잠재력 상한을 적용합니다.')+' '+(hard?'매 팀 경기 피로 +2, 출전 시 추가 +1. 컨디션 −1.1.':'출전 시 피로 +1. 컨디션 −0.6.')+' 4팀 경기마다 피로 −3, 6팀 경기마다 컨디션 +2 보정. 높은 피로는 부상 위험을 높입니다.';
 }
 function paintDialog(){
  if(!context)return;const c=context,d=state.development,p=state.career14?.plan,locked=p?.end>state.game,n=Math.min(7,144-state.game);
  const pending=state.career14?.pending||window.DiamondStories22?.blocks();
  $('trainingPlanBody33').innerHTML='<p class="training-health33">'+text(state.name)+' · 컨디션 <b>'+Math.round(d.condition)+'</b> · 피로 <b>'+Math.round(d.fatigue)+'</b></p><p class="training-duration33">'+(locked?'확정한 '+text(names()[p.mode])+' · '+(p.end-state.game)+'팀 경기 남음':pending?'먼저 기다리는 커리어 선택을 확인해 주세요.':'다음 '+n+'팀 경기의 준비를 정합니다.')+'</p><div class="training-options33" role="group" aria-label="준비 방법">'+Object.entries(names()).map(([mode,name])=>'<button type="button" data-training-mode="'+mode+'" aria-pressed="'+(c.mode===mode)+'" '+(!canChoose(mode)?'disabled':'')+'><span class="training-option-icon33" aria-hidden="true">'+({practice:'↗',defense:'◎',rest:'☾',rehab:'＋'})[mode]+'</span><span><strong>'+name+'</strong><small>'+text(mode==='practice'?focus():mode==='defense'?(state.role==='batter'?'수비 능력':'변화구 능력'):mode==='rest'?'출전을 쉬며 회복':'부상 기간 회복')+'</small></span><span class="training-choice33" aria-hidden="true">'+(c.mode===mode?'●':'○')+'</span></button>').join('')+'</div><section class="training-effect33" aria-live="polite"><h3>'+text(names()[c.mode])+'의 적용 방식</h3><p>'+text(effect(c.mode))+'</p></section><p class="training-note33">계획 확정만으로 경기나 능력치는 변하지 않습니다. 시즌을 진행해야 실제 결과가 쌓입니다. 7경기만으로 성장량이 보장되지는 않습니다.</p>';
  $('confirmTraining33').disabled=!canChoose(c.mode);$('confirmTraining33').textContent=locked?'계획 진행 중':n+'팀 경기 계획 확정';
  $('trainingPlanBody33').querySelectorAll('[data-training-mode]').forEach(b=>b.onclick=()=>{context.mode=b.dataset.trainingMode;paintDialog();$('trainingPlanBody33').querySelector('[data-training-mode="'+context.mode+'"]').focus();});
 }
 function open(opener){if(!pro())return;shell();close();const p=state.career14?.plan;context={owner:state,year:state.year,game:state.game,opener,mode:p?.end>state.game?p.mode:state.development.injury?'rehab':state.development.intensity==='rest'?'rest':'practice'};paintDialog();$('trainingPlanDialog33').showModal();}
 function paint(){
  shell();if(context){if(state!==context.owner||state?.year!==context.year||state?.game!==context.game||!pro())close();else paintDialog();}
  if(!state)return;
  const identity=$('playerIdentity'),a=$('attributes')?.closest('.panel'),d=state.development,p=state.career14?.plan;
  if(identity){
   identity.dataset.role=state.role;
   const rating=identity.querySelector('.profile-overview>div');if(rating){const base=state.ui13?.baselines?.[state.year],delta=Array.isArray(base)&&base.length===6?overall()-Math.round(base.reduce((s,v)=>s+v,0)/6):null;rating.classList.add('player-rating33');if(delta!==null){const small=document.createElement('small');small.className='player-rating-change33';small.textContent='시즌 기준 대비 '+(delta>0?'+':'')+delta;rating.append(small);}}
  }
  if(a){$('attributeLegend').textContent='파란 막대는 집중 과제 · 변화량은 저장된 시즌 기준 대비입니다.';if(!$('attributeScale33')){const scale=document.createElement('p');scale.id='attributeScale33';scale.innerHTML='<span>현재 능력</span><span>최대 100</span>';a.querySelector('h2').after(scale);}a.classList.add('player-attributes33');}
  let card=$('playerPreparation33');if(!card){card=document.createElement('section');card.id='playerPreparation33';card.className='surface-card';a?.after(card);}
  const active=p?.end>state.game;
  card.hidden=!pro();
  if(pro()){
   card.innerHTML='<p class="page-eyebrow">나의 다음 준비</p><div class="section-title-row"><h3>'+text(active?names()[p.mode]:'훈련과 회복의 균형')+'</h3><span class="training-duration-tag33">'+(active?(p.end-state.game)+'팀 경기 남음':'최대 7팀 경기')+'</span></div><p>'+text(active?'확정한 계획을 실제 일정에 적용하고 있습니다.':'집중 과제 '+focus()+'. 다음 일정을 어떻게 보낼지 정해 보세요.')+'</p><button type="button" id="openTraining33">'+(active?'확정한 계획 보기':'훈련·휴식 계획 선택')+' <span aria-hidden="true">›</span></button><button type="button" class="secondary" id="trainingToSeason33">시즌에서 진행과 결과 확인 <span aria-hidden="true">›</span></button>';
   $('openTraining33').onclick=e=>open(e.currentTarget);$('trainingToSeason33').onclick=()=>{window.DiamondNavigation.show('league');const n=$('seasonChange31')?.hidden?$('seasonSituation31'):$('seasonChange31');n?.scrollIntoView({block:'center',behavior:'instant'});};
  }
  const plans=$('weeklyPlans');if(plans&&!$('compareTraining33')){const button=document.createElement('button');button.type='button';button.id='compareTraining33';button.className='secondary';button.textContent='효과를 비교하며 계획 선택';plans.querySelector('summary').after(button);button.onclick=e=>open(e.currentTarget);}
 }
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',()=>{close();paint();});
})();
