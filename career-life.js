// V2.0 optional career life state: explicit decisions, real practice and new salary settlements.
'use strict';
(() => {
 const pro=()=>!!state&&!(state.v12?.college&&!state.v12.college.completed);
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
 function ensure(){
  if(!obj(state.life20))state.life20={version:1,balance:0,morale:0,cohesion:0,history:[],paid:{},purchases:{},stories:{},project:null};
  const x=state.life20;
  for(const key of ['paid','purchases','stories'])if(!obj(x[key]))x[key]={};
  if(!Array.isArray(x.history))x.history=[];
  for(const key of ['balance','morale','cohesion'])if(!Number.isFinite(x[key]))x[key]=0;
  x.balance=Math.max(0,x.balance);x.morale=clamp(x.morale,-20,20);x.cohesion=clamp(x.cohesion,0,20);
  return x;
 }
 function log(title,effect,kind='life'){const x=ensure();x.history.push({year:state.year,game:state.game,title,effect,kind});x.history=x.history.slice(-400);}
 function episode(){
  if(!pro()||state.retired)return null;
  if(state.development?.injury)return {id:'care',title:'복귀를 준비하는 하루',detail:'트레이너와 남은 회복 기간의 생활 계획을 정합니다.',options:[['rest','충분히 쉬고 회복에 집중한다','컨디션 +8 · 피로 −12'],['team','동료와 함께 재활 계획을 나눈다','사기 +6 · 팀 유대 +4 · 신뢰 +3 · 피로 +4']]};
  if(state.age>=28)return {id:'captain',title:'후배들이 먼저 말을 걸어왔다',detail:'팀의 베테랑으로서 어떤 역할을 맡을지 생각합니다.',options:[['lead','후배의 훈련을 함께 챙긴다','팀 유대 +8 · 구단 신뢰 +4 · 피로 +4'],['rest','내 몸과 다음 경기를 먼저 챙긴다','컨디션 +8 · 피로 −12']]};
  return {id:'team',title:'훈련이 끝난 뒤의 약속',detail:'동료들이 식사 자리에 초대했습니다. 내일도 훈련이 있습니다.',options:[['team','함께하며 팀에 적응한다','사기 +6 · 팀 유대 +4 · 피로 +4'],['rest','일찍 돌아가 다음 날을 준비한다','컨디션 +8 · 피로 −12']]};
 }
 function choose(choice){
  const e=episode();if(!e||!e.options.some(x=>x[0]===choice)||state.career14?.pending)return false;
  const x=ensure();if(x.stories[state.year])return false;
  const d=state.development,before={condition:d.condition,fatigue:d.fatigue,trust:d.trust,morale:x.morale,cohesion:x.cohesion};
  if(choice==='rest'){d.condition=clamp(d.condition+8,0,100);d.fatigue=clamp(d.fatigue-12,0,100);}
  if(choice==='team'){x.morale=clamp(x.morale+6,-20,20);x.cohesion=clamp(x.cohesion+4,0,20);d.fatigue=clamp(d.fatigue+4,0,100);if(e.id==='care')d.trust=clamp(d.trust+3,0,100);}
  if(choice==='lead'){x.cohesion=clamp(x.cohesion+8,0,20);d.trust=clamp(d.trust+4,0,100);d.fatigue=clamp(d.fatigue+4,0,100);}
  const labels={condition:'컨디션',fatigue:'피로',trust:'신뢰',morale:'사기',cohesion:'팀 유대'},now={...d,morale:x.morale,cohesion:x.cohesion};
  const effect=Object.keys(before).filter(k=>now[k]!==before[k]).map(k=>labels[k]+' '+Math.round(before[k])+' → '+Math.round(now[k])).join(' · ')||'현재 상한·하한으로 추가 변화 없음';
  x.stories[state.year]={id:e.id,choice,title:e.title,effect};log(e.title,effect);save();render();return true;
 }
 function projects(){return [{id:'technique',title:state.role==='batter'?'타격 기술 다듬기':'제구 안정화',index:state.role==='batter'?0:1},{id:'adapt',title:state.role==='batter'?'수비 적응 프로젝트':'변화구 완성 프로젝트',index:state.role==='batter'?4:3},{id:'body',title:state.role==='batter'?'송구 기본기 완성':'체력 기반 만들기',index:state.role==='batter'?5:4}];}
 function startProject(id){
  if(!pro()||state.retired||state.career14?.pending||state.game>=144)return false;
  const config=projects().find(p=>p.id===id);if(!config)return false;
  const x=ensure();if(x.project&&!x.project.complete)return false;
  // One project start per season, with progress carrying into later seasons.
  if(x.history.some(h=>h.kind==='project-start'&&h.year===state.year))return false;
  x.project={...config,progress:0,awards:0,target:36,complete:false,last:null};log(config.title,'실제 훈련 36일 · 12일마다 해당 능력 +1 · 부상·휴식일 제외','project-start');save();render();return true;
 }
 function factor(){const x=state?.life20;if(!x||!Number.isFinite(x.morale)||!Number.isFinite(x.cohesion))return 1;return 1+clamp(x.morale*.0005+x.cohesion*.0005,-.01,.02);}
 function afterGame(info){
  if(!pro())return;
  let x=state.life20;
  if(x?.project&&!x.project.complete){
   const p=x.project,key=state.year+'-'+state.game;
   if(p.last!==key&&Number.isInteger(p.index)&&p.index>=0&&p.index<6){
    p.last=key;
    if(!info.resting&&!info.injured){
     p.progress=Math.min(36,(Number(p.progress)||0)+1);
     if(p.progress%12===0){const before=state.attributes[p.index];if(state.age<=32)state.attributes[p.index]=Math.max(before,Math.min(state.potential,99,before+1));const amount=state.attributes[p.index]-before;p.awards=(Number(p.awards)||0)+amount;log(p.title,ATTR[state.role][p.index]+' '+(amount?'+'+amount:'추가 성장 없음 · 연령 또는 잠재력 상한'),'project-growth');if(amount&&state.career14)state.career14.growth.push({year:state.year,game:state.game,index:p.index,amount,source:'장기 프로젝트'});}
     if(p.progress>=36){p.complete=true;log(p.title,'36일 훈련 완료 · 실제 능력 성장 +'+p.awards,'project-complete');}
    }
   }
  }
  if(state.game===144){x=ensure();if(!Object.hasOwn(x.paid,state.year)){const salary=Math.max(0,Number(state.development.salary)||0);x.balance+=salary;x.paid[state.year]=salary;log('시즌 급여 정산',salary.toLocaleString()+'만원 적립','salary');}}
 }
 function products(){return [{id:'glove',title:state.role==='batter'?'타격 장갑':'피칭 그립 훈련 도구',price:3000,index:state.role==='batter'?0:1},{id:'shoes',title:'기초 체력 훈련 세트',price:6000,index:state.role==='batter'?3:4},{id:'analysis',title:'개인 영상 분석 세션',price:10000,index:state.development?.focus||0}];}
 function buy(id){
  if(!pro()||state.retired)return false;const product=products().find(p=>p.id===id);if(!product)return false;
  const x=ensure(),before=state.attributes[product.index];if(x.purchases[state.year]||x.balance<product.price||before>=Math.min(99,state.potential))return false;
  x.balance-=product.price;state.attributes[product.index]=Math.min(99,state.potential,before+1);x.purchases[state.year]={...product};log(product.title,product.price.toLocaleString()+'만원 사용 · '+ATTR[state.role][product.index]+' +1','purchase');save();render();return true;
 }
 function onTransfer(from,to){if(from===to||!state.life20)return;const x=ensure(),before=x.cohesion;x.cohesion=Math.floor(before/2);log('새 팀에 적응하는 시간','팀 유대 '+before+' → '+x.cohesion+' · 장기 훈련과 보유 자금 유지','transfer');}
 window.DiamondLife=Object.freeze({episode,choose,projects,startProject,factor,afterGame,products,buy,onTransfer});
})();
