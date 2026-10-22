const {test,expect}=require('@playwright/test');
async function create(page,role='batter',college=false){await page.goto('./');await page.click('#startJourney');await page.click('#wizardNext');await page.selectOption('#role',role);if(college)await page.check('[name=amateurPath][value=college]');await page.click('#wizardNext');await page.click('#wizardNext');await page.click('button[type=submit]');}
for(const role of ['batter','pitcher'])test(`season landmarks derive from current ${role} records and survive stop/resume without rewards`,async({page})=>{
 await create(page,role);await page.click('[data-tab=league]');
 const result=await page.evaluate(role=>{
  state.game=72;state.current.G=20;if(role==='batter'){state.current.H=103;state.current.HR=12;state.current.RBI=38;}else{state.current.PK=103;state.current.W=12;state.current.SV=0;}
  let draws=0;Math.random=()=>{draws++;return .6;};save();render();
  const before=JSON.stringify({current:state.current,attributes:state.attributes}),capture=()=>document.querySelector('#seasonLandmarks25').innerText;
  document.querySelector('#seasonBtn').click();const first=capture();document.querySelector('#stopSeasonRun').click();document.querySelector('#continueCareer').click();const second=capture();document.querySelector('#stopSeasonRun').click();
  return {first,second,draws,before,after:JSON.stringify({current:state.current,attributes:state.attributes}),game:state.game,remaining:state.career14.remaining};
 },role);
 expect(result.first).toBe(result.second);expect(result.game).toBe(72);expect(result.remaining).toBe(72);expect(result.draws).toBe(0);expect(result.after).toBe(result.before);
 expect(result.first).toContain(role==='batter'?'시즌 100안타 달성':'시즌 100탈삼진 달성');expect(result.first).toContain(role==='batter'?'현재 103안타':'현재 103탈삼진');expect(result.first).not.toContain('세이브');
 await page.reload();await expect(page.locator('#homeSeason25 progress')).toHaveAttribute('value','72');
});
for(const width of [320,390,1366])test(`season stage keeps progress, portrait, details and stop controls usable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844});await create(page);const before=await page.evaluate(()=>JSON.stringify(state));await expect(page.locator('#homeSeason25 progress')).toHaveAttribute('max','144');await page.click('#homeSeason25');await expect(page.locator('#seasonPortrait25')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before);
 await page.click('#seasonBtn');await expect(page.locator('#stopSeasonRun')).toBeInViewport();await expect(page.locator('#skipSeasonAnimation')).toBeInViewport();await page.click('#seasonRunDetails25 summary');await expect(page.locator('#seasonRunStats')).toBeVisible();await page.press('#stopSeasonRun','Escape');await expect(page.locator('#seasonProgressDialog')).not.toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('college home uses 36 actual games and retirement removes the progress entry',async({page})=>{
 await create(page,'batter',true);await expect(page.locator('#homeSeason25 progress')).toHaveAttribute('max','36');await page.click('#homeSeason25');await page.click('#collegeFour');await page.click('[data-tab=dashboard]');await expect(page.locator('#homeSeason25 progress')).toHaveAttribute('value','4');
 const before=await page.evaluate(()=>JSON.stringify(state));await page.click('#homeSeason25');await page.click('[data-tab=dashboard]');expect(await page.evaluate(()=>JSON.stringify(state))).toBe(before);
 await page.evaluate(()=>{state.retired=true;render();});await expect(page.locator('#homeSeason25')).not.toBeVisible();
});
