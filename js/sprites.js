// Volt: Sprite sheets. A character with loaded sheets draws from them; anything else (or a sheet
// that fails to load) falls back to its vector drawing. Sheets follow docs/art-brief.md: one PNG per
// animation, 8 direction rows (E, SE, S, SW, W, NW, N, NE), frames left to right, feet at `anchor`.
// The metadata lives here rather than in a fetched manifest.json so the game still runs from file://.
'use strict';

const SPRITES = {
  volt: { dir:'assets/sprites/volt/', frame:96, anchor:[48,82], scale:1.15, anims:{
    idle:{file:'volt_idle.png', frames:6, fps:8, loop:true},
    run:{file:'volt_run.png', frames:8, fps:14, loop:true},
    strike1:{file:'volt_strike1.png', frames:4, fps:20},
    strike2:{file:'volt_strike2.png', frames:4, fps:20},
    strike3:{file:'volt_strike3.png', frames:6, fps:20},
    dash:{file:'volt_dash.png', frames:4, fps:24},
    block:{file:'volt_block.png', frames:3, fps:12, holdLast:true},
    parry:{file:'volt_parry.png', frames:5, fps:20},
  }},
};
for (const id in SPRITES){
  const set=SPRITES[id]; set.pending=Object.keys(set.anims).length; set.ready=false;
  for (const name in set.anims){
    const a=set.anims[name], img=new Image();
    img.onload=()=>{ a.img=img; a.ghost=tintSheet(img,COL.volt); if (--set.pending===0) set.ready=true; };
    img.onerror=()=>{ set.failed=true; };
    img.src=set.dir+a.file;
  }
}
const spriteReady = id => SPRITES[id] && SPRITES[id].ready && !SPRITES[id].failed;
// A flat-coloured copy of a sheet, for dash afterimages.
function tintSheet(img,c){
  const cv2=document.createElement('canvas'); cv2.width=img.width; cv2.height=img.height;
  const g=cv2.getContext('2d'); g.drawImage(img,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=c; g.fillRect(0,0,cv2.width,cv2.height);
  return cv2;
}
// Angle to direction row: 0 = east, counting clockwise on screen (y points down).
const facing8 = a => ((Math.round(a/(Math.PI/4))%8)+8)%8;
function drawSpriteFrame(id,name,frame,dirRow,x,y,scale,sheet){
  const set=SPRITES[id], a=set.anims[name], f=set.frame, s=scale||set.scale;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet||a.img, frame*f, dirRow*f, f, f, x-set.anchor[0]*s, y-set.anchor[1]*s, f*s, f*s);
  ctx.imageSmoothingEnabled=true;
}

/* ---------- Volt ---------- */
// One-shot animations (strikes, parry) are started by gameplay; everything else follows player state.
function playerAnim(name){ if (player) player.anim={name, t0:time}; }
function voltAnimState(p){
  const set=SPRITES.volt;
  if (p.anim){
    const a=set.anims[p.anim.name], fr=Math.floor((time-p.anim.t0)*a.fps);
    if (fr<a.frames) return {name:p.anim.name, frame:fr, face:p.aim};
    p.anim=null;
  }
  const moveA=Math.atan2(p.vy,p.vx), moving=Math.hypot(p.vx,p.vy)>40;
  if (p.dashT>0){ const a=set.anims.dash, total=T.dashTime||0.16; return {name:'dash', frame:Math.min(a.frames-1,Math.floor((1-p.dashT/total)*a.frames)), face:Math.atan2(p.dashDir.y,p.dashDir.x)}; }
  if (p.blockHeld){ const a=set.anims.block; return {name:'block', frame:Math.min(a.frames-1,Math.floor(p.blockT*a.fps)), face:p.aim}; }
  // Run faces where you're going; standing still faces where you aim (the mouse, or the nearest enemy).
  if (moving){ const a=set.anims.run; return {name:'run', frame:Math.floor(time*a.fps)%a.frames, face:moveA}; }
  const a=set.anims.idle; return {name:'idle', frame:Math.floor(time*a.fps)%a.frames, face:p.aim};
}
// Draws Volt from sprites if they're loaded. Returns false so the caller can fall back to vector.
function drawVoltSprite(p,scale){
  if (!spriteReady('volt')) return false;
  const s=scale||SPRITES.volt.scale, st=voltAnimState(p), feet=p.r*0.75; // feet sit at the bottom of the collision circle, on the shadow
  for (const f of fx) if (f.type==='ghost'){
    const k=1-f.t/f.dur; ctx.globalAlpha=k*0.45;
    drawSpriteFrame('volt','dash',SPRITES.volt.anims.dash.frames-1,facing8(f.a),f.x,f.y+feet,s,SPRITES.volt.anims.dash.ghost);
  }
  ctx.globalAlpha=1;
  drawShadow(p.x,p.y,p.r);
  const blink = p.iT>0 && p.dashT<=0 && Math.floor(time*16)%2===0;
  if (blink) ctx.globalAlpha=0.45;
  drawSpriteFrame('volt',st.name,st.frame,facing8(st.face),p.x,p.y+feet,s);
  ctx.globalAlpha=1;
  return true;
}
