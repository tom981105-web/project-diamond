const {test,expect}=require('@playwright/test');
const {finishSeason}=require('./helpers');
async function read(page){return page.evaluate(()=>JSON.parse(JSON.stringify(state)));}
async function start(page,role='batter'){
 await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');await page.click('[data-tab=league]');
}
// Synthetic season records isolate contract formulas from random match outcomes.
async function fixture(page,strength='high',role='batter'){
 await page.evaluate(({strength,role})=>{
  state.role=role;state.position=role==='batter'?'포수':'선발투수';state.age=25;state.attributes.fill(strength==='high'?80:strength==='medium'?60:25);state.potential=95;
  const stats=strength==='low'?empty():role==='batter'?{...empty(),G:strength==='high'?130:90,PA:520,AB:450,H:strength==='high'?160:120,HR:strength==='high'?35:10,B2:30,B3:5,BB:65,RBI:80}:{...empty(),G:29,GS:29,IPouts:540,ER:45,PK:200,W:15};
  state.current=stats;state.game=144;state.career=[{year:state.year,age:state.age,stats:{...stats},ovr:overall(),salary:state.development.salary,team:state.team,region:v5Region()}];
  state.contract15.markets={};state.globalCareer.offersReadyYear=null;state.ui13.contracts={};state.ui13.reviewed[state.year]=true;state.ui13.drafts[state.year]='recover';render();save();
 },{strength,role});
}
async function selectDirection(page){if(await page.locator('#journeyReview').evaluate(e=>e.open))await page.click('#confirmReview');if(await page.locator('#changeDirection').isVisible())await page.click('#changeDirection');await page.click('[data-direction=recover]');}
async function request(page,index,kind){await page.locator(`[data-contract-card="${index}"] [data-negotiate=${kind}]`).click();}

test('actual batting/pitching exposure, age and injuries affect valuation; zero innings earn no ERA bonus',async({page})=>{
 await start(page);
 const r=await page.evaluate(()=>{
  const evaluate=()=>window.DiamondContracts.evaluate();state.attributes.fill(70);state.age=25;state.current={...empty(),G:130,PA:550,AB:480,H:170,HR:35,B2:30,B3:3,BB:60};const good=evaluate();
  state.current=empty();const absent=evaluate();state.age=38;state.development.injuries=6;state.development.injury=10;const older=evaluate();
  state.role='pitcher';state.position='선발투수';state.age=25;state.development.injury=0;state.development.injuries=0;state.current={...empty(),G:28,IPouts:540,ER:45,PK:200};const pitch=evaluate();state.current=empty();return {good,absent,older,pitch,zero:evaluate()};
 });expect(r.good.score).toBeGreaterThan(r.absent.score);expect(r.older.score).toBeLessThan(r.absent.score);expect(r.pitch.score).toBeGreaterThan(r.zero.score);expect(r.zero.performance).toBe(30);expect(r.zero.exposure).toBe(0);
});

