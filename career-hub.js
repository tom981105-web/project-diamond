// V2.9: a connected home and recorded match report. Read-only presentation.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),school=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 let owner=null,reportYear=null,reportGame=null;
 function latest(){
  const l=state?.league,m=l?.last;
  if(!state||school()||state.game<1||l?.season!==state.year||l.round!==state.game||!m||![m.home,m.away].includes(state.team))return null;
  return m;
 }
 function appearance(){
  const c=state.career14,a=c?.lastAppearance;
  if(c?.year!==state.year||a?.year!==state.year||a.game!==state.game)return null;
  return {record:a,stats:c.recent?.at(-1)};
 }
 function outcome(m){const own=m.home===state.team?m.homeRuns:m.awayRuns,other=m.home===state.team?m.awayRuns:m.homeRuns;return own===other?'무승부':own>other?'승리':'패배';}
 function score(m){
  return '<div class="hub-score29">'+[[m.away,m.awayRuns],[m.home,m.homeRuns]].map(([team,runs])=>'<div class="hub-team29'+(team===state.team?' is-mine':'')+'">'+window.DiamondPresentation.badge(team)+'<span>'+text(team)+'</span><strong>'+text(runs)+'</strong></div>').join('')+'</div>';
 }
 function personal(){
  const a=appearance();
  if(!a)return '<p class="hub-note29">이 경기의 개인 출전 내역은 저장되어 있지 않습니다.</p>';
  if(!a.record.played)return '<div class="hub-absence29"><strong>공식 출전 없음</strong><p>'+text(a.record.reason||'출전 기록 없음')+'</p></div>';
  const d=a.stats;if(!d||d.G!==1)return '<p class="hub-note29">공식 출전 기록 있음 · 개인 세부 기록은 보관되어 있지 않습니다.</p>';
  const bat=state.role==='batter',rows=bat?[['타수',d.AB],['안타',d.H],['홈런',d.HR],['타점',d.RBI],['볼넷',d.BB],['도루',d.SB]]:[['이닝',Math.floor(d.IPouts/3)+'.'+d.IPouts%3],['탈삼진',d.PK],['자책점',d.ER],['피안타',d.PH],['볼넷',d.PBB],['승 · 세이브',d.W+' · '+d.SV]];
  return '<p class="hub-appearance29">'+(bat?'타석에서 남긴 기록':'마운드에서 남긴 기록')+'</p><div class="hub-personal29">'+rows.map(([label,value])=>'<div><small>'+label+'</small><strong>'+text(value)+'</strong></div>').join('')+'</div>';
 }
 function preparation(){
  if(state.retired)return '선수 생활을 마치고 기록을 돌아봅니다';
  if(school())return '대학 '+state.v12.college.results.length+' / 36경기 · 프로를 향해 준비 중';
  const d=state.development,p=state.career14?.plan;
  if(d.injury>0)return '부상 재활 · '+d.injury+'팀 경기 남음';
  if(p&&p.end>state.game)return ({rest:'휴식',rehab:'재활',practice:'과제 훈련',defense:state.role==='batter'?'수비 훈련':'변화구 훈련'}[p.mode]||'훈련')+' 계획 · '+(p.end-state.game)+'팀 경기 남음';
  return d.level+' · 컨디션 '+Math.round(d.condition)+' · 피로 '+Math.round(d.fatigue);
 }
 function shell(){
  if($('matchReportDialog29'))return;
  const dialog=document.createElement('dialog');dialog.id='matchReportDialog29';dialog.className='career-dialog experience-dialog';dialog.setAttribute('aria-labelledby','matchReportTitle29');
  dialog.innerHTML='<div class="dialog-top"><h2 id="matchReportTitle29">경기 결과</h2><button type="button" id="closeMatchReport29" aria-label="경기 결과 닫기">닫기</button></div><div class="experience-body"></div>';
  document.querySelector('main').append(dialog);$('closeMatchReport29').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{owner=null;});
 }
 function report(){
  const m=latest();if(!m)return;
  const dialog=$('matchReportDialog29');owner=state;reportYear=state.year;reportGame=state.game;
  dialog.querySelector('.experience-body').innerHTML='<p class="flow-eyebrow">'+state.year+' · '+state.game+'번째 팀 경기 · '+text(m.innings)+'이닝 종료</p><div class="hub-result29"><span class="hub-result-tag29">'+outcome(m)+'</span><small>'+text(state.team)+' 기준</small></div>'+score(m)+'<section class="hub-record29"><h3>'+text(state.name)+'의 이번 경기</h3>'+personal()+'</section><p class="hub-note29">시즌 누적이 아닌 마지막 완료 경기의 기록입니다.</p><div class="hub-report-actions29"><button type="button" class="secondary" id="reportReplay29">경기 다시보기</button><button type="button" id="reportSeason29">시즌으로 돌아가기</button></div>';
  $('reportReplay29').onclick=()=>{dialog.close();window.DiamondExperience.openReplay(m);};
  $('reportSeason29').onclick=()=>{dialog.close();window.DiamondNavigation.show('league');};
  if(!dialog.open)dialog.showModal();
 }
 function paint(){
  shell();const dialog=$('matchReportDialog29');
  if(dialog.open&&(owner!==state||reportYear!==state?.year||reportGame!==state?.game||!latest()))dialog.close();
  if(!state||!$('homeIdentity'))return;
  let prep=$('homePreparation29');if(!prep){prep=document.createElement('button');prep.id='homePreparation29';prep.type='button';}
  $('homeIdentity').closest('.hero').append(prep);
  prep.innerHTML='<span><small>지금의 나</small><strong>'+text(preparation())+'</strong></span><span aria-hidden="true">›</span>';
  prep.onclick=()=>{window.DiamondNavigation.show('training');$('playerSceneEntry27')?.click();};
  let home=$('homeMatch29');if(!home){home=document.createElement('section');home.id='homeMatch29';home.className='surface-card';}
  $('homeNextCard').after(home);const m=latest();home.hidden=!m;
  const root=$('recentMatchStory'),old=$('openMatchReplay');
  if(root)root.hidden=!m;
  if(root&&old&&m){
   root.classList.add('hub-season-match29');root.querySelector('h3').hidden=true;
   let b=$('seasonMatchReport29');if(!b){b=document.createElement('button');b.id='seasonMatchReport29';b.type='button';old.before(b);}
   b.innerHTML=score(m)+'<span class="hub-link29">내 경기 기록 확인 <span aria-hidden="true">›</span></span>';b.onclick=report;
  }
  if(!m)return;
  const a=appearance(),summary=a?(a.record.played?(state.role==='batter'?'공식 출장':'공식 등판'):(a.record.reason||'공식 출전 없음')):'개인 출전 내역 미보관';
  home.innerHTML='<div class="section-title-row"><h3>최근 경기</h3><small>'+state.year+' · '+state.game+'팀 경기</small></div><button type="button" id="homeMatchReport29">'+score(m)+'<span class="hub-match-footer29"><span><b>'+outcome(m)+'</b> · '+text(summary)+'</span><span>내 기록 보기 ›</span></span></button>';
  $('homeMatchReport29').onclick=report;
 }
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',paint);
})();
