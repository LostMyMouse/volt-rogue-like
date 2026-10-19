'use strict';
// The cover is an opening state, not a spoken story beat. Existing narration stays intact.
// Preserve Halo’s first introduction after the team spread.
CUTSCENE.splice(0,CUTSCENE.length,...COMIC_BEATS.map(b=>({...b,who:'volt'})));
const COMIC_COVER=new Image();COMIC_COVER.src='assets/comic/volt-cover-v1.webp';
comicImage('halo');
const COMIC_SPREADS={heroes:new Image(),villains:new Image()};
COMIC_SPREADS.heroes.src='assets/comic/vanguard-spread-v1.webp';COMIC_SPREADS.villains.src='assets/comic/villains-spread-v1.webp';
const VANGUARD_WORDMARK=new Image();VANGUARD_WORDMARK.src='assets/comic/vanguard-wordmark.svg';
const COVER_TIMING={hold:4.2,turn:1.6};
const COMIC_PAGE_TURN=1.45,SPREAD_HOLD={heroes:18,villains:14};
const storyPlayComic=playCutscene,storyNextComic=nextCutPanel,storyUpdateComic=updateCinematic,storyRenderComic=renderCinematic,storyEndComic=endCutscene;
playCutscene=function(done){storyPlayComic(done);if(!comic)return;stopVoice();comic.i=-1;comic.t=0;comic.cover={t:0,turning:false,turnT:0};$('#cutscene').dataset.cover='true';$('#csNext').textContent='Open comic →';};
function openComicBook(){if(!comic?.cover||comic.cover.turning||comic.cover.t<.8)return;comic.cover.turning=true;comic.cover.turnT=0;const front=document.createElement('canvas');front.width=cv.width;front.height=cv.height;front.getContext('2d').drawImage(cv,0,0);comic.cover.front=front;sfx('ui_move',{vol:.2});}
nextCutPanel=function(){
 if(comic?.cover){openComicBook();return;}if(!comic||comic.pageTurn)return;
 if(comic.spread){if(comic.spread.t<1.2)return;startComicPageTurn(comic.i+1);comic.spread=null;return;}
 if(comic.i>=0&&comic.i<COMIC_BEATS.length-1){
  if(comic.t<.35)return;startComicPageTurn(comic.i+1,comic.i===4&&!comic.villainsSpreadSeen?'villains':null);return;
 }
 storyNextComic();
};
function startComicPageTurn(to,spread=null){const snapshot=document.createElement('canvas');snapshot.width=cv.width;snapshot.height=cv.height;snapshot.getContext('2d').drawImage(cv,0,0);comic.pageTurn={t:0,to,spread,snapshot,box:comic.spread?{x:14,y:45,w:W-28,h:H-60}:comicView()};comicImage(COMIC_BEATS[to].id);stopVoice();sfx('ui_move',{vol:.18});}
function beginComicSpread(kind){comic.spread={kind,t:0};if(kind==='villains')comic.villainsSpreadSeen=true;$('#cutscene').dataset.cover='spread';$('#csNext').textContent='Turn page →';}
endCutscene=function(){delete $('#cutscene').dataset.cover;storyEndComic();};
updateCinematic=function(dt){
 if(comic?.pageTurn){const tr=comic.pageTurn,im=tr.spread?COMIC_SPREADS[tr.spread]:comicImage(COMIC_BEATS[tr.to].id);if(!im.complete||!im.naturalWidth)return;tr.t+=dt;if(tr.t>=COMIC_PAGE_TURN){comic.pageTurn=null;if(tr.spread)beginComicSpread(tr.spread);else{delete $('#cutscene').dataset.cover;$('#csNext').textContent='Next scene →';storyNextComic();}}return;}
 if(comic?.spread){const im=COMIC_SPREADS[comic.spread.kind];if(im.complete&&im.naturalWidth)comic.spread.t+=dt;if(comic.auto&&comic.spread.t>=SPREAD_HOLD[comic.spread.kind])nextCutPanel();return;}
 if(!comic?.cover){storyUpdateComic(dt);return;}
 const c=comic.cover;if(!(COMIC_COVER.complete&&COMIC_COVER.naturalWidth)&&!COMIC_COVER.failed)return;
 c.t+=dt;if(!c.turning&&comic.auto&&c.t>=COVER_TIMING.hold)openComicBook();
 if(c.turning){const spread=COMIC_SPREADS.heroes;if(!spread.complete||!spread.naturalWidth)return;c.turnT+=dt;if(c.turnT>=COVER_TIMING.turn){comic.cover=null;beginComicSpread('heroes');}}
};
COMIC_COVER.onerror=()=>COMIC_COVER.failed=true;
function coverRect(){const h=Math.min(H-110,(W-48)*1.5,760);return{x:(W-h*2/3)/2,y:62+(H-76-h)/2,w:h*2/3,h};}
// A visible turning leaf: curved fold, paper underside and moving shadow.
function paintPaperCurl(front,box,progress){
 const p=clamp(progress,0,1),ease=p*p*(3-2*p),edge=box.x+box.w*(1-ease),fold=Math.sin(p*Math.PI)*Math.min(115,box.w*.20),lift=Math.sin(p*Math.PI)*Math.min(22,box.h*.08);
 ctx.save();if(reduceMotion){ctx.globalAlpha=1-p;ctx.drawImage(front,0,0,front.width,front.height,0,0,W,H);ctx.restore();return;}
 ctx.beginPath();ctx.rect(box.x,box.y,Math.max(0,edge-box.x),box.h);ctx.clip();ctx.drawImage(front,0,0,front.width,front.height,0,0,W,H);ctx.restore();
 if(p<=0||p>=1)return;ctx.save();ctx.beginPath();ctx.rect(box.x-2,box.y-24,box.w+4,box.h+48);ctx.clip();
 const shade=ctx.createLinearGradient(edge-fold*.2,0,edge+fold+22,0);shade.addColorStop(0,'rgba(0,0,0,.48)');shade.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=shade;ctx.fillRect(edge-fold*.2,box.y,fold*1.2+22,box.h);
 const paper=ctx.createLinearGradient(edge-fold*.28,0,edge+fold,0);paper.addColorStop(0,'#ae9e7f');paper.addColorStop(.25,'#f8eed4');paper.addColorStop(.7,'#e2d1ac');paper.addColorStop(1,'#897a64');ctx.fillStyle=paper;ctx.strokeStyle='#29252a';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(edge,box.y);ctx.bezierCurveTo(edge+fold*.9,box.y-lift,edge+fold,box.y+box.h*.24,edge+fold,box.y+box.h*.5);ctx.bezierCurveTo(edge+fold,box.y+box.h*.76,edge+fold*.9,box.y+box.h+lift,edge,box.y+box.h);ctx.bezierCurveTo(edge-fold*.28,box.y+box.h*.74,edge-fold*.28,box.y+box.h*.26,edge,box.y);ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(255,250,227,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(edge+2,box.y+2);ctx.bezierCurveTo(edge+fold*.85,box.y-lift+3,edge+fold-3,box.y+box.h*.25,edge+fold-3,box.y+box.h*.5);ctx.stroke();ctx.restore();
}
function drawComicCover(){
 const c=comic.cover,box=coverRect();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);
 if(c.turning){paintComicSpread('heroes',0);if(c.front)paintPaperCurl(c.front,box,c.turnT/COVER_TIMING.turn);return;}
 ctx.save();ctx.globalAlpha=Math.min(1,c.t/1.1);ctx.shadowColor='#000';ctx.shadowBlur=24;ctx.shadowOffsetY=10;
 if(COMIC_COVER.complete&&COMIC_COVER.naturalWidth)ctx.drawImage(COMIC_COVER,box.x,box.y,box.w,box.h);ctx.restore();ctx.fillStyle='#c7d7df';ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.fillText(comic.auto?'Issue #1 - Opening in a moment...':'Issue #1 - Tap Open comic to begin',W/2,H-12);
}
function drawComicPageTurn(){
 const tr=comic.pageTurn,box=tr.box,im=tr.spread?COMIC_SPREADS[tr.spread]:comicImage(COMIC_BEATS[tr.to].id);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);
 if(tr.spread)paintComicSpread(tr.spread,0);else{const ratio=Math.min((box.w-18)/im.naturalWidth,(box.h-18)/im.naturalHeight),w=im.naturalWidth*ratio,h=im.naturalHeight*ratio;ctx.drawImage(im,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);}
 paintPaperCurl(tr.snapshot,box,tr.t/COMIC_PAGE_TURN);
}
function spreadView(){const top=H<450?110:140;return{x:14,y:top,w:W-28,h:Math.max(80,H-top-20)};}
function spreadCamera(){return{x:.5,y:.5,z:1};}
function paintComicSpread(kind,t){
 const im=COMIC_SPREADS[kind],box=spreadView();if(!im.complete||!im.naturalWidth)return;
 const ratio=Math.min(box.w/im.naturalWidth,box.h/im.naturalHeight),w=im.naturalWidth*ratio,h=im.naturalHeight*ratio,x=(W-w)/2,y=box.y+(box.h-h)/2;
 ctx.drawImage(im,x,y,w,h);ctx.strokeStyle='#e7d8b3';ctx.lineWidth=2;ctx.strokeRect(x-2,y-2,w+4,h+4);
 if(kind==='heroes'&&VANGUARD_WORDMARK.complete&&VANGUARD_WORDMARK.naturalWidth){const lw=Math.min(W-70,H<450?390:580),lh=lw*130/900;ctx.drawImage(VANGUARD_WORDMARK,(W-lw)/2,box.y-lh-7,lw,lh);}
 else{ctx.fillStyle='#e68176';ctx.textAlign='center';ctx.font='900 '+clamp(W*.033,20,36)+'px "Big Shoulders Display",Impact,sans-serif';ctx.fillText(kind==='heroes'?'THE VANGUARD':'THE CITY UNDER SIEGE',W/2,box.y-14);}
}
function drawComicSpread(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);paintComicSpread(comic.spread.kind,comic.spread.t);}
renderCinematic=function(){if(comic?.cover){drawComicCover();return;}if(comic?.pageTurn){drawComicPageTurn();return;}if(comic?.spread){drawComicSpread();return;}storyRenderComic();drawComicLettering();};
