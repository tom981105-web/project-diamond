const {test,expect}=require('@playwright/test');
const {finishSeason,openDetails,confirmAdvance}=require('./helpers');
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function tab(page,id){await page.click(`[data-tab=${id}]`);}
async function start(page,role='batter'){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await tab(page,'league');await openDetails(page);
}
test('rest plan locks for seven team games, excludes pro stats and training; survives reload',async({page})=>{
 await start(page);await page.evaluate(()=>{state.development.fatigue=70;state.development.condition=40;render();});const before=await read(page);
 await page.click('[data-week-plan=rest]');await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await expect(page.locator('[data-week-plan=rest]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-week-plan=practice]')).toBeDisabled();await openDetails(page);await page.click('#weekBtn');const after=await read(page);
 expect(after.game).toBe(7);expect(after.current.G).toBe(0);expect(after.attributes).toEqual(before.attributes);expect(after.development.fatigue).toBe(35);expect(after.development.condition).toBe(61);expect(after.career14.plan).toBeNull();await expect(page.locator('#weekReport')).toContainText('프로 출장 0경기');
 await tab(page,'training');await page.selectOption('#intensitySelect','rest');await tab(page,'league');await page.click('[data-week-plan=practice]');expect((await read(page)).career14.plan.intensity).toBe('normal');
});
test('selection creates different actual appearances; health affects plate appearances and pitching quality',async({page})=>{
 await start(page);
 const result=await page.evaluate(()=>{
  const initial=JSON.parse(JSON.stringify(state)),random=Math.random,bat=atBat;
  try{
   Math.random=()=>.65;
   const simulate=good=>{state=JSON.parse(JSON.stringify(initial));state.attributes.fill(good?90:30);state.development.trust=good?90:25;state.development.condition=85;play(7);return state.current.G;};
   const low=simulate(false),high=simulate(true);
   state=JSON.parse(JSON.stringify(initial));state.role='pitcher';state.position='선발투수';state.attributes.fill(60);state.current=empty();state.game=0;state.team=TEAMS[0];let q=[];atBat=(b,quality)=>{q.push(quality);return 'SO';};state._performanceFactor=.8;gameMatch(0,1,true);const weakened=q.filter(x=>x===48).length;
   return {low,high,weakened,outs:state.current.IPouts};
  }finally{Math.random=random;atBat=bat;state=initial;render();}
 });
 expect(result).toEqual({low:0,high:7,weakened:18,outs:18});
 // Exact same random draw hits at normal ability, misses with the health penalty.
 const hitting=await page.evaluate(()=>{
  const random=Math.random;state.attributes=[60,60,60,60,60,60];
  const run=f=>{let draws=[.9,.9,.30,.9,.9,.9,.9],i=0;Math.random=()=>draws[i++]??.9;state._performanceFactor=f;return atBat({user:true},62);};
  try{return [run(1),run(.75)];}finally{Math.random=random;delete state._performanceFactor;}
 });expect(hitting).toEqual(['1B','OUT']);
});
test('demotion pauses batch; training restores call-up with zero major-league appearances',async({page})=>{
 await start(page);await page.evaluate(()=>{state.development.trust=10;state.development.intensity='normal';save();render();});await page.click('#seasonBtn');let s=await read(page);
 expect(s.game).toBe(7);expect(s.development.level).toBe('2군');expect(s.career14.pending.type).toBe('demotion');expect(s.career14.remaining).toBe(137);
 const id=s.career14.pending.id;await page.reload();await expect(page.locator('#careerEvent')).toContainText('2군');expect((await read(page)).career14.pending.id).toBe(id);await expect(page.locator('#seasonBtn')).toBeDisabled();
 await page.click('[data-career-choice=train]');const g=(await read(page)).current.G;await page.click('#continueCareer');s=await read(page);
 expect(s.career14.pending.type).toBe('promotion');expect(s.development.level).toBe('1군');expect(s.current.G).toBe(g);expect(s.attributes.reduce((a,b)=>a+b)).toBeGreaterThan(240);expect(s.development.trust).toBeGreaterThanOrEqual(48);
 await page.click('[data-career-choice=train]');await finishSeason(page);s=await read(page);expect(s.game).toBe(144);expect(s.career).toHaveLength(1);expect(s.career14.history.filter(x=>x.id===id)).toHaveLength(1);
});
test('injury interrupts once, rehab preserves counts, return waits for choice after reload',async({page})=>{
 await start(page);await page.evaluate(()=>{state.development.fatigue=99;state.development.intensity='hard';const random=Math.random;Math.random=()=>0;try{play(144);}finally{Math.random=random;}});
 let s=await read(page);expect(s.game).toBe(1);expect(s.career14.pending.type).toBe('injury');const injured=s.development.injury;const g=s.current.G;const before=s.attributes;
 await page.click('[data-career-choice=rest]');await page.reload();await expect(page.locator('[data-week-plan=rehab]')).toHaveAttribute('aria-pressed','true');
 await page.click('#continueCareer');s=await read(page);expect(s.game).toBe(1+injured);expect(s.development.injury).toBe(0);expect(s.current.G).toBe(g);expect(s.attributes).toEqual(before);expect(s.career14.pending.type).toBe('return');
 const fixed=s.career14.pending.id;await page.reload();await expect(page.locator('#careerEvent')).toContainText('재활을 마쳤습니다');
 expect((await read(page)).career14.pending.id).toBe(fixed);
 await page.click('[data-career-choice=rest]');await openDetails(page);await page.click('#weekBtn');s=await read(page);expect(s.current.G).toBe(g);expect(s.career14.history.filter(x=>x.id===fixed)).toHaveLength(1);
});
test('training and experience growth use actual exposure, cap at potential, and ledger agrees',async({page})=>{
 await start(page);const result=await page.evaluate(()=>{
  const random=Math.random;state.attributes.fill(90);state.potential=92;state.development.trust=100;state.development.condition=100;state.development.focus=0;state.development.intensity='normal';Math.random=()=>.2;
  try{play(24);return {attributes:state.attributes,g:state.current.G,growth:state.career14.growth,stats:state.current};}finally{Math.random=random;}
 });
 expect(result.g).toBe(24);expect(result.attributes[0]).toBe(92);expect(result.growth.reduce((n,x)=>n+x.amount,0)).toBe(2);expect(result.attributes.every(x=>x<=92)).toBe(true);
});
test('old save adds no retroactive growth; optional state is isolated by player and season',async({page})=>{
 await start(page);await page.evaluate(()=>{delete state.career14;state.game=30;state.current.G=22;state.current.H=15;save();render();});const old=await read(page);
 expect(old.current.H).toBe(15);expect(old.career14.growth).toEqual([]);expect(old.career14.experience).toBe(0);
 await finishSeason(page);await page.click('#confirmReview');await page.click('[data-direction=recover]');await confirmAdvance(page);let s=await read(page);expect(s.career14.year).toBe(s.year);expect(s.career14.recent).toEqual([]);expect(s.career14.pending).toBeNull();
 await page.click('#journeySettingsButton');await page.click('#diamondNew');await page.click('#startJourney');for(let i=0;i<3;i++)await page.click('#wizardNext');await page.click('button[type=submit]');s=await read(page);expect(s.career14.history).toEqual([]);expect(s.career14.growth).toEqual([]);
});
test('fielding skill reaches opponent at-bats; weekly UI fits mobile with a pending injury',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);
 const observed=await page.evaluate(()=>{
  const original=atBat;state.attributes[4]=90;state.team=TEAMS[0];let fields=[];
  atBat=(b,q,f)=>{fields.push(f);return 'SO';};
  try{gameMatch(0,1,true);return [...new Set(fields)];}finally{atBat=original;}
 });expect(observed).toEqual(expect.arrayContaining([74,60]));
 await page.evaluate(()=>{state.development.fatigue=99;state.development.intensity='hard';const random=Math.random;Math.random=()=>0;try{play(144);}finally{Math.random=random;}});
 await expect(page.locator('#careerEvent')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('[data-career-choice=rest]')).toBeVisible();
 await page.click('[data-tab=training]');await expect(page.locator('#coachPanel')).toBeVisible();await expect(page.locator('#developmentHistory')).toBeVisible();
});

test('a seven-game fielding plan receives growth after five subsequent batting-practice days',async({page})=>{
 await start(page);const before=await read(page);await page.click('[data-week-plan=defense]');await page.click('#weekBtn');
 await page.click('[data-week-plan=practice]');for(let i=0;i<5;i++)await page.click('#oneBtn');const after=await read(page);
 expect(after.game).toBe(12);expect(after.attributes[4]).toBe(before.attributes[4]+1);expect(after.attributes[0]).toBe(before.attributes[0]);
 expect(after.career14.growth.filter(x=>x.source==='훈련 성장').map(x=>x.index)).toEqual([4]);
});
