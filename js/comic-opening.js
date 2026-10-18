'use strict';
// The cover is an opening state, not a spoken story beat. Existing narration stays intact.
// Halo leads the Vanguard; preserve her first introduction after the team spread.
CUTSCENE.splice(0,CUTSCENE.length,...COMIC_BEATS.map(b=>({...b,who:'volt'})));
const COMIC_COVER=new Image();COMIC_COVER.src='assets/comic/volt-cover-v1.webp';
comicImage('halo');
const COMIC_SPREADS={heroes:new Image(),villains:new Image()};
COMIC_SPREADS.heroes.src='assets/comic/vanguard-spread-v1.webp';COMIC_SPREADS.villains.src='assets/comic/villains-spread-v1.webp';
const COVER_TIMING={hold:4.2,turn:1.8};
const storyPlayComic=playCutscene,storyNextComic=nextCutPanel,storyUpdateComic=updateCinematic,storyRenderComic=renderCinematic,storyEndComic=endCutscene;
playCutscene=function(done){storyPlayComic(done);if(!comic)return;stopVoice();comic.i=-1;comic.t=0;comic.cover={t:0,turning:false,turnT:0};$('#cutscene').dataset.cover='true';$('#csNext').textContent='Open comic →';};
function openComicBook(){if(!comic?.cover||comic.cover.turning||comic.cover.t<.8)return;comic.cover.turning=true;comic.cover.turnT=0;sfx('ui_move',{vol:.2});}
nextCutPanel=function(){
 if(comic?.cover){openComicBook();return;}if(!comic||comic.pageTurn)return;
 if(comic.spread){if(comic.spread.t<1.2)return;startComicPageTurn(comic.i+1);comic.spread=null;return;}
 if(comic.i>=0&&comic.i<COMIC_BEATS.length-1){
  if(comic.t<.35)return;startComicPageTurn(comic.i+1,comic.i===4&&!comic.villainsSpreadSeen?'villains':null);return;
 }
 storyNextComic();
};
function startComicPageTurn(to,spread=null){const snapshot=document.createElement('canvas');snapshot.width=cv.width;snapshot.height=cv.height;snapshot.getContext('2d').drawImage(cv,0,0);comic.pageTurn={t:0,to,spread,snapshot,box:comic.spread?spreadView():comicView()};comicImage(COMIC_BEATS[to].id);stopVoice();sfx('ui_move',{vol:.18});}
function beginComicSpread(kind){comic.spread={kind,t:0};if(kind==='villains')comic.villainsSpreadSeen=true;$('#cutscene').dataset.cover='spread';$('#csNext').textContent='Turn page →';}
endCutscene=function(){delete $('#cutscene').dataset.cover;storyEndComic();};
updateCinematic=function(dt){
 if(comic?.pageTurn){const tr=comic.pageTurn,im=tr.spread?COMIC_SPREADS[tr.spread]:comicImage(COMIC_BEATS[tr.to].id);if(!im.complete||!im.naturalWidth)return;tr.t+=dt;if(tr.t>=1.6){comic.pageTurn=null;if(tr.spread)beginComicSpread(tr.spread);else{delete $('#cutscene').dataset.cover;$('#csNext').textContent='Next scene →';storyNextComic();}}return;}
 if(comic?.spread){const im=COMIC_SPREADS[comic.spread.kind];if(im.complete&&im.naturalWidth)comic.spread.t+=dt;if(comic.auto&&comic.spread.t>=7)nextCutPanel();return;}
 if(!comic?.cover){storyUpdateComic(dt);return;}
 const c=comic.cover;if(!(COMIC_COVER.complete&&COMIC_COVER.naturalWidth)&&!COMIC_COVER.failed)return;
 c.t+=dt;if(!c.turning&&comic.auto&&c.t>=COVER_TIMING.hold)openComicBook();
 if(c.turning){const spread=COMIC_SPREADS.heroes;if(!spread.complete||!spread.naturalWidth)return;c.turnT+=dt;if(c.turnT>=COVER_TIMING.turn){comic.cover=null;beginComicSpread('heroes');}}
};
COMIC_COVER.onerror=()=>COMIC_COVER.failed=true;
function drawComicCover(){
 const c=comic.cover,turn=c.turning?clamp(c.turnT/COVER_TIMING.turn,0,1):0,ease=turn*turn*(3-2*turn),angle=ease*Math.PI;
 const h=Math.min(H-110,(W-48)*1.5,760),w=h*2/3,x=(W-w)/2,y=62+(H-76-h)/2;
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,Math.max(W,H)*.7);glow.addColorStop(0,'#223c54');glow.addColorStop(1,'#080d16');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=Math.min(1,c.t/1.1);ctx.shadowColor='#000';ctx.shadowBlur=28;ctx.shadowOffsetY=12;ctx.fillStyle='#eedfb9';ctx.fillRect(x,y,w,h);ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 if(c.turning){const im=COMIC_SPREADS.heroes;ctx.fillStyle='#171a24';ctx.fillRect(x+7,y+7,w-14,h-14);ctx.fillStyle='#f4e6c4';ctx.textAlign='center';ctx.font=`900 ${w*.11}px "Big Shoulders Display",Impact,sans-serif`;ctx.fillText('THE VANGUARD',x+w/2,y+h*.16);const ih=(w-18)*im.naturalHeight/im.naturalWidth;ctx.drawImage(im,x+9,y+(h-ih)/2,w-18,ih);ctx.font=`700 ${Math.max(10,w*.035)}px sans-serif`;ctx.fillText('THE PEOPLE WHO PROTECTED US',x+w/2,y+h*.88);}
 // Rotate about the binding. Narrow strips give the sheet a gentle bend as it turns.
 for(let i=0;i<48;i++){const u=i/48,v=(i+1)/48,bend=Math.sin(u*Math.PI)*Math.sin(angle)*w*.045,x0=x+u*w*Math.cos(angle),x1=x+v*w*Math.cos(angle),dy=bend;
  ctx.save();ctx.translate(x0,y+dy);ctx.transform((x1-x0)/(w/48),Math.sin(angle)*.025,0,1,0,0);
  if(angle<Math.PI/2&&COMIC_COVER.complete&&COMIC_COVER.naturalWidth)ctx.drawImage(COMIC_COVER,u*COMIC_COVER.naturalWidth,0,COMIC_COVER.naturalWidth/48+1,COMIC_COVER.naturalHeight,0,0,w/48+1,h);
  else{ctx.fillStyle='#d8cba7';ctx.fillRect(0,0,w/48+1,h);}ctx.restore();
 }
 ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h);ctx.stroke();ctx.restore();
 ctx.fillStyle='#c7d7df';ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.fillText(c.turning?'':comic.auto?'Issue #1 · Opening in a moment…':'Issue #1 · Tap Open comic to begin',W/2,H-12);
}
// Brief, unvoiced character speech accompanies the existing Volt narration.
// Each entry follows the four actions in that character's illustrated sequence.
const COMIC_BUBBLES={
 echo:[['echo','Duck. Yes, before you hear it.'],['echo','Your aim is extremely loud.'],['echo','Try pointing that somewhere useful.'],['echo',"You're welcome. Remember this bit."]],
 halo:[['halo',"Stay behind me. I've got you."],['halo','Eyes on me. Away from them.'],['halo','You want a target? Here.'],['halo',"Everyone out. I'm right behind you."]],
 bastion:[['bastion','Nobody gets past this point.'],['bastion','Stay together. Keep moving.'],['bastion','That was my six inches.'],['bastion',"Line held. Don't look so surprised."]],
 thorn:[['thorn','This way. Mind the roots.'],['thorn',"They're alive. Try asking nicely."],['thorn','You should have left them alone.'],['thorn',"Go. I'll keep the path open."]],
 patch:[['patch',"Nobody touch the exposed wire."],['patch','Of course it needs a bypass.'],['patch','Tools. Patience. Mild swearing.'],['patch',"There. Try not to break it."]],
 kilnheart:[['kilnheart','You call that a barricade?'],['kilnheart','Stand back. Or be moved.'],['kilnheart',"Let's open this district up."],['kilnheart',"Your heroes built nothing that lasts."]],
 bellwether:[['bellwether','Everyone quiet. My turn.'],['bellwether',"Let's hear the city crack."],['bellwether','No talking over the performance.'],['bellwether',"Still breathing? There's an encore."]],
 verdigris:[['verdigris','Such faith in solid walls.'],['verdigris','Steel gives way. So will you.'],['verdigris','Look how easily it comes apart.'],['verdigris',"Nothing you hide behind will last."]],
 glasswake:[['glasswake',"Certain that's me?"],['glasswake','A little further. Nearly there.'],['glasswake','Wrong again.'],['glasswake',"I only need you to hesitate."]],
 undertow:[['undertow','The docks are closed.'],['undertow',"Careful. Nothing here holds steady."],['undertow','Down you go.'],['undertow',"Take your time getting up."]],
 gravemark:[['gravemark','Small steps. Small hero.'],['gravemark','The roof comes to me.'],['gravemark','Nowhere higher to run.'],['gravemark','Stay down. Save the city time.']],
 redactor:[['redactor','How reassuring. A registered hero.'],['redactor',"You may stop struggling now."],['redactor','I prefer a quieter city.'],['redactor',"There. Doesn't that feel orderly?"]],
 volt:[['volt',"Okay. Heavy sign. Very heavy sign."],['volt',"I can help. Just… give me a second."],['volt','Please work. People are watching.'],['volt',"All good! Mostly. We're mostly good."]],
 crisis:[['volt',"That's my street."],['volt',"They need help out there."],['volt',"Right. Fortress. Ask the professionals."],['volt',"Nerves later. People first."]],
 arrival:[['volt',"Front door. Obviously locked."],['volt',"Sixty floors. Great first impression."],['patch',"No registered signature. Interesting."],['volt',"Training first. Extremely fair, actually."]],
};
const BUBBLE_ANCHORS={echo:[.72,.78,.43,.25],halo:[.23,.78,.55,.36],bastion:[.75,.2,.5,.43],thorn:[.73,.2,.46,.4],patch:[.72,.2,.44,.4],volt:[.72,.2,.4,.48],arrival:[.25,.2,.5,.5]};
function drawComicBubble(){
 if(!comic||comic.cover||comic.spread||comic.loading||comic.t<(COMIC_CHAPTERS[comic.i]?3.3:1.3))return;
 const b=COMIC_BEATS[comic.i],entry=COMIC_BUBBLES[b.id]?.[comic.phase];if(!entry)return;
 const [who,line]=entry,p=comicPanel(comic.phase),box=comicView(),a=BUBBLE_ANCHORS[b.id]||[.25,.2,.55,.5],z=comic.cam.z;
 const font=clamp(Math.min(W,H)*.036,13,19),width=Math.min(270,Math.max(155,box.w*.32)),lines=[];ctx.font=`700 ${font}px "Chakra Petch",sans-serif`;
 let current='';for(const word of line.split(' ')){const next=current?current+' '+word:word;if(ctx.measureText(next).width>width-28&&current){lines.push(current);current=word;}else current=next;}if(current)lines.push(current);
 const height=lines.length*font*1.22+31,x=clamp(box.x+box.w/2+(p.x+p.w*a[0]-comic.cam.x)*z-width/2,box.x+8,box.x+box.w-width-8),y=clamp(box.y+box.h/2+(p.y+p.h*a[1]-comic.cam.y)*z-height/2,box.y+8,box.y+box.h-height-16);
 const tx=clamp(box.x+box.w/2+(p.x+p.w*a[2]-comic.cam.x)*z,x+12,x+width-12),targetY=box.y+box.h/2+(p.y+p.h*a[3]-comic.cam.y)*z,above=targetY<y,edge=above?y:y+height,ty=above?Math.max(box.y+3,y-36):Math.min(box.y+box.h-3,y+height+36);
 ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();ctx.fillStyle='#fff9e9';ctx.strokeStyle='#080b10';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,width,height,16);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(x+width*.35,edge+(above?2:-2));ctx.lineTo(tx,ty);ctx.lineTo(x+width*.35+18,edge+(above?2:-2));ctx.fill();ctx.stroke();ctx.fillRect(x+width*.35+2,edge-3,14,6);
 ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#46515a';ctx.font='800 10px sans-serif';ctx.fillText((SPEAKERS[who]?.name||who).toUpperCase(),x+14,y+8);ctx.fillStyle='#121821';ctx.font=`700 ${font}px "Chakra Petch",sans-serif`;lines.forEach((s,i)=>ctx.fillText(s,x+14,y+23+i*font*1.22));ctx.restore();
 comic.lastBubble={who,line,x,y,width,height,view:box};
}
function drawComicPageTurn(){
 const tr=comic.pageTurn,box=tr.box,progress=clamp(tr.t/1.6,0,1),ease=progress*progress*(3-2*progress),angle=ease*Math.PI,im=tr.spread?COMIC_SPREADS[tr.spread]:comicImage(COMIC_BEATS[tr.to].id);
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();ctx.fillStyle='#e7d8b3';ctx.fillRect(box.x,box.y,box.w,box.h);
 const ratio=Math.min((box.w-18)/im.naturalWidth,(box.h-18)/im.naturalHeight),w=im.naturalWidth*ratio,h=im.naturalHeight*ratio;ctx.drawImage(im,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h);
 for(let i=0;i<56;i++){const u=i/56,v=(i+1)/56,x0=box.x+u*box.w*Math.cos(angle),x1=box.x+v*box.w*Math.cos(angle),bend=Math.sin(u*Math.PI)*Math.sin(angle)*12;
  ctx.save();ctx.translate(x0,box.y+bend);ctx.scale((x1-x0)/(box.w/56),1);
  if(angle<Math.PI/2)ctx.drawImage(tr.snapshot,(box.x+u*box.w)*DPR,box.y*DPR,(box.w/56+1)*DPR,box.h*DPR,0,0,box.w/56+1,box.h);
  else{ctx.fillStyle='#dfd0ab';ctx.fillRect(0,0,box.w/56+1,box.h);}ctx.restore();
 }
 const shadow=ctx.createLinearGradient(box.x,0,box.x+Math.max(20,box.w*Math.max(0,Math.cos(angle))),0);shadow.addColorStop(0,'rgba(0,0,0,.35)');shadow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=shadow;ctx.fillRect(box.x,box.y,box.w,box.h);ctx.restore();
}
function spreadView(){return{x:14,y:66,w:W-28,h:H-102};}
function drawComicSpread(){const s=comic.spread,im=COMIC_SPREADS[s.kind],box=spreadView();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);if(!im.complete||!im.naturalWidth)return;const ratio=Math.min(box.w/im.naturalWidth,(box.h-55)/im.naturalHeight),w=im.naturalWidth*ratio,h=im.naturalHeight*ratio,x=(W-w)/2,y=box.y+(box.h-h)/2;ctx.drawImage(im,x,y,w,h);ctx.strokeStyle='#e7d8b3';ctx.lineWidth=3;ctx.strokeRect(x-3,y-3,w+6,h+6);ctx.fillStyle=s.kind==='heroes'?'#eecf79':'#e68176';ctx.textAlign='center';ctx.font='900 '+clamp(W*.033,20,36)+'px "Big Shoulders Display",Impact,sans-serif';ctx.fillText(s.kind==='heroes'?'THE VANGUARD':'THE CITY UNDER SIEGE',W/2,box.y+3);ctx.fillStyle='#d8e1e6';ctx.font='600 '+clamp(W*.016,11,15)+'px sans-serif';ctx.fillText(s.kind==='heroes'?'Halo leads. Bastion, Echo, Thorn and Patch stand with her.':'The Redactor and the villains taking the city.',W/2,H-13);}
renderCinematic=function(){if(comic?.cover){drawComicCover();return;}if(comic?.pageTurn){drawComicPageTurn();return;}if(comic?.spread){drawComicSpread();return;}storyRenderComic();drawComicBubble();};
