// PROJECT DIAMOND — progression pipeline fix based on the KICKRU field research.
// V0.9.1: connect existing V0.3 training, fatigue, injury and roster mechanics to gameplay.
'use strict';
(() => {
  const upstream=play;
  function managedPlay(count) {
    if (!state || state.retired || state.game>=144 || !Number.isFinite(count) || count<=0) return;
    // Existing deployed route: v6Play -> v4Play -> v2Play, skipping v3Play.
    // v3Play already models training, fatigue, injuries, trust and player absence.
    // Reuse it as the sole league advance to avoid double-counting games.
    ensureV3();
    v4Ensure();
    v6Init();
    const previousGame=state.game;
    v3Play(Math.max(1,Math.floor(count)));
    if(state && previousGame<144 && state.game===144){
      if(!state.legacyV4.seasons[state.year])v4Finish();
      v6Finish();
      save();
    }
    render();
  }
  play=managedPlay;
  const advanceSeason=nextSeason;
  nextSeason=function(){
    // Retirement closes this season; it must not sign a new contract first.
    if(state&&!state.retired&&state.game===144&&state.age>=40){
      state.retired=true;
      state.events.unshift(state.age+'세에 은퇴했습니다. 커리어 기록을 보관합니다.');
      state.events=state.events.slice(0,12);save();render();return;
    }
    return advanceSeason();
  };

  window.DiamondDiagnostics=Object.freeze({
    version:'0.9.1',
    verify(){
      return {
        gameplayRoute:'managedPlay → v3Play → gameMatch',
        trainingFunctionAvailable:typeof v3Play==='function',
        postseasonFunctionAvailable:typeof v4Finish==='function',
        internationalFunctionAvailable:typeof v6Finish==='function',
        savedCareerLoaded:!!state,
        currentGame:state?state.game:null,
        fatigue:state?.development?.fatigue??null,
        condition:state?.development?.condition??null
      };
    }
  });
  // Reversible fallback for support/debugging, without changing existing saves.
  window.DiamondDiagnosticsLegacyPlay=upstream;
})();
