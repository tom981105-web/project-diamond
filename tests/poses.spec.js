const {test,expect}=require('@playwright/test');
async function create(page,avatar=0){await page.goto('./');await page.click('#startJourney');await page.click(`[data-avatar="${avatar}"]`);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');}
for(let avatar=0;avatar<6;avatar++)test(`avatar ${avatar+1} keeps its own atlas for swing, windup and seated rest without changing saves`,async({page})=>{
 await create(page,avatar);for(const [role,mode,frame] of [['batter',null,0],['pitcher',null,1],['batter','rest',2]]){
  await page.evaluate(({role,mode})=>{state.role=role;state.career14.plan=mode?{mode,end:7,focus:0,intensity:'normal'}:null;save();render();},{role,mode});const before=await page.evaluate(()=>JSON.stringify(state));await page.click('#openPlayerScene27');const scene=page.locator('#playerSceneDialog27 .player-scene27');await expect(scene).toHaveClass(/pose-ready28/);await expect(scene.locator('.action-pose28')).toHaveAttribute('data-pose',String(frame));await expect(scene.locator('.scene-portrait28')).not.toBeVisible();expect(await scene.locator('.action-pose28').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain(`avatar-0${avatar+1}.png`);await page.click('#closePlayerScene27');expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before);
 }
});
for(const role of ['batter','pitcher'])test(`${role} left-handed preparation mirrors the correct pose`,async({page})=>{
 await create(page);await page.evaluate(role=>{state.role=role;state.hand='좌투좌타';render();},role);await page.click('#openPlayerScene27');const pose=page.locator('#playerSceneDialog27 .action-pose28');await expect(pose).toBeVisible();expect(await pose.evaluate(e=>getComputedStyle(e).transform)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
});
test('defensive practice keeps the actual original portrait and does not claim swinging',async({page})=>{
 await create(page);await page.evaluate(()=>{state.development.focus=4;state.career14.plan={mode:'practice',focus:4,intensity:'normal',end:7};render();});await page.click('#openPlayerScene27');await expect(page.locator('#playerSceneDialog27 .action-pose28')).toHaveCount(0);await expect(page.locator('#playerSceneDialog27 .scene-portrait28')).toBeVisible();
});
test('failed action image loading leaves the selected original portrait visible',async({page})=>{
 await page.route('**/assets/actions/*.png',r=>r.abort());await create(page,2);const failed=page.waitForEvent('requestfailed',r=>r.url().includes('/assets/actions/'));await page.click('#openPlayerScene27');await failed;await expect(page.locator('#playerSceneDialog27 .scene-portrait28')).toBeVisible();await expect(page.locator('#playerSceneDialog27 .action-pose28')).not.toBeVisible();await expect(page.locator('#playerSceneDialog27 .scene-portrait28')).toHaveAttribute('src',/avatar-03.webp/);
});
