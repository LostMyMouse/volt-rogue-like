const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const{chromium}=require(process.env.VOLT_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=http.createServer((q,r)=>{let file=path.join(root,new URL(q.url,'http://local').pathname);if(file.endsWith(path.sep))file+='index.html';if(file.endsWith('.svg'))r.setHeader('Content-Type','image/svg+xml');fs.readFile(file,(e,b)=>{r.statusCode=e?404:200;r.end(e?'missing':b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.VOLT_TEST_URL||'http://127.0.0.1:'+server.address().port+'/?debug&nointro');await p.waitForFunction(()=>window.__voltBootReady);await p.locator('#btnStart').click();await p.waitForFunction(()=>COMIC_COVER.complete&&COMIC_COVER.naturalWidth&&VANGUARD_WORDMARK.naturalWidth&&Object.values(COMIC_SPREADS).every(im=>im.complete&&im.naturalWidth));
 for(const size of[{width:1280,height:800},{width:667,height:375},{width:844,height:390},{width:390,height:844}]){
  await p.setViewportSize(size);await p.waitForFunction(s=>W===s.width&&H===s.height,size);await p.evaluate(()=>{window.__volt.noIntro=false;playCutscene(()=>enterHub());comic.auto=false;comic.cover.t=1.2;renderCinematic();});
  const closed=await p.evaluate(()=>({book:comicBookRect(),cover:coverRect(0)}));await p.screenshot({path:path.join(out,`book-closed-${size.width}.png`)});
  await p.locator('#csNext').click();await p.waitForFunction(()=>comic.cover?.zoomT>=.35&&!comic.cover.front);
  const zoom=await p.evaluate(()=>({progress:comic.cover.zoomT,front:!!comic.cover.front,rect:coverRect(comic.cover.zoomT/COVER_TIMING.zoom)}));assert(zoom.rect.w>closed.cover.w&&!zoom.front);await p.screenshot({path:path.join(out,`book-zoom-${size.width}.png`)});
  await p.waitForFunction(()=>comic.cover?.front&&comic.cover.turnT>.25);
  const turn=await p.evaluate(()=>({book:comicBookRect(),zoom:comic.cover.zoomT,turn:comic.cover.turnT,full:coverRect(1)}));assert.deepEqual(turn.book,closed.book);assert.equal(turn.zoom,.9);assert(Math.abs(turn.full.w-turn.book.w)<.01);await p.screenshot({path:path.join(out,`book-opening-turn-${size.width}.png`)});
  await p.waitForFunction(()=>comic.spread?.kind==='heroes');assert.deepEqual(await p.evaluate(()=>comicBookRect()),closed.book);await p.screenshot({path:path.join(out,`book-vanguard-${size.width}.png`)});
  await p.evaluate(()=>comic.spread.t=2);await p.locator('#csNext').click();await p.waitForFunction(()=>!comic.pageTurn&&comic.i===0);
  const before=await p.evaluate(()=>({box:comicView(),z:comic.cam.z}));await p.waitForTimeout(500);const after=await p.evaluate(()=>({box:comicView(),z:comic.cam.z}));assert.deepEqual(before.box,closed.book);assert.deepEqual(after.box,closed.book);assert(Math.abs(before.z-after.z)<.001,'Incoming page must not jump to an overview zoom');await p.screenshot({path:path.join(out,`book-halo-${size.width}.png`)});
  await p.evaluate(()=>{comic.i=4;beginComicSpread('villains');comic.spread.t=5.2;comic.auto=true;});await p.waitForFunction(()=>!!comic.pageTurn,{},{timeout:2500});assert.equal(await p.evaluate(()=>SPREAD_HOLD.villains),6);await p.locator('#csSkip').click();await p.waitForFunction(()=>state==='hub');console.log('PASS real cover tap → zoom → full-frame turn → Vanguard → same-size action page; six-second villain spread',size.width,size.height);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
