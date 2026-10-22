// V2.5: current season context and player staging. No saves, RNG or career commands.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 const text=v=>escapeHtml(String(v??''));
 function paint(){
  if(!state)return;
  const college=state.v12?.college&&!state.v12.college.completed;
  let home=$('homeSeason25');
  if(!home){home=document.createElement('button');home.type='button';home.id='homeSeason25';$('homeStats').after(home);}
  const count=college?state.v12.college.results.length:state.game,total=college?36:144;
  home.hidden=!!state.retired;
  home.innerHTML='<span><strong>'+state.year+' · '+(college?'대학 야구':text(state.team))+'</strong><small>'+count+' / '+total+'경기</small></span><progress value="'+count+'" max="'+total+'" aria-label="현재 시즌 진행도"></progress>';
  home.onclick=()=>window.DiamondNavigation.show('league');
  const story=$('seasonStory');if(!story)return;
  const active=['season','college','entry'].includes(story.dataset.phase);
  story.classList.toggle('has-player25',active);
  let picture=$('seasonPortrait25');if(!picture){picture=document.createElement('img');picture.id='seasonPortrait25';picture.alt='';picture.setAttribute('aria-hidden','true');story.append(picture);}
  const source=window.DiamondVisualAssets?.portraits?.[Number(state.ui13?.avatar)||0];
  picture.hidden=!active||!source;
  if(source&&picture.getAttribute('src')!==source)picture.src=source;
  picture.onerror=()=>{picture.hidden=true;story.classList.remove('has-player25');};
 }
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};
 window.DiamondUI.layout=function(){baseLayout();paint();};
 window.addEventListener('diamond-slot-change',paint);
})();
