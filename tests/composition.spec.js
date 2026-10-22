const {test,expect}=require('@playwright/test');
const {finishSeason}=require('./helpers');
const read=page=>page.evaluate(()=>JSON.parse(JSON.stringify(state)));
async function create(page,role='batter',college=false){await page.goto('./');await page.click('#startJourney');await page.click('#wizardNext');await page.fill('#playerName','화면개편검증');await page.selectOption('#role',role);if(college)await page.check('[name=amateurPath][value=college]');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');}
for(const width of [320,390,800,1366])test(`compact chapters and bottom sheets remain usable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});await create(page);const before=await read(page);
 const task=await page.locator('#homeCareerTask').boundingBox();expect(task.y+task.height).toBeLessThan(650);
 await page.click('#homeCareerTask');await expect(page.locator('#seasonHeading')).not.toBeVisible();await expect(page.locator('#seasonStory progress')).toHaveAttribute('value','0');await expect(page.locator('#seasonPrimaryMetric')).toHaveText('—');await expect(page.locator('#seasonBtn')).toBeInViewport();expect(await page.locator('#seasonBtn').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(52, 120, 235)');
 await page.click('#openLifeMoment');const box=await page.locator('#lifeMomentDialog').boundingBox();expect(box.width).toBeLessThanOrEqual(width);expect(box.y).toBeGreaterThanOrEqual(-1);expect(box.y+box.height).toBeLessThanOrEqual(845);if(width<=600)expect(box.y+box.height).toBeGreaterThanOrEqual(843);
 await expect(page.getByRole('button',{name:'선수 생활의 선택 닫기',exact:true})).toBeInViewport();await page.press('#lifeMomentDialog','Escape');
 await page.click('[data-tab=training]');await expect(page.locator('#v5Pane')).not.toBeVisible();await page.click('#playerCareerDetails summary');await expect(page.locator('#v5Pane')).toBeVisible();await page.click('[data-tab=dashboard]');expect(await read(page)).toEqual(before);await page.reload();expect(await read(page)).toEqual(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('college chapter shows actual 36-game progress without pro statistics',async({page})=>{
 await create(page,'batter',true);await page.click('#homeCareerTask');await page.click('#collegeFour');const before=await read(page);await expect(page.locator('#seasonStory progress')).toHaveAttribute('value','4');await expect(page.locator('#seasonStory progress')).toHaveAttribute('max','36');await expect(page.locator('.chapter-stats')).toHaveCount(0);await page.click('[data-tab=training]');await expect(page.locator('#playerCareerDetails')).not.toBeVisible();expect(await read(page)).toEqual(before);
});
test('report bars preserve actual ability and compact contract valuation stays inspectable',async({page})=>{
 await create(page);await page.click('#homeCareerTask');await finishSeason(page);const before=await read(page);await expect(page.locator('.report-attribute-track>i')).toHaveCount(6);
 const widths=await page.locator('.report-attribute-track>i').evaluateAll(nodes=>nodes.map(n=>parseFloat(n.style.width)));expect(widths).toEqual(before.attributes.map(x=>Math.min(100,Math.max(0,x))));await page.click('#confirmReview');await page.click('[data-direction=recover]');await expect(page.locator('.market-evaluation')).not.toHaveAttribute('open','');await page.click('.market-evaluation>summary');await expect(page.locator('.market-evaluation')).toHaveAttribute('open','');await expect(page.locator('.market-evaluation')).toContainText('부상 위험 보정');expect((await read(page)).current).toEqual(before.current);expect((await read(page)).attributes).toEqual(before.attributes);
});
