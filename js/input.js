// Volt: Keyboard, mouse and touch input.
'use strict';

/* ---------- Input ---------- */
const keys = new Set();
const mouse = { x:0, y:0, active:false, left:false };
let strikeHeld = false;
let inputMode = matchMedia('(pointer: coarse)').matches ? 'touch' : 'kb';
const stick = { id:null, ox:0, oy:0, x:0, y:0 };

function setMode(m){
  inputMode = m;
  $('#touch').hidden = m !== 'touch';
  $('#abilities').style.visibility = m === 'touch' ? 'hidden' : 'visible';
  $('#ctrlKb').hidden = m === 'touch';
  $('#ctrlTouch').hidden = m !== 'touch';
}
setMode(inputMode);

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k===' ') e.preventDefault();
  if (e.repeat) return;
  if (inputMode !== 'kb') setMode('kb');
  if (state==='hubtalk' || state==='dialogue'){ if (k==='e'||k===' '||k==='enter'||k==='escape') advanceTalk(); return; }
  if (state==='hubmenu' && k==='escape'){ if (!$('#mFortress').hidden) closeFortress(); else if (!$('#mStyle').hidden) closeStyles(); return; }
  if (k==='escape'){
    if (state==='play') openPause();
    else if (!$('#mTune').hidden) closeTune();
    else if (state==='paused') closePause();
    return;
  }
  if (state==='intro'){ dismissIntro(); return; }
  if (state==='map'){ if ((k==='1'||k==='2') && cityGates[+k-1]) chooseDistrict(cityGates[+k-1]); return; }
  if (state==='start' && k==='enter'){ enterHub(); return; }
  if (state==='draft'){ if (k==='1'||k==='2'||k==='3') pickCard(+k-1); else if (k==='r') rerollDraft(); return; }
  keys.add(k);
  if (state==='hub' && (k==='e'||k==='enter')){ hubInteract(); return; }
  if (state!=='play') return;
  if (k==='shift') pressBlock();
  if (k===' ') doDash();
  if (k==='q') doSig();
  if (k==='e' && roomPhase==='exits') jumpTo(exitNear());
});
addEventListener('keyup', e => { const k=e.key.toLowerCase(); keys.delete(k); if (k==='shift') releaseBlock(); });
addEventListener('blur', () => { keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; powerHeld=false; if (player){ player.charging=0; player.shield=false; player.blockHeld=false; } if (state==='play') openPause(); });
cv.addEventListener('contextmenu', e => e.preventDefault());

cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse'){
    if (inputMode!=='kb') setMode('kb');
    mouse.x=e.clientX; mouse.y=e.clientY; mouse.active=true;
    if (state!=='play') return;
    if (e.button===0){ mouse.left=true; doStrike(); }
    else if (e.button===2) doPower();
    return;
  }
  if (inputMode!=='touch') setMode('touch');
  if (state!=='play' && state!=='hub') return;
  if (stick.id===null){ stick.id=e.pointerId; stick.ox=e.clientX; stick.oy=e.clientY; stick.x=0; stick.y=0; try{cv.setPointerCapture(e.pointerId)}catch(_){} }
});
cv.addEventListener('pointermove', e => {
  if (e.pointerType==='mouse'){ mouse.x=e.clientX; mouse.y=e.clientY; mouse.active=true; return; }
  if (e.pointerId===stick.id){
    let dx=e.clientX-stick.ox, dy=e.clientY-stick.oy; const d=Math.hypot(dx,dy), R=60;
    if (d>R){ stick.ox += dx*(1-R/d); stick.oy += dy*(1-R/d); dx=e.clientX-stick.ox; dy=e.clientY-stick.oy; }
    stick.x=dx/R; stick.y=dy/R;
  }
});
const endPointer = e => { if (e.pointerType==='mouse' && e.button===0) mouse.left=false; if (e.pointerType==='mouse' && e.button===2) releasePower(); if (e.pointerId===stick.id){ stick.id=null; stick.x=stick.y=0; } };
cv.addEventListener('pointerup', endPointer); cv.addEventListener('pointercancel', endPointer);

function bindTouch(id, down, up){
  const el=$(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('pressed'); if (state==='play') down(); });
  const end = () => { el.classList.remove('pressed'); up && up(); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('pointerleave', end);
}

function moveInput(){
  let x=0,y=0;
  if (keys.has('a')) x--; if (keys.has('d')) x++;
  if (keys.has('w')) y--; if (keys.has('s')) y++;
  if (stick.id!==null){ x+=stick.x; y+=stick.y; }
  const m=Math.hypot(x,y); if (m>1){ x/=m; y/=m; }
  if (m<0.15 && stick.id!==null && !keys.size){ x=0; y=0; }
  return {x,y};
}
function screenToWorld(sx,sy){ return { x:(sx-W/2)/cam.zoom+cam.x, y:(sy-H/2)/cam.zoom+cam.y }; }
