const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const{chromium}=require(process.env.VOLT_PLAYWRIGHT_PATH||'playwright');const root=path.join(__dirname,'../..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=http.createServer((q,r)=>{const file=path.join(root,new URL(q.url,'http://local').pathname);fs.readFile(file.endsWith(path.sep)?file+'index.html':file,(e,b)=>{r.statusCode=e?404:200;if(q.url.split('?')[0].endsWith('.svg'))r.setHeader('Content-Type','image/svg+xml');r.end(e?'missing':b);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port+'/?debug&nointro');await p.waitForFunction(()=>window.__voltBootReady);await p.locator('#btnStart').click();await p.evaluate(()=>{window.__volt.noIntro=false;playCutscene(()=>enterHub());comic.auto=false;comic.cover=null;delete $('#cutscene').dataset.cover;comic.i=-1;storyNextComic();});await p.waitForFunction(()=>COMIC_BEATS.every(b=>comicImage(b.id).complete&&comicImage(b.id).naturalWidth));
 assert.equal(await p.evaluate(()=>COMIC_LETTERING.halo.speech[0].text),'Get behind me');assert.equal(await p.evaluate(()=>COMIC_LETTERING.gravemark.speech[3].text),'Target eliminated');
 const report=[];
 for(const size of [{width:1280,height:800},{width:667,height:375},{width:844,height:390},{width:390,height:844}]){
  await p.setViewportSize(size);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
  const result=await p.evaluate(()=>{
   const rows=[];comic.spread=null;comic.pageTurn=null;
   for(let i=0;i<COMIC_BEATS.length;i++){
    comic.i=i-1;storyNextComic();comic.auto=false;comic.loading=false;const b=COMIC_BEATS[i];
    for(const phase of b.frames||[0,1,2,3]){
     comic.phase=phase;comic.t=(b.frames?(phase===b.frames[0]?0:COMIC_TIMING.twoPanelChange):COMIC_TIMING.panelStarts[phase])+3.5;
     const panel=comicPanel(phase),box=comicView();comic.cam={x:panel.x+480,y:panel.y+270,z:Math.min(box.w/960,box.h/540)*.96};
     renderCinematic();const expected=!!COMIC_LETTERING[b.id]?.speech[phase],bubble=comic.lastBubble;
     if(expected&&!bubble)throw Error('Missing authored bubble '+b.id+' '+phase+' '+W+'x'+H);
     if(!expected&&bubble)throw Error('Unexpected bubble');
     if(bubble){const mouth=comicPoint(COMIC_LETTERING[b.id].speech[phase].mouth);if(Math.hypot(mouth.x-bubble.mouth.x,mouth.y-bubble.mouth.y)>.01)throw Error('Speaker reference detached');if(Math.hypot(mouth.x-bubble.tail.x,mouth.y-bubble.tail.y)<10)throw Error('Tail touches face');}
     comic.t-=2.3;renderCinematic();const impact=comic.lastImpact;
     rows.push({id:b.id,phase,expected,bubble,impact});
    }
   }return rows;
  });
  assert(result.filter(r=>r.bubble).length<result.length/3);assert(result.filter(r=>r.impact).length>=8,'Missing impact lettering');
  for(const row of result)for(const item of [row.bubble,row.impact].filter(Boolean)){assert(item.x>=item.view.x-1&&item.y>=item.view.y-1);if(row.bubble===item)assert(item.x+item.width<=item.view.x+item.view.w+1&&item.y+item.height<=item.view.y+item.view.h+1);}
  for(const [id,phase]of [['halo',0],['bastion',1],['glasswake',2],['redactor',3],['volt',3]]){
   await p.evaluate(({id,phase})=>{const i=COMIC_BEATS.findIndex(b=>b.id===id);comic.i=i-1;storyNextComic();comic.auto=false;comic.loading=false;comic.phase=phase;comic.t=COMIC_TIMING.panelStarts[phase]+(id==='halo'?3.5:1.3);const panel=comicPanel(phase),box=comicView();comic.cam={x:panel.x+480,y:panel.y+270,z:Math.min(box.w/960,box.h/540)*.96};renderCinematic();},{id,phase});await p.screenshot({path:path.join(out,`lettering-${id}-${size.width}.png`)});
  }
  report.push({size,rows:result});console.log('PASS selective lettering, authored mouth anchors, impacts',size.width,size.height);
 }
 assert(!fs.readFileSync(path.join(root,'js/comic-opening.js'),'utf8').includes('Halo leads the Vanguard'));assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'comic-lettering.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
