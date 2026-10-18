// Original scene art, four action poses per sequence, page camera and animated ink effects.
'use strict';
const COMIC_BEATS=[
 {id:'halo',title:'HALO',el:'light',text:"Halo. When the city looked up, she was usually the reason. She would take the hit, then make sure everyone behind her got home."},
 {id:'bastion',title:'BASTION',el:'shield',text:"Bastion held the line. You could throw a whole squad at him. He would move about six inches, complain about it, and put those six inches back."},
 {id:'echo',title:'ECHO',el:'mind',text:"Echo could hear trouble thinking. They would pull you out of its way before you knew you were in it. Then mention it forever."},
 {id:'thorn',title:'THORN',el:'plant',text:"Thorn used to fight these people. Now he grows the way out. Changing sides was one decision. Earning trust takes showing up, every day."},
 {id:'patch',title:'PATCH',el:'repair',text:"Patch kept the doors opening and the comms working. No powers. Just tools, terrible odds, and a very firm opinion about touching exposed wiring."},
 {id:'kilnheart',title:'KILNHEART',el:'fire',text:"Then there was Kilnheart. Furnace armour. Hands like demolition equipment. If she wanted a door open, the wall tended to come with it."},
 {id:'bellwether',title:'BELLWETHER',el:'sound',text:"Bellwether could turn a square into a stage. Her opening note broke the windows. The next one broke whatever people were hiding behind."},
 {id:'verdigris',title:'VERDIGRIS',el:'acid',text:"Verdigris made solid things stop being solid. Steel, circuits, the barriers people trusted. You could watch the city coming apart under their hand."},
 {id:'glasswake',title:'GLASSWAKE',el:'glass',text:"Glasswake was always somewhere else when you hit her. By the time you found the real one, she had already found you."},
 {id:'undertow',title:'UNDERTOW',el:'ice',text:"Undertow owned the docks. He would freeze the ground, pull you off your feet, then explain the problem with trying to stand up again."},
 {id:'gravemark',title:'GRAVEMARK',el:'stone',text:"Gravemark did not need to chase anyone. The whole roof moved towards him. I had seen the footage. I still hoped the camera was making him look bigger."},
 {id:'redactor',title:'THE REDACTOR',el:'drain',text:"And the Redactor gave them a city to take. He could identify a registered hero and drain their power. Almost no effort. That was the frightening part."},
 {id:'volt',title:'MY BLOCK',el:'electric',text:"Me? I was not on any of those posters. I helped around my block. My electricity had always been there. I just tried to keep that part quiet."},
 {id:'crisis',title:'SOMEONE HAS TO HELP',el:'electric',text:"Then the broadcast came. The districts were falling. The heroes still standing were trapped behind the Fortress shield. My neighbours needed them. So I went to find them."},
 {id:'arrival',title:'THE FORTRESS',el:'electric',frames:[0,1],text:"The front door was locked. I took the outside. Sixty floors is a long time to reconsider an introduction. Somehow, I still opened with a joke."},
 {id:'arrival',title:'AN OPENING',el:'repair',frames:[2,3],text:"Patch checked my power. No registered signature. Their shield kept the team safe, and my hidden ability gave us an opening outside it. Bastion insisted on training first. Fair."},
];
CUTSCENE.splice(0,CUTSCENE.length,...COMIC_BEATS.map(b=>({...b,who:'volt'})));
const COMIC_IMAGES={};
function comicImage(id){
 if(COMIC_IMAGES[id])return COMIC_IMAGES[id];
 const im=new Image();im.failed=false;im.onerror=()=>im.failed=true;im.src=`assets/comic/${id}-action.webp?v=2026-10-18-motion`;COMIC_IMAGES[id]=im;return im;
}
// Preload the first scene; subsequent scenes warm while the opening plays.
comicImage('halo');
// The legacy listener captured its function before this replacement loaded.
$('#csSkip').addEventListener('click',()=>endCutscene());
let comic=null;
const comicPanel=i=>({x:(i%2)*980,y:Math.floor(i/2)*560,w:960,h:540});
playCutscene=function(done){
 if(window.__volt?.noIntro){done?.();return;}
 comic={i:-1,done,t:0,phase:0,voiceStarted:false,voiceSeen:false,auto:true,cam:{x:970,y:550,z:.5},loading:true};
 state='cutscene';keys.clear();stick.id=null;show('#splash',false);show('#cutscene',true);document.body.classList.add('in-cut','motion-comic');
 $('#csCard').hidden=true;$('#csPortrait').hidden=true;$('#csWho').textContent='VOLT · NARRATING';
 if(!$('#csAuto')){
  const nav=document.createElement('div');nav.className='comic-controls';nav.innerHTML='<button type="button" class="chip" id="csAuto" aria-pressed="true">Auto: on</button><button type="button" class="chip" id="csNext">Next scene →</button>';
  $('#cutscene').appendChild(nav);
  nav.addEventListener('pointerdown',e=>e.stopPropagation());
  nav.addEventListener('keydown',e=>e.stopPropagation());
  $('#csAuto').onclick=()=>{if(!comic)return;comic.auto=!comic.auto;$('#csAuto').textContent='Auto: '+(comic.auto?'on':'off');$('#csAuto').setAttribute('aria-pressed',comic.auto);};
  $('#csNext').onclick=()=>nextCutPanel();
 }
 $('#csAuto').textContent='Auto: on';$('#csAuto').setAttribute('aria-pressed','true');nextCutPanel();
 for(const b of COMIC_BEATS)comicImage(b.id);
};
nextCutPanel=function(){
 if(!comic)return;
 if(comic.i>=0&&comic.t<.35)return;
 stopVoice();
 if(++comic.i>=COMIC_BEATS.length){endCutscene();return;}
 comic.t=0;comic.phase=0;comic.voiceStarted=false;comic.voiceSeen=false;comic.loading=true;comic.lastPhase=-1;
 const b=COMIC_BEATS[comic.i];comicImage(b.id);
 $('#csTag').hidden=false;$('#csTag').textContent=b.title;$('#csWho').hidden=false;
 $('#csText').textContent=b.text;$('#csCount').textContent=`${comic.i+1} / ${COMIC_BEATS.length} · Tap to continue`;
 $('#csCaption').style.setProperty('--c',SPEAKERS[b.id]?.c||COL.volt);
};
endCutscene=function(){
 if(!comic)return;const done=comic.done;comic=null;stopVoice();show('#cutscene',false);document.body.classList.remove('in-cut','motion-comic');save.seenIntro=2;writeSave();done?.();
};
updateCinematic=function(dt){
 if(!comic)return;const c=comic,b=COMIC_BEATS[c.i],im=comicImage(b.id);
 c.loading=!(im.complete&&im.naturalWidth);
 if(c.loading)return;
 c.t+=dt;
 // Actions play once; the aftermath holds while narration completes.
 c.phase=b.frames?b.frames[c.t<2?0:1]:c.t<1.25?0:c.t<1.7?1:c.t<2.5?2:3;
 if(c.phase!==c.lastPhase){c.lastPhase=c.phase;if(!reduceMotion&&c.phase===1)sfx(b.id==='crisis'?'broadcast':'block',{vol:.28});if(c.phase===2){const sound={electric:'lightning',stone:'stone',fire:'fire',sound:'sound',acid:'acid',glass:'glass',ice:'ice',drain:'redact',repair:'special',mind:'sound',plant:'acid',shield:'block',light:'beam'};sfx(sound[b.el]||'enemyhit',{vol:.22});}}
 const p=comicPanel(c.phase),box=comicView(),target={x:p.x+p.w/2,y:p.y+p.h/2,z:Math.min(box.w/p.w,box.h/p.h)*.96};
 if(c.t<.5&&!b.hold){target.x=970;target.y=550;target.z=Math.min(box.w/1940,box.h/1100)*.95;}
 const k=reduceMotion?1:Math.min(1,dt*12);for(const key of ['x','y','z'])c.cam[key]+=(target[key]-c.cam[key])*k;
 // Let the camera establish the panel before the narration starts.
 if(!c.voiceStarted&&c.t>.65){c.voiceStarted=true;playVoice('volt',b.text);}
 if(AUDIO.voice?.playing&&AUDIO.voice.started)c.voiceSeen=true;
 const readTime=Math.max(7,b.text.split(/\s+/).length/2.6+1);
 if(c.auto&&c.voiceStarted&&c.t>3.5&&((c.voiceSeen&&!AUDIO.voice?.playing)||(!c.voiceSeen&&c.t>readTime)))nextCutPanel();
};
function comicView(){const cap=$('#csCaption').getBoundingClientRect();return{x:12,y:55,w:W-24,h:Math.max(80,cap.top-67)};}
function comicEffects(g,p,b,phase,t){
 if(reduceMotion)return;g.save();g.beginPath();g.rect(p.x,p.y,p.w,p.h);g.clip();g.translate(p.x,p.y);
 const colors={light:'#ffe298',shield:'#9dceff',mind:'#c49cff',plant:'#9cc86c',repair:'#bde9fa',fire:'#ffaf56',sound:'#ffe287',acid:'#b5ed6b',glass:'#ff86d2',ice:'#b6f4ff',stone:'#b58bff',drain:'#ef5267',electric:'#84e3ff'};const col=colors[b.el];
 // Persistent rain/steam/energy drift keeps the held panel alive without repeating impacts.
 g.lineWidth=1.2;g.strokeStyle=b.el==='fire'?'#ffb257':'#adc9e4';g.globalAlpha=.23;
 if(['halo','bastion','echo','thorn','bellwether','undertow'].includes(b.id))for(let i=0;i<45;i++){const x=(i*89.7+t*55)%p.w,y=(i*61.3+t*390)%p.h;g.beginPath();g.moveTo(x,y);g.lineTo(x-4,y-15);g.stroke();}
 g.strokeStyle=col;g.fillStyle=col;g.lineWidth=2;g.globalAlpha=.65;
 // Each power has its own moving shape language. Effects follow the illustrated action.
 if(b.el==='sound'&&phase>=1&&phase<=2){for(let i=0;i<4;i++){const q=(t*.85+i*.25)%1;g.globalAlpha=(1-q)*.65;g.beginPath();g.ellipse(270,270,30+q*760,45+q*420,0,-1.3,1.3);g.stroke();}}
 if(b.el==='shield'&&phase===1){for(let i=0;i<8;i++){const q=(t*2.5+i*.125)%1,x=940-q*400,y=150+i*24;g.globalAlpha=.8;g.beginPath();g.moveTo(x,y);g.lineTo(x+35,y-2);g.stroke();}}
 if(b.el==='light'&&phase===2){for(let i=0;i<9;i++){const q=(t*2+i*.11)%1,x=440+q*400;g.globalAlpha=(1-q)*.7;g.beginPath();g.moveTo(x,260+(i-4)*6);g.lineTo(x+70,260+(i-4)*10);g.stroke();}}
 if((b.el==='plant'||b.el==='acid')&&phase>=1&&phase<=2){const q=clamp((t-1.2)/1.1,0,1);for(let i=0;i<5;i++){g.globalAlpha=.4;g.beginPath();for(let j=0;j<=24*q;j++){const x=170+j*28,y=455-i*18-Math.sin(j*.45+i)*22;if(!j)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();}}
 if(b.el==='mind'&&phase>=1){for(let i=0;i<3;i++){g.globalAlpha=.35;g.beginPath();g.ellipse(750,185,45+i*12,20+i*7,t*.7+i,0,PI2);g.stroke();}}
 if(b.el==='glass'){for(let i=0;i<16;i++){const q=(t*.3+i*.071)%1,x=200+(i*137)%650,y=80+q*400;g.save();g.translate(x,y);g.rotate(t*1.8+i);g.globalAlpha=.2+.35*Math.sin(q*Math.PI);g.beginPath();g.moveTo(0,-9);g.lineTo(5,7);g.lineTo(-4,4);g.closePath();g.stroke();g.restore();}}
 if(b.el==='stone'){for(let i=0;i<15;i++){const lift=phase<2?Math.sin(t*2+i)*8+clamp(t/1.7,0,1)*30:Math.max(0,1-(t-1.7)*2)*35,x=80+(i*151)%820,y=460-(i*23)%100-lift;g.globalAlpha=.7;g.fillStyle='#28232e';g.strokeStyle='#a68bc3';g.beginPath();g.moveTo(x-7,y);g.lineTo(x-4,y-10);g.lineTo(x+8,y-5);g.lineTo(x+5,y+4);g.closePath();g.fill();g.stroke();}}
 if(b.el==='drain'&&phase===2){g.lineWidth=1.5;for(let i=0;i<4;i++){const q=(t*.8+i*.25)%1;g.globalAlpha=.5;g.beginPath();g.moveTo(300,260+i*9);g.bezierCurveTo(400,250+Math.sin(t*5+i)*20,530,240,650,250+i*9);g.stroke();g.beginPath();g.arc(300+q*350,250+i*9,3,0,PI2);g.fill();}}
 if(b.el==='ice'&&phase===1){const q=clamp((t-1.25)/.45,0,1);g.globalAlpha=.7;g.lineWidth=3;g.beginPath();g.moveTo(410,210);g.lineTo(410+q*400,210+q*25);g.stroke();}
 if(b.el==='fire'){for(let i=0;i<22;i++){const q=(t*.35+i*.071)%1,x=120+(i*139)%720,y=490-q*360;g.globalAlpha=(1-q)*.55;g.fillStyle=i%2?'#ffd59a':'#ff8e38';g.fillRect(x+Math.sin(t*2+i)*13,y,2,5);}}
 if((b.el==='repair'||b.el==='electric')&&phase>=1){for(let i=0;i<7;i++){const q=(t*2+i*.14)%1;g.globalAlpha=(1-q)*.6;g.strokeStyle=col;const cx=b.el==='repair'?270:440,cy=310;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.sin(i*3+t)*q*55,cy-q*55);g.lineTo(cx+Math.sin(i*4+t)*q*75,cy-q*85);g.stroke();}}
 const contact=t-1.25,release=t-1.7;
 if((phase===1||phase===2)&&contact>=0&&b.el!=='drain'){let q=phase===1?contact/.45:release/.8;q=clamp(q,0,1);g.globalAlpha=(1-q)*.8;g.strokeStyle=col;g.lineWidth=3;
  for(let i=0;i<27;i++){const a=i*2.399,r=24+q*350;g.beginPath();g.moveTo(570+Math.cos(a)*r,260+Math.sin(a)*r*.6);g.lineTo(570+Math.cos(a)*(r+35),260+Math.sin(a)*(r+35)*.6);g.stroke();}
  if(b.el==='sound'||b.el==='shield'||b.el==='light'){g.lineWidth=5;g.beginPath();g.ellipse(540,270,35+q*350,60+q*230,0,0,PI2);g.stroke();}
 }
 g.restore();
}
renderCinematic=function(){
 if(!comic)return;const c=comic,b=COMIC_BEATS[c.i],im=comicImage(b.id),box=comicView();
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);
 if(c.loading){ctx.fillStyle='#f3dfac';ctx.font='700 18px sans-serif';ctx.textAlign='center';ctx.fillText(im.failed?'Scene could not load. Tap Next or Skip.':'Loading illustrated scene…',W/2,H*.4);return;}
 ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();ctx.translate(box.x+box.w/2,box.y+box.h/2);
 if(!reduceMotion&&c.phase===1){const q=Math.max(0,c.t-1.25);ctx.translate(Math.sin(q*90)*5*Math.exp(-q*8),Math.cos(q*73)*3*Math.exp(-q*8));}
 ctx.scale(c.cam.z,c.cam.z);ctx.translate(-c.cam.x,-c.cam.y);
 const sw=im.naturalWidth/2,sh=im.naturalHeight/2;
 for(let i=0;i<4;i++){const p=comicPanel(i);ctx.fillStyle='#000';ctx.fillRect(p.x-7,p.y-7,p.w+14,p.h+14);
  if(i<=c.phase||c.t<.5){const inset=4;ctx.drawImage(im,(i%2)*sw+inset,Math.floor(i/2)*sh+inset,sw-inset*2,sh-inset*2,p.x,p.y,p.w,p.h);comicEffects(ctx,p,b,i,c.t);}
  else{ctx.fillStyle='#141a25';ctx.fillRect(p.x,p.y,p.w,p.h);}
  ctx.strokeStyle=i===c.phase?'#f3dfac':'#5b6370';ctx.lineWidth=i===c.phase?5:2;ctx.strokeRect(p.x,p.y,p.w,p.h);
 }
 ctx.restore();
};
