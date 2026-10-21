// PROJECT DIAMOND v0.6.1 — non-destructive navigation and responsive layout
'use strict';
(() => {
  const TABS = [
    ['dashboard','🏠 대시보드'],
    ['training','🏋️ 선수 육성·계약'],
    ['league','⚾ 리그'],
    ['career','🏆 커리어 기록']
  ];
  const KEY_TAB='diamond-v061-tab';
  let active='dashboard';
  try { const stored=sessionStorage.getItem(KEY_TAB); if(TABS.some(t=>t[0]===stored)) active=stored; } catch(e) {}
  const previousRender=render;
  function ensureNav() {
    const game=document.getElementById('game');
    if(!game || document.getElementById('diamondNav')) return;
    const nav=document.createElement('nav');
    nav.id='diamondNav';
    nav.className='diamond-tabs';
    nav.setAttribute('aria-label','게임 메뉴');
    TABS.forEach(([key,label])=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='diamond-tab';
      button.dataset.tab=key;
      button.textContent=label;
      button.addEventListener('click',()=>{
        active=key;
        try {sessionStorage.setItem(KEY_TAB,key);} catch(e) {}
        updatePanels();
        nav.scrollIntoView({behavior:'smooth',block:'start'});
      });
      nav.appendChild(button);
    });
    game.prepend(nav);
  }
  function mark(id,tab) {
    const node=document.getElementById(id);
    if(node) node.dataset.diamondTab=tab;
  }
  function updatePanels(){
    if(!state || document.getElementById('game')?.classList.contains('hidden')) return;
    mark('leaguePane','league');
    mark('v4Pane','career');
    mark('v5Pane','training');
    mark('v6Pane','career');
    mark('developmentPane','training');
    const layout=document.querySelector('#game > .layout');
    if(layout){
      const left=layout.querySelector('.stack:first-child');
      const right=layout.querySelector('.stack:last-child');
      if(left){
        for(const node of left.children){
          if(node.id==='diamondSlots')continue;
          node.dataset.diamondTab=node.classList.contains('hero')||node.contains(document.getElementById('stats'))||node.contains(document.getElementById('events'))?'dashboard':'career';
        }
      }
      if(right){
        [...right.children].forEach((node,i)=>{
          // The first panel is abilities, later panels include training and account settings.
          if(!node.id) node.dataset.diamondTab=i===0?'training':'career';
        });
      }
    }
    for(const panel of document.querySelectorAll('#game [data-diamond-tab]:not(.diamond-tab)')){
      panel.classList.toggle('diamond-offscreen',panel.dataset.diamondTab!==active);
    }
    for(const button of document.querySelectorAll('#diamondNav .diamond-tab')){
      const selected=button.dataset.tab===active;
      button.classList.toggle('is-active',selected);
      button.setAttribute('aria-current',selected?'page':'false');
    }
  }
  render=function(){
    previousRender();
    if(!state) return;
    ensureNav();
    updatePanels();
  };
  const style=document.createElement('style');
  style.textContent=`
    #game .layout,#game .layout>.stack{display:contents}
    #game>.diamond-tabs{display:flex;align-items:center;gap:8px;overflow-x:auto;max-width:100%;padding:12px 2px 18px;scrollbar-width:thin;position:relative}
    #game .diamond-tab{flex:0 0 auto;background:#1c3045;color:#c4d5e5;border:1px solid #324b64;border-radius:12px;font-weight:750;padding:12px 16px}
    #game .diamond-tab.is-active{background:#79dab0;color:#0a241d;border-color:#79dab0}
    #game .diamond-offscreen{display:none!important}
    #game>.layout>.stack>.panel,#game>.layout>.stack>.hero,#game>.panel{margin-bottom:16px}
    #game .panel,#game .hero{max-width:100%}
    #game .tablewrap{max-width:100%}
    button:focus-visible,#game .diamond-tab:focus-visible{outline:3px solid #b0f5d1;outline-offset:3px}
    @media(max-width:640px){main{padding:16px 12px 54px}header{margin-bottom:18px}#game .diamond-tab{padding:11px 12px;font-size:13px}#game .hero{padding:17px}#game .hero .row button{flex-grow:1}#game .grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stat strong{font-size:22px}}
  `;
  document.head.appendChild(style);
})();
