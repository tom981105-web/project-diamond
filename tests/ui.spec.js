const {test,expect}=require('@playwright/test');
async function create(page,role='batter',college=false){await page.goto('./');await page.click('#startJourney');await page.click('[data-avatar="2"]');await page.click('#wizardNext');await page.fill('#playerName','화면검증');await page.selectOption('#role',role);if(college)await page.check('[name=amateurPath][value=college]');await page.click('#wizardNext');await page.click('#wizardNext');await page.selectOption('#journeyFocusSecond','1');await page.click('button[type=submit]');}
const read=page=>page.evaluate(()=>JSON.parse(JSON.stringify(state)));
test('card navigation and player summaries never mutate a saved career or duplicate deltas',async({page})=>{
 await create(page);await page.evaluate(()=>{state.attributes[0]+=2;save();render();});const before=await read(page);
 await page.getByRole('button',{name:'선수 정보',exact:true}).click();await expect(page.locator('header h1')).toHaveText('선수');await expect(page.locator('#playerIdentity')).toContainText('화면검증');await expect(page.locator('#playerIdentity')).toContainText('정확성 · 장타력');
 await expect(page.locator('#attributes .is-focused')).toHaveCount(2);await expect(page.locator('#attributes .attribute-change')).toHaveCount(1);await expect(page.locator('#attributes .attribute-change')).toHaveText('+2');
 for(let i=0;i<3;i++){await page.click('[data-tab=dashboard]');await page.click('[data-tab=training]');}
 await expect(page.locator('#attributes .attribute-change')).toHaveCount(1);await expect(page.locator('#coachPanel')).not.toBeVisible();await page.click('#playerCoachDetails summary');await expect(page.locator('#coachPanel')).toBeVisible();
 await page.click('[data-tab=dashboard]');await page.getByRole('button',{name:'리그 순위',exact:true}).click();await expect(page.locator('#leaguePane')).toBeVisible();
 await page.click('[data-tab=dashboard]');await page.getByRole('button',{name:'시즌 기록',exact:true}).click();await expect(page.locator('#seasonArchive')).toBeVisible();expect(await read(page)).toEqual(before);
 await page.reload();expect(await read(page)).toEqual(before);await expect(page.locator('header h1')).toHaveText('기록');
});
for(const width of [390,800,1366])test(`cards, profile and sticky navigation fit ${width}px viewport`,async({page})=>{
 await page.setViewportSize({width,height:900});await create(page,'pitcher');
 for(const tab of ['dashboard','training','league','news','career']){
  await page.click(`[data-tab=${tab}]`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const nav=await page.locator('#diamondNav').boundingBox();expect(nav.y+nav.height).toBeLessThanOrEqual(901);expect(nav.width).toBeLessThanOrEqual(800);
 }
 await page.click('[data-tab=training]');const identity=await page.locator('#playerIdentity').boundingBox(),chart=await page.locator('#attributes').boundingBox();expect(identity.y).toBeLessThan(chart.y);await expect(page.locator('#playerIdentity')).toContainText('선발투수');
});
test('avatar preview selection and failed optional art keep the generated player playable',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'우승 도전',exact:true}).click();await expect(page.locator('#landingJourneyCaption')).toContainText('우승');await page.click('#startJourney');await expect(page.locator('#avatarPreview img')).toBeVisible();await page.click('[data-avatar="4"]');await expect(page.locator('[data-avatar="4"]')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{window.DiamondVisualAssets.portraits[4]='./missing-art-for-test.png';});await page.click('#wizardNext');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await expect(page.locator('#playerPortrait svg')).toBeVisible();await expect(page.locator('#journeyAction')).toBeVisible();
 const s=await read(page);expect(s.ui13.avatar).toBe(4);expect(s.game).toBe(0);await page.click('[data-tab=training]');await expect(page.locator('#playerIdentity svg')).toBeVisible();
 await page.evaluate(()=>{window.DiamondVisualAssets.portraits[4]='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Crect width="10" height="10" fill="blue"/%3E%3C/svg%3E';render();});await expect(page.locator('#playerIdentity img')).toBeVisible();await expect(page.locator('#playerIdentity svg')).not.toBeVisible();await page.evaluate(()=>{delete window.DiamondVisualAssets.portraits[4];render();});await expect(page.locator('#playerIdentity svg')).toBeVisible();expect(await read(page)).toEqual(s);
});
test('college profile and home shortcuts retain amateur separation',async({page})=>{
 await create(page,'batter',true);const before=await read(page);await page.getByRole('button',{name:'선수 정보',exact:true}).click();await expect(page.locator('#playerIdentity')).toContainText('대학 야구');await expect(page.locator('#playerIdentity')).toContainText('대학 야구부');await page.click('[data-tab=dashboard]');await page.getByRole('button',{name:'시즌 기록',exact:true}).click();await expect(page.locator('#archiveCount')).toHaveText('0시즌');expect(await read(page)).toEqual(before);
});

test('supplied first scene preserves its full aspect ratio and missing stages keep their fallback',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./');const scene=page.locator('#landingJourney img');await expect(scene).toBeVisible();await expect.poll(()=>scene.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);const box=await page.locator('.journey-placeholder').boundingBox();expect(box.width/box.height).toBeCloseTo(16/9,1);expect(await scene.evaluate(e=>getComputedStyle(e).objectFit)).toBe('contain');
 await page.getByRole('button',{name:'프로 데뷔',exact:true}).click();await expect(page.locator('#landingJourney img')).toHaveCount(0);await expect(page.locator('.journey-ball')).toBeVisible();await page.getByRole('button',{name:'첫 유니폼',exact:true}).click();await expect(page.locator('#landingJourney img')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('supplied first avatar loads in choice, preview, home, player and reload without replacing saved choice',async({page})=>{
 await page.goto('./');await page.click('#startJourney');const selected=page.locator('[data-avatar="0"] img');await expect(selected).toBeVisible();await expect.poll(()=>selected.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);await expect(page.locator('#avatarPreview img')).toBeVisible();
 for(let i=0;i<3;i++)await page.click('#wizardNext');await page.click('button[type=submit]');const before=await read(page);expect(before.ui13.avatar).toBe(0);await expect(page.locator('#playerPortrait img')).toBeVisible();await page.click('[data-tab=training]');await expect(page.locator('#playerIdentity img')).toBeVisible();await page.reload();await expect(page.locator('#playerIdentity img')).toBeVisible();expect(await read(page)).toEqual(before);
});
