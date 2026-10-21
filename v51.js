// V0.5.1 — non-destructive recovery and foreign season transition guards.
'use strict';
const v51RenderBase=render;
const v51NextBase=nextSeason;
const v51ValidBase=valid;
function v51RegionForTeam(team){return Object.keys(V5_CLUBS).find(k=>V5_CLUBS[k].includes(team))||null;}
function v51Repair(){
 if(!state)return false;
 let changed=false;
 if(!state.globalCareer||typeof state.globalCareer!=='object'){
   state.globalCareer={region:v51RegionForTeam(state.team)||'KR',moves:[],debutYear:state.year};changed=true;
 }
 const g=state.globalCareer;
 const inferred=v51RegionForTeam(state.team);
 if(inferred&&g.region!==inferred){g.region=inferred;changed=true;}
 if(!Array.isArray(g.moves)){g.moves=[];changed=true;}
 if(!Number.isInteger(g.debutYear)){g.debutYear=state.year;changed=true;}
 if(state.game===0&&state.league&&state.league.season===state.year&&
    (!Array.isArray(state.league.standings)||state.league.standings.length!==10||
     state.league.standings.some((s,i)=>s.name!==V5_CLUBS[g.region][i]))){state.league=null;changed=true;}
 v5Teams(g.region);
 if(state.game===144&&!state.retired){ensureV3();
   if(!g.offersReadyYear||g.offersReadyYear!==state.year||
     !Array.isArray(state.development.offers)||state.development.offers.some(o=>!V5_CLUBS[o.region||g.region]?.includes(o.team))){
       v5Offers();g.offersReadyYear=state.year;changed=true;
   }
 }
 if(changed)save();return changed;
}
render=function(){if(state)v51Repair();v51RenderBase();};
valid=function(data){if(!data||typeof data!=='object')return false;
  let inferred=v51RegionForTeam(data.team);
  if(data.globalCareer&&inferred&&data.globalCareer.region!==inferred){
    // Accept a mismatched-but-recognized region from an interrupted foreign transfer.
    const copy={...data,globalCareer:{...data.globalCareer,region:inferred}};
    return v51ValidBase(copy);
  }
  return v51ValidBase(data);
};
nextSeason=function(){
 if(!state||state.retired||state.game!==144)return;
 v51Repair();
 const selected=document.querySelector('input[name="contractPick"]:checked');
 const offer=state.development?.offers?.[Number(selected?.value)];
 if(!offer){alert('다음 시즌 계약을 먼저 선택해 주세요.');return;}
 const target=offer.region||v5Region();
 if(!V5_CLUBS[target]?.includes(offer.team)){alert('구단 및 리그가 일치하지 않습니다. 다른 제안을 선택해 주세요.');return;}
 const previousYear=state.year,previousTeam=state.team,previousRegion=v5Region();
 // Don't mutate current league before the old year's results have been recorded.
 if(!state.legacyV4?.seasons?.[previousYear])v4Finish();
 v51NextBase();
 if(state.year!==previousYear){
    const last=state.career.findLast(c=>c.year===previousYear);
    if(last){last.team=previousTeam;last.region=previousRegion;}
    state.globalCareer.region=target;
    state.team=offer.team;
    v5Teams(target);
    if(!state.league||state.league.season!==state.year||state.league.standings.some((x,i)=>x.name!==V5_CLUBS[target][i])){
      state.league=null;ensureLeague();
    }
    // Repair contract log if the inherited flow reports it using the target team.
    save();render();
 }
};
