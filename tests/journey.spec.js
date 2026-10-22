const {finishSeason,advanceGames,confirmAdvance}=require('./helpers');
const {test,expect}=require('@playwright/test');
async function create(page,role='batter',secondary=false){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');await page.click('[data-avatar="2"]');await page.click('#wizardNext');await page.fill('#playerName','커리어검증');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');if(secondary)await page.selectOption('#journeyFocusSecond','1');await page.click('button[type=submit]');
 await expect(page.locator('#nameLabel')).toHaveText('커리어검증');
}
async function state(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
test('four-step creation, player-first home, five destinations and settings',async({page})=>{
 await create(page,'batter',true);expect((await state(page)).ui13.avatar).toBe(2);
 await expect(page.locator('#diamondNav button')).toHaveCount(5);await expect(page.locator('#diamondSlots')).not.toBeVisible();await expect(page.locator('#journeyAction')).toBeVisible();
 await page.click('#journeyAction');await expect(page.locator('#seasonBtn')).toBeVisible();await expect(page.locator('#nameLabel')).not.toBeVisible();
 await advanceGames(page,24);
 const s=await state(page);expect(s.attributes[0]).toBe(58);expect(s.attributes[1]).toBe(35);expect(s.development.secondaryFocus).toBe(1);
 await page.click('[data-tab=news]');await expect(page.locator('#events')).toBeVisible();
 await page.click('#journeySettingsButton');await expect(page.locator('#diamondSlots')).toBeVisible();await expect(page.locator('#exportBtn')).toBeVisible();await page.click('#closeSettings');
});
test('review → direction and contract → next year; selection survives reload, applied once',async({page})=>{
 await create(page,'pitcher');await page.click('[data-tab=league]');await finishSeason(page);await expect(page.locator('#journeyReview')).toBeVisible();await expect(page.locator('#reviewContent')).toContainText('종합 능력');await page.click('#confirmReview');
 await expect(page.locator('#nextBtn')).toBeDisabled();await page.click('[data-direction=compete]');await page.check('[name=contractPick][value="1"]');const before=await state(page);const target=before.development.offers[1];
 await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await expect(page.locator('[data-direction=compete]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[name=contractPick][value="1"]')).toBeChecked();
 await confirmAdvance(page);const after=await state(page);expect(after.year).toBe(before.year+1);expect(after.team).toBe(target.team);expect(after.development.salary).toBe(target.amount);expect(after.development.fatigue).toBe(Math.max(0,before.development.fatigue-45)+6);expect(after.development.trust).toBe(Math.min(100,before.development.trust+17));expect(after.ui13.choices).toHaveLength(1);
 await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');expect((await state(page)).ui13.choices).toHaveLength(1);expect((await state(page)).development.fatigue).toBe(after.development.fatigue);
});
test('mobile home has no horizontal overflow, bottom navigation is visible',async({page})=>{
 await page.setViewportSize({width:390,height:844});await create(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const box=await page.locator('#diamondNav').boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(845);await expect(page.locator('#diamondNav')).toBeVisible();
});

test('season details are collapsible and record filters isolate amateur history',async({page})=>{
 await create(page);await page.click('[data-tab=league]');await expect(page.locator('#leaguePane')).not.toBeVisible();await page.click('#journeyLeagueDetails summary');await expect(page.locator('#leaguePane')).toBeVisible();
 await page.click('[data-tab=career]');await expect(page.locator('#historyBody')).toBeVisible();await expect(page.locator('#diamondAmateurHistory')).not.toBeVisible();await page.click('[data-record-mode=amateur]');await expect(page.locator('#diamondAmateurHistory')).toBeVisible();await expect(page.locator('#historyBody')).not.toBeVisible();
});

test('season preparation defaults to a single season action; detailed controls remain available',async({page})=>{
 await create(page);await page.click('[data-tab=league]');
 await expect(page.locator('#seasonBtn')).toHaveText('2026 시즌 보내기');await expect(page.locator('#oneBtn')).not.toBeVisible();await expect(page.locator('[data-week-plan=rest]')).not.toBeVisible();
 await page.click('#seasonDetailControls summary');await expect(page.locator('#oneBtn')).toBeVisible();await page.click('#weeklyPlans summary');await expect(page.locator('[data-week-plan=rest]')).toBeVisible();
 await page.click('[data-week-plan=rest]');await page.click('#weekBtn');expect((await state(page)).current.G).toBe(0);expect((await state(page)).game).toBe(7);
});

test('report dismissal preserves records; direction and contract are separate reversible stages',async({page})=>{
 await page.setViewportSize({width:390,height:844});await create(page);await page.click('[data-tab=league]');await finishSeason(page);
 const original=await state(page);await expect(page.locator('#reviewContent')).toContainText('시즌 시작 대비');await expect(page.locator('#reviewContent')).toContainText('정규리그 순위');await expect(page.locator('#reviewContent')).toContainText('집중 과제');
 const report=await page.locator('#journeyReview').boundingBox();expect(report.width).toBe(390);expect(report.height).toBeCloseTo(844,1);
 await page.click('#dismissReview');await expect(page.locator('#contractOptions')).not.toBeVisible();await expect(page.locator('[data-direction=compete]')).not.toBeVisible();
 await page.reload();await page.click('#reopenReview');await page.click('#confirmReview');await expect(page.locator('[data-direction=compete]')).toBeVisible();await expect(page.locator('#contractOptions')).not.toBeVisible();
 await page.click('[data-direction=compete]');await expect(page.locator('#contractOptions')).toBeVisible();await expect(page.locator('[data-direction=recover]')).not.toBeVisible();
 await page.check('[name=contractPick][value="1"]');await page.click('#changeDirection');await expect(page.locator('#contractOptions')).not.toBeVisible();await page.click('[data-direction=recover]');
 await expect(page.locator('[name=contractPick][value="1"]')).toBeChecked();expect((await state(page)).current).toEqual(original.current);expect((await state(page)).ui13.choices).toHaveLength(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('midseason legacy report identifies observed baseline instead of claiming a season-start value',async({page})=>{
 await create(page,'pitcher');await page.click('[data-tab=league]');await page.evaluate(()=>{state.game=30;delete state.ui13.baselines[state.year];delete state.ui13.baselineGames;save();render();});
 await finishSeason(page);await expect(page.locator('#reviewContent')).toContainText('30팀 경기 시점부터 기록한 변화');
 await expect(page.locator('#reviewContent')).toContainText('평균자책점 · 이닝');await expect(page.locator('#reviewContent')).not.toContainText('시즌 시작 대비');
});
