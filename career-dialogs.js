// V1.7: inspect real career decisions and confirm exact terms before advancing.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup;
 const roles={core:'핵심 기용 후보',rotation:'출전 경쟁 후보',reserve:'백업·육성 후보'};
 const money=n=>Number(n).toLocaleString()+'만원';
 const pro=()=>!!state&&!(state.v12?.college&&!state.v12.college.completed);
 let context=null;
 const row=(label,value)=>'<div class="decision-row"><span>'+escapeHtml(label)+'</span><strong>'+escapeHtml(String(value))+'</strong></div>';
 function shell(){
  for(const [id,label] of [['contractDetailDialog','계약 제안 상세'],['careerMomentDialog','커리어의 중요한 순간'],['careerAdvanceDialog','다음 시즌 최종 확인']]){
   if($(id))continue;
   const dialog=document.createElement('dialog');dialog.id=id;dialog.className='career-dialog';dialog.setAttribute('aria-labelledby',id+'Title');
   dialog.innerHTML='<div class="dialog-top"><span class="page-eyebrow">MY CAREER</span><button type="button" data-close-career-dialog aria-label="'+label+' 닫기">닫기</button></div><h2 id="'+id+'Title">'+label+'</h2><div class="decision-content"></div><div class="decision-actions"></div>';
   document.querySelector('main').append(dialog);
   dialog.querySelector('[data-close-career-dialog]').onclick=()=>close();
   dialog.oncancel=e=>{e.preventDefault();close();};
   dialog.addEventListener('close',()=>{if(context?.dialog===dialog)context=null;});
  }
 }
 function close(){const c=context;context=null;if(c?.dialog.open)c.dialog.close();if(c?.opener?.isConnected)c.opener.focus();}
 function market(){return pro()&&state.game===144&&!state.retired?state.contract15?.markets?.[state.year]:null;}
 function offer(id){return market()?.offers.find(x=>x.id===id);}
 function pick(id){
  const m=market(),index=m?.offers.findIndex(x=>x.id===id),input=index>=0?document.querySelector('#contractOptions input[value="'+index+'"]'):null;
  if(!input)return false;input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));return true;
 }
 function selected(){const m=market();return m?.offers.find(x=>x.id===m.selectedId);}
 function fingerprint(){
  const o=selected();return JSON.stringify([state?.year,state?.age,state?.ui13?.drafts?.[state?.year],o?.id,o?.team,o?.region,o?.amount,o?.years,o?.role,o?.negotiation?.status]);
 }
 function show(id,kind,key,opener){
  shell();close();const dialog=$(id);context={dialog,kind,key,owner:state,year:state.year,opener};
  paint();if(context)dialog.showModal();
 }
 function terms(o){
  const m=market(),a=state.contract15.active,continuing=m.kind==='continue';
  const start=state.year+1,end=continuing?a.endYear:state.year+o.years;
  return '<p class="decision-club">'+escapeHtml(o.team)+'</p><p class="screen-intro">'+escapeHtml(V5_NAMES[o.region])+' · '+(continuing?'기존 계약 유지':'다음 시즌 계약 제안')+'</p><div class="decision-rows">'+row('연봉',money(o.amount))+row('적용 기간',start+'–'+end+' · '+o.years+'시즌')+row(continuing?'잔여 기간 연봉 합계':'계약 총액',money(o.amount*o.years))+row('예상 역할',roles[o.role])+row('현재 소속',state.team)+row('현재 연봉',money(a.annualSalary))+'</div><p class="decision-note">예상 역할은 출전 보장이 아닙니다. 실제 기용은 실력·몸 상태·최근 성적과 함께 계산합니다.</p>'+(continuing?'<p class="decision-note">계약 종료 연도와 연봉을 유지합니다. 새 계약이나 추가 협상은 발생하지 않습니다.</p>':'<p class="decision-note">'+escapeHtml(o.negotiation?.reason||'협상 전 제안입니다. 구단별로 한 번 조건 개선을 요청할 수 있습니다.')+'</p>');
 }
 function paint(){
  const c=context;if(!c)return;
  const body=c.dialog.querySelector('.decision-content'),actions=c.dialog.querySelector('.decision-actions');
  if(c.kind==='offer'){
   const o=offer(c.key);if(!o){close();return;}
   body.innerHTML=terms(o);actions.innerHTML='<button type="button" class="secondary" id="keepComparing">계속 비교하기</button><button type="button" id="selectDetailedOffer">이 제안 선택</button>';
   $('keepComparing').onclick=close;$('selectDetailedOffer').onclick=()=>{if(offer(c.key)&&pick(c.key)){close();render();}};
  }else if(c.kind==='event'){
   const p=state.career14?.pending;if(!p||p.id!==c.key){close();return;}
   const injury=p.type==='injury',n=Math.min(7,144-state.game);
   body.innerHTML='<p class="section-kicker">'+state.year+' · '+p.game+'팀 경기</p><h3 class="decision-club">'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.detail)+'</p><div class="decision-rows">'+row('소속 단계',state.development.level)+row('컨디션 · 피로',Math.round(state.development.condition)+' · '+Math.round(state.development.fatigue))+row('남은 요청 일정',state.career14.remaining+'팀 경기')+'</div><p class="decision-note">'+(injury?'재활 계획을 확인하면 최대 '+n+'팀 경기 동안 재활에 집중합니다. 부상 중에는 공식 경기에 출전하지 않습니다.':'훈련 재개 또는 회복 우선 계획을 최대 '+n+'팀 경기 동안 확정합니다. 회복 우선은 출전·훈련 없이 몸 상태를 회복합니다.')+'</p><p class="decision-note">선택은 계획을 확정합니다. 실제 경기 진행은 선택 후 이어가기 버튼으로 시작합니다.</p>';
   actions.innerHTML='<button type="button" class="secondary" id="postponeCareerMoment">나중에 확인</button>'+(injury?'':'<button type="button" data-moment-choice="train">훈련과 경쟁 재개</button>')+'<button type="button" data-moment-choice="rest">'+(injury?'재활 계획 확인':'7경기 회복 우선')+'</button>';
   $('postponeCareerMoment').onclick=close;
   actions.querySelectorAll('[data-moment-choice]').forEach(b=>b.onclick=()=>{if(state!==c.owner||state.career14?.pending?.id!==c.key){close();return;}const choice=b.dataset.momentChoice;close();window.DiamondCareer14.resolve(c.key,choice);});
  }else{
   const retiring=state.age>=40,o=selected();
   body.innerHTML=retiring?'<p class="decision-club">마지막 시즌을 기록으로 남깁니다.</p><p>완료한 '+state.career.length+'시즌의 기록을 보관하고 선수 생활을 마무리합니다.</p>':terms(o)+'<p class="decision-note">육성 방향: '+escapeHtml(({compete:state.role==='batter'?'주전 자리를 향해':'등판 기회를 향해',refine:state.role==='batter'?'타격의 빈틈 메우기':'제구의 완성도를 높이기',recover:state.role==='batter'?'오래 뛸 몸 만들기':'건강한 팔로 새 출발'})[state.ui13.drafts[state.year]])+'</p><p class="decision-note">선택한 육성 방향도 다음 시즌에 한 번 적용됩니다. 확정하면 '+(state.year+1)+'년으로 넘어갑니다.</p>';
   actions.innerHTML='<button type="button" class="secondary" id="cancelCareerAdvance">돌아가서 검토</button><button type="button" id="confirmCareerAdvance">'+(retiring?'은퇴 확정':'이 조건으로 다음 시즌 시작')+'</button>';
   $('cancelCareerAdvance').onclick=close;
   $('confirmCareerAdvance').onclick=()=>{
    if(state!==c.owner||state.year!==c.year||state.game!==144||fingerprint()!==c.key){close();return;}
    $('confirmCareerAdvance').disabled=true;close();nextSeason();
   };
  }
 }
 function sync(){
  shell();if(!context)return;
  const c=context;
  if(state!==c.owner||state?.year!==c.year||!pro()||state.retired||(c.kind==='event'&&state.career14?.pending?.id!==c.key)||(c.kind==='offer'&&!offer(c.key))||(c.kind==='advance'&&(state.game!==144||fingerprint()!==c.key))){close();return;}
  paint();
 }
 function openAdvance(){
  if(!pro()||state.retired||state.game!==144||state.career14?.pending)return;
  if(!state.ui13?.reviewed?.[state.year]){window.DiamondUI.openReview();return;}
  if(state.age<40){if(!state.ui13?.drafts?.[state.year]||!window.DiamondContracts.canAdvance())return;}
  show('careerAdvanceDialog','advance',fingerprint(),$('nextBtn'));
 }
 document.addEventListener('click',e=>{
  const contract=e.target.closest('[data-open-contract]');
  if(contract&&offer(contract.dataset.openContract))show('contractDetailDialog','offer',contract.dataset.openContract,contract);
  if(e.target.closest('#inspectCareerEvent')&&pro()&&state.career14?.pending)show('careerMomentDialog','event',state.career14.pending.id,e.target.closest('#inspectCareerEvent'));
 });
 render=function(){baseRender();sync();};
 setup=function(){baseSetup();$('nextBtn').onclick=openAdvance;sync();};
 window.addEventListener('diamond-slot-change',()=>{close();sync();});
})();
