const {test,expect}=require('@playwright/test');
const {finishSeason,runSeason}=require('./helpers');
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function start(page,role='batter'){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');
 await page.evaluate(()=>{state.attributes.fill(90);state.potential=95;state.development.trust=100;state.development.condition=100;state.development.intensity='normal';Math.random=()=>.65;save();render();});
}

test('visible progress matches completed team rounds, stops and resumes from saved remaining games',async({page})=>{
 await start(page);await page.click('#seasonBtn');await expect(page.getByRole('dialog',{name:/2026/})).toBeVisible();await page.waitForFunction(()=>state.game>=7);
 const progress=await page.evaluate(()=>({game:state.game,value:document.querySelector('#seasonRunProgress').value,G:state.current.G,text:document.querySelector('#seasonProgressPhase').textContent}));expect(progress.value).toBe(progress.game);expect(progress.text).toContain(progress.G+'경기');
 await page.click('#stopSeasonRun');const stopped=await read(page);expect(stopped.game).toBeGreaterThanOrEqual(7);expect(stopped.game).toBeLessThan(144);expect(stopped.career14.remaining).toBe(144-stopped.game);
 await page.waitForTimeout(250);expect((await read(page)).game).toBe(stopped.game);await page.reload();expect((await read(page)).game).toBe(stopped.game);expect((await read(page)).current).toEqual(stopped.current);await expect(page.locator('#continueCareer')).toHaveText('남은 '+(144-stopped.game)+'경기 이어가기');
 await runSeason(page,'#continueCareer');await finishSeason(page);expect((await read(page)).game).toBe(144);expect((await read(page)).career).toHaveLength(1);await expect(page.locator('#journeyReview')).toBeVisible();
});

for(const role of ['batter','pitcher'])test(`skipping presentation and animated progress use the same real simulation (${role})`,async({page})=>{
 await start(page,role);const initial=await read(page);
 // A seeded random stream and isolated state make both complete paths reproducible.
 const install=async()=>page.evaluate(initial=>{state=JSON.parse(JSON.stringify(initial));let seed=123456;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};render();},initial);
 const outcome=async()=>page.evaluate(()=>({game:state.game,current:state.current,attributes:state.attributes,health:state.development,league:state.league,pending:state.career14.pending}));
 await install();await page.click('#seasonBtn');await page.locator('#seasonProgressDialog').waitFor({state:'hidden'});const animated=await outcome();
 if(await page.locator('#journeyReview').isVisible())await page.click('#dismissReview');await install();await page.evaluate(()=>play(144));expect(await outcome()).toEqual(animated);
 if(await page.locator('#journeyReview').isVisible())await page.click('#dismissReview');await install();await runSeason(page);expect(await outcome()).toEqual(animated);
});

test('an important event stops the entire requested season and preserves its remaining schedule',async({page})=>{
 await start(page);await page.evaluate(()=>{state.development.fatigue=99;state.development.intensity='hard';Math.random=()=>0;save();render();});await runSeason(page);const injured=await read(page);
 expect(injured.game).toBe(1);expect(injured.career14.pending.type).toBe('injury');expect(injured.career14.remaining).toBe(143);await expect(page.locator('#careerEvent')).toBeVisible();await expect(page.locator('#seasonProgressDialog')).not.toBeVisible();
 await page.reload();expect((await read(page)).career14.pending).toEqual(injured.career14.pending);expect((await read(page)).career14.remaining).toBe(143);await page.click('[data-career-choice=rest]');await runSeason(page,'#continueCareer');const back=await read(page);expect(back.game).toBe(1+injured.development.injury);expect(back.current.G).toBe(injured.current.G);expect(back.career14.pending.type).toBe('return');expect(back.career14.remaining).toBe(144-back.game);
});

test('replacing the player cancels scheduled work without advancing the new owner',async({page})=>{
 await start(page);await page.click('#seasonBtn');await page.evaluate(()=>{state=JSON.parse(JSON.stringify(state));state.name='별도 선수';state.game=0;state.current=empty();render();});await expect(page.locator('#seasonProgressDialog')).not.toBeVisible();await page.waitForTimeout(250);expect((await read(page)).game).toBe(0);expect((await read(page)).name).toBe('별도 선수');
});

test('mobile progress supports Escape and reduced-motion completion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);await page.click('#seasonBtn');const box=await page.locator('#seasonProgressDialog').boundingBox();expect(box.width).toBeLessThanOrEqual(390);expect(box.height).toBeLessThanOrEqual(844);expect(await page.locator('#seasonProgressDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.press('#stopSeasonRun','Escape');await expect(page.locator('#seasonProgressDialog')).not.toBeVisible();const paused=await read(page);await page.emulateMedia({reducedMotion:'reduce'});await page.click('#seasonBtn');await page.locator('#seasonProgressDialog').waitFor({state:'hidden'});expect((await read(page)).game).toBeGreaterThan(paused.game);
});

test('a failed chunk restores its checkpoint and can be resumed without duplicate stats',async({page})=>{
 await start(page);await page.evaluate(()=>{const original=gameMatch;window.restoreMatch=()=>{gameMatch=original;};gameMatch=(...args)=>{if(state.game>=7)throw Error('isolated test failure');return original(...args);};});await page.click('#seasonBtn');await page.locator('#seasonProgressDialog').waitFor({state:'hidden'});const stopped=await read(page);expect(stopped.game).toBe(7);expect(stopped.league.round).toBe(7);expect(stopped.current.G).toBe(7);expect(stopped.career14.remaining).toBe(137);await expect(page.locator('#seasonRunNotice')).toBeVisible();
 await page.evaluate(()=>window.restoreMatch());await finishSeason(page);const done=await read(page);expect(done.game).toBe(144);expect(done.current.G).toBe(144);expect(done.career).toHaveLength(1);
});
