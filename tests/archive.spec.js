const {test,expect}=require('@playwright/test');
const {finishSeason,confirmAdvance}=require('./helpers');
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function start(page,role='batter'){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');
}
async function next(page){await page.click('#confirmReview');await page.click('[data-direction=recover]');await confirmAdvance(page);}
async function records(page){await page.click('[data-tab=career]');await page.click('[data-record-mode=seasons]');}
async function open(page,index){await page.locator('#archiveSeasonList [data-archive-index="'+index+'"]').click();}

for(const role of ['batter','pitcher'])test(`completed season retains its own stats, attributes and club after the next year (${role})`,async({page})=>{
 await start(page,role);await finishSeason(page);const completed=await read(page),record=completed.career[0];expect(record.review19.attributes).toEqual(completed.attributes);expect(record.review19.condition).toBe(completed.development.condition);expect(record.review19.role).toBe(role);
 await next(page);await page.evaluate(()=>{state.attributes.fill(99);state.development.condition=1;state.development.fatigue=99;save();render();});await records(page);const before=await read(page);await open(page,0);
 await expect(page.locator('#archiveTitle')).toHaveText('2026 시즌 돌아보기');await expect(page.locator('#archiveContent')).toContainText(record.team);await expect(page.locator('#archiveContent')).toContainText(record.stats.G+'경기');await expect(page.locator('#archiveContent')).toContainText(role==='batter'?'타율 · OPS':'평균자책점 · 이닝');
 const health=page.locator('#archiveContent .decision-row').filter({hasText:'결산 컨디션 · 피로'});await expect(health).toContainText(Math.round(record.review19.condition)+' · '+Math.round(record.review19.fatigue));
 const attribute=await page.evaluate(role=>ATTR[role][0],role);await expect(page.locator('#archiveContent .decision-row').filter({hasText:attribute}).first()).toContainText(String(record.review19.attributes[0]));
 await page.click('#returnFromArchive');expect(await read(page)).toEqual(before);await page.reload();await records(page);await open(page,0);expect((await read(page)).career[0].review19).toEqual(record.review19);
});

test('current-season archive viewing does not acknowledge review or apply offseason decisions',async({page})=>{
 await start(page);await finishSeason(page);await page.click('#dismissReview');await records(page);const before=await read(page);expect(before.ui13.reviewed[2026]).toBeUndefined();await open(page,0);await page.press('#closeSeasonArchive','Escape');expect(await read(page)).toEqual(before);await page.click('[data-tab=league]');await expect(page.locator('#contractOptions')).not.toBeVisible();await expect(page.locator('#reopenReview')).toHaveText('시즌 결산 확인하고 다음 진로로');
});

test('legacy seasons expose only recorded fields and tolerate missing or malformed optional details',async({page})=>{
 await start(page);await page.evaluate(()=>{
  const s={...empty(),G:10,AB:40,PA:44,H:12,HR:2,B2:1,BB:4};state.career=[{year:2026,age:18,stats:{...s},ovr:44,salary:12300},{year:2027,age:19,stats:{...s},ovr:46,review19:{version:1,role:'batter',attributes:'invalid'}}];state.year=2028;state.age=20;state.attributes.fill(99);state.ui13.baselines={};state.legacyV4.seasons={2026:{club:'과거 구단',leagueRank:3,postseason:{champion:'기록된 우승팀',rounds:[]},awards:['기록된 개인상']}};save();render();
 });await records(page);const before=await read(page);await open(page,0);await expect(page.locator('#archiveContent')).toContainText('과거 구단');await expect(page.locator('#archiveContent')).toContainText('12,300만원');await expect(page.locator('#archiveContent')).toContainText('세부 능력치·몸 상태는 보관되지 않았습니다');await expect(page.locator('#archiveContent')).toContainText('기록된 개인상');await expect(page.locator('#archiveContent')).not.toContainText('99 →');
 await page.selectOption('#archiveJump','1');await expect(page.locator('#archiveContent')).toContainText('소속 미기록');await expect(page.locator('#archiveContent')).toContainText('수상 기록 미보관');await page.click('#closeSeasonArchive');expect(await read(page)).toEqual(before);
});

test('year navigation, home and news entry points open the exact archived season',async({page})=>{
 await start(page);await finishSeason(page);await next(page);await page.click('[data-tab=league]');await finishSeason(page);await page.click('#dismissReview');await records(page);await expect(page.locator('.archive-season-card')).toHaveCount(2);await open(page,1);await expect(page.locator('#archiveNewer')).toBeDisabled();await page.click('#archiveOlder');await expect(page.locator('#archiveTitle')).toHaveText('2026 시즌 돌아보기');await expect(page.locator('#archiveOlder')).toBeDisabled();await page.click('#archiveNewer');await expect(page.locator('#archiveTitle')).toHaveText('2027 시즌 돌아보기');await page.click('#closeSeasonArchive');
 await page.click('[data-tab=dashboard]');await page.locator('#journeyTimeline [data-archive-index="0"]').click();await expect(page.locator('#archiveTitle')).toHaveText('2026 시즌 돌아보기');await page.click('#closeSeasonArchive');await page.click('[data-tab=news]');await page.locator('#journeyArticles [data-archive-index="1"]').click();await expect(page.locator('#archiveTitle')).toHaveText('2027 시즌 돌아보기');
});

test('JSON export/import preserves snapshots, and replacing a player closes an open archive',async({page})=>{
 await start(page);await finishSeason(page);await page.click('#dismissReview');const before=await read(page);await page.click('#journeySettingsButton');const download=page.waitForEvent('download');await page.click('#exportBtn');const file=await download,stream=await file.createReadStream(),buffers=[];for await(const b of stream)buffers.push(b);const data=JSON.parse(Buffer.concat(buffers).toString());expect(data.career[0].review19).toEqual(before.career[0].review19);await page.click('#closeSettings');page.once('dialog',d=>d.accept());await page.setInputFiles('#importFile',{name:'archive.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await records(page);await open(page,0);await expect(page.locator('#seasonArchiveDialog')).toBeVisible();await page.evaluate(()=>{state=JSON.parse(JSON.stringify(state));state.name='다른 선수';render();});await expect(page.locator('#seasonArchiveDialog')).not.toBeVisible();expect((await read(page)).career[0].review19).toEqual(data.career[0].review19);
});

test('mobile archives and comparison table remain separate from amateur records',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);await finishSeason(page);await page.click('#dismissReview');await records(page);await expect(page.locator('#historyBody')).not.toBeVisible();await page.click('#archiveComparison summary');await expect(page.locator('#historyBody')).toBeVisible();await open(page,0);const box=await page.locator('#seasonArchiveDialog').boundingBox();expect(box.width).toBeLessThanOrEqual(390);expect(box.height).toBeCloseTo(844,1);expect(await page.locator('#seasonArchiveDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.click('#returnFromArchive');await page.click('[data-record-mode=amateur]');await expect(page.locator('#seasonArchive')).not.toBeVisible();await expect(page.locator('#archiveComparison')).not.toBeVisible();await expect(page.locator('#diamondAmateurHistory')).toBeVisible();
});
