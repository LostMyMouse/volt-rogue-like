// Volt: Boot and frame loop.
'use strict';

/* Boot: wire touch buttons, set up the first run state, then start the frame loop. */
bindTouch('#tStrike', () => { strikeHeld=true; doStrike(); }, () => { strikeHeld=false; });
bindTouch('#tPower', doPower, releasePower);
bindTouch('#tDash', doDash);
bindTouch('#tBlock', pressBlock, releaseBlock);
bindTouch('#tSig', doSig);
reset(); run.route={order:['kilnheart'],i:0,room:1,picks:0}; buildRoom(); run.route={order:[],i:-1,room:0,picks:0};

let lastT=performance.now();
function frame(now){
  const dt=Math.min(0.033,(now-lastT)/1000); lastT=now;
  if (state==='play'){
    time+=dt;
    if (hitStop>0) hitStop-=dt; else update(dt);
    updateFx(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  } else if (state==='transit'){
    time+=dt; updateTransit(dt); updateFx(dt); updateCam(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  } else if (state==='start' || state==='over'){
    time+=dt; updateFx(dt); updateCam(dt);
    shakeAmt-=shakeAmt*Math.min(1,10*dt); flash=Math.max(0,flash-dt*1.6); hurtFlash=Math.max(0,hurtFlash-dt*1.4);
  }
  render(); updateHud();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
