// PROJECT DIAMOND V1.1 — amateur performance and scouting reports.
'use strict';
(() => {
 const previousRender=render;
 const previousSetup=setup;
 function grade(score){return score>=90?'S':score>=78?'A':score>=65?'B':score>=50?'C':'D';}
 function simulate(data,athlete){
  const seed=[...athlete.name+data.school].reduce((n,ch)=>((n*33+ch.charCodeAt(0))>>>0),13);
  const r=(year,salt)=>((Math.imul(seed^(year*7919+salt*104729),1664525)+1013904223)>>>0)%100;
  const years=data.path==='college'?[2026,2027,2028]:[2025];
  let performance=0;
  const seasons=years.map((year,i)=>{
   const base=athlete.role==='batter'?{games:25+i*7,battingAverage:(.23+r(year,1)*.0012).toFixed(3),homeRuns:Math.floor(r(year,2)/9),rbi:10+Math.floor(r(year,3)/3)}:{games:15+i*5,era:(2.2+r(year,1)*.036).toFixed(2),strikeouts:21+Math.floor(r(year,2)*1.12),wins:2+Math.floor(r(year,3)/14)};
   const seasonScore=athlete.role==='batter'?Math.round(Number(base.battingAverage)*130+base.homeRuns*2+base.rbi*.4):Math.round(85-Number(base.era)*8+base.strikeouts*.24+base.wins);
   performance+=seasonScore;
   return {year,stage:data.path==='college'?'대학 '+(i+1)+'학년':'고교 3학년',...base,evaluation:grade(seasonScore)};
  });
  const score=Math.min(100,Math.max(20,Math.round(performance/years.length)));
  const round=Math.max(1,Math.min(10,Math.ceil((101-score)/12)));
  return {seasons,score,grade:grade(score),draftRound:round,scoutNotes:score>=78?'상위 라운드 지명 후보':score>=58?'성장 가능성을 갖춘 지명 후보':'육성 선수로 장기 성장 필요'};
 }
 function syncReport(){
  if(!state?.v10?.amateur)return;
  const data=state.v10.amateur;
  if(data.v11)return;
  const scouting=simulate(data,state);
  data.v11=scouting;
  data.draftRound=scouting.draftRound;
  const draft=data.history?.find(x=>x.stage==='draft');
  if(draft)draft.label=state.team+' 신인 드래프트 '+scouting.draftRound+'라운드 지명';
  state.events.unshift('스카우트 평가 '+scouting.grade+' · '+scouting.draftRound+'라운드 지명');
  state.events=state.events.slice(0,12);
  save();
 }
 function view(){
  let panel=document.getElementById('diamondScouting');
  if(!state?.v10?.amateur){panel?.remove();return;}
  const d=state.v10.amateur;
  if(!d.v11)syncReport();
  if(!panel){panel=document.createElement('section');panel.id='diamondScouting';panel.className='panel';document.getElementById('game').append(panel);}
  panel.dataset.diamondTab='career';
  const s=d.v11;
  const e=state.role==='batter';
  panel.innerHTML='<h2>📋 아마추어 성적·스카우팅</h2><p class="notice">평가 '+s.grade+' · '+s.score+'/100 · 신인 드래프트 '+s.draftRound+'라운드</p><p class="muted">'+escapeHtml(s.scoutNotes)+'</p><div class="tablewrap"><table><thead><tr><th>시즌</th><th>구분</th><th>경기</th>'+(e?'<th>타율</th><th>홈런</th><th>타점</th>':'<th>평균자책</th><th>탈삼진</th><th>승</th>')+'<th>평가</th></tr></thead><tbody>'+s.seasons.map(x=>'<tr><td>'+x.year+'</td><td>'+escapeHtml(x.stage)+'</td><td>'+x.games+'</td>'+(e?'<td>'+x.battingAverage+'</td><td>'+x.homeRuns+'</td><td>'+x.rbi+'</td>':'<td>'+x.era+'</td><td>'+x.strikeouts+'</td><td>'+x.wins+'</td>')+'<td>'+x.evaluation+'</td></tr>').join('')+'</tbody></table></div>';
  panel.classList.toggle('diamond-offscreen',(document.querySelector('#diamondNav .is-active')?.dataset.tab||'dashboard')!=='career');
 }
 render=function(){previousRender();view();};
 setup=function(){previousSetup();};
})();
