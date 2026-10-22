// Navigation is a view concern. Career data and commands remain in the game engine.
'use strict';
(() => {
 const tabs=[['dashboard','홈','home'],['news','소식','news'],['league','시즌','season'],['training','선수','player'],['career','기록','records']];
 const icons={home:'<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',news:'<path d="M5 4h14v17H5zM8 8h8M8 12h8M8 16h5"/>',season:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 11h18M8 15h3M14 15h2"/>',player:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',records:'<path d="M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v6M7 21h10"/>'};
 let active='dashboard';
 try{const value=sessionStorage.getItem('diamond-v061-tab');if(tabs.some(x=>x[0]===value))active=value;}catch(e){}
 function update(){
  const nav=document.getElementById('diamondNav');if(!nav)return;
  for(const b of nav.querySelectorAll('button')){const selected=b.dataset.tab===active;b.classList.toggle('is-active',selected);b.setAttribute('aria-current',selected?'page':'false');}
  for(const page of document.querySelectorAll('.journey-screen')){page.hidden=page.dataset.screen!==active;}
  if(window.DiamondUI)window.DiamondUI.layout();
 }
 function show(id){if(!tabs.some(x=>x[0]===id))return;active=id;try{sessionStorage.setItem('diamond-v061-tab',id);}catch(e){}update();window.scrollTo({top:0,behavior:'instant'});}
 function ensure(){
  if(document.getElementById('diamondNav'))return;
  const nav=document.createElement('nav');nav.id='diamondNav';nav.setAttribute('aria-label','게임 메뉴');
  for(const [id,label,icon] of tabs){const b=document.createElement('button');b.type='button';b.className='diamond-tab';b.dataset.tab=id;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+icons[icon]+'</svg><span>'+label+'</span>';b.onclick=()=>show(id);nav.append(b);}
  document.getElementById('game').prepend(nav);update();
 }
 window.DiamondNavigation={show,get active(){return active;},update};
 const previous=render;render=function(){previous();if(state){ensure();update();}};
})();
