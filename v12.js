// PROJECT DIAMOND V1.2 — playable college games and pro club selection.
'use strict';
(() => {
 const baseSetup=setup,baseRender=render,basePlay=play;
 const COLLEGE_GAMES=12;
 function enabled(){return !!(state?.v12?.college && !state.v12.college.completed);}
 function setupCollege(){
  if(!state?.v10?.amateur || state.v10.amateur.path!=='college' || state.v12)return;
  // Only new careers enter here. Previously played pro saves are never rewound.
  state.v12={college:{completed:false,yearIndex:0,game:0,results:[],offers:[],selection:0}};
  state.year=2026;state.age=18;state.game=0;state.league=null;
  state.events.unshift('대학 야구에 입학했습니다. 3시즌 동안 직접 경기를 진행하세요.');
  save();render();
 }
 function rand(seed){let n=0;for(const c of seed)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return (n%10000)/10000;}
 function playCollege(n){
  if(!Number.isFinite(n)||n<=0)return;
  n=Math.floor(n);
  const c=state.v12.college;
  if(c.yearIndex>=3)return;
  for(let k=0;k<n && c.yearIndex<3;k++){
   if(c.game===COLLEGE_GAMES){c.yearIndex++;c.game=0;if(c.yearIndex>=3)break;}
   const yr=2026+c.yearIndex;
   const d=rand(state.name+yr+'-'+c.game+'-'+state.position);
   const a=state.attributes;
   const skill=(a[0]+a[1]+a[2])/3;
   const good=d<(0.35+skill/400);
   const line=state.role==='batter'
     ?{AB:4,H:good?1+Math.floor(d*2):0,HR:good&&d<.13?1:0,RBI:good?1:0}
     :{IPouts:good?18:12,ER:good?1:4,PK:good?7:3,W:good?1:0};
   c.results.push({year:yr,game:c.game+1,...line});
   c.game++;
   state.year=yr;state.age=18+c.yearIndex;
   if(c.game%4===0){
    const d=state.development;
    const idx=d?((Number.isInteger(d.secondaryFocus)&&d.secondaryFocus>=0&&d.secondaryFocus<6&&c.results.length%8===0)?d.secondaryFocus:d.focus):(c.yearIndex+c.game/4)%6;
    state.attributes[idx]=Math.min(state.potential,state.attributes[idx]+1);
   }
  }
  if(c.results.length===36){
   c.yearIndex=3;c.offers=makeOffers();
   state.events.unshift('대학 커리어 종료! 프로 입단 구단을 선택하세요.');
  }
  save();render();
 }
 function rating(){
  const c=state.v12.college,rows=c.results;
  if(!rows.length)return 50;
  if(state.role==='batter'){
   const ab=rows.reduce((v,r)=>v+r.AB,0),hits=rows.reduce((v,r)=>v+r.H,0),hr=rows.reduce((v,r)=>v+r.HR,0);
   return Math.min(99,Math.max(20,Math.round(35+(hits/Math.max(1,ab))*110+hr*2)));
  }
  const outs=rows.reduce((v,r)=>v+r.IPouts,0),er=rows.reduce((v,r)=>v+r.ER,0);
  return Math.min(99,Math.max(20,Math.round(95-er*27/Math.max(1,outs)*8)));
 }
 function makeOffers(){
  const score=rating(),round=Math.min(10,Math.max(1,Math.ceil((101-score)/12)));
  const clubs=(typeof V5_CLUBS!=='undefined'?V5_CLUBS.KR:TEAMS);
  const start=Math.floor(rand(state.name+score)*clubs.length);
  return Array.from({length:3},(_,i)=>({team:clubs[(start+i*3)%clubs.length],round:Math.min(10,round+i),salary:Math.round((2600+score*110-i*350)/100)*100}));
 }
 function sign(i){
  const c=state?.v12?.college;if(!c||!c.offers.length||c.completed)return;
  const offer=c.offers[i];if(!offer)return;
  c.selection=i;c.completed=true;
  state.year=2029;state.age=21;state.game=0;state.team=offer.team;
  state.league=null;state.current=empty();
  if(state.globalCareer){state.globalCareer.region='KR';state.globalCareer.debutYear=2029;}
  if(state.development){state.development.salary=offer.salary;state.development.offers=[];}
  const amateur=state.v10.amateur;
  amateur.history=amateur.history.filter(x=>x.stage!=='college');
  for(let year=2026;year<=2028;year++)amateur.history.push({stage:'college',year,label:'대학 야구 '+(year-2025)+'학년',achievement:'실전 12경기 완료'});
  if(!amateur.history.some(x=>x.stage==='draft'))amateur.history.push({stage:'draft',year:2029,achievement:'대졸 신인'});
  amateur.draftRound=offer.round;
  const record=amateur.history.find(x=>x.stage==='draft');
  if(record){record.label=offer.team+' 신인 드래프트 '+offer.round+'라운드 지명';record.year=2029;}
  // Recompute scouting from matches actually played, not the auto-generated v1.1 report.
  amateur.v11={source:'played',score:rating(),grade:rating()>=90?'S':rating()>=78?'A':rating()>=65?'B':rating()>=50?'C':'D',draftRound:offer.round,scoutNotes:'대학 경기 실제 진행 결과',seasons:[2026,2027,2028].map(year=>{
   const rows=c.results.filter(r=>r.year===year);
   if(state.role==='batter'){
    const AB=rows.reduce((a,x)=>a+x.AB,0),H=rows.reduce((a,x)=>a+x.H,0);
    return {year,stage:'대학 '+(year-2025)+'학년',games:rows.length,battingAverage:(H/Math.max(1,AB)).toFixed(3),homeRuns:rows.reduce((a,x)=>a+x.HR,0),rbi:rows.reduce((a,x)=>a+x.RBI,0),evaluation:'실전'};
   }
   const outs=rows.reduce((a,x)=>a+x.IPouts,0),er=rows.reduce((a,x)=>a+x.ER,0);
   return {year,stage:'대학 '+(year-2025)+'학년',games:rows.length,era:(er*27/Math.max(1,outs)).toFixed(2),strikeouts:rows.reduce((a,x)=>a+x.PK,0),wins:rows.reduce((a,x)=>a+x.W,0),evaluation:'실전'};
  })};
  if(typeof v5Teams==='function')v5Teams('KR');
  if(typeof ensureLeague==='function')ensureLeague();
  state.events.unshift(offer.team+' 입단 계약! '+offer.round+'라운드 · 계약 연봉 '+offer.salary.toLocaleString()+'만원');
  save();render();
 }
 function panel(){
  document.getElementById('diamondCollege')?.remove();
  if(!enabled())return;
  const c=state.v12.college,done=c.yearIndex>=3;
  const root=document.createElement('section');root.id='diamondCollege';root.className='panel';
  let html='<h2>🎓 대학 야구 커리어</h2><p class="notice">'+(done?'대학 3시즌 완료 · 구단 계약 선택':(2026+c.yearIndex)+'년 '+(c.game)+' / '+COLLEGE_GAMES+'경기')+'</p>';
  html+='<p class="muted">'+escapeHtml(state.name)+' · '+state.age+'세 · 종합 '+overall()+'</p><div class="row"><button type="button" id="collegeBackup" class="secondary small">대학 기록 백업 ↓</button><button type="button" id="collegeImport" class="secondary small">기록 가져오기 ↑</button></div>';
  if(!done)html+='<div class="row"><button type="button" id="collegeOne">1경기 진행</button><button type="button" class="secondary" id="collegeFour">4경기 진행</button><button type="button" class="secondary" id="collegeYear">이번 대학 시즌 끝까지</button></div>';
  else html+='<h3>드래프트 구단 제안</h3><div class="diamond-college-offers">'+c.offers.map((x,i)=>'<button type="button" class="secondary" data-offer="'+i+'">'+escapeHtml(x.team)+' · '+x.round+'라운드 · '+x.salary.toLocaleString()+'만원</button>').join('')+'</div>';
  html+='<p class="muted">스카우트 점수 '+rating()+' / 100 · 누적 출전 '+c.results.length+'경기</p><p class="muted">대학 3시즌을 마친 뒤 구단을 선택하면 2029년 프로 시즌이 시작됩니다. 대학 경기 결과는 프로 통계에 포함되지 않습니다.</p>';
  root.innerHTML=html;
  const game=document.getElementById('game');game.prepend(root);
  document.getElementById('diamondSlots')?.before(root);
  const nav=document.getElementById('diamondNav');if(nav)nav.classList.add('hidden');
  game.querySelector('.layout')?.classList.add('hidden');
  for(const p of ['leaguePane','v4Pane','v5Pane','v6Pane','developmentPane','diamondV9','diamondAmateurHistory','diamondScouting'])document.getElementById(p)?.classList.add('hidden');
  document.getElementById('collegeBackup').onclick=()=>exportSave();
  document.getElementById('collegeImport').onclick=()=>document.getElementById('importFile').click();
  const b=document.getElementById('collegeOne');if(b)b.onclick=()=>playCollege(1);
  const f=document.getElementById('collegeFour');if(f)f.onclick=()=>playCollege(4);
  const y=document.getElementById('collegeYear');if(y)y.onclick=()=>playCollege(c.game===COLLEGE_GAMES?COLLEGE_GAMES:COLLEGE_GAMES-c.game);
  root.querySelectorAll('[data-offer]').forEach(el=>el.onclick=()=>sign(Number(el.dataset.offer)));
 }
 function cleanup(){
  document.getElementById('diamondNav')?.classList.remove('hidden');
  document.querySelector('#game .layout')?.classList.remove('hidden');
  for(const p of ['leaguePane','v4Pane','v5Pane','v6Pane','developmentPane','diamondV9','diamondAmateurHistory','diamondScouting'])document.getElementById(p)?.classList.remove('hidden');
 }
 render=function(){baseRender();cleanup();panel();};
 play=function(n){if(enabled())return playCollege(n);return basePlay(n);};
 setup=function(){
  baseSetup();
  document.getElementById('createForm')?.addEventListener('submit',()=>{if(state?.v10?.amateur?.path==='college'&&!state.v12)setupCollege();});
 };
})();
