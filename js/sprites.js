// Volt: Authored four-direction motion clips with static turnarounds as loading fallbacks.
// The metadata lives here rather than in a fetched manifest.json so the game still runs from file://.
'use strict';

const TURN_ORDER = ['south','south-east','east','north-east','north','north-west','west','south-west'];
const EAST_FIRST = ['east','south-east','south','south-west','west','north-west','north','north-east'];
// Scales: heroes stand at 1.5 in the Fortress; Volt fights a little smaller so the arena stays readable.
const SPRITES = {};
for (const [id,scale] of [['volt',1.25],['halo',1.5],['bastion',1.5],['echo',1.5],['thorn',1.5],['patch',1.5]]){
  const img=new Image(), s={frame:64, anchor:[32,60], scale, img, ready:false};
  img.onload=()=>{ s.feet=measureFeet(img,s.frame); s.ghost=tintSheet(img,COL.volt); s.white=tintSheet(img,'#ffffff'); s.ready=true;invalidateRender(); };
  img.src=`assets/sprites/${id}/${id}_rotations.png`;
  SPRITES[id]=s;
}

// Enemy bodies share the hero pixel-art renderer. Cardinal sheets are a first pass;
// the drone has one south-facing frame and rotates continuously in screen space.
const ENEMY_SPRITES = {
  "rusher": {
    "frame": 64,
    "anchor": [
      32,
      60
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.25
  },
  "needle": {
    "frame": 64,
    "anchor": [
      32,
      32
    ],
    "order": [
      "south"
    ],
    "scale": 1
  },
  "kilnheart": {
    "frame": 96,
    "anchor": [
      48,
      92
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.4
  },
  "gravemark": {
    "frame": 128,
    "anchor": [
      64,
      124
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.35
  },
  "bellwether": {
    "frame": 96,
    "anchor": [
      48,
      92
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.4
  },
  "verdigris": {
    "frame": 96,
    "anchor": [
      48,
      92
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.4
  },
  "glasswake": {
    "frame": 96,
    "anchor": [
      48,
      92
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.4
  },
  "undertow": {
    "frame": 128,
    "anchor": [
      64,
      124
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.35
  },
  "redactor": {
    "frame": 128,
    "anchor": [
      64,
      124
    ],
    "order": [
      "south",
      "east",
      "north",
      "west"
    ],
    "scale": 1.35
  }
};
for (const [id,def] of Object.entries(ENEMY_SPRITES)){
  const img=new Image(), s={...def, fixedAnchor:true, img, ready:false};
  img.onload=()=>{
    if (img.width!==s.frame*s.order.length || img.height!==s.frame) return;
    s.white=tintSheet(img,'#ffffff');
    s.ready=true;invalidateRender();
  };
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
  const s=SPRITES[id], order=s.order||TURN_ORDER, f=s.frame, sc=scale||s.scale;
  const direction=order.length===4
    ? ['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4]
    : EAST_FIRST[facing8(face)];
  const col=order.indexOf(direction);
  const a=s.fixedAnchor?s.anchor:(s.feet&&s.feet[col])||s.anchor;
  const smoothing=ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet||s.img, col*f, 0, f, f, x-a[0]*sc, y-a[1]*sc, f*sc, f*sc);
  ctx.imageSmoothingEnabled=smoothing;
}
const drawNpcSprite = (id,x,y,face,options) => drawAnimatedNpc(id,x,y,face,options);

/* ---------- Volt ---------- */
// Strikes and parries mark a moment; the drawing turns it into a lunge or a flash.
function playerAnim(name){ if (player) player.anim={name, t0:time}; }
function drawVoltSprite(p,scale){
  if (!spriteReady('volt')) return false;
  const s=SPRITES.volt, sc=scale||s.scale, feet=p.r*0.75; // feet sit at the bottom of the collision circle, on the shadow
  const moving=Math.hypot(p.vx,p.vy)>40, at=p.anim?time-p.anim.t0:9;
  if (p.anim && at>((ANIMATION_DATA.volt[p.anim.name]?.frames||6)/(ANIMATION_DATA.volt[p.anim.name]?.fps||20))) p.anim=null;
  // Facing: dashing faces the dash, attacking or blocking faces the aim, running faces the run.
  const face = p.dashT>0 ? Math.atan2(p.dashDir.y,p.dashDir.x) : (p.anim||p.blockHeld||p.charging) ? p.aim : moving ? Math.atan2(p.vy,p.vx) : p.aim;
  const clipName=p.dashT>0?'dash':p.anim?p.anim.name:p.blockHeld?'block':moving?'run':hurtFlash>0.15?'hurt':'idle';
  const clip=animationClip('volt',clipName), clipReady=clip&&clip.ready;
  const elapsed=p.anim && clipName===p.anim.name?at:motionClock(p,clipName);
  const face4=stickyFace(p,face), body=(x,y,tint)=>drawAnimation('volt',clipName,x,y,face4,sc,elapsed,null,tint)||drawTurn('volt',x,y,face,sc,tint==='white'?s.white:undefined);
  let ox=0, oy=0;
  if (!clipReady && moving && p.dashT<=0) oy=-Math.abs(Math.sin(time*13))*3*sc;           // running bob
  else if (!clipReady && !moving) oy=-Math.sin(time*2.4)*0.8*sc;                          // breathing
  if (!clipReady && p.anim && p.anim.name!=='parry' && at<0.16){ const k=1-at/0.16, d=(p.anim.name==='strike3'?9:6)*k; ox+=Math.cos(p.aim)*d; oy+=Math.sin(p.aim)*d; } // strike lunge
  if (!clipReady && p.blockHeld) oy+=2;                                                    // braced
  for (const f of fx) if (f.type==='ghost'){ ctx.globalAlpha=clamp(1-f.t/f.dur,0,1)*0.45; drawTurn('volt',f.x,f.y+feet,f.a,sc,s.ghost); }
  ctx.globalAlpha=1;
  drawShadow(p.x,p.y,p.r);
  const blink = p.iT>0 && p.dashT<=0 && Math.floor(time*16)%2===0;
  ctx.globalAlpha = blink ? 0.45 : 1;
  body(p.x+ox,p.y+feet+oy);
  // Parry and dash read as a white flash over the body.
  const flashK = p.anim && p.anim.name==='parry' ? 1-at/0.2 : p.dashT>0 ? 0.35 : 0;
  if (flashK>0){ ctx.globalAlpha=clamp(flashK,0,1)*0.8; body(p.x+ox,p.y+feet+oy,'white'); }
  ctx.globalAlpha=1;
  return true;
}


/* ---------- Enemies and villains ---------- */
function drawEnemySprite(e){
  const id=e.isDecoy||e.kind==='decoy'?'glasswake':e.kind;
  if (!ENEMY_SPRITES[id] || !spriteReady(id)) return false;
  const s=SPRITES[id], sc=s.scale, decoy=!!e.isDecoy||e.kind==='decoy';
  const face=Number.isFinite(e.face)?e.face:Math.PI/2;
  const moving=Math.hypot(e.vx||e.mx||0,e.vy||e.my||0)>20;
  const wind=e.state==='windup'||e.bstate==='WINDUP';
  const exposed=e.bstate==='EXPOSED'||e.state==='stagger';
  const bodyAlpha=decoy?0.65:1;
  const animation=enemyAnimation(e), clip=animationClip(id,animation.name), animated=clip&&clip.ready;
  const face4=stickyFace(e,face), body=(x,y,tint)=>drawAnimation(id,animation.name,x,y,face4,sc,animation.elapsed,animation.frame,tint)||drawTurn(id,x,y,face,sc,tint==='white'?s.white:undefined);
  let ox=0, oy=moving?-Math.abs(Math.sin(time*11))*(e.isBoss?0.7:1.5):0;
  if (!animated && wind){ ox-=Math.cos(face)*2; oy-=Math.sin(face)*2; }
  if (!animated && exposed) ox+=Math.sin(time*27)*2;
  if(animated){ox=0;oy=0;}
  ctx.save();
  drawShadow(e.x,e.y,e.r);
  // Keep Glasswake's gameplay identity tell: real = solid white, decoy = broken magenta.
  if (id==='glasswake'){
    ctx.save(); ctx.strokeStyle=decoy?KIND_COL.glasswake:'#ffffff'; ctx.lineWidth=3;
    if (decoy) ctx.setLineDash([7,7]);
    ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.7,e.r*1.5,e.r*0.6,0,0,PI2); ctx.stroke(); ctx.restore();
  }
  const ground=e.y+e.r*0.75;
  if (id==='needle'){
    const bob=Math.sin(time*5+(e.bob||0))*3;
    ctx.save(); ctx.translate(e.x,e.y-10+bob); ctx.rotate(face-Math.PI/2);
    ctx.imageSmoothingEnabled=false;
    const f=s.frame;
    if(!drawAnimation(id,animation.name,0,0,Math.PI/2,sc,animation.elapsed,animation.frame))ctx.drawImage(s.img,0,0,f,f,-f*sc/2,-f*sc/2,f*sc,f*sc);
    if (e.flashT>0){ ctx.globalAlpha=0.85; if(!drawAnimation(id,animation.name,0,0,Math.PI/2,sc,animation.elapsed,animation.frame,'white'))ctx.drawImage(s.white,0,0,f,f,-f*sc/2,-f*sc/2,f*sc,f*sc); }
    // Charge light remains a code effect; the targeting lane is still drawn by drawTelegraphs.
    if (e.state==='charge'){
      const k=clamp(1-e.timer/(e.windDur||0.65),0,1);
      ctx.globalAlpha=0.25+k*0.6; ctx.fillStyle=COL.amber; ctx.shadowColor=COL.amber; ctx.shadowBlur=6+k*18;
      ctx.beginPath(); ctx.arc(0,f*sc*0.19,2+k*3,0,PI2); ctx.fill();
    }
    ctx.restore();
  } else {
    ctx.globalAlpha=bodyAlpha;
    body(e.x+ox,ground+oy);
    if (e.flashT>0){ ctx.globalAlpha=bodyAlpha*0.85; body(e.x+ox,ground+oy,'white'); }
    ctx.globalAlpha=1;
  }
  if (e.vent>0){
    // Open-guard recovery remains a visible punish cue until authored motion clips exist.
    ctx.save(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5; ctx.globalAlpha=0.45+0.35*Math.sin(time*22);
    ctx.setLineDash([5,5]); ctx.beginPath(); ctx.ellipse(e.x,ground,e.r*1.25,e.r*0.5,0,0,PI2); ctx.stroke(); ctx.restore();
  }
  if (e.bstate==='INTRO'||e.bstate==='PHASE_CHANGE'){
    ctx.save(); ctx.strokeStyle=KIND_COL[id]; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]);
    ctx.beginPath(); ctx.arc(e.x,e.y,e.r+20,0,PI2); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  return true;
}
// Keep status icons above tall body sprites rather than through their heads.
function enemySpriteTop(e){
  const id=e.isDecoy||e.kind==='decoy'?'glasswake':e.kind;
  if (!ENEMY_SPRITES[id] || !spriteReady(id)) return null;
  const s=SPRITES[id];
  return id==='needle' ? e.y-10-s.frame*s.scale/2-3 : e.y+e.r*0.75-s.anchor[1]*s.scale-3;
}
function drawEnemyActor(e){
  // Elite Rushers stand in a pulsing coral aura so they read as the bigger threat.
  if (e.elite){ ctx.save(); ctx.globalAlpha=0.35+0.2*Math.sin(time*6); ctx.fillStyle=COL.threat; ctx.shadowColor=COL.threat; ctx.shadowBlur=18; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.7,e.r*1.6,e.r*0.65,0,0,PI2); ctx.fill(); ctx.restore(); }
  // Buds, ice walls and Redactor plates own custom gameplay drawings; decoys use Glasswake's sprite.
  if (e.drawFn && !e.isDecoy && e.kind!=='decoy'){ e.drawFn(e); return; }
  if (drawEnemySprite(e)) return;
  if (e.drawFn) e.drawFn(e);
  else if (isSpecBoss(e)) BOSSES[e.kind].draw(e);
  else if (VECTOR[e.kind]) VECTOR[e.kind](e);
}

/* Authored pose animation. Metadata is embedded to retain file:// support. */
const ANIMATION_DATA = {"volt":{"run":{"fps":14,"loop":true,"hold_last":false,"file":"assets/sprites/volt/volt_run.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":8,"source_keyframes":8,"frame_map":[0,1,2,3,4,5,6,7]},"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/volt/volt_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1],"mirrored_directions":{"west":"east"}},"block":{"fps":12,"loop":false,"hold_last":true,"file":"assets/sprites/volt/volt_block.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":3,"source_keyframes":4,"frame_map":[0,1,3],"mirrored_directions":{"west":"east"}},"parry":{"fps":20,"loop":false,"hold_last":false,"key_frame":1,"file":"assets/sprites/volt/volt_parry.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,1,2,3],"mirrored_directions":{"west":"east"}},"dash":{"fps":24,"loop":false,"hold_last":false,"file":"assets/sprites/volt/volt_dash.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3],"mirrored_directions":{"west":"east"}},"strike1":{"fps":20,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/volt/volt_strike1.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3],"mirrored_directions":{"west":"east"}},"strike2":{"fps":20,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/volt/volt_strike2.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3],"mirrored_directions":{"west":"east"}},"strike3":{"fps":20,"loop":false,"hold_last":false,"key_frame":3,"file":"assets/sprites/volt/volt_strike3.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,1,2,2,3],"mirrored_directions":{"west":"east"}},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/volt/volt_hurt.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":3,"source_keyframes":4,"frame_map":[0,1,3],"mirrored_directions":{"west":"east"}}},"halo":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/halo/halo_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"talk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/halo/halo_talk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"react_pleased":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/halo/halo_react_pleased.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"react_stern":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/halo/halo_react_stern.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]}},"bastion":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/bastion/bastion_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"talk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/bastion/bastion_talk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"react_pleased":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/bastion/bastion_react_pleased.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"react_stern":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/bastion/bastion_react_stern.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"walk":{"fps":12,"loop":true,"hold_last":false,"file":"assets/sprites/bastion/bastion_walk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":8,"source_keyframes":8,"frame_map":[0,1,2,3,4,5,6,7]}},"echo":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/echo/echo_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"talk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/echo/echo_talk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"react_pleased":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/echo/echo_react_pleased.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"react_stern":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/echo/echo_react_stern.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]}},"thorn":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/thorn/thorn_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"talk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/thorn/thorn_talk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"react_pleased":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/thorn/thorn_react_pleased.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"react_stern":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/thorn/thorn_react_stern.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]}},"patch":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/patch/patch_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"talk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/patch/patch_talk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"react_pleased":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/patch/patch_react_pleased.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"react_stern":{"fps":10,"loop":false,"hold_last":false,"file":"assets/sprites/patch/patch_react_stern.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":5,"source_keyframes":4,"frame_map":[0,1,2,2,3]},"walk":{"fps":12,"loop":true,"hold_last":false,"file":"assets/sprites/patch/patch_walk.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":8,"source_keyframes":8,"frame_map":[0,1,2,3,4,5,6,7]}},"rusher":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/rusher/rusher_idle.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"run":{"fps":12,"loop":true,"hold_last":false,"file":"assets/sprites/rusher/rusher_run.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":8,"source_keyframes":4,"frame_map":[0,1,2,3,0,1,2,3]},"windup":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/rusher/rusher_windup.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,1,2,2,3]},"swing":{"fps":24,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/rusher/rusher_swing.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recover":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/rusher/rusher_recover.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/rusher/rusher_exposed.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":6,"source_keyframes":4,"frame_map":[0,1,2,3,2,1]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/rusher/rusher_hurt.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":2,"source_keyframes":4,"frame_map":[0,2]},"death":{"fps":12,"loop":false,"hold_last":false,"file":"assets/sprites/rusher/rusher_death.png","frame":[128,128],"anchor":[64,112],"directions":["south","east","north","west"],"frames":8,"source_keyframes":4,"frame_map":[0,0,1,1,2,2,3,3]}},"needle":{"hover":{"fps":16,"loop":true,"hold_last":false,"file":"assets/sprites/needle/needle_hover.png","frame":[128,128],"anchor":[64,64],"directions":["south"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"charge":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/needle/needle_charge.png","frame":[128,128],"anchor":[64,64],"directions":["south"],"frames":6,"source_keyframes":4,"frame_map":[0,0,1,2,3,3]},"fire":{"fps":20,"loop":false,"hold_last":false,"key_frame":1,"file":"assets/sprites/needle/needle_fire.png","frame":[128,128],"anchor":[64,64],"directions":["south"],"frames":3,"source_keyframes":4,"frame_map":[0,1,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/needle/needle_hurt.png","frame":[128,128],"anchor":[64,64],"directions":["south"],"frames":2,"source_keyframes":4,"frame_map":[0,2]},"death":{"fps":12,"loop":false,"hold_last":false,"file":"assets/sprites/needle/needle_death.png","frame":[128,128],"anchor":[64,64],"directions":["south"],"frames":8,"source_keyframes":4,"frame_map":[0,0,1,1,2,2,3,3]}},"kilnheart":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_idle.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_walk.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_intro.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_recovery.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_exposed.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_phase_change.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_hurt.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_death.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"punch":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/kilnheart/kilnheart_punch.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"rush":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/kilnheart/kilnheart_rush.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"slam":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/kilnheart/kilnheart_slam.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"vents_open":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/kilnheart/kilnheart_vents_open.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"gravemark":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_idle.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_walk.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_intro.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_recovery.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_exposed.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_phase_change.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_hurt.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_death.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"well_cast":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/gravemark/gravemark_well_cast.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"driver_fire":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/gravemark/gravemark_driver_fire.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"orbit_summon":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/gravemark/gravemark_orbit_summon.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"collapse":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/gravemark/gravemark_collapse.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"bellwether":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_idle.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_walk.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_intro.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_recovery.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_exposed.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_phase_change.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_hurt.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_death.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"ring_emit":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/bellwether/bellwether_ring_emit.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"focused_burst":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/bellwether/bellwether_focused_burst.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"resonator_drop":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/bellwether/bellwether_resonator_drop.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"resonate":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/bellwether/bellwether_resonate.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"verdigris":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_idle.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_walk.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_intro.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_recovery.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_exposed.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_phase_change.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_hurt.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/verdigris/verdigris_death.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"seed_throw":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/verdigris/verdigris_seed_throw.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"vine_sweep":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/verdigris/verdigris_vine_sweep.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"thorn_growth":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/verdigris/verdigris_thorn_growth.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"acid_spray":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/verdigris/verdigris_acid_spray.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"glasswake":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_idle.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_walk.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_intro.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_recovery.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_exposed.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_phase_change.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_hurt.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/glasswake/glasswake_death.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"prism_lanes":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/glasswake/glasswake_prism_lanes.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"mirror_step":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/glasswake/glasswake_mirror_step.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"shard_lunge":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/glasswake/glasswake_shard_lunge.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"refraction":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/glasswake/glasswake_refraction.png","frame":[192,192],"anchor":[96,176],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"undertow":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/undertow/undertow_idle.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/undertow/undertow_walk.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/undertow/undertow_intro.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/undertow/undertow_recovery.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/undertow/undertow_exposed.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/undertow/undertow_phase_change.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/undertow/undertow_hurt.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/undertow/undertow_death.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"pressure_jet":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/undertow/undertow_pressure_jet.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"ice_divide":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/undertow/undertow_ice_divide.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"depth_charge":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/undertow/undertow_depth_charge.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"glacier_hook":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/undertow/undertow_glacier_hook.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}},"redactor":{"idle":{"fps":8,"loop":true,"hold_last":false,"file":"assets/sprites/redactor/redactor_idle.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"walk":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/redactor/redactor_walk.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"intro":{"fps":2.6666666666666665,"loop":false,"hold_last":false,"file":"assets/sprites/redactor/redactor_intro.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"recovery":{"fps":8,"loop":false,"hold_last":false,"file":"assets/sprites/redactor/redactor_recovery.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"exposed":{"fps":10,"loop":true,"hold_last":false,"file":"assets/sprites/redactor/redactor_exposed.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"phase_change":{"fps":3.3333333333333335,"loop":false,"hold_last":false,"file":"assets/sprites/redactor/redactor_phase_change.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"hurt":{"fps":16,"loop":false,"hold_last":false,"file":"assets/sprites/redactor/redactor_hurt.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"death":{"fps":1.6,"loop":false,"hold_last":false,"file":"assets/sprites/redactor/redactor_death.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"redaction_lanes":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/redactor/redactor_redaction_lanes.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"null_field":{"fps":10,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/redactor/redactor_null_field.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"final_verdict":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/redactor/redactor_final_verdict.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]},"stolen_power":{"fps":12,"loop":false,"hold_last":false,"key_frame":2,"file":"assets/sprites/redactor/redactor_stolen_power.png","frame":[256,256],"anchor":[128,240],"directions":["south","east","north","west"],"frames":4,"source_keyframes":4,"frame_map":[0,1,2,3]}}};
const ANIMATION_CACHE = new Map(), ACTOR_MOTION = new WeakMap(), NPC_MOTION = new Map();
function animationClip(id,name){
  const def=ANIMATION_DATA[id] && ANIMATION_DATA[id][name];
  if (!def) return null;
  const key=id+'/'+name;
  if (!ANIMATION_CACHE.has(key)){
    const clip={...def,ready:false,img:new Image()}; ANIMATION_CACHE.set(key,clip);
    clip.img.onload=()=>{invalidateRender();clip.ready=clip.img.width===clip.frame[0]*clip.frames && clip.img.height===clip.frame[1]*clip.directions.length; if (clip.ready && IN_PLACE.has(name)) clip.offsets=registerFrames(clip);};
    clip.img.src=clip.file;
  }
  return ANIMATION_CACHE.get(key);
}
// In-place loops (standing, talking, walking on the spot) should never slide. The generated keyframes
// drift sideways and up and down from frame to frame, so each frame is shifted to put its feet where the
// clip's typical frame has them: the centre of the legs and the lowest pixel, so arms don't move the anchor.
// Attacks, dashes and deaths keep their authored motion. Reading pixels fails from file://; then no shift.
const IN_PLACE = new Set(['idle','talk','hover','walk','run','recovery','exposed','vents_open']);
function registerFrames(c){
  try {
    const [w,h]=c.frame, cv=document.createElement('canvas'); cv.width=c.img.width; cv.height=c.img.height;
    const g=cv.getContext('2d'); g.drawImage(c.img,0,0); const d=g.getImageData(0,0,cv.width,cv.height).data, out=[];
    const on=(r,f,x,y)=>d[((r*h+y)*cv.width+f*w+x)*4+3]>60;
    for (let r=0;r<c.directions.length;r++){
      const feet=[];
      for (let f=0;f<c.frames;f++){
        let top=h, foot=-1;
        for (let y=0;y<h;y++) for (let x=0;x<w;x++) if (on(r,f,x,y)){ if (y<top) top=y; if (y>foot) foot=y; }
        if (foot<0){ feet.push(null); continue; }
        const legTop=Math.floor(foot-Math.max(4,(foot-top)*0.22)); let sx=0,n=0;
        for (let y=legTop;y<=foot;y++) for (let x=0;x<w;x++) if (on(r,f,x,y)){ sx+=x; n++; }
        feet.push([sx/n,foot]);
      }
      const ok=feet.filter(Boolean), med=k=>{ const v=ok.map(q=>q[k]).sort((a,b)=>a-b); return v[Math.floor(v.length/2)]||0; };
      const mx=med(0), my=med(1);
      out.push(feet.map(q=>q?[Math.round(mx-q[0]), Math.round(my-q[1])]:[0,0]));
    }
    return out;
  } catch(e){ return null; }
}
// Four-way facing with a little stickiness, so a character aiming near a diagonal doesn't flicker
// between two views. Returns the snapped angle to draw with.
const FACE_MEMO = new WeakMap(), FACE_MEMO_ID = new Map();
function stickyFace(key,face){
  const memo = typeof key==='object' ? FACE_MEMO : FACE_MEMO_ID;
  let cur=memo.get(key);
  if (cur===undefined || Math.abs(angDiff(face,cur*Math.PI/2))>Math.PI/4+0.17) cur=((Math.round(face/(Math.PI/2))%4)+4)%4;
  memo.set(key,cur); return cur*Math.PI/2;
}
// Volt's side-view run only ever lifts the near leg, and its knee-ups land unevenly (frames 7, 0, then 3).
// Until a proper alternating cycle is generated, replay it as stride, stride, knee-up twice per loop.
const FRAME_ORDER = { 'volt/run/east':[1,2,3,5,6,7], 'volt/run/west':[1,2,3,5,6,7] };
function animationFrame(c,elapsed){
  const f=Math.max(0,Math.floor(elapsed*c.fps));
  return c.loop?f%c.frames:Math.min(c.frames-1,f);
}
function drawAnimation(id,name,x,y,face,scale,elapsed=0,frame=null,tint=null){
  const c=animationClip(id,name); if (!c || !c.ready) return false;
  const direction=['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4];
  const row=c.directions.length===1?0:c.directions.indexOf(direction);
  if (row<0) return false;
  // Some clips replay their frames in a corrected order for one facing (see FRAME_ORDER).
  const order=FRAME_ORDER[id+'/'+name+'/'+direction];
  const f=order&&frame===null ? order[Math.floor(Math.max(0,elapsed)*c.fps)%order.length] : frame===null?animationFrame(c,elapsed):clamp(Math.floor(frame),0,c.frames-1);
  let sheet=c.img;
  if (tint){if (!c[tint]) c[tint]=tintSheet(c.img,tint==='white'?'#ffffff':COL.volt);sheet=c[tint];}
  const [w,h]=c.frame,[ax,ay]=c.anchor, off=c.offsets&&c.offsets[row]&&c.offsets[row][f]||[0,0];
  const smooth=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet,f*w,row*h,w,h,x+(off[0]-ax)*scale,y+(off[1]-ay)*scale,w*scale,h*scale);
  ctx.imageSmoothingEnabled=smooth;return true;
}
function motionClock(actor,token){
  let m=ACTOR_MOTION.get(actor);
  if (!m || m.token!==token || time<m.t0){m={token,t0:time};ACTOR_MOTION.set(actor,m);}
  return time-m.t0;
}
const BOSS_ANIMATION_ATTACKS={
  kilnheart:{punch:'punch',punchHot:'punch',double:'punch',rush:'rush',slam:'slam',erupt:'slam'},
  gravemark:{well:'well_cast',driver:'driver_fire',double:'driver_fire',orbit:'orbit_summon',orbit6:'orbit_summon',collapse:'collapse'},
  bellwether:{ring:'ring_emit',twin:'ring_emit',turning:'ring_emit',burst:'focused_burst',drop:'resonator_drop'},
  verdigris:{seed:'seed_throw',twin:'seed_throw',vine:'vine_sweep',thorns:'thorn_growth',acid:'acid_spray'},
  glasswake:{lanes:'prism_lanes',step:'mirror_step',double:'mirror_step',lunge:'shard_lunge',refract:'refraction'},
  undertow:{jet:'pressure_jet',jet90:'pressure_jet',hook:'glacier_hook',charge:'depth_charge',double:'depth_charge',divide:'ice_divide'},
  redactor:{lanes:'redaction_lanes',field:'null_field',verdict:'final_verdict',stolen:'stolen_power'}
};
const NEEDLE_VISUAL_STATE=new WeakMap();
function enemyAnimation(e){
  const id=e.isDecoy||e.kind==='decoy'?'glasswake':e.kind;
  let name='idle',frame=null;
  if (e.bstate){
    name=({INTRO:'intro',PHASE_CHANGE:'phase_change',EXPOSED:'exposed',RECOVERY:'recovery',PAUSE:'recovery',DEAD:'death'})[e.bstate] || (Math.hypot(e.mx||0,e.my||0)>5 && (e.walkVisT=time+0.25), time<(e.walkVisT||0)?'walk':'idle');
    if (e.bstate==='RECOVERY' && e.vent>0 && id==='kilnheart') name='vents_open';
    if (e.bstate==='WINDUP'||e.bstate==='ACTIVE'){
      name=(BOSS_ANIMATION_ATTACKS[id]||{})[e.atk && e.atk.id] || 'idle';
      const c=ANIMATION_DATA[id] && ANIMATION_DATA[id][name];
      if (c){const key=c.key_frame??2;frame=e.bstate==='WINDUP'?Math.min(key-1,Math.floor(clamp((e.stateT||0)/(e.atk.windup||1),0,1)*key)):Math.min(c.frames-1,key+Math.floor((e.stateT||0)*c.fps));}
    }
  } else if (id==='rusher'){
    name=e.stunT>0||e.exposedT>0?'exposed':({chase:'run',windup:'windup',swing:'swing',recover:'recover'})[e.state]||'idle';
    const c=ANIMATION_DATA[id] && ANIMATION_DATA[id][name];
    if (c && name==='windup') frame=Math.min(c.frames-1,Math.floor(clamp(1-e.timer/(e.windDur||1),0,1)*c.frames));
    if (c && name==='swing') frame=Math.min(c.frames-1,(c.key_frame??2)+Math.floor(Math.max(0,(typeof RUSH==='undefined'?.16:RUSH.swingT)-(e.timer||0))*c.fps));
  } else if (id==='needle'){
    let n=NEEDLE_VISUAL_STATE.get(e);
    if (!n){n={state:e.state,fireAt:-999};NEEDLE_VISUAL_STATE.set(e,n);}
    if (n.state==='charge' && e.state==='move') n.fireAt=time;
    n.state=e.state;
    name=e.state==='charge'?'charge':time-n.fireAt<0.15?'fire':'hover';
    if (name==='charge'){const c=ANIMATION_DATA[id] && ANIMATION_DATA[id][name];if(c)frame=Math.min(c.frames-1,Math.floor(clamp(1-e.timer/(e.windDur||.65),0,1)*c.frames));}
  }
  if (e.flashT>0 && (name==='idle'||name==='walk'||name==='run'||name==='hover')) name='hurt';
  const elapsed=motionClock(e,name+':'+(e.bstate||e.state||'')+':'+(e.atk?e.atk.stepI:''));
  animationClip(id,name);
  return {name,frame,elapsed};
}
function setHeroSpriteAnimation(id,name){
  if (!ANIMATION_DATA[id] || !ANIMATION_DATA[id][name]) return false;
  const n=NPC_MOTION.get(id)||{};n.override=name;n.overrideAt=time;NPC_MOTION.set(id,n);return true;
}
function drawAnimatedNpc(id,x,y,face,options={}){
  let n=NPC_MOTION.get(id)||{x,y,t0:time};
  let name=options.talking?'talk':Math.hypot(x-n.x,y-n.y)>.05 && ANIMATION_DATA[id]?.walk?'walk':'idle';
  if (n.override){const c=ANIMATION_DATA[id][n.override];if(time-n.overrideAt<c.frames/c.fps)name=n.override;else n.override=null;}
  if (name!==n.name){n.name=name;n.t0=time;}
  n.x=x;n.y=y;NPC_MOTION.set(id,n);
  if (!drawAnimation(id,name,x,y,stickyFace(id,face),SPRITES[id].scale,time-n.t0))drawTurn(id,x,y,face);
}
// Corpses are visual-only snapshots. No collision, damage, drops or encounter timing changes.
const PREVIOUS_SPRITE_ACTORS=new Set();let SPRITE_CORPSES=[],SPRITE_LAST_TIME=-1;
function animationDeathActors(){
  if (time<SPRITE_LAST_TIME || (state!=='play' && state!=='over')){PREVIOUS_SPRITE_ACTORS.clear();SPRITE_CORPSES=[];}
  SPRITE_LAST_TIME=time;
  const current=new Set(enemies);
  for(const e of PREVIOUS_SPRITE_ACTORS){
    if (!current.has(e) && e.dead && !e.isDecoy && !e.isIce && !e.isBud && !e.isPlate && !e.tutWeak && !e.tutDummy && !e.isPractice && ANIMATION_DATA[e.kind]?.death){
      animationClip(e.kind,'death');SPRITE_CORPSES.push({kind:e.kind,x:e.x,y:e.y,r:e.r,face:e.face||0,t0:time});
    }
  }
  PREVIOUS_SPRITE_ACTORS.clear();for(const e of enemies)PREVIOUS_SPRITE_ACTORS.add(e);
  SPRITE_CORPSES=SPRITE_CORPSES.filter(e=>time-e.t0<ANIMATION_DATA[e.kind].death.frames/ANIMATION_DATA[e.kind].death.fps+.3).slice(-48);
  return SPRITE_CORPSES.map(e=>({y:e.y,f:()=>{
    const c=ANIMATION_DATA[e.kind].death,age=time-e.t0,sc=SPRITES[e.kind].scale;
    ctx.save();ctx.globalAlpha=clamp((c.frames/c.fps+.3-age)/.3,0,1);
    if(e.kind==='needle'){ctx.translate(e.x,e.y-10);ctx.rotate(e.face-Math.PI/2);drawAnimation(e.kind,'death',0,0,Math.PI/2,sc,age);}
    else drawAnimation(e.kind,'death',e.x,e.y+e.r*.75,e.face,sc,age);
    ctx.restore();
  }}));
}
// Detailed atlases decode on demand. Only warm Volt's legacy idle while the first atlas loads.
animationClip('volt','idle');

