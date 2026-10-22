// Independent baseball career interface. Existing save keys and engine records are retained.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,basePlay=play,baseNext=nextSeason;
 const nav=()=>window.DiamondNavigation;
 const colors=['#367b69','#536f9a','#b18a51','#8c7196','#95685b','#617d80'];
 let selectedAvatar=0,wizardStep=0,started=false,building=false,recordMode='seasons',changingDirection=false;
 const portrait=(index=0)=>`<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M16 120v-20c0-20 20-29 44-29s44 9 44 29v20" fill="${colors[index%colors.length]}"/><path d="m45 74 15 17 15-17M60 91v29" fill="none" stroke="#ffffffaa" stroke-width="3"/><path d="M50 69v12q10 11 20 0V69" fill="#e9ba96"/><ellipse cx="60" cy="46" rx="24" ry="29" fill="#f2cbaa"/><path d="M35 38V28c1-28 48-28 50 0v10" fill="${colors[index%colors.length]}"/><path d="M31 34q28-10 60 0v8q-29-6-60 0z" fill="${colors[index%colors.length]}"/><path d="m57 16 7 7-7 7-7-7z" fill="#fff"/><path d="M49 49h1M71 49h1" stroke="#534739" stroke-width="3.5" stroke-linecap="round"/><path d="M53 62q7 5 14 0" fill="none" stroke="#ae7c61" stroke-width="2" stroke-linecap="round"/><path d="M28 100v20M92 100v20" stroke="#ffffff66" stroke-width="2"/><path d="m37 96 5 5-5 5-5-5z" fill="#fff"/></svg>`;
 const college=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 const data=()=>state?.ui13&&typeof state.ui13==='object'&&!Array.isArray(state.ui13)?state.ui13:{};
 function writable(){
  if(!state.ui13||typeof state.ui13!=='object'||Array.isArray(state.ui13))state.ui13={};
  const u=state.ui13;
  for(const key of ['reviewed','drafts','contracts','baselines'])if(!u[key]||typeof u[key]!=='object'||Array.isArray(u[key]))u[key]={};
  if(!Array.isArray(u.choices))u.choices=[];
  return u;
 }
 function move(node,target){if(!node||!target)return;node.classList.remove('hidden','diamond-offscreen');delete node.dataset.diamondTab;if(node.parentNode!==target)target.append(node);}
 function element(tag,id,html='',className=''){const e=document.createElement(tag);if(id)e.id=id;e.className=className;e.innerHTML=html;return e;}
 function openSettings(){const d=$('journeySettings');if(d&&!d.open)d.showModal();}
 function choiceOptions(){return state.role==='batter'?[
  ['compete','주전 자리를 향해','감독 신뢰 +7 · 피로 +6'],['refine','타격의 빈틈 메우기','선구안 +1 · 감독 신뢰 −2'],['recover','오래 뛸 몸 만들기','피로 −22 · 컨디션 +12']
 ]:[['compete','등판 기회를 향해','감독 신뢰 +7 · 피로 +6'],['refine','제구의 완성도를 높이기','제구 +1 · 감독 신뢰 −2'],['recover','건강한 팔로 새 출발','피로 −22 · 컨디션 +12']];}
 function shell(){
  if($('journeySettings'))return;
  const settings=element('dialog','journeySettings','<div class="dialog-top"><h2>커리어 설정</h2><button type="button" id="closeSettings" aria-label="설정 닫기">닫기</button></div><p class="settings-note">선수별 저장 슬롯과 JSON 백업을 관리합니다.</p>','settings-dialog');
  document.querySelector('main').append(settings);$('closeSettings').onclick=()=>settings.close();
  const header=document.querySelector('header');header.querySelector('h1').textContent='나의 야구 인생';header.querySelector('.brand').textContent='PROJECT DIAMOND';
  const tools=element('div',null,'<span class="page-eyebrow"><i class="release-dot"></i>CAREER</span><button type="button" class="icon-button" id="journeySettingsButton" aria-label="커리어 설정"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 3-1 3-3 1-2 4 2 3v3l4 3 3-1 3 1 4-3v-3l2-3-2-4-3-1-1-3z"/><circle cx="12" cy="12" r="3"/></svg></button>','header-tools');header.append(tools);$('journeySettingsButton').onclick=openSettings;
  const intro=element('section','journeyIntro',`<div class="landing-mark">${portrait(0)}</div><p class="landing-kicker">ONE PLAYER. A WHOLE CAREER.</p><h2 class="landing-title">첫 유니폼부터<br>마지막 타석까지.</h2><p class="landing-sub">어떤 선수로 기억될까요?<br>나만의 선택으로 써 내려가는 야구 인생.</p><button type="button" class="main-action" id="startJourney">나의 커리어 시작</button><button type="button" class="secondary" id="landingLoad" style="margin-top:12px;width:100%">저장된 선수 이어하기</button><div class="landing-milestones"><span><b>01</b>유망주</span><span><b>02</b>첫 계약</span><span><b>03</b>성장의 계절</span><span><b>04</b>나의 기록</span></div>`);
  $('create').before(intro);$('startJourney').onclick=()=>{started=true;wizardStep=0;paintWizard();layout();};$('landingLoad').onclick=openSettings;
  for(const [id,title,sub] of [['dashboard','',''],['news','그라운드 안팎의 이야기','확정된 경기와 커리어 기록에서 전해 오는 소식'],['league','이번 시즌','한 경기의 경험이 다음 선택으로 이어집니다'],['training','나의 선수','능력과 몸 상태를 살피고 다음 기회를 준비하세요'],['career','지나온 발자취','프로 정규시즌 · 아마추어 기록은 따로 보관합니다']]){
   const page=element('section','screen-'+id,title?'<p class="page-eyebrow">'+id.toUpperCase()+'</p><h2 class="page-title">'+title+'</h2><p class="screen-intro">'+sub+'</p>':'','journey-screen');page.dataset.screen=id;$('game').append(page);
  }
  const home=$('screen-dashboard');home.append(element('div','homeStats','','quick-stats'),element('button','journeyAction','','main-action'),element('div','journeyTodo','','todo-card'),element('section','journeyTimeline'));
  $('journeyAction').onclick=()=>{if(state.retired){openSettings();return;}nav().show('league');if(!college()&&state.game===144&&!data().reviewed?.[state.year])openReview();};
  $('screen-league').append(element('div','seasonHeading'),element('section','seasonActions'),element('section','seasonDecision','','panel'));
  const leagueDetails=element('details','journeyLeagueDetails','<summary>리그 순위와 최근 경기 <span>⌄</span></summary>');$('screen-league').append(leagueDetails);
  $('screen-news').append(element('div','journeyArticles'));
  const filters=element('div','recordFilters','','record-filters');for(const [id,label] of [['seasons','시즌 기록'],['honors','수상·이적'],['amateur','아마·선택']]){const b=element('button',null,label);b.type='button';b.dataset.recordMode=id;b.onclick=()=>{recordMode=id;layout();};filters.append(b);}$('screen-career').append(filters);
  $('screen-career').append(element('section','journeyChoices','','panel'));
  const review=element('dialog','journeyReview','<div class="dialog-top"><span class="page-eyebrow">SEASON REVIEW</span><button type="button" id="dismissReview" aria-label="결산 닫기">닫기</button></div><div id="reviewContent" class="review-content"></div><button type="button" class="main-action" id="confirmReview">다음 선택으로</button>','review-dialog');document.querySelector('main').append(review);
  $('dismissReview').onclick=()=>review.close();$('confirmReview').onclick=()=>{if(!state)return;const u=writable();u.reviewed[state.year]=true;save();review.close();nav().show('league');render();};
 }
 function totals(){
  const s=empty();for(const row of state.career)for(const k of Object.keys(s))s[k]+=Number(row.stats?.[k]||0);
  if(state.game<144)for(const k of Object.keys(s))s[k]+=Number(state.current[k]||0);
  return s;
 }
 function home(){
  const u=data(),d=state.development||{},c=state.v12?.college;
  const stage=college()?'대학 야구 · '+Math.min(3,(c.yearIndex||0)+1)+'학년':state.retired?'커리어 아카이브':(V5_NAMES[state.globalCareer?.region||'KR']||'한국')+' · 프로';
  $('teamLabel').textContent=college()?'대학 야구부':state.team;$('seasonLabel').textContent=state.year+' · '+state.age+'세';
  $('profileLabel').textContent=state.position+' · '+state.hand+' · '+stage;
  $('playerPortrait').innerHTML=portrait(Number(u.avatar)||0)+'<span class="ovr-badge"><small>OVR</small>'+overall()+'</span>';
  const total=totals(),r=statline(total,state.role),entries=state.role==='batter'?[['프로 출장',total.G],['통산 안타',total.H],['통산 홈런',total.HR]]:[['프로 출장',total.G],['통산 탈삼진',total.PK],['통산 승리',total.W]];
  $('homeStats').innerHTML=entries.map(([k,v])=>'<div class="quick-stat"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');
  $('headline').textContent=college()?'대학 실전 '+c.results.length+' / 36경기':$('headline').textContent;
  $('journeyAction').textContent=state.retired?'새로운 커리어 준비':college()?(c.yearIndex>=3?'첫 프로 계약 선택':'대학 시즌 이어가기'):state.game===144?(u.reviewed?.[state.year]?'다음 시즌의 진로 결정':'이번 시즌 돌아보기'):'이번 시즌 시작하기';
  $('journeyTodo').innerHTML='<h3>'+(state.retired?'기록은 여기 남습니다':college()?(c.yearIndex>=3?'첫 유니폼을 고를 시간':'프로를 향한 준비'):state.game===144?'다음 시즌의 나는 어떤 선수일까요?':d.injury?'복귀를 위한 시간이 필요합니다':'다가올 기회를 준비하세요')+'</h3><p>'+(state.retired?'시즌별 기록과 수상, 이적의 발자취를 확인하세요.':college()?'대학 실전 성적이 스카우트 평가와 첫 입단 제안에 반영됩니다.':d.injury?'남은 재활 '+d.injury+'경기. 결장 기간에도 팀 일정은 진행됩니다.':state.game===144?'시즌 결산을 확인하고 육성 방향과 계약을 결정하세요.':'컨디션 '+Math.round(d.condition||0)+' · 피로 '+Math.round(d.fatigue||0)+' · '+(d.level||'1군'))+'</p><button type="button" id="todoLink">'+(state.retired?'커리어 기록 보기 →':'선수 상태 살펴보기 →')+'</button>';
  $('todoLink').onclick=()=>nav().show(state.retired?'career':'training');
  const history=[...(state.v10?.amateur?.history||[]).filter(x=>x.stage==='high-school'||!college()),...state.career.map((y,index)=>({archiveIndex:index,year:y.year,label:y.team||'프로 시즌',achievement:(state.role==='batter'?y.stats.HR+'홈런 · '+y.stats.H+'안타':y.stats.PK+'탈삼진 · '+y.stats.W+'승')}))].sort((a,b)=>b.year-a.year).slice(0,4);
  $('journeyTimeline').innerHTML='<div class="section-title-row"><h3>내가 걸어온 길</h3><span>CAREER JOURNEY</span></div>'+(history.length?history.map(x=>'<div class="timeline-row"><span class="year">'+x.year+'</span><i></i><div><strong>'+escapeHtml(x.label)+'</strong><small>'+escapeHtml(x.achievement||'')+'</small>'+(Number.isInteger(x.archiveIndex)?'<button type="button" class="timeline-review" data-archive-index="'+x.archiveIndex+'">시즌 돌아보기 →</button>':'')+'</div></div>').join(''):'<p class="screen-intro">오늘이 첫 번째 페이지입니다.</p>');
 }
 function reviewHTML(){
  const u=data(),before=u.baselines?.[state.year],d=state.development||{},now=overall(),old=Array.isArray(before)?Math.round(before.reduce((a,b)=>a+b,0)/6):null;
  const stat=statline(state.current,state.role),bat=state.role==='batter';
  const rows=bat?[['출전',state.current.G+'경기'],['타율 · OPS',stat.AVG+' · '+stat.OPS],['홈런 · 타점',state.current.HR+'홈런 · '+state.current.RBI+'타점']]:[['출전 · 선발',state.current.G+'경기 · '+state.current.GS+'선발'],['평균자책점 · 이닝',stat.ERA+' · '+stat.IP],['탈삼진 · 승리',stat.K+'K · '+stat.W+'승']];
  rows.push(['종합 능력',old===null?'현재 '+now:old+' → '+now],['컨디션 · 피로',Math.round(d.condition||0)+' · '+Math.round(d.fatigue||0)]);
  const season=state.legacyV4?.seasons?.[state.year],awards=season?.awards||[];
  const recorded=u.baselineGames?.[state.year];
  const baselineNote=old===null?'시작 능력치 미기록 · 현재 값만 표시합니다.':recorded===0?'시즌 시작 대비 변화입니다.':Number.isInteger(recorded)?recorded+'팀 경기 시점부터 기록한 변화입니다.':'이전 버전의 기록된 기준값 대비 변화입니다. 시즌 시작 시점은 확인할 수 없습니다.';
  const delta=(a,b)=>b+' <small class="attribute-delta">'+(a===null?'기준 미기록':(b-a>0?'+':'')+(b-a))+'</small>';
  const growth=(state.career14?.growth||[]).filter(x=>x.year===state.year),moments=(state.career14?.history||[]).filter(x=>x.year===state.year);
  return '<p class="section-kicker">'+state.year+' · '+escapeHtml(state.team)+'</p><h1 class="review-title">'+state.year+' 시즌 결산</h1><p class="screen-intro">'+escapeHtml(state.name)+' · '+escapeHtml(state.position)+' · '+state.age+'세</p><div class="review-score"><small>OVR</small>'+(old===null?now:old+' → '+now)+'</div><p class="review-footnote">'+baselineNote+'</p><h2>프로 정규시즌</h2><div class="report-rows">'+rows.map(([k,v])=>'<div class="report-row"><span>'+k+'</span><b>'+v+'</b></div>').join('')+'</div><h2>성장의 기록</h2><div class="report-rows">'+ATTR[state.role].map((name,i)=>'<div class="report-row"><span>'+escapeHtml(name)+(d.focus===i||d.secondaryFocus===i?' · 집중 과제':'')+'</span><b>'+delta(Array.isArray(before)?before[i]:null,state.attributes[i])+'</b></div>').join('')+'</div><p class="screen-intro">기록된 성장: 훈련 +'+growth.filter(x=>x.source==='훈련 성장').reduce((n,x)=>n+x.amount,0)+' · 실전 경험 +'+growth.filter(x=>x.source==='실전 경험').reduce((n,x)=>n+x.amount,0)+' (능력 합계). 이전 버전의 미기록 성장 내역은 복원하지 않습니다.</p><h2>팀의 한 시즌</h2><div class="report-rows">'+(season?'<div class="report-row"><span>정규리그 순위</span><b>'+season.leagueRank+'위</b></div><div class="report-row"><span>포스트시즌 우승팀</span><b>'+escapeHtml(season.postseason.champion)+'</b></div>':'<p class="screen-intro">팀 결산 미기록</p>')+'</div><h2>수상과 커리어의 순간</h2><p>'+escapeHtml(awards.length?awards.join(' · '):'이번 시즌 개인 수상 없음')+'</p>'+moments.slice(-8).map(x=>'<div class="history-choice">'+x.game+'경기 · '+escapeHtml(x.title)+'</div>').join('')+'<p class="review-footnote">개인 성적은 프로 정규시즌 기준입니다. 팀 포스트시즌 결과와 구분합니다.</p>';

 }
 function openReview(){if(!state||college()||state.game!==144)return;$('reviewContent').innerHTML=reviewHTML();const d=$('journeyReview');if(!d.open)d.showModal();}
 function season(){
  const c=state.v12?.college,done=state.game===144,u=data();
  const count=college()?Math.min(36,c.results.length):state.game,limit=college()?36:144;
  $('seasonHeading').innerHTML='<div class="season-heading"><div><p class="page-eyebrow">'+(college()?'COLLEGE SEASON':'REGULAR SEASON')+'</p><h3>'+state.year+' '+(college()?'대학 야구':escapeHtml(state.team))+'</h3></div><span class="stamp">'+Math.round(count/limit*100)+'<small style="font-size:12px">%</small></span></div><div class="progress-track"><div style="width:'+count/limit*100+'%"></div></div><div class="progress-label"><span>'+count+' / '+limit+'경기</span><span>'+(state.retired?'은퇴':college()?'프로를 향한 여정':done?'시즌 완료':'시즌 진행 중')+'</span></div>';
  $('seasonActions').hidden=college();$('seasonDecision').hidden=college()||!done||state.retired;
  if(!college()){
   $('seasonBtn').textContent=state.year+' 시즌 보내기';$('oneBtn').textContent='1경기';$('weekBtn').textContent='7경기';$('nextBtn').textContent=state.age>=40?'커리어 마무리':'진로 확정 · 다음 시즌';
   $('seasonBtn').classList.toggle('hidden',done||state.retired);$('smallActions').hidden=done||state.retired;$('seasonDetailControls').hidden=done||state.retired;
   $('nextBtn').disabled=!done||state.retired||(state.age<40&&!u.drafts?.[state.year]);
  }
  const freshLabels=[...document.querySelectorAll('#developmentPane input[name=contractPick]')].map(x=>x.closest('label'));
  const labels=freshLabels.length?freshLabels:[...document.querySelectorAll('#contractOptions input[name=contractPick]')].map(x=>x.closest('label'));
  const decision=$('seasonDecision');if($('nextBtn'))$('seasonActions').append($('nextBtn'));decision.innerHTML='';
  if(decision.hidden)return;
  decision.innerHTML='<button type="button" class="secondary" id="reopenReview" style="width:100%;margin-bottom:25px">시즌 결산 다시 보기</button><p class="page-eyebrow">NEXT CHAPTER</p><h2>다음 시즌의 방향</h2><p class="screen-intro">계약을 확정할 때 적용됩니다. 선택한 방향은 저장되어 다시 이어갈 수 있습니다.</p><div class="choice-list" id="directionOptions"></div><div id="contractStage"><h3>도착한 계약 제안</h3><p class="screen-intro">연봉·기간·예상 역할을 비교하세요. 구단의 예상 역할은 출전 보장이 아니며 실제 경쟁 평가에 반영됩니다.</p><div id="contractOptions"></div></div>';
  $('reopenReview').onclick=openReview;
  for(const [id,title,effect] of choiceOptions()){
   const b=element('button',null,'<span class="choice-dot"></span><span><strong>'+title+'</strong><small>'+effect+'</small></span>','direction-choice'+(u.drafts?.[state.year]===id?' selected':''));b.type='button';b.dataset.direction=id;b.setAttribute('aria-pressed',String(u.drafts?.[state.year]===id));b.onclick=()=>{writable().drafts[state.year]=id;changingDirection=false;save();render();};$('directionOptions').append(b);
  }
  for(const label of labels){
   label.classList.add('contract-option');const input=label.querySelector('input');const index=Number(input.value);
   if(Number.isInteger(u.contracts?.[state.year]))input.checked=index===u.contracts[state.year];
   input.onchange=()=>{writable().contracts[state.year]=index;save();};
   label.querySelector('small')?.remove();label.append(element('small',null,'1년 · 가상 리그 · 다음 시즌 소속 및 연봉 확정'));$('contractOptions').append(label);
  }
  for(const h of document.querySelectorAll('#developmentPane h3'))if(h.textContent.includes('계약'))h.remove();
  if(window.DiamondContracts)window.DiamondContracts.marketView($('contractOptions'));
  const selected=choiceOptions().find(x=>x[0]===u.drafts?.[state.year]);
  const contractStage=$('contractStage'),directionStage=$('directionOptions');
  const choosing=state.age<40&&(!selected||changingDirection);
  contractStage.hidden=choosing;directionStage.hidden=!choosing;
  if(selected&&!choosing){
   const summary=element('div','chosenDirection','<span>육성 방향 · '+selected[1]+'</span><button type="button" id="changeDirection" class="secondary small">방향 바꾸기</button>','chosen-direction');
   directionStage.after(summary);$('changeDirection').onclick=()=>{changingDirection=true;render();};
  }
  decision.querySelector('h2').textContent=state.age>=40?'나의 야구 인생 마무리':choosing?'어떤 선수로 돌아올까요?':'다음 시즌의 유니폼';
  decision.querySelector('.page-eyebrow').textContent=choosing?'OFFSEASON · 1 / 2':'OFFSEASON · 2 / 2';
  const intro=decision.querySelector('.screen-intro');intro.textContent=choosing?'새 시즌에 적용할 육성 방향을 하나 골라 주세요.':'계약 조건을 비교하고 확정하면 다음 시즌을 시작합니다.';
  decision.append($('nextBtn'));$('nextBtn').hidden=choosing;
  if(!u.reviewed?.[state.year]){
   // A report can be closed and reopened without losing or applying offseason choices.
   contractStage.hidden=true;directionStage.hidden=true;$('chosenDirection')?.remove();$('nextBtn').hidden=true;
   for(const e of [decision.querySelector('h2'),intro,decision.querySelector('.page-eyebrow')])e.hidden=true;
   $('reopenReview').textContent='시즌 결산 확인하고 다음 진로로';
  }

 }
 function articles(){
  const list=state.career.slice(-3).reverse();
  $('journeyArticles').innerHTML=list.length?list.map(s=>{const r=statline(s.stats,state.role);return '<article class="news-article"><span class="article-category">SEASON NOTE · '+s.year+'</span><h3>'+escapeHtml(state.name)+', '+(state.role==='batter'?s.stats.HR+'홈런과 '+s.stats.H+'안타':s.stats.PK+'탈삼진과 '+s.stats.W+'승')+'의 시즌을 남기다</h3><p>'+escapeHtml(s.team||(s.year===state.year?state.team:'소속 정보 미기록'))+' · '+s.stats.G+'경기 출전 · '+(state.role==='batter'?'타율 '+r.AVG:'평균자책점 '+r.ERA)+'</p><button type="button" class="secondary small" data-archive-index="'+state.career.indexOf(s)+'">시즌 돌아보기</button></article>';}).join(''):'<p class="news-empty">아직 끝나지 않은 첫 시즌.<br>경기를 진행하면 이곳에 나의 이야기가 쌓입니다.</p>';
  $('journeyChoices').innerHTML='<h2>내가 선택한 방향</h2>'+((Array.isArray(data().choices)?data().choices:[]).slice().reverse().map(x=>'<div class="history-choice">'+x.year+' · '+escapeHtml(x.title)+'<br><small>'+escapeHtml(x.effect)+'</small></div>').join('')||'<p class="screen-intro">시즌을 마치고 선택한 방향과 결과가 이곳에 남습니다.</p>');
 }
 function layout(){
  if(building)return;building=true;
  try{
   shell();const settings=$('journeySettings');
   move($('diamondSlots'),settings);move($('exportBtn')?.closest('.panel'),settings);move($('resetBtn'),settings);
   // Saved careers and onboarding share the settings dialog, without duplicating controls.
   const intro=$('journeyIntro');intro.hidden=!!state||started;$('create').classList.toggle('hidden',!!state||!started);
   if(!state){for(const d of [$('journeyReview')])if(d?.open)d.close();return;}
   $('diamondNav')?.classList.remove('hidden');
   const homePage=$('screen-dashboard'),seasonPage=$('screen-league'),playerPage=$('screen-training'),recordPage=$('screen-career'),newsPage=$('screen-news');
   const hero=$('nameLabel').closest('.hero');
   if(!$('playerPortrait')){
    const names=['seasonLabel','teamLabel','nameLabel','profileLabel','headline'].map($);
    const top=element('div',null,'','player-topline');top.append(names[0],names[1]);const face=element('div','playerPortrait','','player-portrait');
    const actions=$('seasonActions');actions.append($('seasonBtn'));const small=element('div','smallActions','','small-actions');small.append($('oneBtn'),$('weekBtn'));const detail=element('details','seasonDetailControls','<summary>세부 경기 관리</summary>');detail.append(small);actions.append(detail,$('nextBtn'));move($('freshBtn'),settings);
    hero.replaceChildren(top,face,names[2],names[3],names[4]);hero.classList.add('player-card');
   }
   move(hero,homePage);homePage.prepend(hero);
   move($('stats').closest('.panel'),seasonPage);move($('leaguePane'),$('journeyLeagueDetails'));move($('attributes').closest('.panel'),playerPage);
   move($('developmentPane'),playerPage);move($('v5Pane'),playerPage);
   move($('historyBody').closest('.panel'),recordPage);move($('v4Pane'),recordPage);move($('v6Pane'),recordPage);move($('diamondAmateurHistory'),recordPage);move($('diamondScouting'),recordPage);
   move($('events').closest('.panel'),newsPage);
   const school=$('diamondCollege');if(school){move(school,seasonPage);$('seasonHeading').after(school);}
   for(const node of [hero,$('stats')?.closest('.panel'),$('attributes')?.closest('.panel'),$('developmentPane'),$('v5Pane'),$('v4Pane'),$('v6Pane'),$('diamondAmateurHistory'),$('diamondScouting')])if(node)node.hidden=false;
   $('stats').closest('.panel').hidden=college();$('v5Pane').hidden=college();
   for(const h of document.querySelectorAll('#game h2'))h.textContent=h.textContent.replace(/\s*[·—]?\s*V\d+(?:\.\d+)*/g,'').replace(/^[⚾🏋️🏆🌐🌏📋🎓]\s*/u,'');
   if(school){$('collegeYear')&&($('collegeYear').textContent='대학 시즌 보내기');$('collegeOne')&&($('collegeOne').textContent='1경기');$('collegeFour')&&($('collegeFour').textContent='4경기');}
   const dev=state.development||{};
   if(!$('secondaryFocusSelect')){
    const field=element('div',null,'<label for="secondaryFocusSelect">두 번째 훈련 과제</label><select id="secondaryFocusSelect"></select><p class="screen-intro">두 과제 선택 시 성장 기회를 번갈아 배분합니다.</p>','field');$('developmentPane').append(field);
   }
   $('secondaryFocusSelect').innerHTML='<option value="-1">한 가지에 집중</option>'+ATTR[state.role].map((x,i)=>'<option value="'+i+'" '+(dev.secondaryFocus===i?'selected':'')+'>'+x+'</option>').join('');
   $('secondaryFocusSelect').onchange=e=>{const n=Number(e.target.value);dev.secondaryFocus=n>=0&&n!==dev.focus?n:null;save();layout();};
   $('focusSelect').onchange=e=>{dev.focus=Number(e.target.value);dev.secondaryFocus=null;save();layout();};
   if(college())for(const p of $('developmentPane').querySelectorAll('p'))if(p.textContent.includes('연봉'))p.textContent='대학 선수 · 프로 계약 전 · 대학 경기에서 성장 기회를 쌓습니다.';
   $('growthMessage').textContent=college()?'종합 '+overall()+' · 대학 4경기마다 선택 과제 성장':'종합 '+overall()+' · 실제 훈련과 프로 출장·이닝을 구분해 성장합니다.';
   recordPage.append($('journeyChoices'));
   for(const [node,mode] of [[$('historyBody').closest('.panel'),'seasons'],[$('v4Pane'),'honors'],[$('v6Pane'),'honors'],[$('diamondAmateurHistory'),'amateur'],[$('diamondScouting'),'amateur'],[$('journeyChoices'),'amateur']])if(node)node.hidden=recordMode!==mode;
   for(const b of $('recordFilters').querySelectorAll('button')){b.classList.toggle('selected',b.dataset.recordMode===recordMode);b.setAttribute('aria-pressed',String(b.dataset.recordMode===recordMode));}
   document.querySelector('.footer').textContent='가상의 야구 세계에서 써 내려가는 나의 커리어';
   home();season();articles();
   for(const page of document.querySelectorAll('.journey-screen'))page.hidden=page.dataset.screen!==nav().active;
   window.DiamondArchive19?.layout();
  }finally{building=false;}
 }
 window.DiamondUI={layout,openSettings,openReview};
 window.addEventListener('diamond-slot-change',()=>{started=false;wizardStep=0;changingDirection=false;paintWizard();$('journeySettings')?.close();if(state)nav().show('dashboard');layout();});
 function paintWizard(){
  if(!$('wizardProgress'))return;
  for(const section of document.querySelectorAll('.wizard-step'))section.hidden=Number(section.dataset.step)!==wizardStep;
  $('wizardProgress').innerHTML=Array.from({length:4},(_,i)=>'<span class="'+(i<=wizardStep?'active':'')+'"></span>').join('');
  $('wizardCount').textContent=(wizardStep+1)+' / 4';$('wizardTitle').textContent=['나의 유니폼','선수의 첫 페이지','어떤 선수로 자랄까요?','집중할 성장 방향'][wizardStep];
  $('wizardNext').hidden=wizardStep===3;$('createForm').querySelector('button[type=submit]').hidden=wizardStep!==3;
  $('wizardBack').textContent=wizardStep===0?'처음으로':'이전';
  if(wizardStep===3){const role=$('role').value;$('journeyFocus').innerHTML=ATTR[role].map((x,i)=>'<option value="'+i+'">'+x+'</option>').join('');$('journeyFocusSecond').innerHTML='<option value="-1">한 가지에 집중</option>'+ATTR[role].map((x,i)=>'<option value="'+i+'">'+x+'</option>').join('');$('wizardSummary').textContent=$('playerName').value+' · '+$('position').value+' · '+$('hand').value+' · '+(document.querySelector('[name=amateurPath]:checked')?.value==='college'?'대학 야구에서 시작':'프로 신인으로 시작');}
 }
 function wizard(){
  const form=$('createForm');if($('wizardProgress'))return;
  const original=[...form.children],submit=form.querySelector('button[type=submit]');
  const progress=element('div','wizardProgress','','wizard-progress'),meta=element('div',null,'<button type="button" id="wizardBack">처음으로</button><span id="wizardCount"></span>','wizard-meta'),title=element('h2','wizardTitle');form.prepend(progress,meta,title);
  const steps=Array.from({length:4},(_,i)=>{const s=element('section',null,'','wizard-step');s.dataset.step=i;form.append(s);return s;});
  steps[0].innerHTML='<p class="screen-intro">그라운드에서 나를 나타낼 모습을 골라 주세요.<br>외형은 선수 능력에 영향을 주지 않습니다.</p><div class="avatar-grid">'+colors.map((_,i)=>'<button type="button" class="avatar-choice'+(i===0?' selected':'')+'" data-avatar="'+i+'" aria-label="선수 모습 '+(i+1)+'">'+portrait(i)+'</button>').join('')+'</div>';
  for(const e of original){if(e===submit)continue;if(e.id==='diamondProspects')steps[2].append(e);else steps[1].append(e);}
  steps[3].innerHTML='<p class="screen-intro">두 과제는 프로 12경기·대학 4경기 단위로 번갈아 훈련합니다.<br>한 과제에 집중할 수도 있습니다.</p><div class="field"><label for="journeyFocus">첫 번째 훈련 과제</label><select id="journeyFocus"></select></div><div class="field"><label for="journeyFocusSecond">두 번째 훈련 과제</label><select id="journeyFocusSecond"></select></div><p class="wizard-summary" id="wizardSummary"></p>';
  const buttons=element('div',null,'<button type="button" id="wizardNext">다음 단계</button>','wizard-buttons');buttons.append(submit);form.append(buttons);submit.textContent='나의 야구 인생 시작';
  $('wizardBack').onclick=()=>{if(wizardStep===0){started=false;layout();}else{wizardStep--;paintWizard();}};
  $('wizardNext').onclick=()=>{if(wizardStep===1&&!$('playerName').value.trim()){$('formError').textContent='선수 이름을 입력해 주세요.';$('playerName').focus();return;}wizardStep=Math.min(3,wizardStep+1);paintWizard();window.scrollTo(0,0);};
  for(const b of steps[0].querySelectorAll('[data-avatar]'))b.onclick=()=>{selectedAvatar=Number(b.dataset.avatar);for(const x of steps[0].querySelectorAll('button'))x.classList.toggle('selected',x===b);};
  form.addEventListener('submit',()=>{
   if(!state||state.game!==0||state.career.length)return;
   const u=writable();u.avatar=selectedAvatar;u.baselines[state.year]=[...state.attributes];u.baselineGames={[state.year]:0};
   ensureV3();state.development.focus=Number($('journeyFocus').value);const second=Number($('journeyFocusSecond').value);state.development.secondaryFocus=second>=0&&second!==state.development.focus?second:null;
   if(college())state.events=state.events.filter(x=>!/^18세 유망주 .*입단했습니다!$/.test(x));
   save();$('journeySettings').open&&$('journeySettings').close();nav().show('dashboard');render();
  });
  paintWizard();
 }
 play=function(count){
  if(!state)return;const u=writable();if(!u.baselines[state.year]){u.baselines[state.year]=[...state.attributes];if(!u.baselineGames)u.baselineGames={};u.baselineGames[state.year]=state.game;}
  const previous=state.game;const result=basePlay(count);
  if(!college()&&previous<144&&state.game===144&&!state.retired){save();openReview();}
  return result;
 };
 nextSeason=function(){
  if(!state||state.retired||state.game!==144)return;
  const year=state.year,u=writable(),id=u.drafts[year];
  if(state.age<40&&!choiceOptions().some(x=>x[0]===id)){nav().show('league');return;}
  const option=choiceOptions().find(x=>x[0]===id);baseNext();
  if(state.year!==year&&!state.retired&&option&&!u.choices.some(x=>x.year===year)){
   const d=state.development,oldTrust=d.trust,oldFatigue=d.fatigue,oldCondition=d.condition,oldAttributes=[...state.attributes];
   if(id==='compete'){d.trust=clamp(d.trust+7,0,100);d.fatigue=clamp(d.fatigue+6,0,100);}
   if(id==='refine'){const i=state.role==='batter'?2:1;state.attributes[i]=Math.min(state.potential,state.attributes[i]+1);d.trust=clamp(d.trust-2,0,100);}
   if(id==='recover'){d.fatigue=clamp(d.fatigue-22,0,100);d.condition=clamp(d.condition+12,0,100);}
   const changes=[['신뢰',d.trust-oldTrust],['피로',d.fatigue-oldFatigue],['컨디션',d.condition-oldCondition],...state.attributes.map((v,i)=>[ATTR[state.role][i],v-oldAttributes[i]])].filter(x=>x[1]!==0).map(([k,v])=>k+' '+(v>0?'+':'')+v).join(' · ')||'현재 상한/하한에 도달해 추가 변화 없음';
   u.choices.push({year,id,title:option[1],effect:changes});u.baselines[state.year]=[...state.attributes];if(!u.baselineGames)u.baselineGames={};u.baselineGames[state.year]=0;changingDirection=false;state.events.unshift('새 시즌의 방향: '+option[1]);state.events=state.events.slice(0,12);save();
  }
  changingDirection=false;nav().show('dashboard');render();
 };
 render=function(){baseRender();layout();};
 setup=function(){baseSetup();wizard();layout();};
})();
