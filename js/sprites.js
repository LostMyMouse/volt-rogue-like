// Volt: Character sprites. Every character is currently a static 8-direction turnaround (one row,
// 64 px frames, south first, clockwise on screen). Motion is added in code until animation sheets
// exist. A character whose sheet hasn't loaded (or failed) falls back to its vector drawing.
// The metadata lives here rather than in a fetched manifest.json so the game still runs from file://.
'use strict';

const TURN_ORDER = ['south','south-east','east','north-east','north','north-west','west','south-west'];
const EAST_FIRST = ['east','south-east','south','south-west','west','north-west','north','north-east'];
// Scales: heroes stand at 1.5 in the Fortress; Volt fights a little smaller so the arena stays readable.
const SPRITES = {};
for (const [id,scale] of [['volt',1.25],['halo',1.5],['bastion',1.5],['echo',1.5],['thorn',1.5],['patch',1.5]]){
  const img=new Image(), s={frame:64, anchor:[32,60], scale, img, ready:false};
  img.onload=()=>{ s.feet=measureFeet(img,s.frame); s.ghost=tintSheet(img,COL.volt); s.white=tintSheet(img,'#ffffff'); s.ready=true; };
  img.src=`assets/sprites/${id}/${id}_rotations.png`;
  SPRITES[id]=s;
}
const spriteReady = id => SPRITES[id] && SPRITES[id].ready;
const npcSpriteReady = spriteReady;
// A flat-coloured copy of a sheet, for afterimages and hit flashes.
function tintSheet(img,c){
  const cv2=document.createElement('canvas'); cv2.width=img.width; cv2.height=img.height;
  const g=cv2.getContext('2d'); g.drawImage(img,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=c; g.fillRect(0,0,cv2.width,cv2.height);
  return cv2;
}
// Where each frame's feet are: the bottom of its opaque pixels, centred on its width. The generated
// turnarounds don't share one ground line, so a fixed anchor makes some directions float.
// Reading pixels is blocked when the page is opened from file://, so then we use the fixed anchor.
function measureFeet(img,f){
  try {
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
    const g=c.getContext('2d'); g.drawImage(img,0,0); const d=g.getImageData(0,0,c.width,c.height).data, out=[];
    for (let i=0;i<Math.round(img.width/f);i++){
      let x0=f,x1=0,y1=0;
      for (let y=0;y<f;y++) for (let x=0;x<f;x++) if (d[(y*c.width+i*f+x)*4+3]>40){ if (x<x0) x0=x; if (x>x1) x1=x; if (y>y1) y1=y; }
      out.push([(x0+x1)/2, y1]);
    }
    return out;
  } catch(e){ return null; }
}
// Angle to an east-first direction index: 0 = east, counting clockwise on screen (y points down).
const facing8 = a => ((Math.round(a/(Math.PI/4))%8)+8)%8;
function drawTurn(id,x,y,face,scale,sheet){
  const s=SPRITES[id], col=TURN_ORDER.indexOf(EAST_FIRST[facing8(face)]), f=s.frame, sc=scale||s.scale;
  const a=(s.feet&&s.feet[col])||s.anchor;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet||s.img, col*f, 0, f, f, x-a[0]*sc, y-a[1]*sc, f*sc, f*sc);
  ctx.imageSmoothingEnabled=true;
}
const drawNpcSprite = (id,x,y,face) => drawTurn(id,x,y,face);

/* ---------- Volt ---------- */
// Strikes and parries mark a moment; the drawing turns it into a lunge or a flash.
function playerAnim(name){ if (player) player.anim={name, t0:time}; }
function drawVoltSprite(p,scale){
  if (!spriteReady('volt')) return false;
  const s=SPRITES.volt, sc=scale||s.scale, feet=p.r*0.75; // feet sit at the bottom of the collision circle, on the shadow
  const moving=Math.hypot(p.vx,p.vy)>40, at=p.anim?time-p.anim.t0:9;
  if (p.anim && at>0.3) p.anim=null;
  // Facing: dashing faces the dash, attacking or blocking faces the aim, running faces the run.
  const face = p.dashT>0 ? Math.atan2(p.dashDir.y,p.dashDir.x) : (p.anim||p.blockHeld||p.charging) ? p.aim : moving ? Math.atan2(p.vy,p.vx) : p.aim;
  let ox=0, oy=0;
  if (moving && p.dashT<=0) oy=-Math.abs(Math.sin(time*13))*3*sc;           // running bob
  else if (!moving) oy=-Math.sin(time*2.4)*0.8*sc;                          // breathing
  if (p.anim && p.anim.name!=='parry' && at<0.16){ const k=1-at/0.16, d=(p.anim.name==='strike3'?9:6)*k; ox+=Math.cos(p.aim)*d; oy+=Math.sin(p.aim)*d; } // strike lunge
  if (p.blockHeld) oy+=2;                                                    // braced
  for (const f of fx) if (f.type==='ghost'){ ctx.globalAlpha=clamp(1-f.t/f.dur,0,1)*0.45; drawTurn('volt',f.x,f.y+feet,f.a,sc,s.ghost); }
  ctx.globalAlpha=1;
  drawShadow(p.x,p.y,p.r);
  const blink = p.iT>0 && p.dashT<=0 && Math.floor(time*16)%2===0;
  ctx.globalAlpha = blink ? 0.45 : 1;
  drawTurn('volt',p.x+ox,p.y+feet+oy,face,sc);
  // Parry and dash read as a white flash over the body.
  const flashK = p.anim && p.anim.name==='parry' ? 1-at/0.2 : p.dashT>0 ? 0.35 : 0;
  if (flashK>0){ ctx.globalAlpha=clamp(flashK,0,1)*0.8; drawTurn('volt',p.x+ox,p.y+feet+oy,face,sc,s.white); }
  ctx.globalAlpha=1;
  return true;
}
