async function finishSeason(page){
 for(let step=0;step<100;step++){
  const status=await page.evaluate(()=>({game:state.game,pending:!!state.career14?.pending}));
  if(status.game>=144)return;
  if(status.pending)await page.locator('[data-career-choice]').first().click();
  else await page.click('#seasonBtn');
 }
 throw Error('Season did not finish within 100 career decisions');
}
module.exports={finishSeason};
