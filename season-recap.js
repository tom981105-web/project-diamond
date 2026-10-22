// V3.0: completed-season summaries from recorded facts; no save or simulation calls.
'use strict';
(() => {
 const text=v=>escapeHtml(String(v??'')),list=v=>Array.isArray(v)?v:[],finite=Number.isFinite;
 const attrs=a=>Array.isArray(a)&&a.length===6&&a.every(finite)?a:null;
 const value=v=>finite(v)?String(v):'미기록';
 function facts(record,live){
  const d=live?{role:state.role,attributes:state.attributes,focuses:[state.development.focus,state.development.secondaryFocus],baseline:state.ui13?.baselines?.[record.year]}:record.review19?.version===1?record.review19:null;
  const role=['batter','pitcher'].includes(d?.role)?d.role:live?state.role:null;
  const before=attrs(d?.baseline)||attrs(state.ui13?.baselines?.[record.year]),after=attrs(d?.attributes);
  const season=state.legacyV4?.seasons?.[record.year],club=record.team||season?.club;
  return {d,role,before,after,season,club};
 }
 function summary(record,live){
  const {d,role,before,after,club}=facts(record,live),s=record.stats||{},bat=role==='batter';
  const rate=role?statline(s,role):null;
  const metrics=!role?[['출장',finite(s.G)?s.G+'경기':'미기록'],['역할','미기록'],['세부 성적','아래 기록 확인']]:bat?[['출장',value(s.G)+'경기'],['안타',value(s.H)],['홈런',value(s.HR)]]:[['등판',value(s.G)+'경기'],['이닝',finite(s.IPouts)?rate.IP:'미기록'],['탈삼진',value(s.PK)]];
  const end=live?overall():record.ovr,old=before?Math.round(before.reduce((a,b)=>a+b,0)/6):null;
  const gain=old!==null&&finite(end)?end-old:null;
  const focus=[...new Set(list(d?.focuses).filter(i=>Number.isInteger(i)&&i>=0&&i<6))];
  return '<section class="recap30" aria-label="시즌 핵심 요약"><div class="recap-club30">'+(club?window.DiamondPresentation.badge(club):'')+'<span>'+text(club||'소속 미기록')+'</span><small>프로 정규시즌</small></div><div class="recap-overall30"><small>종합 능력</small><strong>'+(old===null?'':old+' <span aria-label="에서">→</span> ')+value(end)+'</strong>'+(gain!==null?'<b class="'+(gain<0?'down':'up')+'">'+(gain>0?'+':'')+gain+'</b>':'')+'</div><div class="recap-metrics30">'+metrics.map(([label,v])=>'<div><small>'+label+'</small><strong>'+text(v)+'</strong></div>').join('')+'</div>'+(role?'<p class="recap-rate30">'+(bat?'타율 '+(s.AB>0?rate.AVG:'—')+' · '+value(s.RBI)+'타점':'평균자책점 '+(s.IPouts>0?rate.ERA:'—')+' · '+value(s.W)+'승 · '+value(s.SV)+'세이브')+'</p>':'')+(role&&focus.length?'<div class="recap-focus30" aria-label="결산 집중 과제">'+focus.map(i=>'<div><span>'+text(ATTR[role][i])+'</span><strong>'+(before&&after?before[i]+' → '+after[i]:after?value(after[i])+' · 기준 미기록':'세부 능력 미보관')+'</strong></div>').join('')+'</div>':'')+'</section>';
 }
 function team(record,live){
  const {season,club}=facts(record,live),post=season?.postseason;
  const rounds=list(post?.rounds).filter(r=>r&&list(r.teams).includes(club)),known=list(post?.top5).length>0;
  const champion=post?.champion,won=!!club&&champion===club;
  return '<section class="recap-team30" aria-label="소속팀 시즌 결과"><div class="recap-team-heading30">'+(club?window.DiamondPresentation.badge(club):'')+'<div><h3>'+text(club||'소속 미기록')+'</h3><p>정규리그 '+(finite(season?.leagueRank)?season.leagueRank+'위':'순위 미기록')+'</p></div>'+(won?'<strong class="recap-champion30">우승</strong>':'')+'</div><h4>소속팀의 포스트시즌</h4>'+(rounds.length?'<ol class="recap-rounds30">'+rounds.map(r=>'<li><span class="recap-round-dot30" aria-hidden="true"></span><div><strong>'+text(r.label)+'</strong><small>'+list(r.teams).map(text).join(' · ')+'</small></div><span><b>'+text(r.score)+'</b><small>'+(!r.winner?'결과 미기록':r.winner===club?'시리즈 승리':'시리즈 패배')+'</small></span></li>').join('')+'</ol>':'<p class="recap-empty30">'+(known&&club&&!post.top5.includes(club)?'정규리그 순위로 포스트시즌에 진출하지 못했습니다.':'소속팀의 시리즈 기록이 보관되어 있지 않습니다.')+'</p>')+'<p class="recap-winner30">최종 우승 <strong>'+text(champion||'미기록')+'</strong></p></section>';
 }
 function decorate(record,root,live){
  if(!record||!root||root.querySelector('.recap30'))return;
  root.classList.add('has-recap30');
  const score=root.querySelector('.review-score');if(score)score.insertAdjacentHTML('afterend',summary(record,live));
  const headings=[...root.querySelectorAll('h2')],heading=headings.find(h=>['팀의 한 시즌','팀 결과와 수상'].includes(h.textContent));
  if(heading){heading.insertAdjacentHTML('afterend',team(record,live));const rows=heading.nextElementSibling?.nextElementSibling;if(rows?.matches('.report-rows,.decision-rows'))rows.hidden=true;}
 }
 function live(root){
  if(!state||state.game!==144)return;
  decorate({year:state.year,team:state.team,stats:state.current,ovr:overall()},root,true);
  $('confirmReview').textContent=state.age>=40?'결산 확인 · 은퇴 준비':'결산 확인 · 다음 진로';
 }
 function archive(record,root){
  decorate(record,root,false);if(root.querySelector('.recap-tabs30'))return;
  const first=[...root.children].find(n=>n.tagName==='H2');if(!first)return;
  const tabs=document.createElement('div');tabs.className='chapter-tabs24 recap-tabs30';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','지난 시즌 결산 항목');
  const panels=['성적과 팀','실제 성장','이야기와 반응'].map((title,i)=>{const p=document.createElement('section');p.id='archivePanel30-'+i;p.className='recap-panel30';p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','archiveTab30-'+i);p.hidden=i!==0;const b=document.createElement('button');b.type='button';b.id='archiveTab30-'+i;b.textContent=title;b.setAttribute('role','tab');b.setAttribute('aria-controls',p.id);tabs.append(b);return p;});
  let current=0;const nodes=[...root.children];for(const node of nodes.slice(nodes.indexOf(first))){if(node.tagName==='H2')current=node.textContent==='성장과 몸 상태'?1:node.textContent==='커리어의 순간'?2:0;if(node.classList.contains('experience-report')||node.classList.contains('replay-archive'))current=2;panels[current].append(node);}
  root.append(tabs,...panels);
  function select(i,focus=false){[...tabs.children].forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});if(focus)tabs.children[i].focus();}
  [...tabs.children].forEach((b,i)=>{b.onclick=()=>select(i);b.onkeydown=e=>{const next=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(next!==null){e.preventDefault();select(next,true);}};});select(0);
 }
 window.DiamondRecap30=Object.freeze({live,archive});
})();
