// V3.4: shared visual composition. Existing commands and save data remain the owners.
'use strict';
(() => {
 const baseRender=render,baseSetup=setup,baseLayout=window.DiamondUI.layout;
 let owner=null,reactionYear=null,reactionPinned=false;
 const text=v=>escapeHtml(String(v??''));
 function reactions(){
  const feed=$('journeyArticles');if(!feed)return;
  const records=state.career.slice(-3).reverse(),liveAvailable=!(state.v12?.college&&!state.v12.college.completed)&&!state.retired&&state.game>0&&state.game<144,years=[...new Set([...(liveAvailable?[String(state.year)]:[]),...records.map(r=>String(r.year))])];
  if(!reactionPinned||(!years.includes(reactionYear)&&reactionYear!=='all'))reactionYear=years[0]||null;
  let controls=$('reactionFilter34');if(!controls){controls=document.createElement('section');controls.id='reactionFilter34';controls.className='surface-card';feed.before(controls);}
  controls.innerHTML='<label for="reactionYear34">언론과 팬의 반응</label><select id="reactionYear34" '+(!years.length?'disabled':'')+' aria-label="반응 조회 시즌">'+(years.length?'<option value="all">보관된 모든 시즌</option>'+years.map(y=>'<option value="'+y+'">'+y+' 시즌</option>').join(''):'<option>첫 시즌 진행 중</option>')+'</select>';
  if(reactionYear)$('reactionYear34').value=reactionYear;
  const articles=[...feed.querySelectorAll('.news-article:not(#liveSeason24)')];articles.forEach((a,i)=>{a.hidden=reactionYear!=='all'&&String(records[i]?.year)!==reactionYear;});
  const live=$('liveSeason24');if(live)live.hidden=!liveAvailable||(reactionYear!=='all'&&String(state.year)!==reactionYear);const signing=feed.querySelector('.signing-feed'),entry=state.contract15?.history?.at(-1);if(signing)signing.hidden=reactionYear!=='all'&&String((entry?.year||0)+1)!==reactionYear;
  $('reactionYear34').onchange=e=>{reactionYear=e.target.value;reactionPinned=true;reactions();};
 }
 function header(){
  if(!$('headerReaction34')){
   const holder=document.querySelector('.header-tools');if(!holder)return;
   for(const [id,label,tab,icon] of [['headerReaction34','반응 보기','news','<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h5"/>'],['headerRecords34','기록 보기','career','<path d="M6 3h12v18H6z"/><path d="M9 7h6m-6 4h6m-6 4h4"/>']]){
    const b=document.createElement('button');b.id=id;b.type='button';b.className='icon-button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon+'</svg>';holder.insertBefore(b,$('journeySettingsButton'));b.onclick=()=>window.DiamondNavigation.show(tab);
   }
  }
  for(const id of ['headerReaction34','headerRecords34'])if($(id))$(id).hidden=!state;
  if(state&&window.DiamondNavigation.active==='news')document.querySelector('header h1').textContent='반응';
 }
 function paint(){
  header();if(!state)return;
  if(owner!==state){owner=state;reactionYear=null;reactionPinned=false;}
  let context=$('homeContext34');if(!context){context=document.createElement('section');context.id='homeContext34';context.className='surface-card';context.setAttribute('aria-label','현재 시즌과 준비 상태');}
  const shop=$('careerShop');if(shop){$('homeNextCard')?.after(shop);shop.after(context);}else $('homeNextCard')?.after(context);
  for(const id of ['homeSeason25','homePreparation29'])if($(id))context.append($(id));
  context.hidden=!!state.retired;
  const attributes=$('attributes')?.closest('.panel'),entry=$('playerSceneEntry27');if(attributes&&entry)attributes.append(entry);
  reactions();
 }
 render=function(){baseRender();paint();};setup=function(){baseSetup();paint();};window.DiamondUI.layout=function(){baseLayout();paint();};window.addEventListener('diamond-slot-change',paint);
})();
