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
// Editorial captions turn the introductions into a single escalating conflict.
// These are printed comic headings; the existing Volt narration remains verbatim.
const COMIC_ACTIONS={halo:'Civilians first',bastion:'Hold the escape route',echo:'Get them out before the shot',thorn:'Make a way through',patch:'Keep the rescue running',kilnheart:'The barricades fall',bellwether:'The square becomes a weapon',verdigris:'The city comes apart',glasswake:'Nowhere safe to strike',undertow:'The docks are cut off',gravemark:'The tower has a guard',redactor:'The man behind the takeover',volt:'One block. Someone to help.',crisis:'Now the whole city needs help',arrival:'Get to the Fortress'};
function comicContext(i){
 const b=COMIC_BEATS[i];
 if(i<5)return{role:'Hero',side:'heroes',chapter:'1 · The people who protected us',colour:'#72c8de',headline:COMIC_ACTIONS[b.id]};
 if(i<12)return{role:'Villain',side:'villains',chapter:'2 · The city under siege',colour:'#e87164',headline:COMIC_ACTIONS[b.id]};
 return{role:'Hero',side:'volt',chapter:'3 · A new hero steps forward',colour:'#72c8de',headline:i===15?'An opening the Redactor cannot see':COMIC_ACTIONS[b.id]};
}
const COMIC_CHAPTERS={0:['BEFORE THE BLACKOUT','Heroes stood between danger and the people.'],5:['THEN THE CITY WAS TAKEN','The Redactor’s villains seized the districts.'],12:['SOMEONE STILL HAD TO HELP','Before he could save a city, Volt protected his block.']};
const COMIC_IMAGES={};
const COMIC_TIMING={overview:.9,panelStarts:[0,4.2,7.6,11],twoPanelChange:5.5,minScene:14.4,minTwoPanelScene:10.5,narrationDelay:1.65,afterVoice:1.2,cameraRate:3.2};
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
 comic.t=0;comic.phase=0;comic.voiceStarted=false;comic.voiceSeen=false;comic.voiceEndedAt=null;comic.loading=true;comic.lastPhase=-1;
 const b=COMIC_BEATS[comic.i];comicImage(b.id);
 prepareVoice('volt',b.text);
 const context=comicContext(comic.i);
 $('#cutscene').dataset.faction=context.side;
 $('#csTag').hidden=false;$('#csTag').textContent=`${context.role} · ${SPEAKERS[b.id]?.name||b.title}`;
 $('#csWho').hidden=false;$('#csWho').textContent=context.headline;
 $('#csText').textContent=b.text;$('#csCount').textContent=`${context.chapter} · ${comic.i+1}/${COMIC_BEATS.length} · Volt narrating`;
 $('#csCaption').style.setProperty('--c',context.colour);
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
 c.phase=b.frames?b.frames[c.t<COMIC_TIMING.twoPanelChange?0:1]:c.t<COMIC_TIMING.panelStarts[1]?0:c.t<COMIC_TIMING.panelStarts[2]?1:c.t<COMIC_TIMING.panelStarts[3]?2:3;
 if(c.phase!==c.lastPhase){c.lastPhase=c.phase;if(!reduceMotion&&c.phase===1)sfx(b.id==='crisis'?'broadcast':'block',{vol:.28});if(c.phase===2){const sound={electric:'lightning',stone:'stone',fire:'fire',sound:'sound',acid:'acid',glass:'glass',ice:'ice',drain:'redact',repair:'special',mind:'sound',plant:'acid',shield:'block',light:'beam'};sfx(sound[b.el]||'enemyhit',{vol:.22});}}
 const p=comicPanel(c.phase),box=comicView(),target={x:p.x+p.w/2,y:p.y+p.h/2,z:Math.min(box.w/p.w,box.h/p.h)*.96};
 if(c.t<COMIC_TIMING.overview&&!b.hold){target.x=970;target.y=550;target.z=Math.min(box.w/1940,box.h/1100)*.95;}
 const k=reduceMotion?1:1-Math.exp(-dt*COMIC_TIMING.cameraRate);for(const key of ['x','y','z'])c.cam[key]+=(target[key]-c.cam[key])*k;
 // Let the camera establish the panel before the narration starts.
 if(!c.voiceStarted&&c.t>COMIC_TIMING.narrationDelay){c.voiceStarted=true;playVoice('volt',b.text);}
 if(AUDIO.voice?.playing&&AUDIO.voice.started)c.voiceSeen=true;
 if(c.voiceSeen&&!AUDIO.voice?.playing&&c.voiceEndedAt===null)c.voiceEndedAt=c.t;
 const readTime=Math.max(7,b.text.split(/\s+/).length/2.6+1);
 const minimum=b.frames?COMIC_TIMING.minTwoPanelScene:COMIC_TIMING.minScene;
 if(c.auto&&c.voiceStarted&&c.t>=minimum&&((c.voiceEndedAt!==null&&c.t-c.voiceEndedAt>=COMIC_TIMING.afterVoice)||(!c.voiceSeen&&c.t>COMIC_TIMING.narrationDelay+readTime)))nextCutPanel();
};
function comicView(){const cap=$('#csCaption').getBoundingClientRect();return{x:12,y:55,w:W-24,h:Math.max(80,cap.top-67)};}
// A small highlight layer uses only bright coloured pixels already in the illustration.
// It shares the source crop exactly, so no invented particles or shapes drift off the artwork.
const COMIC_HIGHLIGHTS=new Map();
function comicHighlight(id,el){
 const key=id+':'+el;if(COMIC_HIGHLIGHTS.has(key))return COMIC_HIGHLIGHTS.get(key);
 if(el==='plant')return null;
 const im=comicImage(id);if(!im.complete||!im.naturalWidth)return null;
 let canvas=null;
 try{
  canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const pixels=g.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],v=d[i+1],b=d[i+2],bright=Math.max(r,v,b),contrast=bright-Math.min(r,v,b);let match=false;
   if(bright>230&&contrast>55){
    if(el==='light'||el==='sound')match=r>v*.95&&v>b*1.35&&v>170;
    else if(['shield','repair','ice','electric'].includes(el))match=b>170&&v>120&&r<b*.85;
    else if(el==='mind'||el==='stone')match=b>160&&r>v*1.1&&b>v*1.25;
    else if(el==='acid')match=v>180&&v>r*1.1&&v>b*1.2;
    else if(el==='fire')match=r>210&&v>75&&r>v*1.12&&v>b*1.3;
    else if(el==='glass')match=r>180&&b>110&&v<r*.7;
    else if(el==='drain')match=r>190&&r>v*1.8&&r>b*1.5;
   }d[i+3]=match?Math.round(d[i+3]*.7):0;
  }g.putImageData(pixels,0,0);
 }catch(e){canvas=null;}
 COMIC_HIGHLIGHTS.set(key,canvas);
 while(COMIC_HIGHLIGHTS.size>2){const oldest=COMIC_HIGHLIGHTS.keys().next().value,old=COMIC_HIGHLIGHTS.get(oldest);if(old){old.width=old.height=0;}COMIC_HIGHLIGHTS.delete(oldest);}
 return canvas;
}
function comicEffects(g,p,b,phase,t){
 if(reduceMotion||phase!==comic.phase)return;
 const mask=comicHighlight(b.id,b.el);if(!mask)return;
 const sw=mask.width/2,sh=mask.height/2,inset=4;
 g.save();g.globalCompositeOperation='screen';g.globalAlpha=.04+.08*(.5+.5*Math.sin(t*2.5));
 g.drawImage(mask,(phase%2)*sw+inset,Math.floor(phase/2)*sh+inset,sw-inset*2,sh-inset*2,p.x,p.y,p.w,p.h);g.restore();
}
renderCinematic=function(){
 if(!comic)return;const c=comic,b=COMIC_BEATS[c.i],im=comicImage(b.id),box=comicView();
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#080d16';ctx.fillRect(0,0,W,H);
 if(c.loading){ctx.fillStyle='#f3dfac';ctx.font='700 18px sans-serif';ctx.textAlign='center';ctx.fillText(im.failed?'Scene could not load. Tap Next or Skip.':'Loading illustrated scene…',W/2,H*.4);return;}
 ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();ctx.translate(box.x+box.w/2,box.y+box.h/2);

 ctx.scale(c.cam.z,c.cam.z);ctx.translate(-c.cam.x,-c.cam.y);
 const sw=im.naturalWidth/2,sh=im.naturalHeight/2;
 for(let i=0;i<4;i++){const p=comicPanel(i);ctx.fillStyle='#000';ctx.fillRect(p.x-7,p.y-7,p.w+14,p.h+14);
  if(i<=c.phase||c.t<COMIC_TIMING.overview){const inset=4;ctx.drawImage(im,(i%2)*sw+inset,Math.floor(i/2)*sh+inset,sw-inset*2,sh-inset*2,p.x,p.y,p.w,p.h);comicEffects(ctx,p,b,i,c.t);}
  else{ctx.fillStyle='#141a25';ctx.fillRect(p.x,p.y,p.w,p.h);}
  ctx.strokeStyle=i===c.phase?comicContext(c.i).colour:'#5b6370';ctx.lineWidth=i===c.phase?5:2;ctx.strokeRect(p.x,p.y,p.w,p.h);
 }
 ctx.restore();
 const chapter=COMIC_CHAPTERS[c.i];
 if(chapter&&c.t<3.2){
  ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();
  const x=box.x+10,y=box.y+12,width=Math.min(box.w-20,650),size=clamp(width/25,14,26);
  ctx.fillStyle='#0b111c';ctx.fillRect(x,y,width,size*2.8+18);ctx.strokeStyle=comicContext(c.i).colour;ctx.lineWidth=3;ctx.strokeRect(x,y,width,size*2.8+18);
  ctx.fillStyle=comicContext(c.i).colour;ctx.font=`900 ${size}px "Big Shoulders Display",Impact,sans-serif`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(chapter[0],x+12,y+9,width-24);
  ctx.fillStyle='#f3dfac';ctx.font=`600 ${Math.max(11,size*.58)}px "Chakra Petch",sans-serif`;ctx.fillText(chapter[1],x+12,y+size+18,width-24);ctx.restore();
 }
};
