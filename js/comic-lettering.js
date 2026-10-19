'use strict';
// Mouths, balloons and impacts are authored against each 960×540 illustration,
// not against the screen. The page camera projects all three together.
// These printed lines are unvoiced; Volt's recorded narration is unchanged.
const COMIC_LETTERING={
 halo:{speech:{0:{text:'Behind me. Keep moving.',mouth:[0.394,0.252],at:[.72,.12]}}},
 bastion:{speech:{3:{text:'Everyone through?',mouth:[0.604,0.237],at:[.20,.15]}}},
 echo:{speech:{0:{text:'Down. Now.',mouth:[0.41,0.241],at:[.74,.13]}}},
 thorn:{speech:{3:{text:'The way is clear. Go.',mouth:[0.61,0.122],at:[.20,.13]}}},
 patch:{speech:{3:{text:'Try it now.',mouth:[0.804,0.63],at:[.79,.25]}}},
 kilnheart:{speech:{1:{text:'Move.',mouth:[0.452,0.411],at:[.78,.13]}}},
 bellwether:{speech:{0:{text:'Listen.',mouth:[0.39,0.185],at:[.16,.13]}}},
 verdigris:{speech:{}},
 glasswake:{speech:{2:{text:'Wrong one.',mouth:[0.417,0.196],at:[.76,.12]}}},
 undertow:{speech:{0:{text:'The docks are mine.',mouth:[0.335,0.163],at:[.80,.13]}}},
 gravemark:{speech:{3:{text:'Stay down.',mouth:[0.55,0.207],at:[.79,.14]}}},
 redactor:{speech:{3:{text:'You can rest now.',mouth:[0.831,0.163],at:[.40,.13]}}},
 volt:{speech:{3:{text:'Just glad you’re okay.',mouth:[0.585,0.215],at:[.18,.13]}}},
 crisis:{speech:{0:{text:'That’s our street.',mouth:[0.473,0.311],at:[.76,.13]}}},
 arrival:{speech:{3:{text:'We start with the basics.',mouth:[.26,.19],at:[.78,.12]}}},
};
// Short bursts at the illustrated contact points, with ink shadows and halftone.
// Quiet/threatening scenes deliberately have no impact lettering.
const COMIC_IMPACTS={
 halo:{phase:2,text:'KRAK!',at:[.69,.48],colour:'#ffd15b',angle:-.13},
 bastion:{phase:1,text:'KLANG!',at:[.64,.46],colour:'#c4edff',angle:.13},
 echo:{phase:1,text:'WHIP!',at:[.75,.44],colour:'#dfbeff',angle:-.19},
 thorn:{phase:1,text:'KRRK!',at:[.70,.70],colour:'#cde895',angle:-.12},
 patch:{phase:2,text:'TZT!',at:[.18,.48],colour:'#bbecff',angle:.12,small:true},
 kilnheart:{phase:2,text:'KRAKOOM!',at:[.68,.76],colour:'#ffb64e',angle:-.10},
 bellwether:{phase:2,text:'WHUM!',at:[.73,.57],colour:'#ffdc65',angle:.10},
 verdigris:{phase:1,text:'SSSS!',at:[.78,.51],colour:'#c6eb88',angle:.12,small:true},
 glasswake:{phase:2,text:'KSHH!',at:[.66,.44],colour:'#f5c6e8',angle:-.14},
 undertow:{phase:1,text:'CRACK!',at:[.76,.57],colour:'#b6edff',angle:.15},
 gravemark:{phase:1,text:'KRRRM!',at:[.63,.79],colour:'#e1c3a1',angle:-.08},
 volt:{phase:2,text:'ZZT!',at:[.61,.55],colour:'#9be5ff',angle:-.17,small:true},
};
function comicPoint(point,phase=comic.phase){
 const panel=comicPanel(phase),box=comicView(),cam=comic.cam;
 return{x:box.x+box.w/2+(panel.x+panel.w*point[0]-cam.x)*cam.z,y:box.y+box.h/2+(panel.y+panel.h*point[1]-cam.y)*cam.z};
}
function comicPanelBounds(){
 const a=comicPoint([0,0]),b=comicPoint([1,1]),v=comicView();
 return{x:Math.max(a.x,v.x)+5,y:Math.max(a.y,v.y)+5,right:Math.min(b.x,v.x+v.w)-5,bottom:Math.min(b.y,v.y+v.h)-5};
}
function comicPhaseAge(){
 const b=COMIC_BEATS[comic.i];
 return comic.t-(b.frames?(comic.phase===b.frames[0]?0:COMIC_TIMING.twoPanelChange):COMIC_TIMING.panelStarts[comic.phase]);
}
function comicWrappedText(text,width,font){
 ctx.font=font;const lines=[];let line='';
 for(const word of text.split(' ')){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);return lines;
}
function drawComicBubble(){
 comic.lastBubble=null;
 const b=COMIC_BEATS[comic.i],entry=COMIC_LETTERING[b.id]?.speech[comic.phase];
 if(!entry||comicPhaseAge()<.75||comic.t<(COMIC_CHAPTERS[comic.i]?3.3:1.3))return;
 const bounds=comicPanelBounds(),mouth=comicPoint(entry.mouth),at=comicPoint(entry.at),available=bounds.right-bounds.x;
 if(available<90||bounds.bottom-bounds.y<55||mouth.x<bounds.x||mouth.x>bounds.right||mouth.y<bounds.y||mouth.y>bounds.bottom)return;
 const font=clamp(540*comic.cam.z*.048,12,20),face=`italic 800 ${font}px "Chakra Petch",sans-serif`;
 ctx.font=face;const width=Math.min(available-8,Math.max(92,Math.min(220,available*.55,ctx.measureText(entry.text).width+38))),lines=comicWrappedText(entry.text,width*.76,face);
 const height=lines.length*font*1.22+24;
 if(height>bounds.bottom-bounds.y-10)return;
 const x=clamp(at.x-width/2,bounds.x,bounds.right-width),y=clamp(at.y-height/2,bounds.y,bounds.bottom-height),cx=x+width/2,cy=y+height/2,rx=width/2,ry=height/2;
 // Don't place speech over the speaker's face. Its tail ends at the authored mouth.
 if(Math.hypot((mouth.x-cx)/rx,(mouth.y-cy)/ry)<1.16)return;
 const angle=Math.atan2((mouth.y-cy)/ry,(mouth.x-cx)/rx),gap=.13;
 ctx.save();ctx.fillStyle='#fff9e9';ctx.strokeStyle='#090d16';ctx.lineWidth=clamp(comic.cam.z*8,2,3.5);ctx.lineJoin='round';
 ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,angle+gap,angle+Math.PI*2-gap);ctx.lineTo(mouth.x,mouth.y);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#111722';ctx.font=face;ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((line,i)=>ctx.fillText(line,cx,cy+(i-(lines.length-1)/2)*font*1.22));ctx.restore();
 comic.lastBubble={who:b.id==='arrival'?'bastion':b.id==='crisis'?'volt':b.id,line:entry.text,x,y,width,height,view:comicView(),mouth,authoredMouth:entry.mouth,phase:comic.phase};
}
function drawComicImpact(){
 comic.lastImpact=null;
 const b=COMIC_BEATS[comic.i],entry=COMIC_IMPACTS[b.id],age=comicPhaseAge();
 if(!entry||comic.phase!==entry.phase||age<.65||age>2.5)return;
 const anchor=comicPoint(entry.at),bounds=comicPanelBounds();
 const size=clamp(540*comic.cam.z*(entry.small ? .085 : .13),17,52),font=`italic 900 ${size}px "Big Shoulders Display",Impact,sans-serif`;
 ctx.font=font;const width=ctx.measureText(entry.text).width+size*.6,height=size*1.55;
 // Keep the entire rotated burst inside this panel, even on a small phone.
 const pad=Math.abs(Math.sin(entry.angle))*width*.5+6;
 if(width+pad*2>bounds.right-bounds.x||height+pad*2>bounds.bottom-bounds.y)return;
 const x=clamp(anchor.x,bounds.x+width/2+pad,bounds.right-width/2-pad),y=clamp(anchor.y,bounds.y+height/2+pad,bounds.bottom-height/2-pad);
 const pop=reduceMotion?1:.86+.14*Math.min(1,(age-.65)/.16);
 ctx.save();ctx.translate(x,y);ctx.rotate(entry.angle);ctx.scale(pop,pop);
 ctx.fillStyle='#0a101b';ctx.strokeStyle='#0a101b';ctx.lineWidth=2.5;
 const burst=()=>{ctx.beginPath();for(let i=0;i<28;i++){const a=i*Math.PI/14,r=i%2?.70:1,px=Math.cos(a)*width*.53*r,py=Math.sin(a)*height*.56*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();};
 ctx.save();ctx.translate(3,4);burst();ctx.fill();ctx.restore();
 ctx.fillStyle=entry.colour;burst();ctx.fill();ctx.stroke();
 ctx.save();ctx.clip();ctx.globalAlpha=.19;ctx.fillStyle='#1b1520';for(let yy=-height;yy<height;yy+=6)for(let xx=-width;xx<width;xx+=6){ctx.beginPath();ctx.arc(xx+(Math.round(yy/6)%2)*3,yy,1,0,Math.PI*2);ctx.fill();}ctx.restore();
 ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size*.13);ctx.strokeStyle='#080d16';ctx.strokeText(entry.text,1,1);ctx.fillStyle='#fff6dc';ctx.fillText(entry.text,0,-1);ctx.restore();
 comic.lastImpact={text:entry.text,phase:comic.phase,x,y,width,height,anchor,view:comicView()};
}
function drawComicLettering(){
 if(!comic)return;
 comic.lastBubble=null;comic.lastImpact=null;
 if(comic.cover||comic.spread||comic.loading||comic.pageTurn)return;
 // Let the camera settle into its panel; effects never float across the gutters.
 const bounds=comicPanelBounds();if(bounds.right<=bounds.x||bounds.bottom<=bounds.y)return;
 ctx.save();ctx.beginPath();ctx.rect(bounds.x,bounds.y,bounds.right-bounds.x,bounds.bottom-bounds.y);ctx.clip();drawComicImpact();drawComicBubble();ctx.restore();
}
