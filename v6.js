// PROJECT DIAMOND V0.6 — International career, rivals, records and achievements.
'use strict';
const v6PrevRender=render, v6PrevPlay=play, v6PrevNext=nextSeason;
function v6Init(){
 if(!state)return;
 if(!state.v6||typeof state.v6!=='object')state.v6={nationality:'KR',tournaments:{},rivals:[],achievements:[]};
 const x=state.v6;
 if(!['KR','JP','US'].includes(x.nationality))x.nationality='KR';
 if(!x.tournaments||typeof x.tournaments!=='object')x.tournaments={};
 if(!Array.isArray(x.achievements))x.achievements=[];
 if(!Array.isArray(x.rivals))x.rivals=[];
 if(!x.rivals.length){
  const first=['강태성','유현준','서민재','오지훈','최도윤','박시우'];
  let seed=Array.from(state.name).reduce((a,c)=>a+c.charCodeAt(0),state.year);
  x.rivals=[{name:first[seed%first.length],role:state.role,base:64+(seed%11),wins:0},{name:first[(seed+3)%first.length],role:state.role,base:68+(seed%9),wins:0}];
 }
}
function v6HallStats(){
 const result={G:0,H:0,HR:0,RBI:0,PA:0,AB:0,BB:0,SO:0,W:0,SV:0,PK:0,ER:0,IPouts:0};
 for(const entry of state.career){for(const k of Object.keys(result))result[k]+=Number(entry.stats?.[k]||0)}
 return result;
}
function v6Achievements(){
 const x=state.v6, total=v6HallStats(),count=state.career.length;
 const candidates=[['first','첫 번째 시즌 완주',count>=1],['veteran','베테랑',count>=10],['hits500','통산 500안타',state.role==='batter'&&total.H>=500],['hits2000','통산 2,000안타',state.role==='batter'&&total.H>=2000],['hr100','통산 100홈런',state.role==='batter'&&total.HR>=100],['k500','통산 500탈삼진',state.role==='pitcher'&&total.PK>=500],['wins100','통산 100승',state.role==='pitcher'&&total.W>=100],['international','국제대회 출전',Object.values(x.tournaments).some(t=>t.selected)],['medal','국제대회 메달',Object.values(x.tournaments).some(t=>t.medal!=='없음'&&t.selected)],['globetrotter','해외 리그 진출',(state.globalCareer?.moves||[]).length>0],['champion','우승 경험',(state.legacyV4?.honors||[]).some(h=>h.title==='팀 우승')]];
 for(const [id,title,earned] of candidates)if(earned&&!x.achievements.some(a=>a.id===id))x.achievements.push({id,title,year:state.year});
}
function v6Finish(){
 if(!state||state.game!==144)return;
 v6Init();const x=state.v6,year=state.year;
 // Fictional quadrennial championship: 2027, 2031, 2035... One immutable entry per season.
 if((year-2027)%4===0&&!x.tournaments[year]){
  const rating=overall();const stats=statline(state.current,state.role);
  const performance=state.role==='batter'? Number(stats.OPS||0)*38+Number(stats.HR||0)*.6 : Math.max(0,7-Number(stats.ERA||7))*7+Number(stats.K||0)*.07;
  const strength=rating*.72+performance*.28;
  const selected=strength>=60&&state.game===144&&state.age<=39;
  const roll=Math.random();let medal='없음';
  if(selected){const p=Math.max(.08,Math.min(.66,(strength-50)/110));medal=roll<p*.2?'금메달':roll<p*.5?'은메달':roll<p?'동메달':'없음';}
  x.tournaments[year]={year,selected,medal,team:x.nationality,overall:rating};
  state.events.unshift(selected?`${year} 국제 야구 챔피언십 국가대표 발탁! ${medal==='없음'?'대회 참가':medal+' 획득'}`:`${year} 국제대회 대표팀 선발에서 제외됐습니다.`);
 }
 // Rival performance is annual, never regenerated when re-rendered.
 if(!x.rivalYears)x.rivalYears={};
 if(!x.rivalYears[year]){
  const o=overall(),yearResults=x.rivals.map((r,i)=>{const score=Math.max(30,Math.min(99,r.base+(state.age-24)*.35+(Math.random()-.5)*24)); const win=o>=score;r.wins+=win?1:0;return {name:r.name,score:Math.round(score),playerWon:win};});
  x.rivalYears[year]=yearResults;
 }
 v6Achievements();state.events=state.events.slice(0,12);save();
}
function v6Render(){
 v6PrevRender();if(!state)return;
 v6Init();if(state.game===144){v6Finish();}
 const x=state.v6,stats=v6HallStats(),years=Object.values(x.tournaments).sort((a,b)=>b.year-a.year);
 let panel=$('v6Pane');if(!panel){panel=document.createElement('section');panel.id='v6Pane';panel.className='panel';($('v5Pane')||$('game')).after(panel);}
 const teamNames={KR:'대한민국',JP:'일본',US:'미국'};
 const nationalSelect=`<select id="v6Country" aria-label="국가대표 국적" ${state.career.length||state.game?'disabled':''}>${Object.keys(teamNames).map(k=>`<option value="${k}" ${x.nationality===k?'selected':''}>${teamNames[k]}</option>`).join('')}</select>`;
 const rivals=x.rivals.map(r=>{const result=Object.values(x.rivalYears||{}).flat().filter(z=>z.name===r.name);const last=result.at(-1);return `<div class="event"><strong>${escapeHtml(r.name)}</strong> · 라이벌 평가 ${r.base} · 커리어 우위 ${r.wins}/${result.length} 시즌${last?` · 최근 ${last.playerWon?'내 선수 우세':'라이벌 우세'}`:''}</div>`}).join('');
 panel.innerHTML=`<h2>🌐 V0.6 · 국가대표와 라이벌</h2><p class="muted">국가대표 국적: ${nationalSelect} · 국제 챔피언십은 2027년부터 4년마다 열리는 가상 대회입니다. 국적은 첫 경기 전까지만 변경할 수 있습니다.</p><h3>국제대회 기록</h3>${years.length?`<div class="events">${years.map(t=>`<div class="event">${t.year} · ${teamNames[t.team]||'대표팀'} · ${t.selected?'선발':'미선발'} · ${t.medal}</div>`).join('')}</div>`:'<p class="muted">국제대회 개최 연도를 기다리고 있습니다.</p>'}<h3>라이벌 경쟁</h3><div class="events">${rivals}</div><h3>통산 기록</h3><div class="grid">${(state.role==='batter'?[['시즌',state.career.length],['안타',stats.H],['홈런',stats.HR],['타점',stats.RBI]]:[['시즌',state.career.length],['승리',stats.W],['탈삼진',stats.PK],['세이브',stats.SV]]).map(([k,v])=>`<div class="stat"><small>${k}</small><strong>${Number(v).toLocaleString()}</strong></div>`).join('')}</div><h3>커리어 업적 (${x.achievements.length}개)</h3>${x.achievements.length?`<div class="events">${x.achievements.slice().reverse().map(a=>`<div class="event">🏅 ${a.year} · ${escapeHtml(a.title)}</div>`).join('')}</div>`:'<p class="muted">시즌을 진행하여 업적을 획득하세요.</p>'}`;
 $('v6Country').onchange=e=>{if(state.career.length||state.game)return;x.nationality=e.target.value;save();v6Render();};
}
function v6Play(n){v6PrevPlay(n);if(state?.game===144)v6Finish();v6Render();}
function v6Next(){v6PrevNext();if(state){v6Init();v6Achievements();save();v6Render();}}
render=v6Render;play=v6Play;nextSeason=v6Next;
