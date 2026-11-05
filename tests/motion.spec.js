const {test,expect}=require('@playwright/test');
async function create(page,avatar=0){
 await page.goto('./');await page.click('#startJourney');await page.click(`[data-avatar="${avatar}"]`);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');
}
const saved=page=>page.evaluate(()=>({state:JSON.stringify(state),raw:localStorage.getItem(KEY)}));
for(let avatar=0;avatar<6;avatar++)test(`avatar ${avatar+1} plays its own swing, pitch and recovery artwork without changing career`,async({page})=>{
 await create(page,avatar);
 for(const [role,mode,kind] of [['batter',null,'swing'],['pitcher',null,'pitch'],['batter','rest','rest']]){
  await page.evaluate(({role,mode})=>{state.role=role;state.career14.plan=mode?{mode,end:7,focus:0,intensity:'normal'}:null;save();render();},{role,mode});
  const before=await saved(page);await page.evaluate(()=>{window.motionDraws=0;Math.random=()=>{motionDraws++;return .65;};});
  await page.click('#openPlayerScene27');const img=page.locator('#playerSceneDialog27 .player-motion37');await expect(img).toBeVisible();await expect(img).toHaveAttribute('src',new RegExp(`avatar-0${avatar+1}-${kind}\\.webp$`));
  await expect(page.locator('#playerSceneDialog27 .action-pose28')).not.toBeVisible();await page.click('#closePlayerScene27');expect(await saved(page)).toEqual(before);expect(await page.evaluate(()=>motionDraws)).toBe(0);
 }
});
test('motion pause selects a still image, survives refresh and never changes the career backup',async({page})=>{
 await create(page);const before=await saved(page);await page.click('#openPlayerScene27');const img=page.locator('#playerSceneDialog27 .player-motion37');await expect(img).toHaveAttribute('src',/swing\.webp$/);
 await page.click('#playerSceneDialog27 .motion-toggle37');await expect(img).toHaveAttribute('src',/swing-still\.webp$/);await expect(page.locator('#playerSceneDialog27 .motion-toggle37')).toHaveAttribute('aria-pressed','false');await page.click('#closePlayerScene27');
 await page.reload();await page.click('[data-tab=league]');await page.click('#openPlayerScene27');await expect(img).toHaveAttribute('src',/swing-still\.webp$/);expect(await saved(page)).toEqual(before);
 await page.click('#playerSceneDialog27 .motion-toggle37');await expect(img).toHaveAttribute('src',/swing\.webp$/);expect(await saved(page)).toEqual(before);
});
test('reduced motion never requests an animated WebP or GIF and reacts to media changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const requests=[];page.on('request',r=>{if(/\/motion\/.*(?<!-still)\.(webp|gif)$/.test(r.url()))requests.push(r.url());});
 await create(page);await page.click('#openPlayerScene27');await expect(page.locator('#playerSceneDialog27 .player-motion37')).toHaveAttribute('src',/-still\.webp$/);await expect(page.locator('#playerSceneDialog27 .motion-toggle37')).toBeDisabled();expect(requests).toEqual([]);
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('#playerSceneDialog27 .player-motion37')).toHaveAttribute('src',/swing\.webp$/);await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#playerSceneDialog27 .player-motion37')).toHaveAttribute('src',/-still\.webp$/);
});
test('WebP decode failure uses transparent GIF and total failure retains the existing static artwork',async({page})=>{
 await page.route('**/assets/motion/*',r=>r.request().url().endsWith('-still.webp')||r.request().url().endsWith('.gif')?r.continue():r.abort());
 await create(page);await page.click('#openPlayerScene27');await expect(page.locator('#playerSceneDialog27 .player-motion37')).toHaveAttribute('src',/swing\.gif$/);await expect(page.locator('#playerSceneDialog27 .player-motion37')).toBeVisible();
 await page.unroute('**/assets/motion/*');await page.route('**/assets/motion/*',r=>r.abort());await page.click('#closePlayerScene27');await page.evaluate(()=>{state.ui13.avatar=3;render();});await page.click('#openPlayerScene27');await expect(page.locator('#playerSceneDialog27 .action-pose28')).toBeVisible();await expect(page.locator('#playerSceneDialog27 .player-motion37')).not.toBeVisible();
});
test('replay illustrates only recorded personal action and omits walks and opponent plate appearances',async({page})=>{
 await create(page);await page.evaluate(()=>{state.league.last={away:state.team,home:'부산 웨이브스',homeIndex:1,awayIndex:0,awayHits:1,homeHits:0,innings:1,logs:[],awayRuns:1,homeRuns:0,frames:[{inning:1,away:1,home:0,plays:[{half:'초',name:state.name,kind:'1B',runs:0,outs:0,bases:[true,false,false],user:true},{half:'초',name:state.name,kind:'BB',runs:0,outs:0,bases:[true,true,false],user:true},{half:'말',name:'상대 타자',kind:'OUT',runs:0,outs:1,bases:[]},{half:'말',name:'상대 타자',kind:'SO',runs:0,outs:2,bases:[],pitchUser:true}]}]};save();render();});
 const before=await saved(page);await page.click('#openMatchReplay');await expect(page.locator('.replay-action37')).toHaveCount(0);await page.click('#replayNext');await expect(page.locator('.replay-action37 .player-motion37')).toHaveAttribute('data-motion-kind','swing');
 await page.click('#replayNext');await expect(page.locator('.replay-action37')).toHaveCount(0);await page.click('#replayNext');await expect(page.locator('.replay-action37')).toHaveCount(0);await page.click('#replayNext');await expect(page.locator('.replay-action37 .player-motion37')).toHaveAttribute('data-motion-kind','pitch');await page.click('#replayFinish');await expect(page.locator('.replay-action37')).toHaveCount(0);expect(await saved(page)).toEqual(before);
});
for(const width of [320,390,1366])test(`animated scene controls fit at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:640});await create(page);await page.click('#openPlayerScene27');await expect(page.locator('#playerSceneDialog27 .motion-toggle37')).toBeInViewport();await expect(page.locator('#playerSceneDialog27 .player-motion37')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.click('#playerSceneDialog27 .motion-toggle37');await page.click('#closePlayerScene27');
});
