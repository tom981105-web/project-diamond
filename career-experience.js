// V2.0: original baseball career presentation, sharing recorded facts across all screens.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),list=v=>Array.isArray(v)?v:[],money=v=>(Number(v)||0).toLocaleString()+'만원';
 const school=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 const card=(id,parent,cls='surface-card')=>{let e=$(id);if(!e){e=document.createElement('section');e.id=id;e.className=cls;parent.append(e);}return e;};
 let owner=null,filters={level:'pro',team:'all',year:'all'},replay=null,replayTimer=null,painting=false;
 const fact=record=>{const s=record.stats||empty(),rate=statline(s,state.role);return state.role==='batter'?s.G+'출장 · '+s.H+'안타 · '+s.HR+'홈런 · 타율 '+(s.AB?rate.AVG:'—'):s.G+'등판 · '+s.W+'승 · '+s.PK+'탈삼진 · ERA '+(s.IPouts?rate.ERA:'—');};
 const latest=()=>state?.career?.at(-1);
 const current=()=>({year:state.year,team:state.team,stats:state.current,ovr:overall()});
 const scene=index=>window.DiamondVisualAssets?.milestones?.[index];
 const img=(index,alt)=>scene(index)?'<img class="experience-scene" src="'+text(scene(index))+'" alt="'+text(alt)+'" loading="lazy">':'';
 function reactions(record){
  const s=record.stats||empty(),bat=state.role==='batter',season=state.legacyV4?.seasons?.[record.year],club=record.team||season?.club||'소속 미기록';
  const headline=club+'의 '+state.name+', '+record.year+'년 '+(bat?s.H+'안타·'+s.HR+'홈런':s.PK+'탈삼진·'+s.W+'승')+'을 남기다';
  const story=list(state.narrative22?.history).filter(h=>h&&h.year===record.year&&h.status==='chosen').at(-1);
  const first=s.G<30?'출전 기회가 많지는 않았네. 다음 시즌에는 더 자주 보고 싶다.':bat?(s.HR>=20?'타석에 들어서면 한 방을 기대하게 된다.':'한 타석씩 기록을 쌓는 모습이 좋다.'):'등판마다 쌓은 이닝과 결과를 함께 봐야지.';
  const second=season?.postseason?.champion===club?'동료들과 함께 만든 우승이라 더 기억에 남을 것 같다.':'다음 시즌에는 팀 성적도 함께 올라갔으면 좋겠다.';
  return '<div class="press-story"><small>다이아몬드 스포츠 · 가상 기사</small><strong>'+text(headline)+'</strong><p>'+text(fact(record))+'</p></div>'+[["오늘도직관",first],["구장옆자리",second],["기록노트",story?'이번 시즌 기억에 남는 선택: '+story.label+'.':'종합 능력 '+(record.ovr??'미기록')+'. 성적과 성장 기록을 같이 보자.']].map(([name,comment],i)=>'<div class="fan-comment"><span class="fan-avatar">'+text(name[0])+'</span><div><strong>'+name+'</strong><p>'+text(comment)+'</p><small>게임 속 팬 · '+text(record.year)+' 시즌</small></div><span class="fan-count">♡ '+Math.max(1,Math.round((s.G||0)/3+i*7))+'</span></div>').join('')+'<p class="fiction-note">기록을 바탕으로 구성한 게임 속 가상 기사와 반응입니다.</p>';
 }
 function moments(record){
  const items=list(state.life20?.history).filter(x=>x.year===record.year&&x.kind!=='salary'&&x.kind!=='story22');
  const decisions=list(state.career14?.history).filter(x=>x.year===record.year);
  const project=items.map(x=>'<div class="season-moment"><strong>'+text(x.title)+'</strong><p>'+text(x.effect)+'</p></div>').join('');
  const stories=list(state.narrative22?.history).filter(x=>x&&x.year===record.year).map(x=>'<div class="season-moment"><strong>'+text(x.title)+' · '+text(x.label)+'</strong>'+(x.speaker?'<small class="moment-speaker">'+text(x.speaker.name)+' · '+text(x.speaker.role)+'</small>':'')+'<p>'+text(x.effect)+'</p></div>').join('');
  return project+stories+decisions.map(x=>'<div class="season-moment"><strong>'+text(x.title)+'</strong><p>'+text(x.detail)+' · '+text(({rehab:'재활 집중',rest:'회복 우선',practice:'훈련 재개'})[x.choice]||x.choice)+'</p></div>').join('');
 }
 function report(record,target){
  if(!record||!target)return;let section=target.querySelector('.experience-report');if(!section){section=document.createElement('section');section.className='experience-report';target.append(section);}const season=state.legacyV4?.seasons?.[record.year],champion=season?.postseason?.champion===(record.team||season?.club);
  const firstHit=state.role==='batter'&&record.stats?.H>0&&!state.career.some(r=>r.year<record.year&&r.stats?.H>0);
  section.innerHTML=(firstHit?'<details class="first-hit-story"><summary>프로 첫 안타를 기록한 시즌</summary>'+img(2,'프로 첫 안타의 순간')+'</details>':'')+(champion?'<div class="season-celebration">'+img(3,'동료들과 함께한 우승')+'<h2>함께 만든 우승의 순간</h2></div>':'')+'<h2>시즌의 순간</h2>'+(moments(record)||'<p class="screen-intro">이 시즌에 보관된 생활 선택이 없습니다.</p>')+'<h2>언론과 팬의 반응</h2>'+reactions(record);
 }
 function review(){if(state&&$('reviewContent')){report(current(),$('reviewContent'));window.DiamondChapters24?.review();window.DiamondRecap30?.live($('reviewContent'));}}
 function archive(record,target){report(record,target);const match=record.review19?.match20;if(match){const b=document.createElement('button');b.type='button';b.className='secondary replay-archive';b.textContent='이 시즌 마지막 경기 다시보기';b.onclick=()=>openReplay(match);target.append(b);}window.DiamondRecap30?.archive(record,target);}
 function feed(){
  const root=$('journeyArticles');if(!root)return;
  const records=[...state.career].slice(-3).reverse();
  const signing=list(state.contract15?.history).at(-1);
  root.innerHTML=(signing?'<article class="surface-card signing-feed"><p class="flow-eyebrow">계약과 진로 · '+(signing.year+1)+'</p><h2>'+text(state.name)+', '+text(signing.team)+'와 다음 시즌을 함께합니다</h2><p>연봉 '+money(signing.annualSalary)+' · '+signing.endYear+'년까지'+(signing.signature?' · '+text(signing.signature.name)+' 서명 완료':'')+'</p><p class="screen-intro">'+(signing.fromTeam===signing.team?'익숙한 팀에서 이어가는 도전입니다.':text(signing.fromTeam)+'에서 새로운 소속으로 이동했습니다.')+'</p></article>':'')+(records.length?records.map(record=>'<article class="news-article"><p class="flow-eyebrow">'+record.year+' 시즌 반응</p>'+reactions(record)+'<button type="button" class="secondary" data-archive-index="'+state.career.indexOf(record)+'">이 시즌 돌아보기</button></article>').join(''):'<div class="news-empty">아직 첫 시즌의 이야기를 쓰고 있습니다.<br>시즌을 마치면 실제 성적에 맞춘 반응이 쌓입니다.</div>');
  const label=document.querySelector('[data-tab="news"] span');if(label)label.textContent='반응';if(window.DiamondNavigation.active==='news')document.querySelector('header h1').textContent='언론·팬 반응';
 }
 function life(){
  const root=card('lifeChapter',$('screen-league'));root.hidden=school()||state.retired;const e=window.DiamondLife.episode(),choice=state.life20?.stories?.[state.year];
  if(root.hidden){if($('longProject'))$('longProject').hidden=true;if($('careerShop'))$('careerShop').hidden=true;return;}($('seasonActions')||$('seasonStory')).after(root);
  if(choice)root.innerHTML='<p class="flow-eyebrow">이번 시즌의 선택</p><h3>'+text(choice.title)+'</h3><p>'+text(choice.effect)+'</p><p class="screen-intro">선택 결과를 저장했습니다. 이번 시즌에 다시 적용되지 않습니다.</p>';
  else root.innerHTML='<p class="flow-eyebrow">그라운드 밖의 하루 · 시즌당 한 번</p><h3>'+text(e.title)+'</h3><p>'+text(e.detail)+'</p><button type="button" id="openLifeMoment">이야기 확인하기</button>';
  if($('openLifeMoment'))$('openLifeMoment').onclick=openLife;
  const training=card('longProject',$('screen-training'));training.hidden=school();const project=state.life20?.project;
  training.innerHTML='<div class="section-title-row"><h2>나의 장기 훈련</h2><span>실제 훈련일 기준</span></div>'+(project?'<h3>'+text(project.title)+'</h3><progress max="36" value="'+project.progress+'" aria-label="장기 훈련 진행"></progress><p>'+project.progress+' / 36일 · '+(project.complete?'완료':'진행 중')+' · 실제 능력 성장 +'+project.awards+'</p>':'<p class="screen-intro">부상·휴식일을 제외한 훈련 12일마다 선택한 능력이 +1 성장합니다. 36일을 채우며, 다음 시즌에도 이어집니다. 32세 이하·잠재력 상한을 적용합니다.</p>')+((!project||project.complete)&&!state.retired?'<div class="project-options">'+window.DiamondLife.projects().map(p=>'<button type="button" class="secondary" data-project="'+p.id+'">'+text(p.title)+'</button>').join('')+'</div>':'')+'<p class="screen-intro">사기 '+(state.life20?.morale||0)+' · 팀 유대 '+(state.life20?.cohesion||0)+' · 경기 능력 보정 '+Math.round((window.DiamondLife.factor()-1)*1000)/10+'%</p>';
  for(const b of training.querySelectorAll('[data-project]'))b.onclick=()=>window.DiamondLife.startProject(b.dataset.project);
  for(const b of training.querySelectorAll('[data-project]'))b.disabled=state.retired||state.game>=144||!!state.career14?.pending||list(state.life20?.history).some(h=>h.year===state.year&&h.kind==='project-start');
  const shop=card('careerShop',$('screen-dashboard'));$('homeShortcuts').before(shop);shop.hidden=school()||state.retired;
  shop.innerHTML='<button type="button" class="shop-entry" id="openCareerShop"><span><strong>이번 시즌의 나에게</strong><small>보유 자금 '+money(state.life20?.balance||0)+' · 훈련 용품과 개인 세션</small></span><span aria-hidden="true">›</span></button>';$('openCareerShop').onclick=openShop;
 }
 function shell(){
  if($('lifeMomentDialog'))return;
  for(const [id,title] of [['lifeMomentDialog','선수 생활의 선택'],['careerShopDialog','나를 위한 투자'],['matchReplayDialog','경기 다시보기'],['careerSceneDialog','커리어의 한 장면']]){
   const d=document.createElement('dialog');d.id=id;d.className='career-dialog experience-dialog';d.setAttribute('aria-labelledby',id+'Title');d.innerHTML='<div class="dialog-top"><h2 id="'+id+'Title">'+title+'</h2><button type="button" data-experience-close aria-label="'+title+' 닫기">닫기</button></div><div class="experience-body"></div>';document.querySelector('main').append(d);d.querySelector('[data-experience-close]').onclick=()=>d.close();if(id==='matchReplayDialog'){d.addEventListener('close',pauseReplay);d.addEventListener('cancel',pauseReplay);}
  }
 }
 function openLife(){
  if(!state||state.retired)return;const e=window.DiamondLife.episode();if(!e||state.life20?.stories?.[state.year])return;const player=state,year=state.year,d=$('lifeMomentDialog');
  d.querySelector('.experience-body').innerHTML='<p class="flow-eyebrow">'+year+' · '+text(state.name)+'</p><h3>'+text(e.title)+'</h3><p>'+text(e.detail)+'</p><div class="life-options">'+e.options.map(([id,title,effect])=>'<button type="button" data-life-choice="'+id+'"><strong>'+text(title)+'</strong><small>'+text(effect)+'</small></button>').join('')+'</div><p class="decision-note">선택 결과는 즉시 적용됩니다. 경기를 진행하지는 않습니다. 사기와 팀 유대는 실제 경기 능력에 최대 2% 반영됩니다.</p>';
  for(const b of d.querySelectorAll('[data-life-choice]')){b.disabled=!!state.career14?.pending;b.onclick=()=>{if(state!==player||state.year!==year){d.close();return;}if(window.DiamondLife.choose(b.dataset.lifeChoice)){d.close();window.DiamondNavigation.show('league');}};}d.showModal();
 }
 function openShop(){
  const d=$('careerShopDialog'),player=state,year=state.year;
  function paintShop(){const x=state.life20||{};d.querySelector('.experience-body').innerHTML='<p>보유 자금 <strong>'+money(x.balance)+'</strong></p><p class="decision-note">새로 완료한 프로 시즌의 연봉을 정산합니다. 이전 저장의 과거 연봉은 소급 적립하지 않습니다. 시즌당 하나만 구매할 수 있습니다.</p>'+window.DiamondLife.products().map(p=>'<button type="button" class="shop-product" data-product="'+p.id+'"><span><strong>'+text(p.title)+'</strong><small>'+text(ATTR[state.role][p.index])+' +1 · '+money(p.price)+'</small></span><span>'+(x.purchases?.[year]?.id===p.id?'구매 완료':'구매')+'</span></button>').join('');for(const b of d.querySelectorAll('[data-product]')){const p=window.DiamondLife.products().find(p=>p.id===b.dataset.product);b.disabled=!!x.purchases?.[year]||(x.balance||0)<p.price||state.attributes[p.index]>=Math.min(99,state.potential);b.onclick=()=>{if(state!==player||state.year!==year){d.close();return;}if(window.DiamondLife.buy(b.dataset.product))paintShop();};}}
  paintShop();d.showModal();
 }
 function welcome(){
  const root=card('careerWelcome',$('screen-dashboard')),a=state.contract15?.active,signature=list(state.contract15?.history).at(-1)?.signature;
  root.hidden=school()||state.retired||state.game!==0||!a||a.startYear!==state.year;
  if(root.hidden)return;$('homeNextCard').after(root);const first=['draft','college'].includes(a.source);
  root.innerHTML='<p class="flow-eyebrow">'+(first?'프로 입단':'계약 확정')+'</p><h3>'+text(a.team)+'에서 시작하는 '+state.year+'년</h3><p>연봉 '+money(a.annualSalary)+' · '+a.endYear+'년까지'+(signature?' · 서명 완료':'')+'</p><button type="button" class="secondary small" id="openCareerScene">'+(first?'첫 유니폼의 순간':'새 출발의 순간')+'</button>';
  $('openCareerScene').onclick=()=>{const d=$('careerSceneDialog');d.querySelector('.experience-body').innerHTML=img(first?0:1,'새로운 팀에서 시작하는 야구 인생')+'<h3>'+text(state.name)+' · '+text(a.team)+'</h3><p>'+state.year+'년의 도전이 시작됩니다. 실제 기용은 능력과 몸 상태, 최근 성적에 따라 결정됩니다.</p>';d.showModal();};
 }
 function recordRows(){
  if(filters.level==='college')return list(state.v12?.college?.results).map(r=>({year:r.year,team:'대학 야구부',stats:{...empty(),...r,G:1,PA:r.AB||0}}));
  const rows=state.career.map(r=>({...r,team:r.team||state.legacyV4?.seasons?.[r.year]?.club||'소속 미기록'}));
  if(!state.retired&&state.game<144&&!school())rows.push(current());return rows;
 }
 function explorer(){
  const root=card('careerExplorer',$('screen-career'));$('screen-career').prepend(root);
  const source=recordRows(),teams=[...new Set(source.map(r=>r.team))],years=[...new Set(source.map(r=>r.year))].sort((a,b)=>b-a);
  const chosen=source.filter(r=>(filters.team==='all'||r.team===filters.team)&&(filters.year==='all'||r.year===Number(filters.year))),stats=empty();for(const r of chosen)for(const key of Object.keys(stats))stats[key]+=Number(r.stats?.[key]||0);
  const rate=statline(stats,state.role),national=Object.values(state.v6?.tournaments||{}).sort((a,b)=>b.year-a.year);
  root.innerHTML='<h2>내 야구 인생의 기록</h2><div class="record-levels">'+[['pro','프로'],['college','대학'],['national','대표팀']].map(([id,label])=>'<button type="button" data-record-level="'+id+'" aria-pressed="'+(filters.level===id)+'">'+label+'</button>').join('')+'</div>'+(filters.level==='national'?'<div class="national-records">'+(national.length?national.map(t=>'<div class="career-record-row"><strong>'+t.year+' 국제 챔피언십</strong><span>'+text(t.selected?'대표팀 선발 · '+t.medal:'미선발')+'</span></div>').join(''):'<p class="screen-intro">아직 보관된 대표팀 대회가 없습니다.</p>')+'<p class="fiction-note">가상 대회 선발·메달 기록입니다. 미보관 개인 성적은 만들지 않습니다.</p></div>':'<div class="record-selects"><label>소속팀<select id="recordTeam">'+[['all','모든 팀'],...teams.map(t=>[t,t])].map(([id,label])=>'<option value="'+text(id)+'" '+(filters.team===id?'selected':'')+'>'+text(label)+'</option>').join('')+'</select></label><label>시즌<select id="recordYear"><option value="all">커리어 통산</option>'+years.map(y=>'<option '+(String(filters.year)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label></div><p class="flow-eyebrow">선택한 범위 · '+chosen.length+'개 '+(filters.level==='college'?'대학 경기':'시즌')+'</p><div class="record-total-grid">'+(state.role==='batter'?[['출장',stats.G],['안타',stats.H],['홈런',stats.HR],['타율',stats.AB?rate.AVG:'—']]:[['등판',stats.G],['승리',stats.W],['탈삼진',stats.PK],['ERA',stats.IPouts?rate.ERA:'—']]).map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div><p class="fiction-note">'+(filters.level==='college'?'실제로 진행한 대학 경기만 집계합니다. 프로 성적과 합산하지 않습니다.':'완료한 시즌과 진행 중인 프로 시즌을 중복 없이 집계합니다.')+'</p>');
  for(const b of root.querySelectorAll('[data-record-level]'))b.onclick=()=>{filters={level:b.dataset.recordLevel,team:'all',year:'all'};explorer();};
  if($('recordTeam'))$('recordTeam').onchange=e=>{filters.team=e.target.value;explorer();};if($('recordYear'))$('recordYear').onchange=e=>{filters.year=e.target.value;explorer();};
  const trophy=card('trophyCabinet',$('screen-career'));root.after(trophy);const honors=list(state.legacyV4?.honors),wins=honors.filter(h=>h.title==='팀 우승'),awards=honors.filter(h=>h.title!=='팀 우승');
  trophy.innerHTML='<h2>우승 '+wins.length+'회 · 개인 수상·선정 '+awards.length+'회</h2><details><summary>모아 둔 트로피 보기</summary>'+(honors.length?honors.slice().reverse().map(h=>'<div class="career-record-row"><span>'+h.year+'</span><strong>'+text(h.title)+'</strong></div>').join(''):'<p class="screen-intro">첫 트로피를 향해 도전하고 있습니다.</p>')+'</details>';
 }
 function retirement(){
  const root=card('retirementStory',$('screen-dashboard'));root.hidden=!state.retired;if(!state.retired)return;$('screen-dashboard').prepend(root);
  const total=empty();for(const r of state.career)for(const key of Object.keys(total))total[key]+=Number(r.stats?.[key]||0);
  const best=state.career.reduce((best,r)=>(r.ovr||0)>(best?.ovr||0)?r:best,null);
  root.innerHTML=img(4,'선수 생활을 마치고 구장을 바라보는 순간')+'<p class="flow-eyebrow">나의 야구 인생</p><h2>'+text(state.name)+'의 마지막 유니폼</h2><p>'+state.career.length+'시즌 · '+state.age+'세 은퇴 · '+(state.role==='batter'?total.H+'안타 · '+total.HR+'홈런':total.W+'승 · '+total.PK+'탈삼진')+'</p>'+(best?'<p>가장 높은 종합 능력 '+best.ovr+' · '+best.year+'년</p>':'')+'<p class="screen-intro">시즌 기록과 계약, 선택의 발자취를 보관했습니다.</p><button type="button" id="retirementRecords">나의 커리어 돌아보기</button>';$('retirementRecords').onclick=()=>window.DiamondNavigation.show('career');
 }
 function pauseReplay(){clearTimeout(replayTimer);replayTimer=null;if(replay)replay.auto=false;const b=$('replayAuto36');if(b){b.textContent='자동 재생';b.setAttribute('aria-pressed','false');}}
 function scheduleReplay(){
  clearTimeout(replayTimer);const r=replay;
  if(!r?.auto)return;
  replayTimer=setTimeout(()=>{
   if(replay!==r||state!==r.owner||state.year!==r.year||!$('matchReplayDialog').open||document.visibilityState==='hidden'){pauseReplay();return;}
   r.index++;paintReplay();if(r.auto)scheduleReplay();
  },r.delay);
 }
 function openReplay(match){
  if(!match||!state)return;pauseReplay();shell();replay={owner:state,year:state.year,match,index:0,phase:list(match.frames).some(f=>list(f.plays).length)?'preview':'result',auto:false,delay:700};paintReplay();$('matchReplayDialog').showModal();
 }
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseReplay();});
 window.addEventListener('pagehide',pauseReplay);

 function paintReplay(){
  if(!replay||replay.owner!==state||replay.year!==state.year){pauseReplay();$('matchReplayDialog').close();return;}
  const scrollBody=$('matchReplayDialog').querySelector('.experience-body'),keepScroll=replay.auto&&$('matchReplayDialog').dataset.phase==='play',scrollTop=scrollBody.scrollTop;
  const focused=$('matchReplayDialog').contains(document.activeElement)?document.activeElement.id:null;
  const r=replay,m=r.match,frames=list(m.frames),plays=frames.flatMap(f=>list(f.plays).map(p=>({...p,inning:f.inning}))),p=plays[r.index],end=r.index>=plays.length;
  if(end){r.phase='result';pauseReplay();}
  const preview=r.phase==='preview';$('matchReplayDialog').dataset.phase=r.phase;
  const seen=preview?[]:plays.slice(0,end?plays.length:r.index+1),names={'1B':'안타','2B':'2루타','3B':'3루타',HR:'홈런',BB:'볼넷',SO:'삼진',OUT:'범타',SF:'희생타'};
  const inningRuns=(inning,half)=>seen.filter(q=>q.inning===inning&&q.half===half).reduce((n,q)=>n+(q.runs||0),0);
  const score=half=>preview?0:end?(half==='초'?m.awayRuns:m.homeRuns):frames.filter(f=>f.inning<p.inning).reduce((n,f)=>n+(f[half==='초'?'away':'home']||0),0)+inningRuns(p.inning,half);
  const call=q=>text(q.name)+' · '+text(names[q.kind]||q.kind)+(q.runs?' · '+q.runs+'득점':'')+(q.user?' · 내 타석':q.pitchUser?' · 내 투구':'')+' · '+q.outs+'아웃';
  const portrait=window.DiamondVisualAssets?.portraits?.[Number(state.ui13?.avatar)||0],face=portrait?'<img class="replay-face36" src="'+text(portrait)+'" alt="내 선수 모습">':'';
  const nextMine=plays.findIndex((q,i)=>i>r.index&&(q.user||q.pitchUser));
  const line=(f,key)=>preview?'—':end||f.inning<p.inning?f[key]===null?'X':f[key]:f.inning>p.inning||key==='home'&&p.half==='초'?'—':inningRuns(f.inning,key==='away'?'초':'말');
  const mine=seen.filter(q=>q.user||q.pitchUser),metrics=state.role==='batter'?[['타석',mine.filter(q=>q.user).length],['안타',mine.filter(q=>q.user&&['1B','2B','3B','HR'].includes(q.kind)).length],['홈런',mine.filter(q=>q.user&&q.kind==='HR').length]]:[['상대한 타석',mine.filter(q=>q.pitchUser).length],['탈삼진',mine.filter(q=>q.pitchUser&&q.kind==='SO').length],['볼넷',mine.filter(q=>q.pitchUser&&q.kind==='BB').length]];
  $('matchReplayDialog').querySelector(':scope > .decision-actions')?.remove();
  $('matchReplayDialog').querySelector('.experience-body').innerHTML=
   '<section class="replay-intro36" '+(!preview?'hidden':'')+'><p class="flow-eyebrow">기록으로 돌아가는 그라운드</p><h2>이 경기를<br>함께 돌아볼까요?</h2><p>타석별 흐름을 따라가거나 내 '+(state.role==='batter'?'타석':'투구')+' 장면으로 이동할 수 있습니다.</p></section>'+
   '<div class="replay-status35"><span>저장된 경기</span><strong>'+(preview?'경기 준비':end?'경기 종료':p.inning+'회 '+p.half)+'</strong><span>'+(preview?0:end?plays.length:r.index+1)+' / '+plays.length+'타석</span></div>'+
   '<div class="baseball-score"><span>'+text(m.away)+'</span><strong>'+score('초')+' : '+score('말')+'</strong><span>'+text(m.home)+'</span></div>'+
   '<progress id="replayProgress35" max="'+Math.max(1,plays.length)+'" value="'+(preview?0:end?plays.length:r.index+1)+'" aria-label="경기 다시보기 진행"></progress>'+
   '<div class="replay-field" '+(preview?'hidden':'')+'><svg viewBox="0 0 600 300" role="img" aria-label="'+(end?'경기 종료':p.outs+'아웃 · 주자 '+p.bases.filter(Boolean).length+'명')+'"><defs><pattern id="replayGrass35" width="80" height="300" patternUnits="userSpaceOnUse"><rect width="40" height="300" fill="#e3f1e9"/><rect x="40" width="40" height="300" fill="#e9f5ee"/></pattern></defs><rect width="600" height="300" rx="18" fill="url(#replayGrass35)"/><path d="M300 269 90 60Q300-36 510 60Z" fill="none" stroke="white" stroke-width="2"/><path d="m300 269-91-91 91-91 91 91Z" fill="#e6d4b5"/><path d="M300 269 90 60M300 269 510 60" stroke="white" stroke-width="2"/>'+[[209,178],[300,87],[391,178]].map(([x,y],i)=>'<rect x="'+(x-7)+'" y="'+(y-7)+'" width="14" height="14" transform="rotate(45 '+x+' '+y+')" fill="'+(!end&&p.bases[2-i]?'#3478eb':'white')+'"/>').join('')+'<circle cx="300" cy="181" r="7" fill="#b89871"/><path d="m294 264 6-4 6 4v7h-12Z" fill="white"/></svg></div>'+
   '<p class="replay-call" role="status">'+(preview?'자동 중계 또는 타석별 보기를 선택하세요.':end?'경기가 끝났습니다.':call(p))+'</p>'+
   '<div class="replay-toolbar36" '+(preview||end?'hidden':'')+'><button type="button" id="replayAuto36" class="secondary" aria-pressed="'+r.auto+'">'+(r.auto?'일시정지':'자동 재생')+'</button><label>속도<select id="replaySpeed36"><option value="700" '+(r.delay===700?'selected':'')+'>1×</option><option value="350" '+(r.delay===350?'selected':'')+'>2×</option><option value="175" '+(r.delay===175?'selected':'')+'>4×</option></select></label></div>'+
   (preview?'<div class="replay-preview36">'+face+'<p>'+text(state.name)+' · '+text(state.position)+'</p><button type="button" id="replayStart36">자동 중계 시작</button><small>저장된 경기 기록을 재생합니다.</small></div>':'')+
   (end?'<section class="replay-result36" aria-label="이 경기의 나">'+face+'<div><strong>'+text(state.name)+'</strong><small>'+text(state.position)+' · '+(mine.length?'이 경기의 내 기록':'내 출장 장면 미보관')+'</small></div></section>':'')+
   '<div class="replay-personal35" '+(preview?'hidden':'')+' aria-label="재생한 구간의 내 기록">'+metrics.map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div>'+
   '<ol class="replay-feed35" '+(preview?'hidden':'')+' aria-label="최근 타석 중계">'+seen.slice(-4).reverse().map(q=>'<li class="'+(q.user||q.pitchUser?'is-mine':'')+'"><span>'+q.inning+'회 '+q.half+'</span><p>'+call(q)+'</p></li>').join('')+'</ol>'+
   '<details class="replay-lines35" '+(preview?'hidden':'')+'><summary>이닝별 점수 보기</summary><div class="tablewrap"><table><thead><tr><th>팀</th>'+frames.map(f=>'<th>'+f.inning+'</th>').join('')+'<th>R</th></tr></thead><tbody>'+[['away',m.away],['home',m.home]].map(([key,name])=>'<tr><td>'+text(name)+'</td>'+frames.map(f=>'<td>'+line(f,key)+'</td>').join('')+'<td>'+score(key==='away'?'초':'말')+'</td></tr>').join('')+'</tbody></table></div></details>'+
   (end&&plays.length&&!plays.some(q=>q.user||q.pitchUser)?'<p class="replay-absent36">이 경기에 보관된 내 출장 장면은 없습니다.</p>':'')+
   '<p class="fiction-note">'+(plays.length?'저장된 타석을 차례로 보여줍니다. 내 기록은 재생한 구간까지 집계합니다.':'이 경기에는 타석별 기록이 없습니다. 보관된 최종 점수만 표시합니다.')+'</p>'+
   '<div class="replay-navigation35" '+(preview?'hidden':'')+'><button type="button" class="secondary" id="replayPrevious35" '+(r.index===0||!plays.length?'disabled':'')+'>이전 타석</button><button type="button" class="secondary" id="replayMine35" '+(nextMine<0?'disabled':'')+'>내 '+(state.role==='batter'?'타석으로':'투구로')+'</button></div>'+
   '<div class="decision-actions">'+(end?'<button type="button" class="secondary" id="replayRestart36" '+(!plays.length?'disabled':'')+'>처음부터 보기</button><button type="button" id="replayExit36">돌아가기</button>':'')+'<button type="button" class="secondary" id="replayFinish" '+(end?'disabled hidden':'')+'>결과만 보기</button><button type="button" id="replayNext" '+(end?'disabled hidden':'')+'>'+(preview?'타석별로 보기':'다음 타석')+'</button></div>'+
   (end&&m===state.league?.last&&state.game===144&&!school()?'<button type="button" class="secondary replay-review36" id="replayReview36">이번 시즌 결산 보기</button>':'');
  const d=$('matchReplayDialog');d.append(d.querySelector('.experience-body > .decision-actions'));
  d.querySelector('.experience-body').scrollTop=keepScroll?scrollTop:0;
  const manual=action=>{pauseReplay();r.phase='play';action();paintReplay();};
  $('replayNext').onclick=()=>manual(()=>{if(!preview)r.index++;});$('replayFinish').onclick=()=>manual(()=>{r.index=plays.length;});
  $('replayPrevious35').onclick=()=>manual(()=>{r.index=Math.max(0,r.index-1);});$('replayMine35').onclick=()=>manual(()=>{if(nextMine>=0)r.index=nextMine;});
  if($('replayStart36'))$('replayStart36').onclick=()=>{r.phase='play';r.auto=true;paintReplay();scheduleReplay();};
  $('replayAuto36').onclick=()=>{if(r.auto)pauseReplay();else{r.auto=true;paintReplay();scheduleReplay();}};
  $('replaySpeed36').onfocus=()=>{if(r.auto)pauseReplay();};
  $('replaySpeed36').onchange=e=>{r.delay=Number(e.target.value);if(r.auto)scheduleReplay();};
  if($('replayExit36'))$('replayExit36').onclick=()=>d.close();
  if($('replayRestart36'))$('replayRestart36').onclick=()=>manual(()=>{r.index=0;});
  if($('replayReview36'))$('replayReview36').onclick=()=>{d.close();window.DiamondUI.openReview();};
  if(focused){const available=e=>e&&!e.disabled&&!e.closest('[hidden]');let target=$(focused);if(!available(target))target=r.auto?$('replayAuto36'):end?$('replayExit36'):null;if(available(target))target.focus({preventScroll:true});}
 }
 function matchCard(){
  const root=card('recentMatchStory',$('screen-league')),match=state.league?.last;root.hidden=school()||!match;if(root.hidden)return;
  root.innerHTML='<p class="flow-eyebrow">'+(state.game===144?'정규시즌 마지막 경기':'최근 경기')+'</p><h3>'+text(match.away)+' '+match.awayRuns+' : '+match.homeRuns+' '+text(match.home)+'</h3><button type="button" class="secondary" id="openMatchReplay">그라운드에서 다시보기</button>';$('openMatchReplay').onclick=()=>openReplay(match);
 }
 function paint(){if(painting)return;painting=true;try{shell();if(!state){for(const id of ['lifeMomentDialog','careerShopDialog','matchReplayDialog','careerSceneDialog'])$(id)?.close();return;}if(replay&&replay.year!==state.year){pauseReplay();$('matchReplayDialog').close();}if(owner!==state){pauseReplay();owner=state;filters={level:'pro',team:'all',year:'all'};replay=null;for(const id of ['lifeMomentDialog','careerShopDialog','matchReplayDialog','careerSceneDialog'])$(id)?.close();}if(!$('seasonStory'))return;feed();life();welcome();explorer();retirement();matchCard();if($('journeyReview')?.open)review();}finally{painting=false;}}
 window.DiamondExperience=Object.freeze({review,archive,welcome,openReplay});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};
 window.addEventListener('diamond-slot-change',()=>{owner=null;paint();});
})();
