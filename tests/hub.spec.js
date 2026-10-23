const {test,expect}=require('@playwright/test');
const {openDetails}=require('./helpers');
async function create(page,{role='batter',position,school=false}={}){
 await page.goto('./');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);if(position)await page.selectOption('#position',position);if(school)await page.check('[name=amateurPath][value=college]');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');
}
const saved=page=>page.evaluate(()=>({state:JSON.stringify(state),raw:localStorage.getItem(KEY)}));
async function fixture(page,role='batter',mode=null){
 await page.evaluate(({role,mode})=>{state.role=role;state.development.trust=100;state.development.condition=100;state.attributes=[70,70,70,70,70,70];state.career14.role='starter';if(mode)state.career14.plan={mode,focus:0,intensity:'rest',end:7};Math.random=()=>.5;save();render();},{role,mode});
 await page.click('[data-tab=league]');await openDetails(page);await page.click('#oneBtn');
}
for(const role of ['batter','pitcher'])test(`${role} home and season report use the last actual match delta and replay adds no records`,async({page})=>{
 await create(page,{role});await fixture(page,role);const actual=await page.evaluate(()=>({m:state.league.last,d:state.career14.recent.at(-1),a:state.career14.lastAppearance}));expect(actual.a.played).toBe(true);await page.click('#seasonMatchReport29');
 const dialog=page.locator('#matchReportDialog29');await expect(dialog.locator('.hub-team29>strong')).toHaveText([String(actual.m.awayRuns),String(actual.m.homeRuns)]);
 const values=role==='batter'?[actual.d.AB,actual.d.H,actual.d.HR,actual.d.RBI,actual.d.BB,actual.d.SB]:[Math.floor(actual.d.IPouts/3)+'.'+actual.d.IPouts%3,actual.d.PK,actual.d.ER,actual.d.PH,actual.d.PBB,actual.d.W+' · '+actual.d.SV];await expect(dialog.locator('.hub-personal29 strong')).toHaveText(values.map(String));
 const before=await saved(page);await page.click('#reportReplay29');await page.click('#replayFinish');await expect(page.locator('#matchReplayDialog')).toHaveAttribute('data-phase','result');await expect(page.locator('.baseball-score')).toContainText(actual.m.awayRuns+' : '+actual.m.homeRuns);await page.press('#matchReplayDialog','Escape');await page.click('[data-tab=dashboard]');await page.click('#homeMatchReport29');await expect(dialog).toContainText('1번째 팀 경기');await page.press('#matchReportDialog29','Escape');await page.reload();expect(await saved(page)).toEqual(before);await page.click('#homeMatchReport29');await expect(dialog).toContainText('1번째 팀 경기');
});
for(const mode of ['rest','rehab'])test(`${mode} preserves team score and shows absence rather than invented player stats`,async({page})=>{
 await create(page);await fixture(page,'batter',mode);await page.click('#seasonMatchReport29');await expect(page.locator('#matchReportDialog29')).toContainText('공식 출전 없음');await expect(page.locator('#matchReportDialog29')).toContainText('회복 계획');await expect(page.locator('.hub-personal29')).toHaveCount(0);await expect(page.locator('#matchReportDialog29 .hub-team29')).toHaveCount(2);
});
test('starter rotation rest reports no official appearance while keeping the real team result',async({page})=>{
 await create(page,{role:'pitcher',position:'선발투수'});await fixture(page,'pitcher');await page.click('#oneBtn');await page.click('#seasonMatchReport29');await expect(page.locator('#matchReportDialog29')).toContainText('기용 경쟁 또는 등판 휴식');await expect(page.locator('.hub-personal29')).toHaveCount(0);
});
test('missing personal metadata and stale season or slot never borrow another match record',async({page})=>{
 await create(page);await fixture(page);await page.evaluate(()=>{delete state.career14.lastAppearance;render();});await page.click('#seasonMatchReport29');await expect(page.locator('#matchReportDialog29')).toContainText('개인 출전 내역은 저장되어 있지 않습니다');await expect(page.locator('.hub-personal29')).toHaveCount(0);
 await page.evaluate(()=>{state=JSON.parse(JSON.stringify(state));state.name='교체 선수';render();});await expect(page.locator('#matchReportDialog29')).not.toBeVisible();await page.evaluate(()=>{state.league.season--;render();});await page.click('[data-tab=dashboard]');await expect(page.locator('#homeMatch29')).not.toBeVisible();await page.click('[data-tab=league]');await expect(page.locator('#recentMatchStory')).not.toBeVisible();
});
test('college preparation links to the actual player scene without fabricating pro match results',async({page})=>{
 await create(page,{school:true});const before=await saved(page);await expect(page.locator('#homePreparation29')).toContainText('대학 0 / 36경기');await expect(page.locator('#homeMatch29')).not.toBeVisible();await page.click('#homePreparation29');await expect(page.locator('#playerSceneDialog27')).toContainText('0 / 36경기');await page.click('#closePlayerScene27');expect(await saved(page)).toEqual(before);
});
for(const width of [320,390,1366])test(`home report and return navigation fit ${width}px without changing career state`,async({page})=>{
 await page.setViewportSize({width,height:844});await create(page);await fixture(page);await page.click('[data-tab=dashboard]');const before=await saved(page);await page.click('#homeMatchReport29');const dialog=page.locator('#matchReportDialog29'),box=await dialog.boundingBox();expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(845);await expect(page.locator('#reportSeason29')).toBeInViewport();await page.click('#reportSeason29');await expect(page.locator('#seasonStory')).toBeVisible();expect(await saved(page)).toEqual(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
