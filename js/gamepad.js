// Volt: Controller support (Gamepad API, standard mapping: Xbox-style layouts, AYN/Android handhelds,
// PlayStation and Switch Pro pads in Chrome). Polled once per frame from main.js.
//   Left stick / D-pad: move (and navigate menus)    Right stick: aim (otherwise auto-aim)
//   X / Square: Strike (hold)   Y / Triangle: Special (hold to charge)   A / Cross: Dash
//   RB / R1: Block (tap to parry)   LB / L1 or RT: Overload   B / Circle: jump / interact / back
//   Start: pause   In the Fortress and dialogue, A or B talks / continues.
'use strict';

const PAD = { prev:[], navT:0, navDir:null, deadzone:0.28, aim:null, axes:{x:0,y:0} };
const BTN = { A:0, B:1, X:2, Y:3, LB:4, RB:5, LT:6, RT:7, BACK:8, START:9, UP:12, DOWN:13, LEFT:14, RIGHT:15 };

function activePad(){
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  return pads.find(p=>p.connected) || null;
}
const padKey = k => { const ev=new KeyboardEvent('keydown',{key:k}); ev.__pad=true; dispatchEvent(ev); const up=new KeyboardEvent('keyup',{key:k}); up.__pad=true; dispatchEvent(up); };
function rumble(strong=0.5, weak=0.3, ms=90){
  const p=activePad(); if (!p || inputMode!=='pad') return;
  try { p.vibrationActuator && p.vibrationActuator.playEffect && p.vibrationActuator.playEffect('dual-rumble',{duration:ms,strongMagnitude:strong,weakMagnitude:weak}); } catch(e){}
}

/* ---------- Menus: spatial navigation over the buttons of whichever panel is on top ---------- */
const MENU_LAYERS = ['#mConfirm','#mTune','#mSlots','#mStart','#mStyle','#mFortress','#mPause','#mDraft','#mCity','#mOver','#splash'];
function menuLayer(){ for (const id of MENU_LAYERS){ const el=$(id); if (el && !el.hidden && getComputedStyle(el).display!=='none') return el; } return null; }
function menuItems(layer){
  return [...layer.querySelectorAll('button, input[type=range]')].filter(b=>!b.disabled && !b.hidden && b.offsetParent!==null && b.getAttribute('aria-disabled')!=='true' || (b.classList.contains('style-card') && b.offsetParent!==null));
}
function focusItem(el){ if (!el) return; el.focus({preventScroll:false}); el.scrollIntoView({block:'nearest'}); }
function menuMove(dx,dy){
  const layer=menuLayer(); if (!layer) return;
  const items=menuItems(layer); if (!items.length) return;
  const cur=document.activeElement;
  if (!items.includes(cur)){ focusItem(items[0]); return; }
  if (cur.type==='range' && dx){ cur.value=+cur.value+dx*(+cur.step||1); cur.dispatchEvent(new Event('input')); return; }
  const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let best=null, bs=Infinity;
  for (const it of items){ if (it===cur) continue;
    const q=it.getBoundingClientRect(), ox=q.left+q.width/2-cx, oy=q.top+q.height/2-cy, along=ox*dx+oy*dy;
    if (along<=4) continue;
    const score=along+Math.abs(dx?oy:ox)*2.5; if (score<bs){ bs=score; best=it; } }
  if (best) focusItem(best);
}
function menuConfirm(){
  const layer=menuLayer(); if (!layer) return false;
  const items=menuItems(layer), cur=document.activeElement;
  if (items.includes(cur)){ if (cur.type!=='range') cur.click(); } else if (items[0]) focusItem(items[0]);
  return true;
}

/* ---------- Per frame ---------- */
function pollPads(dt){
  const p=activePad(); if (!p){ PAD.axes.x=PAD.axes.y=0; PAD.aim=null; return; }
  const b=i=>!!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value>0.5)), was=i=>!!PAD.prev[i], down=i=>b(i)&&!was(i), up=i=>!b(i)&&was(i);
  const dz=v=>Math.abs(v)<PAD.deadzone?0:v;
  let lx=dz(p.axes[0]||0), ly=dz(p.axes[1]||0);
  if (b(BTN.LEFT)) lx=-1; if (b(BTN.RIGHT)) lx=1; if (b(BTN.UP)) ly=-1; if (b(BTN.DOWN)) ly=1;
  const rx=dz(p.axes[2]||0), ry=dz(p.axes[3]||0);
  const anyInput = p.buttons.some((x,i)=>b(i)) || lx || ly || rx || ry;
  if (anyInput && inputMode!=='pad') setMode('pad');
  if (inputMode!=='pad'){ PAD.prev=p.buttons.map((x,i)=>b(i)); return; }

  PAD.axes.x=lx; PAD.axes.y=ly;
  PAD.aim = Math.hypot(rx,ry)>0.45 ? Math.atan2(ry,rx) : null;

  // Menus and overlays first.
  if (state==='cutscene'){ if (down(BTN.A)||down(BTN.B)||down(BTN.X)) padKey('e'); if (down(BTN.START)) padKey('escape'); }
  else if (state==='intro'||state==='dialogue'||state==='hubtalk'){ if (down(BTN.A)||down(BTN.B)) padKey('e'); }
  else if (state==='play' || state==='transit'){
    if (down(BTN.X)) { strikeHeld=true; doStrike(); } if (up(BTN.X)) strikeHeld=false;
    if (down(BTN.Y)) doPower(); if (up(BTN.Y)) releasePower();
    if (down(BTN.A)) doDash();
    if (down(BTN.RB)) pressBlock(); if (up(BTN.RB)) releaseBlock();
    if (down(BTN.LB)||down(BTN.RT)) doSig();
    if (down(BTN.B) && roomPhase==='exits') jumpTo(exitNear());
    if (down(BTN.START)) padKey('escape');
  } else if (state==='hub'){
    if (down(BTN.A)||down(BTN.B)) hubInteract();
    if (down(BTN.START)) { /* nothing to pause in the hub */ }
  } else {
    // Any menu screen: move focus with the stick or D-pad (with key-repeat), A selects, B / Start backs out.
    const dir = Math.abs(lx)>Math.abs(ly) ? (lx?[Math.sign(lx),0]:null) : (ly?[0,Math.sign(ly)]:null), key=dir&&dir.join();
    if (key && key!==PAD.navDir){ menuMove(dir[0],dir[1]); PAD.navT=0.38; }
    else if (key){ PAD.navT-=dt; if (PAD.navT<=0){ menuMove(dir[0],dir[1]); PAD.navT=0.13; } }
    PAD.navDir=key;
    if (down(BTN.A)) menuConfirm();
    if (down(BTN.B)||down(BTN.START)) padKey('escape');
    if (state==='draft' && down(BTN.Y) && run.rerolls>0) rerollDraft();
  }
  PAD.prev=p.buttons.map((x,i)=>b(i));
}
addEventListener('gamepadconnected', () => { if (typeof banner==='function' && state!=='start') banner('CONTROLLER CONNECTED'); });
