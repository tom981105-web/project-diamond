// V2.2: opt-in, deterministic career stories. Viewing never changes a save.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),pro=()=>!!state&&!state.retired&&!(state.v12?.college&&!state.v12.college.completed);
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const good=n=>object(n)&&n.version===1&&typeof n.enabled==='boolean'&&Number.isInteger(n.year)&&typeof n.team==='string'&&['offered','paused','serial','lastOffer'].every(k=>Number.isFinite(n[k]))&&Array.isArray(n.history)&&n.history.every(h=>object(h)&&Number.isInteger(h.year)&&typeof h.title==='string')&&Array.isArray(n.seen)&&n.seen.every(k=>typeof k==='string')&&object(n.threads)&&(!n.pending||(object(n.pending)&&typeof n.pending.id==='string'&&typeof n.pending.title==='string'&&Array.isArray(n.pending.options)&&n.pending.options.every(o=>object(o)&&typeof o.id==='string'&&typeof o.label==='string'&&object(o.effect)&&Object.values(o.effect).every(Number.isFinite))));
 const data=()=>good(state?.narrative22)?state.narrative22:null;
 const pending=()=>{const p=data()?.pending;return p&&Array.isArray(p.options)&&p.year===state.year&&p.team===state.team?p:null;};
 const blocks=()=>!!(pro()&&data()?.enabled&&pending()?.blocking&&state.game<144);
 const choice=(id,label,effect,extra={})=>({id,label,effect,...extra});
 const rest=()=>choice('rest','몸을 쉬게 하며 다음 기회를 준비한다',{condition:6,fatigue:-10});
 const plan=(id,label,effect,extra={})=>choice(id,label,effect,{plan:true,...extra});
 function situation(n){
  const d=state.development,c=state.career14||{},t=n.threads,g=state.game;
  const story=(key,title,detail,options)=>({key,title,detail,options});
  const recent=c.recent||[],sum=k=>recent.reduce((v,r)=>v+(Number(r[k])||0),0);
  const slump=state.role==='batter'?sum('AB')>=24&&sum('H')/sum('AB')<.2:sum('IPouts')>=27&&sum('ER')*27/sum('IPouts')>6;
  const elapsed=t=>t?(state.year-t.year)*144+g-t.game:0;
  const ready=t.practice&&elapsed(t.practice)>=28;
  const candidates=[];
  if(d.injury)candidates.push(story('rehab','동료가 찾아온 재활실','공식 재활 일정은 그대로입니다. 동료가 훈련이 끝난 뒤 안부를 물었습니다.',[choice('talk','회복 계획과 걱정을 함께 나눈다',{morale:4,cohesion:3}),rest()]));
  if(n.wasInjured&&!d.injury)candidates.push(story('return','복귀 뒤의 새 루틴','재활을 마친 뒤의 훈련과 몸 상태를 다시 점검합니다.',[plan('review','코치와 기본 훈련부터 확인한다',{trust:3,morale:2}),rest()]));
  if(ready)candidates.push(story('practice-followup','그날 함께 남았던 동료',slump?'함께 훈련했던 동료가 최근 부진을 보고 영상 분석을 제안했습니다.':'함께 훈련했던 동료가 지난 경기 영상을 챙겨 왔습니다. 약속이 다음 훈련으로 이어집니다.',[plan('review','동료와 영상을 보고 7경기 훈련을 준비한다',{trust:2,cohesion:3,fatigue:3},{consume:'practice'}),choice('talk','조언을 듣고 내 페이스를 유지한다',{morale:3,cohesion:2},{consume:'practice'})]));
  if(t.mentor&&elapsed(t.mentor)>=28)candidates.push(story('mentor-followup','후배가 건넨 경기 노트','훈련을 함께했던 후배가 분석한 내용을 가져왔습니다.',[plan('review','서로의 기록으로 다음 훈련을 준비한다',{trust:2,cohesion:3},{consume:'mentor'}),choice('talk','고마움을 전하고 후배의 이야기를 듣는다',{morale:3,cohesion:3},{consume:'mentor'})]));
  if(slump)candidates.push(story('slump','숫자가 마음에 걸리는 날','최근 실제 경기 기록에서 부진이 이어지고 있습니다. 코치가 훈련 방향을 함께 점검하자고 합니다.',[plan('review','기본 과제로 돌아가 7경기 훈련한다',{trust:3,fatigue:3}),rest()]));
  const moved=state.contract15?.history?.some(h=>h.year+1===state.year&&h.fromTeam!==h.team);
  if(moved)candidates.push(story('adapt','아직 낯선 더그아웃','새 구단의 훈련 방식과 동료들에게 적응하는 중입니다.',[choice('talk','동료에게 먼저 다가가 팀의 방식을 묻는다',{cohesion:4,trust:2,fatigue:2}),rest()]));
  if(state.age>=28)candidates.push(story('mentor','후배의 질문','후배가 평소 준비 과정을 물어왔습니다. 팀에서 맡을 역할을 생각합니다.',[plan('lead','후배와 기본 훈련을 함께한다',{cohesion:4,trust:3,fatigue:4},{thread:'mentor'}),rest()]));
  if(c.role==='reserve')candidates.push(story('competition','기회를 기다리는 시간','현재 기용 평가에서는 출전 경쟁 중입니다. 코치에게 준비 방향을 물을 수 있습니다.',[plan('review','코치와 7경기 훈련 계획을 맞춘다',{trust:4,fatigue:3}),rest()]));
  candidates.push(story('practice',state.age<=21?'첫 원정의 훈련 파트너':'모두가 떠난 훈련장','동료 한 명이 조금 더 남아 기본 훈련을 하자고 합니다. 내일의 몸 상태도 생각해야 합니다.',[plan('team','동료와 추가 훈련을 약속한다',{cohesion:3,trust:2,fatigue:6},{thread:'practice'}),rest()]));
  return candidates.find(s=>!n.seen.includes(s.key))||null;
 }
 function record(p,option,effect,status='chosen'){
  const n=data();n.history.push({id:p.id,year:p.year,game:state.game,offeredAt:p.game,team:p.team,key:p.key,title:p.title,choice:option?.id||'skip',label:option?.label||'이번에는 넘기기',effect,status});n.history=n.history.slice(-400);
 }
 function offer(n,initial=false){
  if(n.pending||n.offered>=3||state.game>=144||(!initial&&state.game-n.lastOffer<28))return;
  const s=situation(n);if(!s)return;
  n.serial++;n.pending={...s,id:state.year+'-'+n.serial,year:state.year,game:state.game,team:state.team,blocking:initial||n.paused<2};
  n.seen.push(s.key);n.offered++;n.lastOffer=state.game;if(!initial&&n.pending.blocking)n.paused++;
 }
 function enable(){
  if(!pro()||state.game>=144||state.career14?.pending)return false;
  let n=data();if(!n){n=state.narrative22={version:1,enabled:true,year:state.year,team:state.team,offered:0,lastOffer:state.game,paused:0,serial:0,pending:null,history:[],threads:{},seen:[],lastGame:null,wasInjured:!!state.development.injury};}
  else n.enabled=true;
  observeYear(n);offer(n,n.offered===0);save();render();return true;
 }
 function observeYear(n){
  if(n.year!==state.year||n.team!==state.team){
   if(n.pending)record(n.pending,null,'시즌 또는 소속이 바뀌어 이 이야기를 마쳤습니다.','expired');
   if(n.team!==state.team)n.threads={};
   n.wasInjured=false;n.year=state.year;n.team=state.team;n.pending=null;n.offered=0;n.paused=0;n.seen=[];n.lastOffer=state.game-28;n.lastGame=null;
  }
 }
 function afterGame(info){
  const n=data();if(!pro()||!n?.enabled)return;observeYear(n);const key=state.year+'-'+state.game;if(n.lastGame===key)return;n.lastGame=key;
  if(state.game>=144){if(n.pending){record(n.pending,null,'시즌을 마쳐 추가 선택을 적용하지 않았습니다.','expired');n.pending=null;}return;}
  // Preserve an observed injury until its return story has been offered.
  if(info.injured)n.wasInjured=true;
  offer(n);if(n.pending?.key==='return')n.wasInjured=false;
 }
 function unavailable(o){
  if(state.career14?.pending)return '부상·기용의 필수 선택을 먼저 확인해 주세요.';
  if(o.plan&&state.game+7>144)return '7팀 경기 훈련을 마칠 일정이 부족합니다. 다른 선택을 골라 주세요.';
  if(o.plan&&(state.development.injury>0||state.career14?.plan?.end>state.game))return '재활 또는 이미 확정한 7경기 계획을 먼저 마쳐 주세요.';
  return '';
 }
 function resolve(id,optionId){
  const n=data(),p=pending();if(!pro()||!n?.enabled||!p||p.id!==id||state.game>=144||state.career14?.pending)return false;
  const o=p.options.find(o=>o.id===optionId);if(optionId!=='skip'&&(!o||unavailable(o)))return false;
  if(o){
   const effect=window.DiamondLife.applyStory(p.title,o.effect,o.label,o.plan);
   if(o.plan){state.career14.plan={mode:'practice',focus:state.development.focus,intensity:'normal',end:Math.min(144,state.game+7)};}
   if(o.thread)n.threads[o.thread]={game:state.game,year:state.year,team:state.team};
   if(o.consume)delete n.threads[o.consume];
   record(p,o,effect+(o.plan?' · 일반 훈련 7팀 경기 계획 확정 · 실제 훈련일에 성장 계산':''));
  }else record(p,null,'효과 없이 이야기를 넘겼습니다.','skipped');
  n.pending=null;save();render();return true;
 }
 function disable(){const n=data();if(!n)return;if(pending()){record(pending(),null,'이야기 알림을 꺼 효과 없이 넘겼습니다.','skipped');n.pending=null;}n.enabled=false;save();render();}
 const changes=o=>Object.entries(o.effect).map(([k,v])=>({trust:'구단 신뢰',cohesion:'팀 유대',morale:'사기',fatigue:'피로',condition:'컨디션'}[k]||k)+' '+(v>0?'+':'')+v).join(' · ')+(o.plan?' · 7경기 일반 훈련':'');
 let context=null;
 function open(){const p=pending();if(!p)return;const d=$('storyDialog22');context={owner:state,id:p.id};const src=window.DiamondVisualAssets?.portraits?.[Number(state.ui13?.avatar)||0];
  d.querySelector('.experience-body').innerHTML='<div class="story-speaker">'+(src?'<img src="'+text(src)+'" alt="나의 야구 선수">':'')+'<div><small>'+p.year+' · '+p.game+'팀 경기 · '+text(p.team)+'</small><h3>'+text(p.title)+'</h3></div></div><p>'+text(p.detail)+'</p><div class="life-options">'+p.options.map(o=>'<button type="button" data-story-choice="'+text(o.id)+'" '+(unavailable(o)?'disabled':'')+'><strong>'+text(o.label)+'</strong><small>'+text(changes(o))+'</small>'+(unavailable(o)?'<small>'+text(unavailable(o))+'</small>':'')+'</button>').join('')+'</div><p class="decision-note">신뢰는 실제 기용 평가에, 팀 유대·사기는 경기 능력에 반영됩니다. 훈련 보상은 실제 훈련일을 채워야 지급됩니다. 선택 자체로 부상 기간이나 경기 기록을 바꾸지 않습니다.</p><button type="button" class="secondary" id="skipStory22" '+(state.career14?.pending?'disabled':'')+'>이번에는 넘기기</button>';
  for(const b of d.querySelectorAll('[data-story-choice],#skipStory22'))b.onclick=()=>{if(context?.owner!==state||context.id!==pending()?.id){d.close();return;}if(resolve(context.id,b.dataset.storyChoice||'skip'))d.close();};if(!d.open)d.showModal();
 }
 function paint(){
  if(!$('storyDialog22')){const d=document.createElement('dialog');d.id='storyDialog22';d.className='career-dialog experience-dialog';d.setAttribute('aria-labelledby','storyTitle22');d.innerHTML='<div class="dialog-top"><h2 id="storyTitle22">라커룸 이야기</h2><button type="button" aria-label="라커룸 이야기 닫기" id="closeStory22">닫기</button></div><div class="experience-body"></div>';document.querySelector('main').append(d);$('closeStory22').onclick=()=>d.close();}
  const modal=$('storyDialog22');if(!pro()){modal.close();context=null;}if(context&&(context.owner!==state||context.id!==pending()?.id)){modal.close();context=null;}
  let root=$('careerStory22');if(!root){root=document.createElement('section');root.id='careerStory22';root.className='surface-card';$('screen-league')?.append(root);}root.hidden=!pro();if(root.hidden)return;
  const n=data(),p=pending(),last=n?.history?.at(-1);(state.game>=144?$('seasonDecision'):blocks()?$('careerWeek')||$('seasonStory'):$('seasonActions')).after(root);
  root.innerHTML='<p class="flow-eyebrow">선수 생활 · 라커룸 이야기</p><h3>'+text(p?.title||(!n?.enabled?'선택이 다음 이야기로 이어집니다':'다음 이야기를 쌓는 중'))+'</h3><p>'+text(p?p.detail:!n?.enabled?'이야기를 켜면 동료·코치와의 선택이 훈련과 관계에 남습니다. 기존 일정은 그대로 이어갈 수 있습니다.':'시즌 중 최대 두 번 일정을 멈춥니다. 매 사건은 28팀 경기 이상 간격으로 발생하며 넘길 수도 있습니다.')+'</p>'+(p&&n.enabled?'<button type="button" id="openStory22">이야기와 선택 확인</button>':!n?.enabled?'<button type="button" id="enableStories22" '+(state.game>=144||state.career14?.pending?'disabled':'')+'>이야기 진행 켜기</button>':'')+(last?'<div class="story-feedback" role="status"><strong>'+text(last.title)+' · '+text(last.label)+'</strong><p>'+text(last.effect)+'</p></div>':'')+(n?.enabled?'<button type="button" class="secondary small" id="disableStories22">이야기 알림 끄기</button>':'');
  if($('openStory22'))$('openStory22').onclick=open;if($('enableStories22'))$('enableStories22').onclick=()=>{if(enable())open();};if($('disableStories22'))$('disableStories22').onclick=disable;
  if(blocks()&&!state.career14?.pending){for(const id of ['oneBtn','weekBtn','seasonBtn','continueCareer'])if($(id))$(id).disabled=true;}
 }
 window.DiamondStories22=Object.freeze({enable,resolve,disable,afterGame,blocks,pending,open});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',()=>{context=null;$('storyDialog22')?.close();paint();});
})();
