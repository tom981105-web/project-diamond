const {test,expect}=require('@playwright/test');
const {finishSeason,runSeason}=require('./helpers');
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function start(page){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');for(let i=0;i<3;i++)await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');
}
async function offseason(page){await finishSeason(page);await page.click('#confirmReview');await page.click('[data-direction=recover]');}

test('inspect, dismiss and choose a real offer without signing; reload preserves selection',async({page})=>{
 await start(page);await offseason(page);const before=await read(page),o=before.development.offers[1];
 await page.locator('[data-contract-card="1"] [data-open-contract]').click();
 const dialog=page.getByRole('dialog',{name:'계약 제안 상세'});await expect(dialog).toContainText(o.team);await expect(dialog).toContainText(o.amount.toLocaleString()+'만원');await expect(dialog).toContainText((o.amount*o.years).toLocaleString()+'만원');await expect(dialog).toContainText('2027–'+(2026+o.years));
 await page.press('#keepComparing','Escape');await expect(dialog).not.toBeVisible();expect((await read(page)).contract15.history).toEqual(before.contract15.history);await expect(page.locator('[data-contract-card="1"] [data-open-contract]')).toBeFocused();
 await page.locator('[data-contract-card="1"] [data-open-contract]').click();await page.click('#selectDetailedOffer');await expect(page.locator('[name=contractPick][value="1"]')).toBeChecked();expect((await read(page)).year).toBe(before.year);expect((await read(page)).development.salary).toBe(before.development.salary);
 await page.reload();await expect(page.locator('[name=contractPick][value="1"]')).toBeChecked();expect((await read(page)).development.offers[1]).toEqual(o);
});

test('final confirmation can be cancelled; only explicit confirmation signs exact terms once',async({page})=>{
 await start(page);await offseason(page);await page.check('[name=contractPick][value="1"]');const before=await read(page),o=before.development.offers[1];
 await page.click('#nextBtn');await expect(page.locator('#careerAdvanceDialog')).toContainText(o.team);await expect(page.locator('#careerAdvanceDialog')).toContainText('오래 뛸 몸 만들기');expect((await read(page)).year).toBe(2026);
 await page.click('#cancelCareerAdvance');expect((await read(page)).contract15.history).toEqual(before.contract15.history);expect((await read(page)).ui13.choices).toEqual(before.ui13.choices);
 await page.click('#nextBtn');await page.reload();expect((await read(page)).year).toBe(2026);await expect(page.locator('#careerAdvanceDialog')).not.toBeVisible();
 await page.click('#nextBtn');{if(await page.locator('#signatureName').isVisible())await page.locator('#signatureName').fill(await page.evaluate(()=>state.name));await page.click('#confirmCareerAdvance');}const after=await read(page);expect(after.year).toBe(2027);expect(after.team).toBe(o.team);expect(after.development.salary).toBe(o.amount);expect(after.contract15.active.endYear).toBe(2026+o.years);expect(after.contract15.history).toHaveLength(1);expect(after.ui13.choices).toHaveLength(1);
 await page.reload();expect((await read(page)).contract15.history).toHaveLength(1);expect((await read(page)).ui13.choices).toHaveLength(1);
});

test('pending injury inspection and postponement preserve outcome, counts and remaining schedule',async({page})=>{
 await start(page);await page.evaluate(()=>{state.development.fatigue=99;state.development.intensity='hard';const random=Math.random;Math.random=()=>0;try{play(144);}finally{Math.random=random;}});
 const before=await read(page);expect(before.career14.pending.type).toBe('injury');await page.click('#inspectCareerEvent');await expect(page.locator('#careerMomentDialog')).toContainText(before.career14.remaining+'팀 경기');await expect(page.locator('[data-moment-choice=train]')).toHaveCount(0);await page.click('#postponeCareerMoment');
 let after=await read(page);expect(after.current).toEqual(before.current);expect(after.career14.pending).toEqual(before.career14.pending);expect(after.career14.plan).toEqual(before.career14.plan);expect(after.career14.remaining).toBe(before.career14.remaining);await expect(page.locator('#seasonBtn')).toBeDisabled();
 await page.reload();await page.click('#inspectCareerEvent');await page.click('[data-moment-choice=rest]');after=await read(page);expect(after.game).toBe(before.game);expect(after.current).toEqual(before.current);expect(after.career14.pending).toBeNull();expect(after.career14.plan.mode).toBe('rehab');expect(after.career14.history.filter(x=>x.id===before.career14.pending.id)).toHaveLength(1);
 await runSeason(page,'#continueCareer');after=await read(page);expect(after.game).toBe(before.game+before.development.injury);expect(after.current.G).toBe(before.current.G);expect(after.career14.pending.type).toBe('return');
});

test('modal closes when an imported player replaces its owner; stale confirmation cannot carry over',async({page})=>{
 await start(page);await offseason(page);await page.click('#nextBtn');await expect(page.locator('#careerAdvanceDialog')).toBeVisible();
 // An independent import fixture replaces state, as slot/import restoration does.
 await page.evaluate(()=>{state=JSON.parse(JSON.stringify(state));state.name='별도 선수';render();});await expect(page.locator('#careerAdvanceDialog')).not.toBeVisible();expect((await read(page)).year).toBe(2026);expect((await read(page)).contract15.history).toHaveLength(0);
});

test('mobile contract detail and final confirmation fit viewport and retain accessible actions',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);await offseason(page);await page.locator('[data-contract-card="0"] [data-open-contract]').click();
 const check=async id=>{const box=await page.locator(id).boundingBox();expect(box.width).toBeLessThanOrEqual(390);expect(box.height).toBeLessThanOrEqual(844);expect(box.x).toBeGreaterThanOrEqual(0);expect(await page.locator(id).evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);};
 await check('#contractDetailDialog');await page.click('#selectDetailedOffer');await page.click('#nextBtn');await check('#careerAdvanceDialog');await expect(page.locator('#confirmCareerAdvance')).toBeVisible();await page.press('#cancelCareerAdvance','Escape');await expect(page.locator('#careerAdvanceDialog')).not.toBeVisible();
});
