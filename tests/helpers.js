async function runSeason(page,selector='#seasonBtn'){
 await page.click(selector);
 if(await page.locator('#seasonProgressDialog').isVisible()){
  const skip=page.locator('#skipSeasonAnimation');if(await skip.isEnabled()){try{await skip.click({timeout:1000});}catch(error){if(await page.locator('#seasonProgressDialog').isVisible())throw error;}}
  await page.locator('#seasonProgressDialog').waitFor({state:'hidden'});
 }
}
async function finishSeason(page){
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let step=0;step<100;step++){
  const status=await page.evaluate(()=>({game:state.game,pending:!!state.career14?.pending}));
  if(status.game>=144)return;
  if(status.pending)await page.locator('[data-career-choice]').first().click();
  else await runSeason(page);
 }
 throw Error('Season did not finish within 100 career decisions');
}
async function openDetails(page){
 for(const id of ['seasonDetailControls','weeklyPlans']){const detail=page.locator('#'+id);if(await detail.count()&&await detail.isVisible()&&!await detail.evaluate(e=>e.open))await detail.locator('summary').click();}
}
async function advanceGames(page,count){
 await openDetails(page);
 const target=Math.min(144,await page.evaluate(()=>state.game)+count);
 for(let step=0;step<100;step++){
  const s=await page.evaluate(()=>({game:state.game,pending:!!state.career14?.pending}));
  if(s.game>=target)return;
  if(s.pending)await page.locator('[data-career-choice]').first().click();
  else await page.click(target-s.game>=7?'#weekBtn':'#oneBtn');
 }
 throw Error('Requested team games did not finish');
}
async function confirmAdvance(page){
 await page.click('#nextBtn');
 if(await page.locator('#careerAdvanceDialog').isVisible())await page.click('#confirmCareerAdvance');
}
module.exports={finishSeason,advanceGames,openDetails,confirmAdvance,runSeason};
