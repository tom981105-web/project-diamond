// PROJECT DIAMOND v0.8 — baseball-career onboarding inspired by public career-sim mechanics.
// Original UI and independent baseball archetypes; legacy careers are left unchanged.
'use strict';
(() => {
  const PROFILES = {
    batter: [
      {id:'contact',name:'정교한 교타자',tag:'출루와 타격 기술',stats:[57,34,51,38,32,28],desc:'정확한 컨택과 좋은 선구안으로 살아남는 유형'},
      {id:'slugger',name:'차세대 거포',tag:'한 방으로 승부',stats:[39,61,37,29,33,41],desc:'장타력이 뛰어나지만 삼진을 감수해야 하는 유형'},
      {id:'speed',name:'다재다능한 야수',tag:'빠른 발과 수비',stats:[42,35,39,53,40,31],desc:'주루와 수비에서 가치를 만드는 유형'}
    ],
    pitcher: [
      {id:'fire',name:'강속구 유망주',tag:'압도적인 구위',stats:[60,30,51,37,34,28],desc:'빠른 공을 앞세우지만 제구는 불안정한 유형'},
      {id:'command',name:'정교한 제구형',tag:'안정적인 이닝 소화',stats:[34,57,39,46,35,29],desc:'낮은 볼넷 비율과 다양한 구종을 활용하는 유형'},
      {id:'stamina',name:'장기전형 투수',tag:'체력과 위기관리',stats:[37,38,33,40,55,37],desc:'많은 이닝과 꾸준한 활약을 노리는 유형'}
    ]
  };
  let choice={batter:'contact',pitcher:'fire'};
  function createCards(){
    const form=document.getElementById('createForm');
    if(!form||document.getElementById('diamondProspects'))return;
    const wrap=document.createElement('section');
    wrap.id='diamondProspects';
    wrap.innerHTML='<h3>나의 신인 선수 유형 선택</h3><p class="muted">유망주마다 강점과 약점이 달라요. 모든 시작 능력치 합계는 240입니다.</p><div class="diamond-prospect-grid" id="diamondProspectCards"></div><p class="muted" style="font-size:12px">선수 유형은 최초 생성 시에만 적용되며, 기존 선수의 기록은 바뀌지 않습니다.</p>';
    const submit=form.querySelector('button[type=submit]');
    submit.before(wrap);
    paint();
  }
  function paint(){
    const role=document.getElementById('role')?.value||'batter';
    const root=document.getElementById('diamondProspectCards');
    if(!root)return;
    root.textContent='';
    for(const p of PROFILES[role]){
      const button=document.createElement('button');
      button.type='button';button.className='diamond-prospect'+(choice[role]===p.id?' selected':'');
      button.setAttribute('aria-pressed',choice[role]===p.id?'true':'false');
      const title=document.createElement('strong');title.textContent=p.name;
      const tag=document.createElement('span');tag.textContent=p.tag;
      const desc=document.createElement('small');desc.textContent=p.desc;
      const stat=document.createElement('small');stat.textContent='초기 능력치 '+p.stats.join(' · ');
      button.append(title,tag,desc,stat);if(choice[role]===p.id){const bars=document.createElement('div');bars.className='prospect-bars';bars.innerHTML=ATTR[role].map((label,i)=>'<div><span>'+label+'</span><i><b style="width:'+p.stats[i]+'%"></b></i><strong>'+p.stats[i]+'</strong></div>').join('');button.append(bars);}
      button.onclick=()=>{choice[role]=p.id;paint();};
      root.append(button);
    }
  }
  function commitProfile(){
    if(!state||state.game!==0||state.career.length!==0)return;
    const role=state.role;
    const p=PROFILES[role].find(x=>x.id===choice[role]);
    if(!p)return;
    state.attributes=[...p.stats];
    state.potential=Math.max(78,Math.min(96,state.potential));
    state.events.unshift('신인 유형: '+p.name+' · '+p.tag);
    state.events=state.events.slice(0,12);
    save();render();
  }
  const oldSetup=setup;
  setup=function(){
    oldSetup();
    createCards();
    document.getElementById('role')?.addEventListener('change',paint);
    const form=document.getElementById('createForm');
    form?.addEventListener('submit',commitProfile);
  };
  const style=document.createElement('style');
  style.textContent=`
    .diamond-prospect-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
    .diamond-prospect{display:grid;gap:9px;text-align:left;align-content:start;border:1px solid #375069;background:#162b3c;color:#e5f0f8;min-height:168px;padding:15px;border-radius:14px;font-weight:400}
    .diamond-prospect strong{font-size:15px}.diamond-prospect span{font-weight:800;color:#93ddbd;font-size:12px}
    .diamond-prospect small{color:#a8bfd0;line-height:1.5}.diamond-prospect.selected{background:#203c40;border-color:#79dab0;box-shadow:0 0 0 2px #79dab044}
    .diamond-prospect:focus-visible{outline:3px solid #a8efcc;outline-offset:2px}
    @media(max-width:620px){.diamond-prospect-grid{grid-template-columns:1fr}.diamond-prospect{min-height:auto}}
  `;
  document.head.append(style);
})();
