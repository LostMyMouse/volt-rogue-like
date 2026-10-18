// Volt: Boot and frame loop.
'use strict';

/* Boot: wire touch buttons, set up the first run state, then start the frame loop. */
bindTouch('#tStrike', () => { strikeHeld=true; doStrike(); }, () => { strikeHeld=false; });
bindTouch('#tPower', doPower, releasePower);
bindTouch('#tDash', doDash);
bindTouch('#tBlock', pressBlock, releaseBlock);
bindTouch('#tSig', doSig);
reset(); run.route={order:['kilnheart'],i:0,room:1,picks:0}; buildRoom(); run.route={order:[],i:-1,room:0,picks:0};

const PORTRAIT_TOUCH = matchMedia('(orientation: portrait) and (pointer: coarse)');
let lastT=performance.now();
let paintedFrame='';
const frozenCanvas=()=>['paused','draft','map','intro','dialogue','hubmenu','hubtalk'].includes(state);
function frame(now){
  const dt=Math.min(0.033,(now-lastT)/1000); lastT=now;
  pollPads(dt); audioTick(dt);
  document.body.classList.toggle('needs-landscape',PORTRAIT_TOUCH.matches&&['play','paused'].includes(state)&&$('#mTune').hidden);
  if (state==='play' && PORTRAIT_TOUCH.matches) openPause(); // the rotate prompt is up: freeze the fight
  if (state==='play'){
    time+=dt;
    if (hitStop>0) hitStop-=dt; else update(dt);
    updateFx(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  } else if (state==='transit'){
    time+=dt; updateTransit(dt); updateFx(dt); updateCam(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  } else if (state==='cutscene'){
    time+=dt; updateCinematic(dt);
  } else if (state==='hub'){
    time+=dt;updateHub(dt);updateFx(dt);hubCam(dt);
  } else if (state==='start' || state==='over'){
    time+=dt; updateFx(dt); updateCam(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  }
  const stamp=state+'|'+W+'|'+H+'|'+DPR+'|'+renderRevision+'|'+(talk?.i??'');
  if(!frozenCanvas()||stamp!==paintedFrame){render();updateHud();updateComposureHud();paintedFrame=stamp;}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