test('salary accepted once; choice and revised terms persist, then sign a multiyear contract',async({page})=>{
 await start(page);await fixture(page);const original=await read(page),m=original.contract15.markets[2026];const i=m.offers.findIndex(o=>o.interest>=70&&o.ceiling>=Math.round(o.amount*1.2/100)*100);expect(i).toBeGreaterThanOrEqual(0);
 await request(page,i,'salary');let s=await read(page),o=s.development.offers[i];expect(o.negotiation.status).toBe('accepted');expect(o.amount).toBeGreaterThan(m.offers[i].amount);expect(s.development.salary).toBe(original.development.salary);
 page.once('dialog',d=>d.accept());await page.setInputFiles('#importFile',{name:'negotiated.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(s))});expect((await read(page)).development.offers[i]).toEqual(o);
 await expect(page.locator(`[data-contract-card="${i}"] [data-negotiate]`)).toHaveCount(0);await page.check(`[name=contractPick][value="${i}"]`);await selectDirection(page);await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await expect(page.locator(`[name=contractPick][value="${i}"]`)).toBeChecked();
 expect((await read(page)).development.offers[i]).toEqual(o);await page.click('#nextBtn');s=await read(page);expect(s.year).toBe(2027);expect(s.development.salary).toBe(o.amount);expect(s.development.contractYears).toBe(o.years);expect(s.contract15.active.endYear).toBe(2027+o.years-1);expect(s.contract15.history).toHaveLength(1);
 await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');expect((await read(page)).contract15.history).toHaveLength(1);await page.click('[data-tab=training]');await expect(page.locator('#contractSummary')).toContainText(o.years+'시즌 남음');
});

test('salary counter must be resolved before signing; declining preserves original offer, rejection does not reroll',async({page})=>{
 await start(page);await fixture(page,'medium');let s=await read(page);const i=s.development.offers.findIndex(o=>o.interest>=48&&o.interest<70&&o.ceiling>o.amount);expect(i).toBeGreaterThanOrEqual(0);const original=s.development.offers[i].amount;
 await request(page,i,'salary');await page.check(`[name=contractPick][value="${i}"]`);await selectDirection(page);page.once('dialog',d=>d.accept());await page.click('#nextBtn');expect((await read(page)).year).toBe(2026);
 await page.reload();await expect(page.locator(`[data-contract-card="${i}"] [data-counter=decline]`)).toBeVisible();await page.locator(`[data-contract-card="${i}"] [data-counter=decline]`).click();s=await read(page);expect(s.development.offers[i].amount).toBe(original);expect(s.development.offers[i].negotiation.status).toBe('declined');
 await fixture(page,'low');await request(page,0,'salary');s=await read(page);expect(s.development.offers[0].negotiation.status).toBe('rejected');const fixed=s.development.offers[0];await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');expect((await read(page)).development.offers[0]).toEqual(fixed);
});

test('role counter changes both salary and expectation only after acceptance',async({page})=>{
 await start(page);await fixture(page,'medium');let s=await read(page);let i=s.development.offers.findIndex(o=>o.role!=='core'&&o.need>=50&&o.interest>=45&&o.interest<70);
 // Independent player names alter club needs while keeping exactly the same season record.
 for(let n=0;i<0&&n<20;n++){await page.evaluate(n=>{state.name='역할협상'+n;state.contract15.markets={};state.globalCareer.offersReadyYear=null;render();save();},n);s=await read(page);i=s.development.offers.findIndex(o=>o.role!=='core'&&o.need>=50&&o.interest>=45&&o.interest<70);}
 expect(i).toBeGreaterThanOrEqual(0);const before=s.development.offers[i];await request(page,i,'role');s=await read(page);expect(s.development.offers[i].negotiation.status).toBe('pending');expect(s.development.offers[i].role).toBe(before.role);
 await page.locator(`[data-contract-card="${i}"] [data-counter=accept]`).click();s=await read(page);expect(s.development.offers[i].role).not.toBe(before.role);expect(s.development.offers[i].amount).toBeLessThan(before.amount);expect(s.development.offers[i].negotiation.status).toBe('accepted-counter');
});

test('remaining contract blocks fresh FA offers, advances once per year and expires correctly',async({page})=>{
 await start(page);await fixture(page);let s=await read(page);const i=s.development.offers.findIndex(o=>o.years>=3);expect(i).toBeGreaterThanOrEqual(0);const offer=s.development.offers[i];await page.check(`[name=contractPick][value="${i}"]`);await selectDirection(page);await page.click('#nextBtn');
 const end=(await read(page)).contract15.active.endYear;
 for(let y=2027;y<=end;y++){
  await page.click('[data-tab=league]');await finishSeason(page);await selectDirection(page);s=await read(page);const m=s.contract15.markets[y];
  if(y<end){expect(m.kind).toBe('continue');expect(s.development.offers).toHaveLength(1);expect(s.development.offers[0].team).toBe(offer.team);expect(s.development.offers[0].amount).toBe(offer.amount);await expect(page.locator('[data-negotiate]')).toHaveCount(0);
   await page.click('#nextBtn');s=await read(page);expect(s.development.contractYears).toBe(end-y);expect(s.contract15.active.endYear).toBe(end);await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');expect((await read(page)).development.contractYears).toBe(end-y);
  }else{expect(m.kind).toBe('renewal');expect(m.offers.length).toBeGreaterThanOrEqual(3);}
 }
 expect(new Set((await read(page)).contract15.history.map(x=>x.year)).size).toBe((await read(page)).contract15.history.length);
});

test('contract roles and league competition change actual early-season opportunities, then decay',async({page})=>{
 await start(page);const r=await page.evaluate(()=>{
  const original=JSON.parse(JSON.stringify(state)),random=Math.random;
  const run=role=>{state=JSON.parse(JSON.stringify(original));state.attributes.fill(60);state.contract15.active={...state.contract15.active,role,source:'negotiated',startYear:state.year};Math.random=()=>.65;play(7);const games=state.current.G;state.game=42;return {games,after:window.DiamondContracts.selectionAdjustment()};};
  try{return {core:run('core'),reserve:run('reserve')};}finally{state=original;Math.random=random;render();}
 });expect(r.core.games).toBeGreaterThan(r.reserve.games);expect(r.core.after).toBe(0);expect(r.reserve.after).toBe(0);
});

test('legacy completed-season offers and existing salary survive migration and slot changes',async({page})=>{
 await start(page);await fixture(page);await page.evaluate(()=>{
  const legacy=[{team:state.team,region:'KR',amount:12300,type:'stay'},{team:V5_CLUBS.JP[2],region:'JP',amount:45600,type:'fa'}];delete state.contract15;state.development.salary=7200;state.development.contractYears=1;state.development.offers=legacy;state.globalCareer.offersReadyYear=state.year;state.ui13.contracts[state.year]=1;save();
 });await page.reload();await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');let s=await read(page);expect(s.contract15.markets[2026].kind).toBe('legacy');expect(s.development.offers.map(o=>o.amount)).toEqual([12300,45600]);expect(s.development.salary).toBe(7200);await expect(page.locator('[name=contractPick][value="1"]')).toBeChecked();
 await page.click('#journeySettingsButton');await page.click('#diamondNew');await page.click('#startJourney');for(let n=0;n<3;n++)await page.click('#wizardNext');await page.click('button[type=submit]');s=await read(page);expect(s.contract15.history).toEqual([]);expect(s.contract15.active.annualSalary).toBe(3000);
 await page.click('#journeySettingsButton');await page.selectOption('#diamondSlotSelect','slot-1');await page.click('#diamondSwitch');await page.click('[data-tab=league]');s=await read(page);expect(s.development.offers.map(o=>o.amount)).toEqual([12300,45600]);expect(s.contract15.active.annualSalary).toBe(7200);
});

test('mobile contract comparison has no horizontal overflow and navigation retains negotiated terms',async({page})=>{
 await page.setViewportSize({width:390,height:844});await start(page);await fixture(page);const i=0;await request(page,i,'salary');const offer=(await read(page)).development.offers[i];await page.click('[data-tab=training]');await expect(page.locator('#contractSummary')).toBeVisible();await page.click('[data-tab=league]');await expect(page.locator('[data-contract-card="0"]')).toContainText(offer.amount.toLocaleString()+'만원');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
