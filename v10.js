// PROJECT DIAMOND V1.0: original baseball amateur-to-pro entry route.
// Existing careers retain their age, season, team, and data.
'use strict';
(() => {
  let route='draft', school='서울 고교 야구부';
  const sanitize=s=>String(s||'').trim().slice(0,24);
  const seedValue=s=>[...s].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),17);
  const pseudo=(seed,index)=>((Math.imul(seed^(index*2654435761),1664525)+1013904223)>>>0)%100;
  const oldSetup=setup;
  const oldRender=render;
  function create(){
    const form=document.getElementById('createForm');
    if(!form || document.getElementById('diamondAmateur'))return;
    const block=document.createElement('section');
    block.id='diamondAmateur';
    block.innerHTML='<h3>🎓 아마추어 커리어 선택</h3><p class="muted">고교 졸업 후 드래프트에 도전하거나 대학 야구를 경험한 뒤 프로에 진출하세요.</p><div class="field"><label for="diamondSchool">출신 고교</label><input id="diamondSchool" maxlength="24" value="서울 고교 야구부" autocomplete="off"></div><div class="diamond-amateur-options"><label class="diamond-amateur-option"><input type="radio" name="amateurPath" value="draft" checked> <strong>고졸 프로 드래프트</strong><small>18세 · 2026년 프로 데뷔 · 더 빠른 성장 기회</small></label><label class="diamond-amateur-option"><input type="radio" name="amateurPath" value="college"> <strong>대학 야구 진학</strong><small>대학 3시즌 경험 · 21세 · 2029년 프로 데뷔</small></label></div><p class="notice" id="diamondDraftHint">선택한 팀은 드래프트 지명 구단으로 기록됩니다. 지명 순번은 유망주 평가에 따라 달라집니다.</p>';
    const submit=form.querySelector('button[type=submit]');
    submit.before(block);
    block.querySelector('#diamondSchool').oninput=e=>school=sanitize(e.target.value);
    block.querySelectorAll('[name=amateurPath]').forEach(r=>r.onchange=e=>{if(e.target.checked){route=e.target.value;block.querySelector('#diamondDraftHint').textContent=route==='college'?'대학 야구 3시즌 성장이 반영되고 2029년에 프로에 데뷔합니다.':'선택한 팀은 드래프트 지명 구단으로 기록됩니다. 지명 순번은 유망주 평가에 따라 달라집니다.';}});
    // Registered after the base submit handler: this runs only when the player is newly created.
    form.addEventListener('submit',()=>{
      if(!state || state.game!==0 || state.career.length!==0 || state.v10?.amateur)return;
      const name=state.name,srcSchool=school||'무명 고교',seed=seedValue(name+srcSchool+state.position);
      const history=[{stage:'high-school',year:2025,label:srcSchool+' 졸업',achievement:pseudo(seed,1)>=80?'전국대회 우수 선수':'지역 유망주'}];
      if(route==='college'){
        for(let year=2026;year<=2028;year++){
          const gain=1+pseudo(seed,year)%3;
          const attrIndex=pseudo(seed,year+11)%6;
          state.attributes[attrIndex]=Math.min(state.potential,state.attributes[attrIndex]+gain);
          history.push({stage:'college',year,label:'대학 야구 '+(year-2025)+'학년',achievement:['주전 경쟁','정규 시즌 활약','전국대회 도전'][year-2026],growth:gain,attribute:attrIndex});
        }
        state.age=21;state.year=2029;state.league=null;
      }
      const grade=Math.max(1,Math.min(10,Math.floor((101-state.potential)/6)+1));
      history.push({stage:'draft',year:state.year,label:state.team+' 신인 드래프트 '+grade+'라운드 지명',achievement:route==='college'?'대졸 신인':'고졸 신인'});
      state.v10={amateur:{school:srcSchool,path:route,history,draftRound:grade,debutAge:state.age,debutYear:state.year}};
      state.events.unshift(state.team+' '+grade+'라운드 지명 · '+(route==='college'?'대학 졸업 후':'고교 졸업 후')+' 프로 입단!');
      state.events=state.events.slice(0,12);
      // Recreate league standings for the correct debut year.
      if(typeof ensureLeague==='function'){state.league=null;ensureLeague();}
      save();render();
    });
  }
  function renderTimeline(){
    const profile=state?.v10?.amateur;
    let panel=document.getElementById('diamondAmateurHistory');
    if(!profile){panel?.remove();return;}
    if(!panel){panel=document.createElement('section');panel.id='diamondAmateurHistory';panel.className='panel';document.getElementById('game').append(panel);}
    panel.dataset.diamondTab='career';
    panel.innerHTML='<h2>🎓 아마추어 시절과 드래프트</h2><p class="muted">'+escapeHtml(profile.school)+' · '+(profile.path==='college'?'대학 진학':'고졸 지명')+' · '+profile.debutYear+'년 프로 데뷔</p><div class="events">'+profile.history.map(e=>'<div class="event"><strong>'+e.year+'</strong> · '+escapeHtml(e.label)+'<span class="muted"> — '+escapeHtml(e.achievement)+'</span></div>').join('')+'</div>';
    const active=document.querySelector('#diamondNav .diamond-tab.is-active')?.dataset.tab||'dashboard';
    panel.classList.toggle('diamond-offscreen',active!=='career');
  }
  setup=function(){oldSetup();create();};
  render=function(){oldRender();renderTimeline();};
  const style=document.createElement('style');
  style.textContent='.diamond-amateur-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}.diamond-amateur-option{background:#152c3e;border:1px solid #354e67;border-radius:12px;padding:14px;display:grid;gap:7px;cursor:pointer}.diamond-amateur-option input{width:auto;justify-self:start}.diamond-amateur-option small{color:#a7bbcc;line-height:1.5;font-weight:400}@media(max-width:640px){.diamond-amateur-options{grid-template-columns:1fr}}';
  document.head.appendChild(style);
})();
