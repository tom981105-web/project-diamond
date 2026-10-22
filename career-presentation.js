// V2.3: present recorded relationships and contract choices without changing career data.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??'')),school=()=>!!(state?.v12?.college&&!state.v12.college.completed);
 const hash=value=>Array.from(String(value)).reduce((n,c)=>(Math.imul(n,31)+c.codePointAt(0))>>>0,17);
 function speaker(key,team){
  const coach=['return','slump','competition','coach-path','coach-review'].includes(key),junior=key==='mentor'||key==='mentor-followup';
  const role=coach?'담당 코치':junior?'후배 선수':key==='press'?'스포츠 기자':'동료 선수';
  const names=coach?['차도현','윤정우','박건호','송재민','권태준','이정환']:junior?['한시우','임도윤','백승재','서지한','조은찬','문태오']:['강유진','오승현','정이준','신태건','배준서','류민재'];
  return {name:names[hash(team+role)%names.length],role,team};
 }
 function badge(team){
  const hue=hash(team)%360;
  return '<span class="club-mark" style="--club-hue:'+hue+'" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="m16 3 13 13-13 13L3 16Z" fill="currentColor" opacity=".13"/><path d="m16 5 11 11-11 11L5 16Z" stroke="currentColor" stroke-width="1.6"/><path d="M10 20V12h5a4 4 0 0 1 0 8Zm8-8v8m-3-8v8" stroke="currentColor" stroke-width="1.7"/></svg></span>';
 }
 function relationships(){
  let root=$('careerRelationships');if(!root){root=document.createElement('section');root.id='careerRelationships';root.className='surface-card';$('screen-training').append(root);}
  root.hidden=school();if(root.hidden)return;
  $('developmentPane').after(root);
  const coach=speaker('slump',state.team),mate=speaker('practice',state.team),junior=speaker('mentor',state.team);
  const n=state.narrative22,history=Array.isArray(n?.history)?n.history.filter(h=>h&&typeof h.title==='string'):[];
  const trust=Math.max(0,Math.min(100,Number(state.development?.trust)||0)),cohesion=Math.max(0,Math.min(20,Number(state.life20?.cohesion)||0));
  const gauge=(person,label,value,max)=>'<div class="relationship-row"><span class="speaker-mark" aria-hidden="true">'+text(person.name.slice(-2))+'</span><div><strong>'+text(person.name)+' <small>'+text(person.role)+'</small></strong><span>'+label+'</span></div><b>'+value+'<small> / '+max+'</small></b><progress max="'+max+'" value="'+value+'" aria-label="'+label+'"></progress></div>';
  const threads=n?.threads&&typeof n.threads==='object'?Object.entries(n.threads).filter(([key,t])=>['practice','mentor','coach'].includes(key)&&t&&t.team===state.team&&Number.isInteger(t.year)&&Number.isFinite(t.game)):[];
  root.innerHTML='<div class="section-title-row"><h2>함께 뛰는 사람들</h2><span>나의 구단</span></div>'+gauge(coach,'구단 신뢰',trust,100)+gauge(mate,'팀 전체 유대',cohesion,20)+'<p class="relationship-note">구단 신뢰는 기용 평가에, 팀 전체 유대는 경기 능력에 반영됩니다. 등장인물은 게임 속 가상 인물입니다.</p>'+(threads.length?'<div class="relationship-promises"><h3>이어지는 약속</h3>'+threads.map(([key,t])=>'<p><strong>'+text((key==='coach'?coach:key==='mentor'?junior:mate).name)+'</strong> · '+(key==='coach'?'상담 이후의 실제 성장 점검':key==='mentor'?'함께 준비한 훈련 돌아보기':'다음 경기 영상 함께 보기')+'<small>'+t.year+' · '+t.game+'팀 경기에서 시작</small></p>').join('')+'</div>':'')+'<details id="relationshipHistory"><summary>이전 만남과 선택 <span>'+history.length+'</span></summary>'+(history.length?history.slice(-12).reverse().map(h=>'<article class="relationship-memory"><small>'+text(h.year)+' · '+text(h.game)+'팀 경기 · '+text(h.team)+'</small><strong>'+text(h.title)+'</strong><p>'+text(h.speaker?.name||'이름을 기록하지 않은 만남')+' · '+text(h.label||'이전 선택')+'</p><small>'+text(h.effect)+'</small></article>').join(''):'<p class="screen-intro">아직 기록된 만남이 없습니다. 시즌 화면에서 라커룸 이야기를 켜면 선택을 남길 수 있습니다.</p>')+'</details>';
 }
 function offers(){
  for(const card of document.querySelectorAll('.contract-card')){
   const label=card.querySelector('.contract-option'),input=label?.querySelector('input');if(!label||!input)continue;
   const title=label.querySelector('strong');if(title&&!label.querySelector('.club-mark'))input.insertAdjacentHTML('afterend',badge(title.textContent));
   card.classList.toggle('offer-selected',input.checked);
   input.addEventListener('change',()=>{for(const other of document.querySelectorAll('.contract-card'))other.classList.toggle('offer-selected',!!other.querySelector('input:checked'));});
  }
 }
 function paint(){
  if(!state||!$('playerIdentity'))return;
  relationships();offers();
  const p=document.body.dataset.careerPhase;
  // Only the current chapter advertises the blocking story; the companion card holds controls.
  $('careerStory22')?.classList.toggle('story-is-pending',p==='story');
  if(!school()&&!state.retired&&state.game<144){
   const actions=$('seasonActions'),week=$('careerWeek');if(week)week.after(actions);
   if(p==='story')$('seasonStory').after($('careerStory22'));
  }
 }
 window.DiamondPresentation=Object.freeze({speaker,badge});
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};
 window.addEventListener('diamond-slot-change',paint);
})();
