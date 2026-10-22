// V2.5: real season landmarks and completed-round progress; presentation never draws randomness.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,enginePlay=play;
 let run=null,timer=null;
 const pro=()=>!!state&&!(state.v12?.college&&!state.v12.college.completed);
 const valid=r=>r&&pro()&&state===r.owner&&state.year===r.year&&!state.retired&&state.game===r.expected;
 function shell(){
  if($('seasonProgressDialog'))return;
  const dialog=document.createElement('dialog');dialog.id='seasonProgressDialog';dialog.className='career-dialog season-progress-dialog';dialog.setAttribute('aria-labelledby','seasonProgressTitle');
  dialog.innerHTML='<p class="page-eyebrow">나의 시즌</p><h2 id="seasonProgressTitle">시즌 진행</h2><p id="seasonProgressPhase" role="status" aria-live="polite"></p><progress id="seasonRunProgress" max="144" value="0" aria-label="완료한 팀 경기"></progress><div class="progress-label"><span id="seasonRunCount"></span><span id="seasonRunPercent"></span></div><div class="run-body25"><div id="runPlayerScene27"></div><section aria-labelledby="seasonLandmarksTitle25"><h3 id="seasonLandmarksTitle25">쌓여 가는 기록</h3><ol id="seasonLandmarks25"></ol></section><details id="seasonRunDetails25"><summary>현재 기록과 최근 경기</summary><div id="seasonRunStats" class="decision-rows"></div><div id="seasonRunMoments"></div></details></div><p class="decision-note">완료한 팀 경기와 실제 선수 기록을 표시합니다. 중요한 선택이 생기면 일정을 멈춥니다.</p><div class="decision-actions"><button type="button" class="secondary" id="stopSeasonRun">여기서 멈추기</button><button type="button" id="skipSeasonAnimation">연출 건너뛰기</button></div>';
  document.querySelector('main').append(dialog);
  $('stopSeasonRun').onclick=()=>stop(true);
  dialog.oncancel=e=>{e.preventDefault();stop(true);};
  $('skipSeasonAnimation').onclick=()=>{if(!run)return;run.fast=true;$('skipSeasonAnimation').disabled=true;$('skipSeasonAnimation').textContent='빠르게 진행 중';schedule(0);};
 }
 function remaining(r){if(valid(r)&&state.career14)state.career14.remaining=Math.max(0,r.target-state.game);}
 function stop(preserve=false){
  const r=run;run=null;clearTimeout(timer);timer=null;
  if(preserve&&valid(r)){remaining(r);save();}
  if($('seasonProgressDialog')?.open)$('seasonProgressDialog').close();
  if(r){render();if(valid(r)){if(!state.career14?.pending&&window.DiamondStories22?.blocks())window.DiamondStories22.open();else if(state.game<r.target)$('seasonBtn')?.focus();}}
 }
 function paint(){
  const r=run;if(!r)return;
  const g=state.game,d=state.development,s=statline(state.current,state.role),bat=state.role==='batter';
  $('seasonProgressTitle').textContent=r.year+' · '+state.team;
  $('seasonProgressPhase').textContent=(g===0?'개막을 준비합니다':g<=36?'시즌 초반':g<=72?'전반기를 쌓아 갑니다':g<=108?'후반기의 경쟁':'시즌 막바지')+' · 선수 출장 '+state.current.G+'경기';
  $('seasonRunProgress').value=g;$('seasonRunCount').textContent=g+' / 144팀 경기';$('seasonRunPercent').textContent=Math.round(g/144*100)+'%';
  const row=(label,value)=>'<div class="decision-row"><span>'+label+'</span><strong>'+escapeHtml(String(value))+'</strong></div>';
  $('seasonRunStats').innerHTML=row(bat?'타율 · 홈런':'평균자책점 · 탈삼진',bat?s.AVG+' · '+state.current.HR+'홈런':s.ERA+' · '+state.current.PK+'K')+row('종합 능력',overall())+row('컨디션 · 피로',Math.round(d.condition)+' · '+Math.round(d.fatigue))+row('소속 단계',d.level);
  $('runPlayerScene27').innerHTML=window.DiamondScenes27?.progress()||'';
  landmarks();
  $('seasonRunMoments').innerHTML=r.moments.slice(-3).reverse().map(m=>'<div class="run-moment"><span>'+m.game+'팀 경기</span><strong>'+escapeHtml(m.text)+'</strong></div>').join('');
 }
 // These are current-stat checkpoints, not fabricated match dates or saved achievements.
 function landmarks(){
  const c=state.current,bat=state.role==='batter',items=[];
  const add=(label,value)=>items.push('<li><span aria-hidden="true" class="run-dot25"></span><div><strong>'+escapeHtml(label)+'</strong><small>'+escapeHtml(value)+'</small></div></li>');
  if(c.G>0)add(bat?'이번 시즌 타석에 서다':'이번 시즌 마운드에 서다',c.G+(bat?'출장':'등판')+' · 현재 시즌 기록');
  for(const n of [36,72,108])if(state.game>=n)add(n===36?'시즌의 첫 구간을 지나':n===72?'시즌의 절반을 지나':'마지막 구간을 향해',n+'팀 경기 이상 진행');
  for(const [key,unit,thresholds] of bat?[['H','안타',[1,50,100,150,200]],['HR','홈런',[1,10,20,30,40]],['RBI','타점',[30,60,100]],['SB','도루',[10,20,30]]]:[['PK','탈삼진',[1,50,100,150,200]],['W','승',[1,5,10,15,20]],['SV','세이브',[1,10,20,30,40]]]){
   const reached=thresholds.filter(n=>c[key]>=n).at(-1);
   if(reached!==undefined)add('시즌 '+reached+unit+' 달성','현재 '+c[key]+unit);
  }
  if(!items.length)add('첫 기록을 기다리며',state.game+' / 144팀 경기 · 실제 출전 이후 기록합니다.');
  $('seasonLandmarks25').innerHTML=items.join('');
 }
 function schedule(delay){clearTimeout(timer);timer=setTimeout(tick,delay);}
 function tick(){
  const r=run;if(!valid(r)){stop();return;}
  if(state.career14?.pending||window.DiamondStories22?.blocks()||state.game>=r.target){stop(true);return;}
  const previous=state.game,checkpoint=JSON.parse(JSON.stringify(state)),count=r.fast?r.target-state.game:Math.min(7,r.target-state.game);
  // Close before the final chunk so the existing completed-season report owns focus.
  if(r.target===144&&state.game+count>=144)$('seasonProgressDialog').close();
  r.inTick=true;
  try{enginePlay(count);}
  catch(error){r.inTick=false;if(state===r.owner&&state.year===r.year){state=checkpoint;save();}stop();let notice=$('seasonRunNotice');if(!notice){notice=document.createElement('p');notice.id='seasonRunNotice';notice.className='notice';notice.setAttribute('role','alert');$('seasonHeading').after(notice);}notice.textContent='진행 중 오류로 멈췄습니다. 직전 진행 구간까지의 기록을 복원했습니다. 기록을 확인한 뒤 다시 진행해 주세요.';console.error('시즌 진행 중단',error);return;}
  r.inTick=false;
  if(run!==r||state!==r.owner||state.year!==r.year){stop();return;}
  r.expected=state.game;remaining(r);save();
  if(state.game<=previous||state.career14?.pending||window.DiamondStories22?.blocks()||state.game>=r.target){stop(true);return;}
  const match=state.league?.last;
  if(match)r.moments.push({game:state.game,text:match.away+' '+match.awayRuns+' : '+match.homeRuns+' '+match.home});
  if(r.moments.length>3)r.moments.shift();
  paint();if(!$('seasonProgressDialog').open)$('seasonProgressDialog').showModal();
  schedule(r.fast?0:110);
 }
 function start(target=144){
  if(run||!pro()||state.retired||state.game>=144||state.career14?.pending||window.DiamondStories22?.blocks())return;
  shell();$('seasonRunNotice')?.remove();const end=Math.min(144,Math.floor(target));if(end<=state.game)return;
  run={owner:state,year:state.year,target:end,expected:state.game,inTick:false,fast:window.matchMedia('(prefers-reduced-motion: reduce)').matches,moments:[]};
  $('seasonRunDetails25').open=false;remaining(run);save();render();$('skipSeasonAnimation').disabled=false;$('skipSeasonAnimation').textContent='연출 건너뛰기';paint();$('seasonProgressDialog').showModal();schedule(run.fast?0:140);
 }
 function bind(){
  shell();$('seasonBtn').onclick=()=>start(144);
  if($('continueCareer'))$('continueCareer').onclick=()=>start(state.game+(state.career14?.remaining||0));
  if(run&&!run.inTick&&!valid(run))stop();
 }
 render=function(){baseRender();bind();};
 setup=function(){baseSetup();bind();};
 window.addEventListener('diamond-slot-change',()=>{stop();bind();});
 window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=null;run=null;});
 window.addEventListener('pageshow',e=>{if(e.persisted){$('seasonProgressDialog')?.close();render();}});
})();
