// V1.5 — fictional contract market. No real-world league eligibility rules are implied.
'use strict';
(() => {
 const previousRender=render,previousSetup=setup,previousNext=nextSeason;
 const levels={KR:52,JP:64,US:76},roleNames={core:'핵심 기용 후보',rotation:'출전 경쟁 후보',reserve:'백업·육성 후보'};
 const pro=()=>!!state&&!(state.v12?.college&&!state.v12.college.completed);
 const money=n=>Number(n).toLocaleString()+'만원';
 const rounded=n=>Math.round(clamp(n,3000,250000)/100)*100;
 const hash=s=>[...s].reduce((n,ch)=>(Math.imul(n,31)+ch.charCodeAt(0))>>>0,17);
 const remaining=a=>Math.max(0,a.endYear-state.year+1);
 function ensure(){
  if(!pro())return null;ensureV3();v5Ensure();
  if(!state.contract15||typeof state.contract15!=='object'||Array.isArray(state.contract15)){
   const d=state.development,years=clamp(Math.floor(Number(d.contractYears)||1),1,5);
   state.contract15={active:{id:'legacy-'+state.year,team:state.team,region:v5Region(),annualSalary:d.salary,startYear:state.year,endYear:state.year+years-1,years,role:'rotation',source:'legacy'},markets:{},history:[],injuryBaselines:{}};
   if(state.game===144&&Array.isArray(d.offers)&&d.offers.length)state.contract15.legacyOffers=JSON.parse(JSON.stringify(d.offers));
  }
  const c=state.contract15;
  if(!c.markets||typeof c.markets!=='object'||Array.isArray(c.markets))c.markets={};
  if(!Array.isArray(c.history))c.history=[];
  if(!c.injuryBaselines||typeof c.injuryBaselines!=='object')c.injuryBaselines={};
  if(!Number.isFinite(c.injuryBaselines[state.year]))c.injuryBaselines[state.year]=Number(state.development.injuries)||0;
  return c;
 }
 function rookie(source='draft'){
  if(!pro())return;const c=ensure(),d=state.development;
  c.active={id:source+'-'+state.year,team:state.team,region:v5Region(),annualSalary:d.salary,startYear:state.year,endYear:state.year,years:1,role:'rotation',source};
  d.contractYears=1;
 }
 function evaluate(){
  const c=ensure(),s=state.current,d=state.development,bat=state.role==='batter';
  let exposure,performance;
  if(bat){
   exposure=clamp(s.G/144*100,0,100);
   const ops=Number(statline(s,'batter').OPS),sample=clamp(s.PA/350,0,1);
   performance=s.PA?clamp(50+((ops-.70)*70+(s.HR/Math.max(1,s.PA)) *150)*sample,10,100):30;
  }else{
   const starter=state.position==='선발투수',sample=clamp(s.IPouts/180,0,1),era=s.IPouts?s.ER*27/s.IPouts:0,k9=s.IPouts?s.PK*27/s.IPouts:0;
   exposure=clamp((starter?s.IPouts/(29*18):s.G/60)*100,0,100);
   performance=s.IPouts?clamp(50+((4.5-era)*9+(k9-6)*2+(!starter?s.SV*.25:0))*sample,10,100):30;
  }
  const injuries=Math.max(0,(Number(d.injuries)||0)-c.injuryBaselines[state.year]);
  const risk=clamp(injuries*6+Math.min(10,(Number(d.injuries)||0)*.5)+(d.injury>0?8:0),0,30);
  const ageScore=state.age<=28?90:clamp(90-(state.age-28)*6,20,90);
  const score=clamp(overall()*.4+performance*.35+exposure*.15+ageScore*.1-risk*.25,0,100);
  return {year:state.year,score:Math.round(score*10)/10,ovr:overall(),performance:Math.round(performance),exposure:Math.round(exposure),age:state.age,ageScore,injuries,risk,stats:{...s}};
 }
 function buildOffer(e,team,region,index){
  const need=35+hash(state.name+state.year+team)%61,interest=clamp(e.score+(need-60)*.4-(levels[region]-52)*.6,0,100);
  const fit=e.score-levels[region]+(need-65)*.3,role=fit>=8?'core':fit>=-10?'rotation':'reserve';
  const amount=rounded((1600+Math.pow(e.score,3)*.08)*(region==='US'?2.2:region==='JP'?1.45:1)*(.75+need/200));
  const years=state.age>=36?1:e.score>=65?2+hash(team+state.year)%3:e.score>=50?2:1;
  const ceiling=rounded(amount*(1+clamp((interest-40)/100,0,.35)));
  return {id:state.year+'-'+index,team,region,amount,years,role,need,interest:Math.round(interest),ceiling,type:team===state.team&&region===v5Region()?'stay':'fa',negotiation:null};
 }
 function market(){
  const c=ensure();if(!c||state.game!==144||state.retired||state.age>=40)return null;
  if(c.markets[state.year])return c.markets[state.year];
  const a=c.active,e=evaluate();let list,kind='renewal';
  if(c.legacyOffers){
   kind='legacy';list=c.legacyOffers.map((o,i)=>({...o,id:state.year+'-legacy-'+i,region:o.region||v5Region(),years:Number.isInteger(o.years)?o.years:1,role:roleNames[o.role]?o.role:'rotation',need:60,interest:50,ceiling:rounded(o.amount*1.1),negotiation:null}));delete c.legacyOffers;
  }else if(a.endYear>state.year){
   kind='continue';list=[{id:state.year+'-continue',team:a.team,region:a.region,amount:a.annualSalary,years:a.endYear-state.year,role:a.role,type:'continue',negotiation:null}];
  }else{
   const clubs=V5_CLUBS[v5Region()].filter(t=>t!==state.team),first=hash(state.name+state.year)%clubs.length;
   list=[buildOffer(e,state.team,v5Region(),0),buildOffer(e,clubs[first],v5Region(),1),buildOffer(e,clubs[(first+4)%clubs.length],v5Region(),2)];
   for(const region of Object.keys(levels).filter(r=>r!==v5Region())){
    const threshold=region==='US'?65:region==='JP'?55:0;
    if(e.score>=threshold){const target=V5_CLUBS[region][hash(state.name+state.year+region)%10];list.push(buildOffer(e,target,region,list.length));}
   }
  }
  const selected=Number.isInteger(state.ui13?.contracts?.[state.year])?state.ui13.contracts[state.year]:0;
  const m={year:state.year,kind,evaluation:e,offers:list,selectedId:list[selected]?.id||list[0].id,status:'open'};
  c.markets[state.year]=m;return m;
 }
 function offers(){
  if(!pro())return;const c=ensure(),m=market();state.development.offers=m?m.offers:[];
 }
 function selected(){
  const m=market();if(!m)return null;
  const input=document.querySelector('input[name=contractPick]:checked'),index=input?Number(input.value):-1;
  return m.offers[index]||m.offers.find(o=>o.id===m.selectedId)||null;
 }
 function negotiate(id,kind){
  const m=market();if(!m||m.status!=='open'||m.kind==='continue'||!['salary','role'].includes(kind))return;
  const o=m.offers.find(x=>x.id===id);if(!o||o.negotiation||(kind==='role'&&o.role==='core'))return;
  let result,proposal,request,reason;
  if(kind==='salary'){
   request={amount:rounded(o.amount*1.2),role:o.role};
   if(o.interest>=70&&request.amount<=o.ceiling){result='accepted';proposal=request;reason='시즌 성과와 구단 영입 예산이 인상 요구를 충족했습니다.';}
   else if(o.interest>=48&&o.ceiling>o.amount){result='counter';proposal={amount:Math.min(request.amount,o.ceiling,rounded(o.amount*1.1)),role:o.role};reason='요구액 전부를 맞추기 어려워 예산 안에서 역제안했습니다.';}
   else{result='rejected';reason='현재 평가와 영입 예산에서 추가 인상을 승인하지 않았습니다. 원래 제안은 유지됩니다.';}
  }else{
   const role=o.role==='reserve'?'rotation':'core';request={amount:o.amount,role};
   if(o.interest>=70&&o.need>=65){result='accepted';proposal=request;reason='구단의 해당 역할 수요와 선수 평가가 맞아 역할 개선에 동의했습니다.';}
   else if(o.interest>=45&&o.need>=50){result='counter';proposal={amount:rounded(o.amount*.9),role};reason='연봉 10% 조정을 조건으로 역할 개선을 역제안했습니다.';}
   else{result='rejected';reason='해당 역할의 경쟁 수준과 구단 수요 때문에 역할 개선을 거절했습니다. 원래 제안은 유지됩니다.';}
  }
  o.negotiation={kind,request,result,proposal:proposal||null,status:result==='counter'?'pending':result,reason,original:{amount:o.amount,role:o.role}};
  if(result==='accepted'){o.amount=proposal.amount;o.role=proposal.role;}
  offers();save();render();
 }
 function counter(id,accept){
  const m=market(),o=m?.offers.find(x=>x.id===id),n=o?.negotiation;
  if(!n||n.status!=='pending'||typeof accept!=='boolean')return;
  if(accept){o.amount=n.proposal.amount;o.role=n.proposal.role;n.status='accepted-counter';}else n.status='declined';
  offers();save();render();
 }
 function canAdvance(){
  const m=market(),o=selected();
  if(!m||!o)return false;
  if(o.negotiation?.status==='pending'){alert('선택한 제안의 역제안을 수락하거나 원래 제안을 유지해 주세요.');return false;}
  return V5_CLUBS[o.region]?.includes(o.team)&&Number.isFinite(o.amount)&&o.amount>=0&&Number.isInteger(o.years)&&o.years>=1;
 }
 function advance(legacyAdvance){
  if(!pro()||state.retired||state.game!==144||!canAdvance())return;
  const c=ensure(),m=market(),offer=selected(),year=state.year,fromTeam=state.team,fromRegion=v5Region();
  // Validate and freeze this exact selection before inherited season and award bookkeeping.
  const index=m.offers.indexOf(offer),choice=document.querySelector('input[name=contractPick]:checked');
  if(!choice||Number(choice.value)!==index)return;
  state.development.offers=m.offers;state.globalCareer.region=offer.region;v5Teams(offer.region);
  legacyAdvance();
  if(state.year!==year+1){state.globalCareer.region=fromRegion;v5Teams(fromRegion);return;}
  if(m.kind!=='continue')c.active={id:offer.id,team:offer.team,region:offer.region,annualSalary:offer.amount,startYear:state.year,endYear:state.year+offer.years-1,years:offer.years,role:offer.role,source:m.kind==='legacy'?'legacy-offer':'negotiated',signedAfter:year};
  const a=c.active;m.status='signed';m.selectedId=offer.id;
  state.development.salary=a.annualSalary;state.development.contractYears=remaining(a);
  if(!c.history.some(x=>x.year===year))c.history.push({year,id:offer.id,type:m.kind==='continue'?'continue':'sign',fromTeam,team:a.team,region:a.region,annualSalary:a.annualSalary,endYear:a.endYear,role:a.role,negotiation:offer.negotiation?JSON.parse(JSON.stringify(offer.negotiation)):null});
  if(fromRegion!==a.region)state.globalCareer.moves.push({year,fromRegion,toRegion:a.region,fromTeam,toTeam:a.team});
  const last=state.career.at(-1);if(last?.year===year){last.team=fromTeam;last.region=fromRegion;}
  state.league=null;ensureLeague();save();render();
 }
 function selectionAdjustment(){
  const c=ensure(),a=c?.active;if(!a||state.game>=42||a.source==='legacy'||a.source==='draft'||a.source==='college'||a.startYear!==state.year)return 0;
  return ((a.role==='core'?6:a.role==='reserve'?-6:0)-(levels[a.region]-52)*.15)*Math.max(0,1-state.game/42);
 }
 function marketView(root){
  if(!root)return;offers();const m=market();if(!m){root.innerHTML='<p class="screen-intro">이번 시즌을 마치고 커리어를 정리합니다.</p>';return;}
  const e=m.evaluation,a=ensure().active;
  let html='<div class="market-evaluation"><h3>'+(m.kind==='continue'?'기존 계약으로 다음 시즌':'이번 시즌 시장 평가')+'</h3>';
  if(m.kind==='continue')html+='<p>'+escapeHtml(a.team)+' · 계약 종료 '+a.endYear+'년 · 다음 시즌 포함 '+(a.endYear-state.year)+'시즌 남음</p><p>계약 기간에는 새 FA 제안과 재협상을 열지 않습니다. 현재 소속·연봉·종료 연도를 유지합니다.</p>';
  else html+='<p>종합 '+e.score+' · 기량 '+e.ovr+' · 성과 '+e.performance+' · 출전 '+e.exposure+' · 나이 '+e.age+'세 · 부상 위험 보정 '+e.risk+'</p><p class="screen-intro">'+(m.kind==='legacy'?'이전 버전에서 이미 받은 구단·연봉·선택 순서를 보존한 제안입니다. 기간 정보가 없던 제안은 1년으로 이어집니다.':'프로 정규시즌 기록으로 평가합니다. 리그 경쟁 기준: 한국52·일본64·미국76. 기간과 FA는 실제 규정과 다른 가상 게임 규칙입니다.')+'</p>';
  html+='</div>';
  m.offers.forEach((o,i)=>{
   const n=o.negotiation,checked=o.id===m.selectedId;
   html+='<article class="contract-card" data-contract-card="'+i+'"><label class="contract-option"><input type="radio" name="contractPick" value="'+i+'" '+(checked?'checked':'')+'><span><strong>'+escapeHtml(o.team)+' · '+V5_NAMES[o.region]+'</strong><span class="contract-pay">연봉 '+money(o.amount)+' · '+o.years+'년</span><small>'+roleNames[o.role]+' · '+(m.kind==='continue'?'잔여 기간 유지':'계약 총액 '+money(o.amount*o.years))+'</small></span></label>';
   html+='<button type="button" class="secondary small contract-inspect" data-open-contract="'+o.id+'">조건 자세히 보기</button>';
   if(m.kind!=='continue'){
    html+='<details class="contract-negotiation" '+(n?'open':'')+'><summary>구단과 조건 협상</summary><p class="contract-fit">구단 수요 '+o.need+' · 관심 '+o.interest+' · '+(o.role==='core'?'상대적으로 많은 기용 기회를 검토':'출전 경쟁과 성적에 따라 역할 조정')+'</p>';
    if(!n)html+='<div class="row negotiation-actions"><button type="button" class="secondary small" data-negotiate="salary" data-offer-id="'+o.id+'">연봉 20% 인상 요청</button><button type="button" class="secondary small" data-negotiate="role" data-offer-id="'+o.id+'" '+(o.role==='core'?'disabled':'')+'>역할 개선 요청</button></div>';
    else{
     const text={accepted:'요구 수락',counter:'구단 역제안',rejected:'요구 거절'}[n.result];
     html+='<div class="negotiation-result" role="status"><strong>'+text+'</strong><p>'+escapeHtml(n.reason)+'</p><p>요구: '+money(n.request.amount)+' · '+roleNames[n.request.role]+'</p>';
     if(n.proposal)html+='<p>구단 조건: '+money(n.proposal.amount)+' · '+roleNames[n.proposal.role]+'</p>';
     if(n.status==='pending')html+='<div class="row"><button type="button" class="small" data-counter="accept" data-offer-id="'+o.id+'">역제안 수락</button><button type="button" class="secondary small" data-counter="decline" data-offer-id="'+o.id+'">원래 제안 유지</button></div>';
     else html+='<p>'+({accepted:'개선된 조건으로 계약할 수 있습니다.','accepted-counter':'역제안을 수락했습니다. 최종 계약은 다음 시즌 확정 시 적용됩니다.',declined:'원래 조건을 유지했습니다.',rejected:'원래 조건으로 계약할 수 있습니다.'}[n.status]||'')+'</p>';
     html+='</div>';
    }
    html+='</details>';
   }
   html+='</article>';
  });
  html+='<p class="screen-intro">'+(m.kind==='continue'?'기존 계약의 남은 기간을 유지합니다. 최종 확인 후 다음 시즌을 시작합니다.</p>':'구단별 협상은 한 번입니다. 다른 제안과 비교한 뒤 진로 확정 버튼으로 최종 계약합니다. 예상 역할·리그 적응은 첫 42팀 경기 동안 기용 평가에 반영되며 건강·실력 평가가 함께 적용됩니다.</p>');
  root.innerHTML=html;
  for(const input of root.querySelectorAll('input'))input.onchange=()=>{m.selectedId=m.offers[Number(input.value)].id;if(!state.ui13)state.ui13={};if(!state.ui13.contracts)state.ui13.contracts={};state.ui13.contracts[state.year]=Number(input.value);save();};
  for(const b of root.querySelectorAll('[data-negotiate]'))b.onclick=()=>negotiate(b.dataset.offerId,b.dataset.negotiate);
  for(const b of root.querySelectorAll('[data-counter]'))b.onclick=()=>counter(b.dataset.offerId,b.dataset.counter==='accept');
 }
 function view(){
  let pane=$('contractSummary');if(!pro()){if(pane)pane.hidden=true;return;}
  const c=ensure(),a=c.active;if(!pane){pane=document.createElement('section');pane.id='contractSummary';pane.className='panel';}
  $('screen-training')?.append(pane);pane.hidden=false;
  const rem=remaining(a);state.development.contractYears=rem;
  pane.innerHTML='<p class="page-eyebrow">MY CONTRACT</p><h2>나의 계약</h2><div class="report-rows"><div class="report-row"><span>계약 구단</span><b>'+escapeHtml(a.team)+'</b></div><div class="report-row"><span>연봉</span><b>'+money(a.annualSalary)+'</b></div><div class="report-row"><span>기간</span><b>'+a.startYear+'–'+a.endYear+' · '+rem+'시즌 남음</b></div><div class="report-row"><span>예상 역할</span><b>'+roleNames[a.role]+'</b></div></div><p class="screen-intro">'+(a.source==='legacy'?'이전 저장의 연봉·소속을 보존했습니다. 종료 연도는 기존 잔여 기간을 기준으로 연결했습니다.':'계약 기간은 현재 시즌을 포함합니다. 연봉은 시즌별 금액이며 계약 총액과 구분합니다.')+'</p><h3>최근 계약 이력</h3>'+(c.history.slice(-5).reverse().map(x=>'<div class="growth-row">'+(x.year+1)+' · '+escapeHtml(x.team)+' · '+money(x.annualSalary)+' · '+x.endYear+'년 종료 · '+(x.type==='continue'?'기존 계약 유지':'새 계약')+'</div>').join('')||'<p class="screen-intro">다음 시즌 계약을 확정하면 이력이 쌓입니다.</p>');
 }
 window.DiamondContracts=Object.freeze({offers,advance,marketView,rookie,selectionAdjustment,evaluate,canAdvance});
 render=function(){if(pro())ensure();previousRender();view();};
 setup=function(){previousSetup();$('createForm').addEventListener('submit',()=>{if(!state||state.game||state.career.length)return;if(!pro()){delete state.contract15;return;}rookie('draft');save();render();});};
 nextSeason=function(){if(pro()&&!state.retired&&state.game===144&&state.age<40&&!canAdvance())return;return previousNext();};
})();
