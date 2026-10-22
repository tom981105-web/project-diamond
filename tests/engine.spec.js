const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('./');await expect(page.locator('#createForm')).not.toHaveAttribute('inert','');await page.click('#startJourney');for(let i=0;i<3;i++)await page.click('#wizardNext');await page.click('button[type=submit]');});
test('singles advance each existing runner one base; grand slam scores four',async({page})=>{
  const result=await page.evaluate(()=>{
    const original=atBat;const lineup=Array.from({length:9},()=>({name:'검증',user:false}));
    const run=sequence=>{let i=0;atBat=()=>sequence[i++]||'OUT';return halfInning(lineup,{index:0},62,{}).runs;};
    try{return {singles:run(['1B','1B','1B','OUT','OUT','OUT']),slam:run(['BB','BB','BB','HR','OUT','OUT','OUT']),loadedWalk:run(['BB','BB','BB','BB','OUT','OUT','OUT'])};}finally{atBat=original;}
  });
  expect(result).toEqual({singles:0,slam:4,loadedWalk:1});
});
for(const position of ['선발투수','중간계투','마무리투수'])test(`pitch quality and recorded innings agree (${position})`,async({page})=>{
  const result=await page.evaluate(position=>{
    state.role='pitcher';state.position=position;state.attributes=[10,10,10,10,10,10];
    const original=atBat,random=Math.random;Math.random=()=>0;
    try{return [true,false].map(home=>{
      state.current=empty();state.game=0;state.team=TEAMS[home?0:1];const qualities=[];
      atBat=(b,q)=>{qualities.push(q);return 'SO';};gameMatch(0,1,true);
      return {outs:state.current.IPouts,k:state.current.PK,lowQualityPA:qualities.filter(q=>q===10).length};
    });}finally{atBat=original;Math.random=random;}
  },position);
  const outs=position==='선발투수'?18:3;
  expect(result).toEqual([{outs,k:outs,lowQualityPA:outs},{outs,k:outs,lowQualityPA:outs}]);
});

test('sacrifice fly needs a runner on third and fewer than two outs; loaded walk credits RBI',async({page})=>{
  const result=await page.evaluate(()=>{
    const original=atBat;const lineup=Array.from({length:9},()=>({name:state.name,user:true}));
    const run=sequence=>{state.current=empty();let i=0;atBat=()=>sequence[i++]||'OUT';halfInning(lineup,{index:0},62,{});return {AB:state.current.AB,PA:state.current.PA,RBI:state.current.RBI};};
    try{return [run(['SF','OUT','OUT']),run(['3B','OUT','OUT','SF']),run(['3B','SF','OUT','OUT']),run(['BB','BB','BB','BB','OUT','OUT','OUT'])];}finally{atBat=original;}
  });
  expect(result).toEqual([{AB:3,PA:3,RBI:0},{AB:4,PA:4,RBI:0},{AB:3,PA:4,RBI:1},{AB:3,PA:7,RBI:1}]);
});

test('release scripts use one cache version',async({page})=>{
  const scripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>new URL(n.src).searchParams.get('v')));
  expect(scripts.length).toBeGreaterThan(10);expect(new Set(scripts)).toEqual(new Set(['2.5']));
});
