const {test,expect}=require('@playwright/test');
const KEY='project-diamond-save-v1';
async function ready(page){await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');}
async function snapshot(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function saved(page){await expect(page.locator('#diamondSlotsStatus')).toHaveText('커리어 슬롯 저장 완료');}
async function create(page,name,role='batter',college=false,position){
  await ready(page);await page.fill('#playerName',name);await page.selectOption('#role',role);
  if(position)await page.selectOption('#position',position);
  await page.check(`[name=amateurPath][value=${college?'college':'draft'}]`);
  await page.click('button[type=submit]');await saved(page);
}
async function tab(page,id){await page.click(`[data-tab=${id}]`);}
async function exportJSON(page,selector='#exportBtn'){
  const pending=page.waitForEvent('download');await page.click(selector);const file=await pending;
  const stream=await file.createReadStream();const buffers=[];for await(const chunk of stream)buffers.push(chunk);
  return JSON.parse(Buffer.concat(buffers).toString());
}
async function importJSON(page,data){
  page.once('dialog',d=>d.accept());
  await page.setInputFiles('#importFile',{name:'career.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await saved(page);
}
test.beforeEach(async({page})=>{page.errors=[];page.on('pageerror',e=>page.errors.push(e.message));await page.goto('/');await ready(page);});
test.afterEach(async({page})=>{expect(page.errors).toEqual([]);});
for(const role of ['batter','pitcher'])test(`college 36 games → signing → pro season → reload (${role})`,async({page})=>{
  await create(page,'대학'+role,role,true);
  let s=await snapshot(page);expect(s.attributes.reduce((a,b)=>a+b)).toBe(240);expect(s.year).toBe(2026);expect(s.age).toBe(18);
  await expect(page.locator('#oneBtn')).not.toBeVisible();await expect(page.locator('#diamondSlots')).toBeVisible();
  await page.click('#collegeOne');expect((await snapshot(page)).v12.college.results).toHaveLength(1);
  for(let i=0;i<3;i++)await page.click('#collegeOne');expect((await snapshot(page)).v12.college.results).toHaveLength(4);
  await page.click('#collegeFour');await page.click('#collegeFour');s=await snapshot(page);expect(s.v12.college.results).toHaveLength(12);
  const backup=await exportJSON(page,'#collegeBackup');expect(backup.v12.college.results).toHaveLength(12);
  await page.reload();await ready(page);expect((await snapshot(page)).v12.college.results).toHaveLength(12);
  await page.click('#collegeYear');expect((await snapshot(page)).v12.college.results).toHaveLength(24);
  await page.click('#collegeYear');s=await snapshot(page);expect(s.v12.college.results).toHaveLength(36);expect(s.current.G).toBe(0);expect(s.career).toHaveLength(0);
  for(const year of [2026,2027,2028])expect(s.v12.college.results.filter(x=>x.year===year)).toHaveLength(12);
  await expect(page.locator('[data-offer]')).toHaveCount(3);const offer=s.v12.college.offers[1];
  await page.click('[data-offer="1"]');s=await snapshot(page);expect(s.team).toBe(offer.team);expect(s.development.salary).toBe(offer.salary);expect(s.year).toBe(2029);expect(s.age).toBe(21);expect(s.globalCareer.debutYear).toBe(2029);expect(s.v10.amateur.v11.source).toBe('played');
  await tab(page,'dashboard');await expect(page.locator('#stats')).toBeVisible();await expect(page.locator('#historyBody')).not.toBeVisible();
  await page.click('#oneBtn');expect((await snapshot(page)).game).toBe(1);
  // Seven team games in total, then a complete season.
  for(let i=0;i<6;i++)await page.click('#oneBtn');expect((await snapshot(page)).game).toBe(7);
  await page.click('#seasonBtn');s=await snapshot(page);expect(s.game).toBe(144);expect(s.career).toHaveLength(1);expect(s.league.round).toBe(144);expect(s.development.offers).toHaveLength(4);expect(s.development.offers[1].region).toBe('JP');
  for(const club of s.league.standings)expect(club.W+club.L+club.T).toBe(144);
  expect(s.career[0].stats).toEqual(s.current);expect(s.legacyV4.seasons[2029]).toBeTruthy();expect(s.attributes.reduce((a,b)=>a+b)).toBeGreaterThan(249);
  await saved(page);await page.reload();await ready(page);expect((await snapshot(page)).current).toEqual(s.current);
  await tab(page,'training');await page.check('[name=contractPick][value="1"]');const target=(await snapshot(page)).development.offers[1];
  await tab(page,'dashboard');await page.click('#nextBtn');s=await snapshot(page);expect(s.year).toBe(2030);expect(s.game).toBe(0);expect(s.team).toBe(target.team);expect(s.globalCareer.region).toBe('JP');expect(s.globalCareer.moves).toHaveLength(1);expect(s.development.salary).toBe(target.amount);expect(s.career).toHaveLength(1);
  await tab(page,'career');const proBackup=await exportJSON(page);await importJSON(page,proBackup);expect((await snapshot(page)).career).toEqual(proBackup.career);
});
for(const role of ['batter','pitcher'])test(`high-school ${role}, training, injury and slots`,async({page})=>{
  await create(page,'고졸'+role,role);let s=await snapshot(page);expect(s.game).toBe(0);expect(s.v12).toBeUndefined();
  await tab(page,'training');await page.selectOption('#focusSelect','2');await page.selectOption('#intensitySelect','hard');
  const before=await snapshot(page);await tab(page,'dashboard');await page.click('#weekBtn');expect((await snapshot(page)).game).toBe(7);for(let i=0;i<5;i++)await page.click('#oneBtn');
  s=await snapshot(page);expect(s.attributes[2]).toBe(before.attributes[2]+2);expect(s.development.fatigue).toBeGreaterThan(0);expect(s.development.condition).toBeLessThan(85);
  await tab(page,'career');const backup=await exportJSON(page);backup.development.injury=3;backup.development.intensity='rest';
  await importJSON(page,backup);await tab(page,'dashboard');const g=(await snapshot(page)).current.G;await page.click('#oneBtn');s=await snapshot(page);expect(s.development.injury).toBe(2);expect(s.current.G).toBe(g);
  const original=await snapshot(page);await page.click('#diamondNew');await create(page,'두번째'+role,role);await page.click('#oneBtn');await saved(page);
  await page.selectOption('#diamondSlotSelect','slot-1');await page.click('#diamondSwitch');await expect(page.locator('#nameLabel')).toHaveText(original.name);s=await snapshot(page);expect(s.current).toEqual(original.current);expect(s.game).toBe(original.game);
  await page.reload();await ready(page);expect((await snapshot(page)).current).toEqual(original.current);
  await page.selectOption('#diamondSlotSelect','slot-2');await page.click('#diamondSwitch');await expect(page.locator('#nameLabel')).toHaveText('두번째'+role);
  page.once('dialog',d=>d.accept());await page.click('#diamondDelete');await expect(page.locator('#nameLabel')).toHaveText(original.name);
});
test('legacy pro college-route save is preserved; last-slot deletion stays deleted',async({page})=>{
  await create(page,'기존선수');let data=await snapshot(page);delete data.v12;data.v10.amateur.path='college';data.year=2031;data.age=23;data.game=7;data.current.H=2;data.current.AB=8;data.current.PA=8;
  await tab(page,'career');await importJSON(page,data);await page.reload();await ready(page);let s=await snapshot(page);expect(s.year).toBe(2031);expect(s.game).toBe(7);expect(s.current.H).toBe(2);expect(s.v12).toBeUndefined();
  page.once('dialog',d=>d.accept());await page.click('#diamondDelete');await expect(page.locator('#create')).toBeVisible();await page.reload();await ready(page);expect(await snapshot(page)).toBeNull();
  await create(page,'삭제후재생성');expect((await snapshot(page)).name).toBe('삭제후재생성');
});
test('localStorage quota fallback restores IndexedDB slot',async({page})=>{
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')};});
  await create(page,'용량검증');await page.click('#weekBtn');await saved(page);const before=await snapshot(page);
  await page.reload();await ready(page);expect((await snapshot(page)).current).toEqual(before.current);expect((await snapshot(page)).game).toBe(7);
});
test('migration prefers current local save over stale auxiliary backup',async({page})=>{
  await create(page,'최신기록');const latest=await snapshot(page);const stale={...latest,name:'오래된백업'};
  // Independent browser storage fixture, not a modification of a real player save.
  await page.evaluate(async({latest,stale,KEY})=>{
    const open=name=>new Promise((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    let db=await open('project-diamond-slot-manager');await new Promise(resolve=>{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').clear();tx.oncomplete=resolve;});db.close();
    db=await open('project-diamond-careers');await new Promise(resolve=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({data:JSON.stringify(stale),updatedAt:1},'active');tx.oncomplete=resolve;});db.close();
    localStorage.clear();localStorage.setItem(KEY,JSON.stringify(latest));
  },{latest,stale,KEY});
  await page.reload();await ready(page);expect((await snapshot(page)).name).toBe('최신기록');
});
test('long career reaches retirement without duplicate seasons',async({page})=>{
  await create(page,'장기투수','pitcher',false,'마무리투수');
  let lastTeam;
  for(let i=0;i<23;i++){
    lastTeam=(await snapshot(page)).team;
    await tab(page,'dashboard');await page.click('#seasonBtn');await page.click('#nextBtn');
    if((await snapshot(page)).retired)break;
  }
  const s=await snapshot(page);expect(s.retired).toBe(true);expect(s.team).toBe(lastTeam);expect(s.age).toBe(40);expect(s.career).toHaveLength(23);expect(new Set(s.career.map(x=>x.year)).size).toBe(23);
  await expect(page.locator('#oneBtn')).toBeDisabled();await saved(page);await page.reload();await ready(page);expect((await snapshot(page)).retired).toBe(true);
});
test('unfinished slot write restores newer journal, not stale IndexedDB row',async({page})=>{
  await create(page,'복구검증');const current=await snapshot(page);current.game=9;current.current.H=3;
  await page.evaluate(data=>localStorage.setItem('diamond-slot-journal-v1',JSON.stringify({id:'slot-1',data,updated:Date.now()+1000})),current);
  await page.reload();await ready(page);const s=await snapshot(page);expect(s.game).toBe(9);expect(s.current.H).toBe(3);
});
test('failed slot writes keep current player in memory when switching',async({page})=>{
  await create(page,'저장실패보호');
  await page.evaluate(()=>{const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(store,mode,...rest){if(this.name==='project-diamond-slot-manager'&&mode==='readwrite')throw Error('test write failure');return transaction.call(this,store,mode,...rest);};});
  page.once('dialog',d=>d.accept());await page.click('#diamondNew');await expect(page.locator('#diamondSlotsStatus')).toContainText('슬롯 저장 오류');expect((await snapshot(page)).name).toBe('저장실패보호');await expect(page.locator('#create')).not.toBeVisible();
});
