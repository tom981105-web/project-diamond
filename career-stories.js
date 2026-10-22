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
 const validTraining=t=>Array.isArray(t)&&t.length===2&&t.every(i=>Number.isInteger(i)&&i>=0&&i<6)&&t[0]!==t[1];
 function coachStory(){
  const pairs=state.role==='batter'?[[0,2],[1,3],[4,5]]:[[0,1],[2,3],[4,5]],d=state.development;
  const alternatives=pairs.filter(t=>!(t.includes(d.focus)&&t.includes(d.secondaryFocus))).sort((a,b)=>a.reduce((v,i)=>v+state.attributes[i],0)-b.reduce((v,i)=>v+state.attributes[i],0));
  return {key:'coach-path',title:'다음 훈련을 함께 그려 봅니다',detail:'코치가 두 가지 과제를 묶은 훈련 방향을 제안합니다. 선택하면 기본 집중 과제를 바꾸고, 앞으로 7팀 경기 동안 일반 훈련 계획을 확정합니다.',options:[choice('keep','지금의 훈련 방향을 이어간다',{}),...alternatives.slice(0,2).map((t,i)=>plan('path-'+i,ATTR[state.role][t[0]]+' · '+ATTR[state.role][t[1]]+' 중심으로 준비한다',{}, {training:t,thread:'coach'}))]};
 }
 function coachingReview(t){
  if(!t||t.team!==state.team||!validTraining(t.training)||!Array.isArray(t.attributes)||t.attributes.length!==6||!t.attributes.every(Number.isFinite))return null;
  const rows=t.training.map(i=>({index:i,before:t.attributes[i],now:state.attributes[i]}));
  return {key:'coach-review',title:'함께 정한 과제를 돌아보며',detail:'지난 상담 이후 실제 능력치가 어떻게 달라졌는지 코치와 확인합니다. 아래 변화에는 이 기간의 훈련·실전 경험 등 실제 성장이 모두 포함됩니다.',trainingReport:rows,options:[choice('continue','지금의 과제로 다음 기회를 준비한다',{trust:2},{consume:'coach'}),{...rest(),consume:'coach'}]};
 }
 function fresh(){return {version:1,enabled:true,year:state.year,team:state.team,offered:0,lastOffer:state.game,paused:0,serial:0,pending:null,history:[],threads:{},seen:[],lastGame:null,wasInjured:!!state.development.injury};}
 function consultReason(){
  if(!pro())return '프로 선수만 상담할 수 있습니다.';
  if(state.game+7>144)return '7팀 경기 훈련을 확정할 일정이 부족합니다.';
  if(state.career14?.pending||pending())return '기다리고 있는 선택을 먼저 마쳐 주세요.';
  if(state.development.injury>0||state.career14?.plan?.end>state.game)return '재활 또는 확정한 훈련 계획을 먼저 마쳐 주세요.';
  const n=data();if(coachingReview(n?.threads?.coach))return '지난 상담의 성장 점검을 먼저 마쳐 주세요. 시즌 진행 중 이어집니다.';if(n?.year===state.year&&n.team===state.team){if(n.seen.includes('coach-path'))return '이번 시즌 육성 상담을 이미 진행했습니다.';if(n.offered>=3)return '이번 시즌의 세 가지 이야기를 모두 만났습니다.';}
  return '';
 }
 function consult(){
  if(consultReason())return false;
  const n=data()||(state.narrative22=fresh());observeYear(n);n.enabled=true;publish(n,coachStory(),true);save();render();open();return true;
 }
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
  const coaching=t.coach&&elapsed(t.coach)>=28?coachingReview(t.coach):null;if(coaching)candidates.push(coaching);
  if(slump)candidates.push(story('slump','숫자가 마음에 걸리는 날','최근 실제 경기 기록에서 부진이 이어지고 있습니다. 코치가 훈련 방향을 함께 점검하자고 합니다.',[plan('review','기본 과제로 돌아가 7경기 훈련한다',{trust:3,fatigue:3}),rest()]));
  const moved=state.contract15?.history?.some(h=>h.year+1===state.year&&h.fromTeam!==h.team);
  if(moved)candidates.push(story('adapt','아직 낯선 더그아웃','새 구단의 훈련 방식과 동료들에게 적응하는 중입니다.',[choice('talk','동료에게 먼저 다가가 팀의 방식을 묻는다',{cohesion:4,trust:2,fatigue:2}),rest()]));
  if(state.age>=28)candidates.push(story('mentor','후배의 질문','후배가 평소 준비 과정을 물어왔습니다. 팀에서 맡을 역할을 생각합니다.',[plan('lead','후배와 기본 훈련을 함께한다',{cohesion:4,trust:3,fatigue:4},{thread:'mentor'}),rest()]));
  if(c.role==='reserve')candidates.push(story('competition','기회를 기다리는 시간','현재 기용 평가에서는 출전 경쟁 중입니다. 코치에게 준비 방향을 물을 수 있습니다.',[plan('review','코치와 7경기 훈련 계획을 맞춘다',{trust:4,fatigue:3}),rest()]));
  if(g>=28)candidates.push(coachStory());
  if(g>=56){const rate=statline(state.current,state.role);candidates.push(story('press','경기 뒤, 짧은 인터뷰',state.role==='batter'?'이번 시즌 '+state.current.G+'출장 · '+state.current.H+'안타 · 타율 '+(state.current.AB?rate.AVG:'—')+'. 기자가 남은 시즌의 목표를 물었습니다.':'이번 시즌 '+state.current.G+'등판 · '+state.current.PK+'탈삼진 · 평균자책점 '+(state.current.IPouts?rate.ERA:'—')+'. 기자가 다음 등판 준비를 물었습니다.',[choice('team','함께 준비하는 동료들에게 고마움을 전한다',{cohesion:2,morale:2}),choice('routine','매일의 준비 과정에 집중하겠다고 말한다',{trust:2,morale:1})]));}
  candidates.push(story('practice',state.age<=21?'첫 원정의 훈련 파트너':'모두가 떠난 훈련장','동료 한 명이 조금 더 남아 기본 훈련을 하자고 합니다. 내일의 몸 상태도 생각해야 합니다.',[plan('team','동료와 추가 훈련을 약속한다',{cohesion:3,trust:2,fatigue:6},{thread:'practice'}),rest()]));
  return candidates.find(s=>!n.seen.includes(s.key))||null;
 }
 function record(p,option,effect,status='chosen',training=null){
  const n=data();n.history.push({id:p.id,year:p.year,game:state.game,offeredAt:p.game,team:p.team,key:p.key,title:p.title,...(p.speaker?{speaker:{...p.speaker}}:{}),choice:option?.id||'skip',label:option?.label||'이번에는 넘기기',effect,status,...(training?{training}:{}),...(Array.isArray(p.trainingReport)?{trainingReport:p.trainingReport.map(r=>({...r}))}:{})});n.history=n.history.slice(-400);
 }
 function offer(n,initial=false){
  if(n.pending||n.offered>=3||state.game>=144||(!initial&&state.game-n.lastOffer<28))return;
  const s=situation(n);if(!s)return;
  publish(n,s,initial);
 }
 function publish(n,s,initial){
  n.serial++;const speaker=window.DiamondPresentation?.speaker(s.key,state.team);n.pending={...s,...(speaker?{speaker}:{}),id:state.year+'-'+n.serial,year:state.year,game:state.game,team:state.team,blocking:initial||n.paused<2};
  n.seen.push(s.key);n.offered++;n.lastOffer=state.game;if(!initial&&n.pending.blocking)n.paused++;
 }
 function enable(){
  if(!pro()||state.game>=144||state.career14?.pending)return false;
  let n=data();if(!n){n=state.narrative22=fresh();}
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
  if((o.training||o.thread==='coach')&&!validTraining(o.training))return '훈련안 정보가 올바르지 않습니다. 다른 선택을 확인해 주세요.';
  if(state.career14?.pending)return '부상·기용의 필수 선택을 먼저 확인해 주세요.';
  if(o.plan&&state.game+7>144)return '7팀 경기 훈련을 마칠 일정이 부족합니다. 다른 선택을 골라 주세요.';
  if(o.plan&&(state.development.injury>0||state.career14?.plan?.end>state.game))return '재활 또는 이미 확정한 7경기 계획을 먼저 마쳐 주세요.';
  return '';
 }
 function resolve(id,optionId){
  const n=data(),p=pending();if(!pro()||!n?.enabled||!p||p.id!==id||state.game>=144||state.career14?.pending)return false;
  const o=p.options.find(o=>o.id===optionId);if(optionId!=='skip'&&(!o||unavailable(o)))return false;
  if(o){
   const before={focus:state.development.focus,secondaryFocus:state.development.secondaryFocus??null};
   const effect=Object.keys(o.effect).length?window.DiamondLife.applyStory(p.title,o.effect,o.label,o.plan):o.plan?'선택한 방향으로 일반 훈련을 준비합니다.':'현재 훈련 방향과 기존 계획을 유지했습니다.';
   if(o.training){state.development.focus=o.training[0];state.development.secondaryFocus=o.training[1];}
   if(o.plan){state.career14.plan={mode:'practice',focus:state.development.focus,intensity:'normal',end:Math.min(144,state.game+7)};}
   if(o.thread)n.threads[o.thread]={game:state.game,year:state.year,team:state.team,...(o.thread==='coach'?{training:[...o.training],attributes:[...state.attributes]}:{})};
   if(o.consume)delete n.threads[o.consume];
   const training=o.training?{before,after:{focus:o.training[0],secondaryFocus:o.training[1]}}:null;
   record(p,o,effect+(o.training?' · 집중 과제 '+o.training.map(i=>ATTR[state.role][i]).join(' · '):'')+(o.plan?' · 일반 훈련 7팀 경기 계획 확정 · 실제 훈련일에 성장 계산':''),'chosen',training);
  }else record(p,null,'효과 없이 이야기를 넘겼습니다.','skipped');
  n.pending=null;save();render();return true;
 }
 function disable(){const n=data();if(!n)return;if(pending()){record(pending(),null,'이야기 알림을 꺼 효과 없이 넘겼습니다.','skipped');n.pending=null;}n.enabled=false;save();render();}
 const changes=o=>[o.training?'집중 과제 '+o.training.map(i=>ATTR[state.role][i]).join(' · '):'',...Object.entries(o.effect).map(([k,v])=>({trust:'구단 신뢰',cohesion:'팀 유대',morale:'사기',fatigue:'피로',condition:'컨디션'}[k]||k)+' '+(v>0?'+':'')+v),o.plan?'7경기 일반 훈련':''].filter(Boolean).join(' · ')||'현재 훈련과 상태 유지';
 let context=null;
 function open(){const p=pending();if(!p)return;const d=$('storyDialog22');context={owner:state,id:p.id};const speaker=object(p.speaker)&&typeof p.speaker.name==='string'?p.speaker:null;
  const scenes={press:1,practice:0,'practice-followup':0,mentor:0,'mentor-followup':0,adapt:1,return:1},src=window.DiamondVisualAssets?.milestones?.[scenes[p.key]];
  const quotes={'coach-path':'그동안의 준비를 봤어. 다음에는 어떤 두 과제에 집중하고 싶은지 같이 정해 보자.','coach-review':'약속했던 과제를 돌아보자. 숫자가 그대로여도, 실제로 준비한 시간을 함께 확인하는 게 중요해.',press:'오늘까지의 기록과 남은 시즌의 목표를 들려주시겠어요?',practice:'오늘은 조금만 더 맞춰 볼까? 내일 일정도 있으니 무리하지는 말고.', 'practice-followup':'우리 같이 연습했던 장면을 찾아봤어. 이 영상부터 볼래?',mentor:'선배님은 경기에 나가기 전에 어떤 준비를 하세요?', 'mentor-followup':'같이 연습하고 나서 적어 둔 건데, 한번 봐 주실래요?',slump:'최근 기록을 같이 보자. 다음 훈련은 기본부터 점검하면 어떨까?',competition:'기회가 왔을 때 준비돼 있어야 해. 이번 주 과제를 같이 정해 보자.',rehab:'몸은 좀 어때? 급하게 돌아오려고 하지는 마.',return:'다시 시작하는 첫 주야. 몸 상태부터 천천히 확인하자.',adapt:'처음엔 누구나 낯설지. 궁금한 건 편하게 물어봐.'};
  d.querySelector('.experience-body').innerHTML=(p.key==='coach-path'||p.key==='coach-review'?window.DiamondChapters24?.coachScene(p)||'':'')+(src?'<img class="story-scene" src="'+text(src)+'" alt="나의 야구 여정" loading="lazy">':'')+'<p class="story-context">'+p.year+' · '+p.game+'팀 경기 · '+text(p.team)+'</p><h3>'+text(p.title)+'</h3><p>'+text(p.detail)+'</p>'+(speaker?'<div class="story-conversation"><span class="speaker-mark" aria-hidden="true">'+text(speaker.name.slice(-2))+'</span><div><strong>'+text(speaker.name)+' <small>'+text(speaker.role)+'</small></strong><p>“'+text(quotes[p.key]||'다음 경기를 어떻게 준비할지 함께 생각해 보자.')+'”</p></div></div>':'')+(window.DiamondChapters24?.trainingReport(p)||'')+'<div class="life-options">'+p.options.map(o=>'<button type="button" data-story-choice="'+text(o.id)+'" '+(unavailable(o)?'disabled':'')+'><strong>'+text(o.label)+'</strong><small>'+text(changes(o))+'</small>'+(unavailable(o)?'<small>'+text(unavailable(o))+'</small>':'')+'</button>').join('')+'</div><details class="story-rules"><summary>선택이 경기에 반영되는 방식</summary><p>신뢰는 기용 평가에, 팀 유대·사기는 경기 능력에 반영됩니다. 육성 상담에서 선택한 과제는 기본 훈련 방향에도 반영됩니다. 7경기 계획은 확정한 집중 과제의 일반 훈련으로 진행하며 실제 훈련일에 성장을 계산합니다. 선택만으로 부상 기간이나 경기 기록이 바뀌지는 않습니다.</p></details><button type="button" class="secondary" id="skipStory22" '+(state.career14?.pending?'disabled':'')+'>이번에는 넘기기</button>';
  for(const b of d.querySelectorAll('[data-story-choice],#skipStory22'))b.onclick=()=>{if(context?.owner!==state||context.id!==pending()?.id){d.close();return;}if(resolve(context.id,b.dataset.storyChoice||'skip'))d.close();};if(!d.open)d.showModal();
 }
 function paint(){
  if(!$('storyDialog22')){const d=document.createElement('dialog');d.id='storyDialog22';d.className='career-dialog experience-dialog';d.setAttribute('aria-labelledby','storyTitle22');d.innerHTML='<div class="dialog-top"><h2 id="storyTitle22">라커룸 이야기</h2><button type="button" aria-label="라커룸 이야기 닫기" id="closeStory22">닫기</button></div><div class="experience-body"></div>';document.querySelector('main').append(d);$('closeStory22').onclick=()=>d.close();}
  const modal=$('storyDialog22');if(!pro()){modal.close();context=null;}if(context&&(context.owner!==state||context.id!==pending()?.id)){modal.close();context=null;}
  let root=$('careerStory22');if(!root){root=document.createElement('section');root.id='careerStory22';root.className='surface-card';$('screen-league')?.append(root);}root.hidden=!pro();if(root.hidden)return;
  const n=data(),p=pending(),last=n?.history?.at(-1);(state.game>=144?$('seasonDecision'):blocks()?$('careerWeek')||$('seasonStory'):$('seasonActions')).after(root);
  const blocked=blocks(),recent=last?'<details class="story-last-choice"><summary>최근 선택 · '+text(last.title)+'</summary><div class="story-feedback"><strong>'+text(last.label)+'</strong><p>'+text(last.effect)+'</p></div></details>':'';
  root.classList.toggle('story-is-pending',blocked);
  root.innerHTML=(blocked?'<p class="story-waiting">선택을 기다리며 '+(state.career14?.remaining||0)+'팀 경기 일정을 보관했습니다.</p>':'<p class="flow-eyebrow">라커룸 이야기</p><h3>'+text(p?.title||(!n?.enabled?'함께 뛰는 사람들의 이야기':'동료들과 다음 경기를 준비합니다'))+'</h3><p>'+text(p?p.detail:!n?.enabled?'동료·코치와 나눈 선택이 다음 훈련과 만남으로 이어집니다.':'시즌 중 최대 두 번 일정을 멈추며, 모든 사건은 28팀 경기 이상 간격으로 찾아옵니다.')+'</p>')+(p&&n.enabled?'<button type="button" id="openStory22"'+(blocked?' class="secondary"':'')+'>'+(blocked?'선택 화면 다시 열기':'이야기와 선택 확인')+'</button>':!n?.enabled?'<button type="button" id="enableStories22" '+(state.game>=144||state.career14?.pending?'disabled':'')+'>이야기 진행 켜기</button>':'')+recent+(n?.enabled?'<button type="button" class="secondary small" id="disableStories22">이야기 알림 끄기</button>':'');
  if($('openStory22'))$('openStory22').onclick=open;if($('enableStories22'))$('enableStories22').onclick=()=>{if(enable())open();};if($('disableStories22'))$('disableStories22').onclick=disable;
  if(blocks()&&!state.career14?.pending){for(const id of ['oneBtn','weekBtn','seasonBtn','continueCareer'])if($(id))$(id).disabled=true;}
 }
 window.DiamondStories22=Object.freeze({enable,resolve,disable,afterGame,blocks,pending,open,consult,consultReason});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',()=>{context=null;$('storyDialog22')?.close();paint();});
})();
