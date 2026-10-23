const {test,expect}=require('@playwright/test');
const {advanceGames}=require('./helpers');
async function start(page,role='batter'){
 await page.goto('./');await page.click('#startJourney');await page.click('#wizardNext');await page.fill('#playerName','중계검증');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');
 await page.evaluate(()=>{state.attributes.fill(90);state.potential=95;state.development.trust=100;state.development.condition=100;Math.random=()=>.65;save();render();});
 await page.click('[data-tab=league]');await advanceGames(page,1);
}
for(const width of [320,390,800])test(`creation selection keeps its actual archetype and training plan at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:640});await page.goto('./');await page.click('#startJourney');await page.click('[data-avatar="4"]');await expect(page.locator('[data-avatar="4"]')).toHaveAttribute('aria-pressed','true');
 await page.click('#wizardNext');await page.fill('#playerName','선택보존');await page.selectOption('#role','pitcher');await page.check('[name=amateurPath][value=college]');await page.click('#wizardNext');
 await expect(page.locator('#wizardProgress')).toHaveAttribute('aria-valuenow','3');await page.getByRole('button',{name:/정교한 제구형/}).click();const values=await page.locator('.prospect-bars strong').allTextContents();expect(values.map(Number)).toEqual([34,57,39,46,35,29]);
 expect(await page.evaluate(()=>state)).toBeNull();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const selected=page.locator('.diamond-prospect.selected');const boxes=await page.locator('.diamond-prospect').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].bottom);await expect(selected).toHaveAttribute('aria-pressed','true');
 await page.click('#wizardNext');await page.selectOption('#journeyFocus','1');await page.selectOption('#journeyFocusSecond','3');await page.click('#wizardBack');await expect(selected).toContainText('정교한 제구형');await page.click('#wizardNext');await expect(page.locator('#journeyFocus')).toHaveValue('1');await page.click('button[type=submit]');
 const s=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));expect(s.ui13.avatar).toBe(4);expect(s.attributes).toEqual(values.map(Number));expect(s.development.focus).toBe(1);expect(s.development.secondaryFocus).toBe(3);expect(s.v12.college.completed).toBe(false);await page.reload();expect(await page.evaluate(()=>state.attributes)).toEqual(s.attributes);
});
for(const role of ['batter','pitcher'])test(`broadcast navigation shows recorded ${role} plays and never changes saves or randomness`,async({page})=>{
 await page.setViewportSize({width:390,height:640});await start(page,role);
 const before=await page.evaluate(()=>({state:JSON.stringify(state),saved:localStorage.getItem(KEY),match:state.league.last}));
 await page.evaluate(()=>{window.broadcastRandomCalls=0;Math.random=()=>{window.broadcastRandomCalls++;return .65;};});
 await page.click('#openMatchReplay');await expect(page.locator('#replayMine35')).toHaveText(role==='batter'?'내 타석으로':'내 투구로');await expect(page.locator('#replayPrevious35')).toBeDisabled();await page.click('#replayNext');await page.click('#replayPrevious35');await expect(page.locator('#replayProgress35')).toHaveAttribute('value','1');
 if(await page.locator('#replayMine35').isEnabled()){await page.click('#replayMine35');await expect(page.locator('.replay-call')).toContainText(role==='batter'?'내 타석':'내 투구');}
 expect(await page.locator('#matchReplayDialog > .experience-body').evaluate(e=>e.scrollTop)).toBe(0);
 const footer=await page.locator('#matchReplayDialog > .decision-actions').boundingBox();expect(footer.y+footer.height).toBeLessThanOrEqual(640);
 expect(await page.locator('#matchReplayDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.click('#replayFinish');await expect(page.locator('.baseball-score')).toContainText(before.match.awayRuns+' : '+before.match.homeRuns);await expect(page.locator('#replayNext')).toBeDisabled();
 const plays=before.match.frames.flatMap(f=>f.plays),metrics=await page.locator('.replay-personal35 strong').allTextContents();expect(Number(metrics[0])).toBe(plays.filter(p=>role==='batter'?p.user:p.pitchUser).length);
 await page.locator('.replay-lines35 summary').click();await expect(page.locator('.replay-lines35 table')).toContainText(String(before.match.awayRuns));
 await page.click('#replayPrevious35');await expect(page.locator('#replayNext')).toBeEnabled();await page.click('#replayFinish');await page.press('#matchReplayDialog','Escape');
 expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before.state);expect(await page.evaluate(()=>localStorage.getItem(KEY))).toBe(before.saved);expect(await page.evaluate(()=>window.broadcastRandomCalls)).toBe(0);await page.reload();expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before.state);
});
test('old score-only matches show final scores with all replay controls disabled',async({page})=>{
 await start(page);await page.evaluate(()=>{delete state.league.last.frames;save();render();});const before=await page.evaluate(()=>JSON.stringify(state));await page.click('#openMatchReplay');await expect(page.locator('#matchReplayDialog')).toContainText('보관된 최종 점수만');for(const id of ['replayNext','replayPrevious35','replayMine35','replayFinish'])await expect(page.locator('#'+id)).toBeDisabled();await page.press('#matchReplayDialog','Escape');expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before);
});
test('current inning score includes only the replayed half and no future scoring',async({page})=>{
 await start(page);await page.evaluate(()=>{state.league.last={...state.league.last,away:'부산 웨이브스',home:'서울 피닉스',awayRuns:3,homeRuns:2,frames:[{inning:1,away:3,home:2,plays:[{half:'초',name:'첫 타자',kind:'HR',runs:1,outs:0,bases:[false,false,false],user:true},{half:'초',name:'둘째 타자',kind:'HR',runs:2,outs:0,bases:[false,false,false]},{half:'말',name:'홈 타자',kind:'HR',runs:2,outs:0,bases:[false,false,false]}]}]};save();render();});
 await page.click('#openMatchReplay');await expect(page.locator('.baseball-score')).toContainText('1 : 0');await page.locator('.replay-lines35 summary').click();expect(await page.locator('.replay-lines35 tbody tr').first().locator('td').allTextContents()).toEqual(['부산 웨이브스','1','1']);expect(await page.locator('.replay-lines35 tbody tr').last().locator('td').allTextContents()).toEqual(['서울 피닉스','—','0']);await page.click('#replayNext');await expect(page.locator('.baseball-score')).toContainText('3 : 0');await page.click('#replayNext');await expect(page.locator('.baseball-score')).toContainText('3 : 2');
});
