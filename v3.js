// PROJECT DIAMOND v0.3 — progression, selection, injuries and contract events.
'use strict';
const v3BaseGameMatch=gameMatch, v3BaseRender=render, v3BaseNext=nextSeason;
const FOCI={batter:[['정확성','컨택 집중'],['장타력','근력 훈련'],['선구안','타석 분석'],['주루','스피드 훈련'],['수비','수비 훈련'],['송구','송구 훈련']],pitcher:[['구속','구속 훈련'],['제구','제구 훈련'],['구위','구위 훈련'],['변화구','변화구 훈련'],['체력','체력 강화'],['위기관리','멘탈 훈련']]};
function ensureV3(){if(!state)return; if(!state.development||typeof state.development!=='object'){state.development={focus:0,intensity:'normal',condition:85,fatigue:0,injury:0,injuries:0,level:'1군',trust:55,salary:3000,contractYears:1,offers:[],decisions:[],lastTraining:0};}let d=state.development;d.focus=clamp(Number(d.focus)||0,0,5);d.condition=clamp(Number.isFinite(d.condition)?d.condition:85,0,100);d.fatigue=clamp(Number(d.fatigue)||0,0,100);d.injury=Math.max(0,Math.floor(Number(d.injury)||0));d.trust=clamp(Number.isFinite(d.trust)?d.trust:55,0,100);if(!['1군','2군'].includes(d.level))d.level='1군';if(!['rest','normal','hard'].includes(d.intensity))d.intensity='normal';if(!Number.isFinite(d.salary))d.salary=3000; if(!Array.isArray(d.decisions))d.decisions=[]; if(!Array.isArray(d.offers))d.offers=[];}
function v3Event(txt){state.events.unshift(txt);state.events=state.events.slice(0,12)}
// One team round is the atomic unit. V1.4 manages participation and development.
function v3Play(n){
 if(!state||state.retired||state.game>=144||!Number.isFinite(n)||n<=0)return;
 ensureV3();ensureLeague();
 const manager=window.DiamondCareer14;if(!manager||manager.pending())return;
 const d=state.development,rounds=Math.min(Math.floor(n),144-state.game),schedule=scheduleLeague();
 for(let step=0;step<rounds;step++){
  const before={...state.current};manager.prepare();let last=null;
  try{
   for(const [h,a] of schedule[state.game]){
    const focused=TEAMS[h]===state.team||TEAMS[a]===state.team,match=gameMatch(h,a,focused);
    const home=state.league.standings[h],away=state.league.standings[a];
    home.R+=match.homeRuns;home.RA+=match.awayRuns;away.R+=match.awayRuns;away.RA+=match.homeRuns;
    if(match.homeRuns>match.awayRuns){home.W++;away.L++;}else if(match.homeRuns<match.awayRuns){away.W++;home.L++;}else{home.T++;away.T++;}
    if(focused)last=match;
   }
  }finally{state._unavailable=false;delete state._unavailableReason;delete state._performanceFactor;}
  state.game++;state.league.round=state.game;state.league.last=last;manager.complete(before);
  if(manager.pending()){manager.setRemaining(rounds-step-1);break;}
 }
 if(state.game===144){
  state.career.push({year:state.year,age:state.age,stats:{...state.current},ovr:overall(),salary:d.salary,level:d.level,team:state.team,region:state.globalCareer?.region||'KR',review19:window.DiamondArchive19?.snapshot()});
  let ratings=state.role==='batter'?(state.current.HR*3+state.current.H*.45):(state.current.PK*.6+state.current.W*3+state.current.SV);
  d.offers=[{team:state.team,amount:Math.round(clamp(2700+ratings*55+overall()*18,2800,250000)/100)*100},{team:TEAMS.filter(t=>t!==state.team)[integer(0,8)],amount:Math.round(clamp(3000+ratings*60+overall()*20,3000,250000)/100)*100}];
  v3Event(`${state.year} 시즌 종료! 계약 제안을 선택하고 다음 시즌을 시작하세요.`);
 }else v3Event(`${state.year} 시즌 ${state.game}/144경기 · 컨디션 ${Math.round(d.condition)} · ${d.level}`);
 save();render();
}
function v3GameMatch(h,a,track){if(!state||!track||!state._unavailable)return v3BaseGameMatch(h,a,track);const result=v3BaseGameMatch(h,a,false);result.logs=[`선수 결장 (${state._unavailableReason||(state.development.injury?'부상 재활':state.development.level==='2군'?'2군':'컨디션 저하')})`,...result.logs];return result;}
gameMatch=v3GameMatch;
function v3Advance(){if(!state||state.game!==144||state.retired)return;ensureV3();const d=state.development;if(d.offers.length){const choice=document.querySelector('input[name="contractPick"]:checked');if(!choice){alert('다음 시즌 계약할 팀을 선택해 주세요.');return;}const offer=d.offers[Number(choice.value)];if(!offer)return;state.team=offer.team;d.salary=offer.amount;d.decisions.push(`${state.year} 계약: ${offer.team} / 연봉 ${offer.amount.toLocaleString()}만원`);d.offers=[];}v3BaseNext();if(state&&!state.retired){ensureV3();d.condition=clamp(d.condition+35,0,100);d.fatigue=clamp(d.fatigue-45,0,100);d.injury=0;d.trust=clamp(d.trust+10,0,100);state.league=null;ensureLeague();v3Event(`${state.year} 시즌 시작 · ${state.team} · 연봉 ${d.salary.toLocaleString()}만원`);save();render();}}
nextSeason=v3Advance;
function v3Render(){v3BaseRender();if(!state)return;ensureV3();const d=state.development;let pane=$('developmentPane');if(!pane){pane=document.createElement('section');pane.id='developmentPane';pane.className='panel';const attributes=$('attributes');attributes.closest('.panel').after(pane);}const current=FOCI[state.role];const end=state.game===144;pane.innerHTML=`<h2>🏋️ 선수 육성 · V0.3</h2><div class="grid"><div class="stat"><strong>${d.level}</strong><small>소속 단계</small></div><div class="stat"><strong>${Math.round(d.condition)}</strong><small>컨디션</small></div><div class="stat"><strong>${Math.round(d.fatigue)}</strong><small>피로도</small></div><div class="stat"><strong>${d.trust}</strong><small>구단 신뢰</small></div></div><p class="muted">${d.injury?`🚑 부상 재활 ${d.injury}경기 남음`: '몸 상태 정상 · 실제 기용은 경쟁 평가로 결정'} · 연봉 ${d.salary.toLocaleString()}만원</p><label for="focusSelect">훈련 집중 분야</label><select id="focusSelect">${current.map((x,i)=>`<option value="${i}" ${d.focus===i?'selected':''}>${x[1]} (${x[0]})</option>`).join('')}</select><label for="intensitySelect" style="display:block;margin-top:12px">훈련 강도</label><select id="intensitySelect"><option value="rest" ${d.intensity==='rest'?'selected':''}>회복 우선 — 훈련 성장 없음</option><option value="normal" ${d.intensity==='normal'?'selected':''}>일반 — 12팀 경기 구간 중 훈련 6일 이상이면 +1</option><option value="hard" ${d.intensity==='hard'?'selected':''}>강훈련 — 12팀 경기 구간 중 강훈련 6일 이상이면 +2, 피로 증가</option></select><p class="muted" style="font-size:12px">기본 훈련 설정입니다. 시즌 화면에서 확정한 7경기 계획이 있으면 그 계획을 우선 적용합니다. 피로가 높으면 부상 위험이 커집니다.</p>${end&&d.offers.length&&!state.retired?`<h3>📄 시즌 종료 계약 제안</h3>${d.offers.map((o,i)=>`<label style="display:block;padding:8px"><input type="radio" name="contractPick" value="${i}" ${i===0?'checked':''} style="width:auto"> ${escapeHtml(o.team)} · ${o.amount.toLocaleString()}만원</label>`).join('')}`:''}`;
$('focusSelect').onchange=e=>{d.focus=Number(e.target.value);d.secondaryFocus=null;save()};$('intensitySelect').onchange=e=>{d.intensity=e.target.value;save()};if(end&&!state.retired){const next=$('nextBtn');next.textContent='계약 후 다음 시즌 →';}
const guide=$('game').querySelector('.stack:last-child .panel:last-child');if(guide&&guide.textContent.includes('첫 번째 알파 버전'))guide.innerHTML='<h2>게임 설명</h2><p class="muted">V0.3은 집중 훈련·컨디션·부상·1군/2군·시즌 계약 선택을 지원합니다. 기존 기록은 보존하며, 팀 경기 엔진은 알파 단계의 간소화 모델입니다.</p>';
}
render=v3Render;
