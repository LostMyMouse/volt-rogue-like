// Controlled progression smoke test. Enemies are deliberately defeated by the harness;
// this validates every room/reward/state transition, not combat balance or human skill.
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');const{chromium}=require(process.env.VOLT_PLAYWRIGHT_PATH||'playwright'),root=path.join(__dirname,'../..');
(async()=>{const server=http.createServer((q,r)=>{let rel=new URL(q.url,'http://local').pathname;if(rel.endsWith('/'))rel+='index.html';if(rel.endsWith('.svg'))r.setHeader('Content-Type','image/svg+xml');fs.readFile(path.join(root,rel),(e,b)=>{r.statusCode=e?404:200;r.end(e?'missing':b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/?debug&nointro');await p.waitForFunction(()=>window.__voltBootReady);await p.locator('#btnStart').click();
const runs=await p.evaluate(()=>{const report=[],random=Math.random;try{let seed=9447;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};save.unlocked=SAVE_STYLES.slice();save.seenIntro=2;save.wins=1;save.runs=6;save.unitIntel={lockjaw:1,relay:1};
for(const weapon of SAVE_STYLES){save.style=weapon;startGame();const encountered=new Set(),kinds=new Set();let steps=0,purchases=0,creditsEarned=0;
while(!run.won&&steps++<5000){
 if(state==='map'){chooseDistrict(run.route.pendingDistrict);continue;}
 if(state==='draft'){const hybrid=draftCards.findIndex(c=>c.kind==='hybrid'),passive=draftCards.findIndex(c=>c.kind==='boon'&&BOON_BY_ID[c.id].slot==='passive');pickCard(hybrid>=0?hybrid:passive>=0?passive:0);continue;}
 if(state==='dialogue'||state==='hubtalk'){talk.t=0;advanceTalk();continue;}
 if(state==='intro'){dismissIntro();continue;}
 if(state==='transit'){updateTransit(.12);continue;}
 if(state!=='play')throw Error('Unexpected '+weapon+' '+state);
 if(run.pendingTransition){advanceDistrictTransition(2);continue;}
 if(roomPhase==='shop'){for(let i=0;i<shop.offers.length;i++){const o=shop.offers[i];if(!o.sold&&run.credits>=o.cost&&o.type!=='health'){player.x=SHOP_SPOTS[i].x;player.y=SHOP_SPOTS[i].y;buyShopOffer(i);purchases++;if(state!=='play')break;}}if(state!=='play')continue;jumpTo(exits[0]);continue;}
 if(roomPhase==='exits'){jumpTo(exits[0]);continue;}
 if(roomPhase==='reward'){arrivalT=.01;update(.03);continue;}
 if(roomPhase==='cleared'){clearT=.01;update(.03);continue;}
 if(roomPhase==='fight'){
  for(const e of enemies.slice()){if(e.dead)continue;kinds.add(e.kind);if(e.isBoss){encountered.add(e.kind);e.invuln=false;bossSetState(e,'EXPOSED');}damageEnemy(e,1e7,0,0,0,{src:'power'});}
  for(const drop of fieldDrops.slice()){const before=run.credits;player.x=drop.x;player.y=drop.y;drop.t=1;updateFieldDrops(.01);creditsEarned+=run.credits-before;}
  player.x=750;player.y=450;player.iT=100;update(.03);continue;
 }
 update(.03);
}
if(!run.won||state!=='over')throw Error('Operation did not finish '+weapon+' '+state+' '+roomPhase);
if(run.roomsCleared!==routeLength())throw Error('Wrong completed room denominator '+weapon+' '+run.roomsCleared+'/'+routeLength());
if(save.checkpoint)throw Error('Victory left active checkpoint');if(encountered.size!==5)throw Error('Boss count');if(!kinds.has('lockjaw')||!kinds.has('relay'))throw Error('Missing advanced units');
report.push({weapon,rooms:run.roomsCleared,bosses:[...encountered],shops:run.shopsVisited.length,purchases,creditsEarned,hybrids:run.hybrids,rank:$('#resRank').textContent,steps});
}return report;}finally{Math.random=random;}});
for(const r of runs){assert.equal(r.shops,5);assert(r.purchases>0);assert(r.creditsEarned>0);}assert(runs.some(r=>r.hybrids.length>0),'No hybrid offered across five seeded operations');assert.deepEqual(errors,[]);fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,'test-results/operation-flow.json'),JSON.stringify(runs,null,2));console.log('PASS five complete controlled operations, all district/shop/boss transitions, purchases, advanced units, in-run hybrids, results and cleared checkpoints',runs);
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
