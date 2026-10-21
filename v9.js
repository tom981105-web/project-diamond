// PROJECT DIAMOND V0.9 - season review and real career direction decisions
'use strict';
(() => {
 const OPTIONS={
  batter:[
   {id:'starter',title:'주전 경쟁',desc:'감독 신뢰를 얻는 대신 체력 부담을 감수합니다.'},
   {id:'refine',title:'약점 보완',desc:'훈련에 집중해 선구안과 정확성을 다듬습니다.'},
   {id:'recover',title:'몸 관리',desc:'회복과 컨디션을 우선해 부상 위험을 낮춥니다.'}
  ],
  pitcher:[
   {id:'starter',title:'선발 로테이션 도전',desc:'감독 신뢰를 높이고 출전 기회를 요구합니다.'},
   {id:'refine',title:'구종·제구 보완',desc:'훈련을 통해 제구와 변화구를 개선합니다.'},
   {id:'recover',title:'투구 부담 관리',desc:'체력을 회복하고 피로를 줄입니다.'}
  ]
 };
 let draft='starter';
 const previousRender=render, previousNext=nextSeason;
 function ensure(){
  if(!state)return null;
  if(!state.v9||typeof state.v9!=='object')state.v9={choices:[],seasonReviews:{}};
  const data=state.v9;
  if(!Array.isArray(data.choices))data.choices=[];
  if(!data.seasonReviews||typeof data.seasonReviews!=='object')data.seasonReviews={};
  return data;
 }
 function seasonStats(){
  if(!state)return null;
  const s=state.current;
  return state.role==='batter'
   ? {G:s.G,AVG:s.AB?(s.H/s.AB).toFixed(3):'.000',HR:s.HR,RBI:s.RBI,H:s.H,BB:s.BB,SO:s.SO}
   : {G:s.G,ERA:s.IPouts?(s.ER*27/s.IPouts).toFixed(2):'0.00',K:s.PK,W:s.W,SV:s.SV,IP:Math.floor(s.IPouts/3)+'.'+s.IPouts%3};
 }
 function impact(id){
  const d=state.development;
  if(!d)return;
  if(id==='starter'){
   d.trust=Math.min(100,(Number(d.trust)||50)+7);
   d.fatigue=Math.min(100,(Number(d.fatigue)||0)+6);
  }else if(id==='refine'){
   d.focus=state.role==='batter'?0:1;
   d.trust=Math.max(0,(Number(d.trust)||50)-2);
   state.attributes[d.focus]=Math.min(100,state.attributes[d.focus]+1);
  }else{
   d.fatigue=Math.max(0,(Number(d.fatigue)||0)-22);
   d.condition=Math.min(100,(Number(d.condition)||70)+12);
  }
 }
 function resultHTML(s){
  const stats=seasonStats()||{};
  return Object.entries(stats).map(([k,v])=>'<div class="diamond-v9-stat"><small>'+escapeHtml(k)+'</small><b>'+escapeHtml(String(v))+'</b></div>').join('');
 }
 function renderPanel(){
  let panel=document.getElementById('diamondV9');
  if(!state){panel?.remove();return;}
  const data=ensure(),done=state.game===144,choices=OPTIONS[state.role];
  if(!panel){panel=document.createElement('section');panel.id='diamondV9';panel.className='panel';const point=document.getElementById('v6Pane')||document.getElementById('game');point.after(panel);}
  panel.dataset.diamondTab='career';
  const achievements=data.choices.slice(-8).reverse().map(e=>'<div class="event">'+escapeHtml(e.year+' · '+e.title)+'</div>').join('');
  panel.innerHTML='<h2>⚾ 시즌 리포트 & 진로 선택</h2>'+
   '<div class="diamond-v9-grid">'+resultHTML()+'</div>'+
   (done&&!state.retired?'<p class="notice">시즌 종료! 다음 시즌의 성장 방향을 결정하세요. 기존 계약 선택은 선수 육성·계약 메뉴에서 그대로 진행합니다.</p>'+
   '<div class="diamond-v9-options">'+choices.map(o=>'<button type="button" data-v9="'+o.id+'" class="diamond-v9-choice '+(draft===o.id?'selected':'')+'"><b>'+o.title+'</b><small>'+o.desc+'</small></button>').join('')+'</div>':
   '<p class="muted">정규 시즌 종료 후 다음 시즌의 진로 방향을 선택할 수 있습니다.</p>')+
   '<h3>나의 진로 기록</h3>'+(achievements?'<div class="events">'+achievements+'</div>':'<p class="muted">아직 진로 결정 기록이 없습니다.</p>');
  panel.querySelectorAll('[data-v9]').forEach(button=>button.onclick=()=>{
   draft=button.dataset.v9;
   panel.querySelectorAll('[data-v9]').forEach(x=>x.classList.toggle('selected',x.dataset.v9===draft));
  });
  const active=document.querySelector('#diamondNav .diamond-tab.is-active')?.dataset.tab||'dashboard';
  panel.classList.toggle('diamond-offscreen',active!=='career');
 }
 render=function(){previousRender();renderPanel();};
 nextSeason=function(){
  if(!state||state.game!==144||state.retired)return previousNext();
  const previousYear=state.year,previousCareer=state.career.length;
  const entry=OPTIONS[state.role].find(o=>o.id===draft)||OPTIONS[state.role][0];
  const data=ensure();
  previousNext();
  // Apply only when the original contract/season transition succeeded.
  if(state && state.year>previousYear && state.career.length>=previousCareer){
   impact(entry.id);
   if(!data.choices.some(e=>e.year===previousYear)){
    data.choices.push({year:previousYear,id:entry.id,title:entry.title});
   }
   save();render();
  }
 };
 const style=document.createElement('style');
 style.textContent=`
  .diamond-v9-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:9px;margin:12px 0 18px}
  .diamond-v9-stat{background:#1c3045;border-radius:10px;padding:11px;display:grid;gap:4px}
  .diamond-v9-stat small{color:#9eb6c8;font-size:11px}.diamond-v9-stat b{font-size:20px}
  .diamond-v9-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0 20px}
  .diamond-v9-choice{display:grid;gap:8px;text-align:left;align-content:start;min-height:105px;background:#192e43;color:#eaf5ff;border:1px solid #34506a;font-weight:400}
  .diamond-v9-choice small{color:#bfd0dd;line-height:1.45}.diamond-v9-choice.selected{border:2px solid #79dab0;background:#1e4247}
  @media(max-width:680px){.diamond-v9-options{grid-template-columns:1fr}.diamond-v9-choice{min-height:0}}
 `;
 document.head.append(style);
})();
