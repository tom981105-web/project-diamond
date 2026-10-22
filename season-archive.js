// V1.9: browse recorded seasons without applying career decisions or replaying games.
'use strict';
(() => {
 const baseRender=render;
 const attrs=a=>Array.isArray(a)&&a.length===6&&a.every(Number.isFinite)?a:null;
 const list=a=>Array.isArray(a)?a:[];
 const objects=a=>list(a).filter(x=>x&&typeof x==='object');
 const health=n=>Number.isFinite(n)?String(Math.round(n)):'미기록';
 const number=n=>Number.isFinite(n)?String(n):'미기록';
 const text=v=>escapeHtml(String(v??'미기록'));
 const row=(label,value)=>'<div class="decision-row"><span>'+text(label)+'</span><strong>'+text(value)+'</strong></div>';
 let context=null;
 function snapshot(){
  const d=state.development,u=state.ui13||{};
  return {version:1,role:state.role,position:state.position,attributes:[...state.attributes],baseline:attrs(u.baselines?.[state.year])?.slice()||null,baselineGame:Number.isInteger(u.baselineGames?.[state.year])?u.baselineGames[state.year]:null,focuses:[...new Set([d.focus,d.secondaryFocus].filter(x=>Number.isInteger(x)&&x>=0&&x<6))],condition:d.condition,fatigue:d.fatigue,growth:list(state.career14?.growth).filter(x=>x.year===state.year).map(x=>({...x})),moments:list(state.career14?.history).filter(x=>x.year===state.year).map(x=>({...x}))};
 }
 function entries(){return list(state?.career).map((record,index)=>({record,index})).sort((a,b)=>b.record.year-a.record.year||b.index-a.index);}
 function details(record){const d=record.review19;return d?.version===1&&['batter','pitcher'].includes(d.role)&&attrs(d.attributes)?d:null;}
 function club(record){return record.team||state.legacyV4?.seasons?.[record.year]?.club||'소속 미기록';}
 function shell(){
  if(!$('seasonArchive')){
   const section=document.createElement('section');section.id='seasonArchive';section.className='panel';section.innerHTML='<div class="section-title-row"><h2>시즌 보관함</h2><span id="archiveCount"></span></div><p class="screen-intro">완료한 프로 시즌의 기록을 다시 살펴보세요.</p><div id="archiveSeasonList"></div>';
   $('recordFilters').after(section);
   const table=document.createElement('details');table.id='archiveComparison';table.innerHTML='<summary>시즌 기록을 표로 비교하기</summary>';
   section.after(table);
  }
  if($('seasonArchiveDialog'))return;
  const dialog=document.createElement('dialog');dialog.id='seasonArchiveDialog';dialog.className='review-dialog archive-dialog';dialog.setAttribute('aria-labelledby','archiveTitle');
  dialog.innerHTML='<div class="dialog-top"><span class="page-eyebrow">CAREER ARCHIVE</span><button type="button" id="closeSeasonArchive">닫기</button></div><div class="archive-navigation"><button type="button" id="archiveOlder" class="secondary" aria-label="이전 시즌">←</button><select id="archiveJump" aria-label="조회할 시즌"></select><button type="button" id="archiveNewer" class="secondary" aria-label="다음 시즌">→</button></div><div id="archiveContent"></div><button type="button" id="returnFromArchive" class="main-action">돌아가기</button>';
  document.querySelector('main').append(dialog);
  $('closeSeasonArchive').onclick=close;$('returnFromArchive').onclick=close;dialog.oncancel=e=>{e.preventDefault();close();};
  $('archiveJump').onchange=e=>choose(Number(e.target.value));
  $('archiveOlder').onclick=()=>adjacent(1);$('archiveNewer').onclick=()=>adjacent(-1);
 }
 function close(){const c=context;context=null;if($('seasonArchiveDialog')?.open)$('seasonArchiveDialog').close();if(c?.opener?.isConnected)c.opener.focus();}
 function choose(index){
  if(!context||state!==context.owner||!Number.isInteger(index)||!state.career[index])return;
  context.index=index;context.record=state.career[index];paint();$('seasonArchiveDialog').scrollTop=0;
 }
 function adjacent(delta){const records=entries(),i=records.findIndex(x=>x.index===context?.index),next=records[i+delta];if(next)choose(next.index);}
 function open(index,opener){
  if(!state||!Number.isInteger(index)||!state.career[index])return;
  shell();context={owner:state,index,record:state.career[index],opener};paint();if(!$('seasonArchiveDialog').open)$('seasonArchiveDialog').showModal();
 }
 function paint(){
  const c=context;if(!c||state!==c.owner||state.career[c.index]!==c.record){close();return;}
  const record=c.record,year=record.year,d=details(record),role=d?.role||state.role,bat=role==='batter',s=record.stats||{};
  const required=bat?['AB','H','BB','PA','B2','B3','HR']:['IPouts','ER','PH','PBB'];
  const stats=required.every(k=>Number.isFinite(s[k]))?statline(s,role):null;
  const season=state.legacyV4?.seasons?.[year],before=attrs(d?.baseline)||attrs(state.ui13?.baselines?.[year]),old=before?Math.round(before.reduce((n,x)=>n+x,0)/6):null;
  const end=Number.isFinite(record.ovr)?record.ovr:season?.ovr,baselineGame=d?d.baselineGame:state.ui13?.baselineGames?.[year];
  const note=!before?'기준 능력치 미기록':baselineGame===0?'시즌 시작 대비 변화입니다.':Number.isInteger(baselineGame)?baselineGame+'팀 경기 시점부터 기록한 변화입니다.':'기록된 기준값 대비 변화입니다. 기준 기록 시점은 미확인입니다.';
  let html='<p class="section-kicker">'+text(year)+' · '+text(club(record))+'</p><h1 id="archiveTitle" class="review-title">'+text(year)+' 시즌 돌아보기</h1><p class="screen-intro">'+text(state.name)+' · '+(bat?'타자':'투수')+(d?.position?' · '+text(d.position):'')+(Number.isFinite(record.age)?' · '+record.age+'세':' · 나이 미기록')+(record.region?' · '+text(V5_NAMES[record.region]||record.region):'')+'</p><div class="review-score"><small>OVR</small>'+(old===null?'':old+' → ')+number(end)+'</div><p class="review-footnote">'+(before?note:'기준 능력치 미기록 · 보관된 시즌 종합 능력만 표시합니다.')+'</p><h2>프로 정규시즌</h2><div class="decision-rows">'+row('출장',number(s.G)+'경기');
  if(bat)html+=row('타율 · OPS',stats?(s.AB?stats.AVG:'—')+' · '+(s.PA?stats.OPS:'—'):'미기록')+row('홈런 · 타점',number(s.HR)+' · '+number(s.RBI))+row('안타 · 타석',number(s.H)+' · '+number(s.PA));
  else html+=row('선발 · 승리 · 세이브',number(s.GS)+' · '+number(s.W)+' · '+number(s.SV))+row('평균자책점 · 이닝',stats?(s.IPouts?stats.ERA:'투구 기록 없음')+' · '+stats.IP:'미기록')+row('탈삼진 · 볼넷',number(s.PK)+' · '+number(s.PBB));
  html+=row('시즌 연봉',Number.isFinite(record.salary)?record.salary.toLocaleString()+'만원':'미기록')+'</div><h2>성장과 몸 상태</h2>';
  if(d){
   html+='<div class="decision-rows">'+ATTR[role].map((label,i)=>row(label+(list(d.focuses).includes(i)?' · 결산 시 집중 과제':''),number(d.attributes[i])+(before?' ('+(d.attributes[i]-before[i]>0?'+':'')+(d.attributes[i]-before[i])+')':' (기준 미기록)'))).join('')+row('결산 컨디션 · 피로',health(d.condition)+' · '+health(d.fatigue))+'</div>';
   const gains=objects(d.growth);html+='<p class="decision-note">보관된 성장: 훈련 +'+gains.filter(x=>x.source==='훈련 성장').reduce((n,x)=>n+(Number(x.amount)||0),0)+' · 실전 경험 +'+gains.filter(x=>x.source==='실전 경험').reduce((n,x)=>n+(Number(x.amount)||0),0)+' (능력 합계)</p>';
  }else html+='<p class="decision-note">이 시즌의 세부 능력치·몸 상태는 보관되지 않았습니다. 현재 선수 값으로 대체하지 않습니다.</p>';
  html+='<h2>팀 결과와 수상</h2><div class="decision-rows">'+row('정규리그 순위',Number.isFinite(season?.leagueRank)?season.leagueRank+'위':'미기록')+row('포스트시즌 우승팀',season?.postseason?.champion||'미기록')+'</div><p>'+text(Array.isArray(season?.awards)?season.awards.join(' · ')||'개인 수상 없음':'수상 기록 미보관')+'</p>';
  const rounds=objects(season?.postseason?.rounds);if(rounds.length)html+='<details class="archive-extra"><summary>포스트시즌 결과 자세히</summary>'+rounds.map(r=>'<div class="history-choice">'+text(r.label)+' · '+list(r.teams).map(text).join(' vs ')+'<br>'+text(r.score)+' · 승리 '+text(r.winner)+'</div>').join('')+'</details>';
  const tournament=state.v6?.tournaments?.[year];if(tournament)html+='<h2>국제대회</h2><p>'+text(tournament.selected?'국가대표 선발 · '+tournament.medal:'국가대표 미선발')+'</p><p class="review-footnote">가상 대회 선발·메달 기록입니다. 프로 정규시즌 개인 성적과 구분합니다.</p>';
  const moments=objects(d?.moments),choice=objects(state.ui13?.choices).find(x=>x.year===year),contract=objects(state.contract15?.history).find(x=>x.year===year);
  html+='<h2>커리어의 순간</h2>'+(moments.length?moments.map(x=>'<div class="history-choice">'+number(x.game)+'경기 · '+text(x.title)+'<br><small>'+text(({practice:'훈련 재개',rest:'회복 우선',rehab:'재활 집중'})[x.choice]||x.choice)+'</small></div>').join(''):'<p class="decision-note">보관된 경기 중 선택 내역이 없습니다.</p>');
  if(choice)html+='<p class="decision-note">다음 시즌 육성: '+text(choice.title)+' · '+text(choice.effect)+'</p>';
  if(contract)html+='<p class="decision-note">다음 시즌 계약: '+text(contract.team)+' · 연봉 '+text(Number(contract.annualSalary).toLocaleString())+'만원 · '+number(contract.endYear)+'년 종료</p>';
  html+='<p class="review-footnote">완료한 프로 정규시즌 기록입니다. 열람은 경기·계약·육성 방향을 확정하지 않습니다.</p>';
  $('archiveContent').innerHTML=html;
  const records=entries(),position=records.findIndex(x=>x.index===c.index);$('archiveJump').innerHTML=records.map(x=>'<option value="'+x.index+'" '+(x.index===c.index?'selected':'')+'>'+text(x.record.year)+' · '+text(club(x.record))+'</option>').join('');$('archiveOlder').disabled=position===records.length-1;$('archiveNewer').disabled=position===0;
 }
 function layout(){
  if(!state||!$('recordFilters')){close();return;}
  shell();if(context&&(context.owner!==state||state.career[context.index]!==context.record))close();
  const visible=document.querySelector('#recordFilters .selected')?.dataset.recordMode==='seasons';$('seasonArchive').hidden=!visible;$('archiveComparison').hidden=!visible;
  const table=$('historyBody')?.closest('.panel');if(table&&table.parentNode!==$('archiveComparison'))$('archiveComparison').append(table);
  const records=entries();$('archiveCount').textContent=records.length+'시즌';
  $('archiveSeasonList').innerHTML=records.length?records.map(({record,index})=>{const bat=(details(record)?.role||state.role)==='batter',s=record.stats||{};return '<button type="button" class="archive-season-card" data-archive-index="'+index+'"><span class="archive-year">'+text(record.year)+'</span><span><strong>'+text(club(record))+'</strong><small>'+number(s.G)+'출장 · '+(bat?number(s.HR)+'홈런 · '+number(s.H)+'안타':number(s.PK)+'탈삼진 · '+number(s.W)+'승')+'</small></span><span class="archive-arrow">보기 →</span></button>';}).join(''):'<p class="screen-intro">완료한 프로 시즌이 없습니다. 대학 실전 기록은 아마·선택에서 확인할 수 있습니다.</p>';
 }
 document.addEventListener('click',e=>{const button=e.target.closest('[data-archive-index]');if(button)open(Number(button.dataset.archiveIndex),button);});
 window.DiamondArchive19=Object.freeze({snapshot,layout});
 render=function(){baseRender();layout();};
 window.addEventListener('diamond-slot-change',()=>{close();layout();});
})();
