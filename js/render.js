// Volt: All canvas drawing.
'use strict';

/* ---------- Render ---------- */
function jag(x1,y1,x2,y2,seg,amp){
  const pts=[[x1,y1]], dx=x2-x1, dy=y2-y1, d=Math.hypot(dx,dy)||1, nx=-dy/d, ny=dx/d;
  for (let i=1;i<seg;i++){ const t=i/seg, o=rand(-amp,amp); pts.push([x1+dx*t+nx*o,y1+dy*t+ny*o]); }
  pts.push([x2,y2]); return pts;
}
function strokePts(pts){ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.stroke(); }
function heroShape(){ ctx.beginPath(); ctx.moveTo(23,0); ctx.lineTo(5,-13); ctx.lineTo(-11,-16); ctx.lineTo(-5,0); ctx.lineTo(-11,16); ctx.lineTo(5,13); ctx.closePath(); }

function drawCity(){
  const ox=(cam.x-ARENA.w/2)*0.35, oy=(cam.y-ARENA.h/2)*0.35;
  for (const l of city){
    ctx.globalAlpha=l.a*(0.75+0.25*Math.sin(time*1.3+l.f));
    ctx.fillStyle=l.c; ctx.fillRect(l.x+ox,l.y+oy,l.w,l.h);
  }
  ctx.globalAlpha=1;
}
// Rooftop floor: mottled slate with panel seams, a raised parapet on three sides (the front wall draws over actors).
const WALL = 24;
const floorBlots = Array.from({length:70},()=>({x:rand(0,ARENA.w),y:rand(0,ARENA.h),r:rand(30,110),dark:Math.random()<.8,a:rand(.02,.05)}));
const facadeWins = Array.from({length:46},(_,i)=>({x:20+i*32+rand(-4,4),y:rand(40,110),lit:Math.random()<.45,c:Math.random()<.8?'#f2a24a':'#8a6cf0'}));
// The painted rooftop: its floor maps onto the arena at ROOF.k world units per painting pixel,
// with painting pixel (ox,oy) at the arena's top-left corner. Each district gets a colour grade.
const ROOF = { k:1.124, ox:110, oy:178, img:new Image() };
ROOF.img.src='assets/arena/rooftop.webp';
const roofPainted = () => ROOF.img.complete && ROOF.img.naturalWidth>0;
function drawPaintedRoof(){
  const k=ROOF.k, im=ROOF.img;
  ctx.drawImage(im, -ROOF.ox*k, -ROOF.oy*k, im.naturalWidth*k, im.naturalHeight*k);
  const d=run && run.route && curDistrict(), c=d && KIND_COL[d];
  if (c){ ctx.save(); ctx.globalCompositeOperation='soft-light'; ctx.globalAlpha=0.22; ctx.fillStyle=c; ctx.fillRect(-ROOF.ox*k, -ROOF.oy*k, im.naturalWidth*k, im.naturalHeight*k); ctx.restore(); }
}
function drawFloor(){
  if (roofPainted()){ drawPaintedRoof(); return; }
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(18,26,ARENA.w,ARENA.h);
  ctx.fillStyle=floorTint; ctx.fillRect(0,0,ARENA.w,ARENA.h);
  for (const s of floorBlots){ ctx.fillStyle=s.dark?`rgba(4,7,14,${s.a*1.6})`:`rgba(110,140,190,${s.a})`; ctx.beginPath(); ctx.ellipse(s.x,s.y,s.r,s.r*0.7,s.x,0,PI2); ctx.fill(); }
  for (const s of stains){ ctx.fillStyle=`rgba(4,7,14,${s.a})`; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,PI2); ctx.fill(); }
  ctx.strokeStyle='rgba(4,7,14,.55)'; ctx.lineWidth=2;
  ctx.beginPath(); for (let x=125;x<ARENA.w;x+=125){ ctx.moveTo(x,0); ctx.lineTo(x,ARENA.h); } for (let y=125;y<ARENA.h;y+=125){ ctx.moveTo(0,y); ctx.lineTo(ARENA.w,y); } ctx.stroke();
  ctx.strokeStyle='rgba(66,81,106,.25)'; ctx.lineWidth=1;
  ctx.beginPath(); for (let x=127;x<ARENA.w;x+=125){ ctx.moveTo(x,0); ctx.lineTo(x,ARENA.h); } for (let y=127;y<ARENA.h;y+=125){ ctx.moveTo(0,y); ctx.lineTo(ARENA.w,y); } ctx.stroke();
  ctx.strokeStyle='rgba(38,191,255,.07)'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(ARENA.w/2,ARENA.h/2,180,0,PI2); ctx.stroke();
  ctx.fillStyle='rgba(38,191,255,.05)'; ctx.font='900 150px "Big Shoulders Display", Impact, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('V',ARENA.w/2,ARENA.h/2+8);
  // back wall: its inner face is visible, its top sits above it
  ctx.fillStyle='#202a3c'; ctx.fillRect(-WALL,-14,ARENA.w+WALL*2,WALL+14);
  ctx.fillStyle='#3a4760'; ctx.fillRect(-WALL,-40,ARENA.w+WALL*2,26);
  // side walls
  ctx.fillStyle='#2e3a50'; ctx.fillRect(-WALL,-40,WALL+6,ARENA.h+40); ctx.fillRect(ARENA.w-6,-40,WALL+6,ARENA.h+40);
  ctx.fillStyle='#3a4760'; ctx.fillRect(-WALL,-40,WALL,ARENA.h+40); ctx.fillRect(ARENA.w,-40,WALL,ARENA.h+40);
  ctx.fillStyle='#46546e'; for (let x=-WALL;x<ARENA.w+WALL;x+=250) ctx.fillRect(x,-46,34,34);
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.strokeRect(-WALL,-40,ARENA.w+WALL*2,ARENA.h+40);
  ctx.strokeStyle='rgba(66,81,106,.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-WALL+2,ARENA.h); ctx.lineTo(-WALL+2,-38); ctx.lineTo(ARENA.w+WALL-2,-38); ctx.stroke();
}
function drawFrontWall(){
  if (roofPainted()) return; // the painting has its own front parapet
  const y=ARENA.h-6;
  ctx.fillStyle='#121a28'; ctx.fillRect(-WALL,y+26,ARENA.w+WALL*2,150);
  for (const w of facadeWins){ ctx.fillStyle=w.lit?w.c:'#0c121d'; ctx.globalAlpha=w.lit?.55:1; ctx.fillRect(w.x,y+26+w.y,14,20); }
  ctx.globalAlpha=1;
  ctx.fillStyle='#3a4760'; ctx.fillRect(-WALL,y-14,ARENA.w+WALL*2,22);
  ctx.fillStyle='#253045'; ctx.fillRect(-WALL,y+8,ARENA.w+WALL*2,20);
  ctx.fillStyle='#46546e'; for (let x=-WALL;x<ARENA.w+WALL;x+=250) ctx.fillRect(x,y-20,34,30);
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.strokeRect(-WALL,y-14,ARENA.w+WALL*2,42);
}
function drawDecals(){
  for (const d of decals){
    ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(d.rot);
    ctx.fillStyle='rgba(4,7,14,.6)'; ctx.beginPath();
    d.pts.forEach((k,i)=>{ const a=i/d.pts.length*PI2, r=d.r*k; i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); });
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle=d.c; ctx.globalAlpha=.28;
    for (const q of d.drops){ ctx.beginPath(); ctx.arc(d.x+Math.cos(q.a)*q.d,d.y+Math.sin(q.a)*q.d,q.r,0,PI2); ctx.fill(); }
    ctx.globalAlpha=1;
  }
}

/* Obstacles in 3/4: the footprint is on the floor, the top face is lifted by ht, the front face joins them. */
function box3(x,y,w,h,ht,top,front){
  ctx.fillStyle=front; ctx.fillRect(x,y+h-ht,w,ht);
  ctx.fillStyle=top; ctx.fillRect(x,y-ht,w,h);
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.strokeRect(x,y-ht,w,h+ht);
  ctx.beginPath(); ctx.moveTo(x,y+h-ht); ctx.lineTo(x+w,y+h-ht); ctx.stroke();
  ctx.strokeStyle='rgba(66,81,106,.95)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+3,y+h-ht-3); ctx.lineTo(x+3,y-ht+3); ctx.lineTo(x+w-3,y-ht+3); ctx.stroke();
}
function drawObstacle(b){
  if (b.painted && roofPainted()) return; // already in the painting; only its collision is live
  if (b.kind==='ice'){ if (b.drawSeg) drawIceWall(b.wall); return; }
  ctx.fillStyle='rgba(0,0,0,.45)';
  if (b.circle){ ctx.beginPath(); ctx.ellipse(b.cx+14,b.cy+10,b.rad*1.05,b.rad*0.62,0,0,PI2); ctx.fill(); }
  else ctx.fillRect(b.x+12,b.y+12,b.w,b.h);
  if (b.kind==='tower'){
    const cx=b.cx, cy=b.cy, R=b.rad*0.82, base=cy-b.ht+40, top=base-80;
    ctx.strokeStyle='#2a2522'; ctx.lineWidth=7;
    for (const [lx,ly] of [[-0.7,0.2],[0.7,0.2],[-0.45,0.55],[0.45,0.55]]){ ctx.beginPath(); ctx.moveTo(cx+lx*R,cy+ly*R); ctx.lineTo(cx+lx*R*0.9,base); ctx.stroke(); }
    ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-R*0.7,cy-10); ctx.lineTo(cx+R*0.7,base+20); ctx.moveTo(cx+R*0.7,cy-10); ctx.lineTo(cx-R*0.7,base+20); ctx.stroke();
    ctx.fillStyle='#3a3431'; ctx.beginPath(); ctx.ellipse(cx,base,R,R*0.42,0,0,Math.PI); ctx.lineTo(cx-R,top); ctx.ellipse(cx,top,R,R*0.42,0,Math.PI,0,true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a2522'; ctx.lineWidth=2; for (let i=1;i<4;i++){ const yy=top+(base-top)*i/4; ctx.beginPath(); ctx.ellipse(cx,yy,R,R*0.42,0,0,Math.PI); ctx.stroke(); }
    ctx.fillStyle='#4a4340'; ctx.beginPath(); ctx.moveTo(cx-R-6,top); ctx.lineTo(cx,top-62); ctx.lineTo(cx+R+6,top); ctx.ellipse(cx,top,R+6,R*0.45,0,0,Math.PI); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx,base,R,R*0.42,0,0,Math.PI); ctx.lineTo(cx-R,top); ctx.moveTo(cx+R,base); ctx.lineTo(cx+R,top); ctx.stroke();
    ctx.fillStyle='rgba(255,182,71,.85)'; ctx.beginPath(); ctx.arc(cx+R+10,top+20,4,0,PI2); ctx.fill();
    return;
  }
  if (b.kind==='hut'){
    box3(b.x,b.y,b.w,b.h,b.ht,'#34405a','#28324a');
    const dx=b.x+b.w*0.5-22, dy=b.y+b.h-b.ht+22;
    const g=ctx.createRadialGradient(dx+22,dy-6,2,dx+22,dy-6,90); g.addColorStop(0,'rgba(255,182,71,.35)'); g.addColorStop(1,'rgba(255,182,71,0)');
    ctx.fillStyle=g; ctx.fillRect(dx-70,dy-40,184,200);
    ctx.fillStyle='#161e2c'; ctx.fillRect(dx,dy,44,b.ht-22); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.strokeRect(dx,dy,44,b.ht-22);
    ctx.fillStyle='#ffd27a'; ctx.fillRect(dx+16,dy-12,12,7);
    ctx.strokeStyle='#202a3c'; ctx.lineWidth=2; for (let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(b.x+12,b.y-b.ht+18+i*30); ctx.lineTo(b.x+b.w-12,b.y-b.ht+18+i*30); ctx.stroke(); }
    return;
  }
  if (b.kind==='ac'){
    box3(b.x,b.y,b.w,b.h,b.ht,'#3a4760','#28324a');
    for (let i=0;i<2;i++){
      const cx=b.x+b.w*(0.28+i*0.44), cy=b.y-b.ht+b.h/2, r=Math.min(b.w*0.2,b.h*0.38);
      ctx.fillStyle=COL.ink; ctx.beginPath(); ctx.arc(cx,cy,r,0,PI2); ctx.fill();
      ctx.strokeStyle='#56647e'; ctx.lineWidth=3; ctx.save(); ctx.translate(cx,cy); ctx.rotate(time*7+i);
      ctx.beginPath(); for (let k=0;k<3;k++){ const a=k*PI2/3; ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*r*.85,Math.sin(a)*r*.85); } ctx.stroke(); ctx.restore();
      ctx.strokeStyle='#46546e'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,r,0,PI2); ctx.stroke();
    }
    ctx.strokeStyle='#1e2738'; ctx.lineWidth=3; ctx.beginPath(); for (let x=b.x+12;x<b.x+b.w-10;x+=10){ ctx.moveTo(x,b.y+b.h-b.ht+10); ctx.lineTo(x,b.y+b.h-8); } ctx.stroke();
    return;
  }
  box3(b.x,b.y,b.w,b.h,b.ht,b.kind==='box'?'#33405a':'#3a4760','#28324a');
  if (b.kind==='vent'){
    ctx.fillStyle='#1a2232'; ctx.fillRect(b.x+20,b.y-b.ht+16,b.w-40,b.h-36);
    ctx.strokeStyle='#46546e'; ctx.lineWidth=3; ctx.beginPath(); for (let y=b.y-b.ht+22;y<b.y-b.ht+b.h-24;y+=9){ ctx.moveTo(b.x+24,y); ctx.lineTo(b.x+b.w-24,y); } ctx.stroke();
    ctx.strokeStyle='#1e2738'; ctx.lineWidth=3; ctx.beginPath(); for (let y=b.y+b.h-b.ht+12;y<b.y+b.h-6;y+=9){ ctx.moveTo(b.x+14,y); ctx.lineTo(b.x+b.w-14,y); } ctx.stroke();
  }
}
function drawIceWall(w){
  if (typeof drawIceCrystals==='function'){ drawIceCrystals(w); return; }
  const g=w.seg, s=w.owner && w.owner.atk ? null : null, len=3*U, th=0.7*U, age=run.time-w.born, fade=Math.min(1,(w.dur-age)/0.4), hurt=1-w.hp/w.maxHp;
  ctx.save(); ctx.globalAlpha=Math.max(0,fade); ctx.translate(g.x,g.y); ctx.rotate(g.ang);
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(-len/2+6,-th/2+8,len,th);
  ctx.fillStyle=w.flashT>0?'#ffffff':'rgba(190,240,255,.75)'; ctx.strokeStyle='#e8fbff'; ctx.lineWidth=2;
  ctx.beginPath(); for (let i=0;i<=8;i++){ const x=-len/2+i*len/8; ctx.lineTo(x,-th/2-((i%2)?14:6)); } ctx.lineTo(len/2,th/2); ctx.lineTo(-len/2,th/2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
  if (hurt>0){ ctx.strokeStyle='rgba(4,7,14,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,-th/2); ctx.lineTo(4,0); ctx.lineTo(-6,th/2); if (hurt>0.5){ ctx.moveTo(20,-th/2); ctx.lineTo(28,4); } ctx.stroke(); }
  ctx.restore();
}
const obstacleDepth = b => b.circle ? b.cy+b.rad*0.5 : b.y+b.h;

/* Ground telegraphs: drawn under every actor so they read as zones on the floor. */
function wedge(x,y,r,a0,a1){ ctx.beginPath(); ctx.moveTo(x,y); ctx.arc(x,y,r,a0,a1); ctx.closePath(); }
function drawZones(){
  for (const z of zones){
    const k=z.t/z.dur, fade=Math.min(1,(z.dur-z.t)/0.4);
    ctx.save(); ctx.globalAlpha=fade;
    if (z.kind==='light'){
      const g=ctx.createRadialGradient(z.x,z.y,0,z.x,z.y,z.r); g.addColorStop(0,'rgba(255,241,208,.32)'); g.addColorStop(1,'rgba(255,241,208,.05)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,PI2); ctx.fill();
      ctx.strokeStyle=z.c; ctx.lineWidth=2; ctx.setLineDash([12,10]); ctx.lineDashOffset=-time*40; ctx.stroke(); ctx.setLineDash([]);
    } else if (z.kind==='thorns'){
      ctx.fillStyle='rgba(106,212,106,.14)'; ctx.beginPath(); ctx.arc(z.x,z.y,z.r,0,PI2); ctx.fill();
      ctx.strokeStyle=z.c; ctx.lineWidth=2.5;
      for (let i=0;i<9;i++){ const a=z.seed+i*0.7, rr=z.r*((i*37%10)/10*0.8+0.15), x=z.x+Math.cos(a)*rr, y=z.y+Math.sin(a)*rr; ctx.beginPath(); ctx.moveTo(x-5,y+4); ctx.lineTo(x,y-7); ctx.lineTo(x+5,y+4); ctx.stroke(); }
    } else if (z.kind==='echo' && !z.fired){
      ctx.translate(z.x,z.y); ctx.rotate(z.a); ctx.globalAlpha=0.5+0.4*Math.sin(time*40); heroShape(); ctx.fillStyle=z.c; ctx.fill();
    }
    ctx.restore();
  }
}
function drawTelegraphs(){
  for (const e of enemies){
    if (e.spawnT>0){
      const k=clamp(e.spawnT/0.8,0,1), c=KIND_COL[e.kind];
      ctx.strokeStyle=c; ctx.globalAlpha=1-k*0.6; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.r+k*40,0,PI2); ctx.stroke();
      ctx.setLineDash([6,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+8,time*4,time*4+PI2); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=1; continue;
    }
    if (e.kind==='rusher' && (e.state==='windup'||e.state==='swing')){
      // Wide coral arc: the whole area the pipe swing covers.
      const k=e.state==='swing'?1:1-e.timer/(e.windDur||RUSH.wind), R=RUSH.reach+RUSH.step*RUSH.swingT*T.enemySpeed, committed=e.state==='swing'||e.timer<=0.18;
      wedge(e.x,e.y,R,e.lungeA-RUSH.arc/2,e.lungeA+RUSH.arc/2);
      ctx.fillStyle=`rgba(255,90,69,${0.1+k*0.22})`; ctx.fill();
      ctx.strokeStyle=`rgba(255,90,69,${committed?0.95:0.45+k*0.3})`; ctx.lineWidth=committed?3:2; ctx.stroke();
      wedge(e.x,e.y,R*k,e.lungeA-RUSH.arc/2,e.lungeA+RUSH.arc/2); ctx.fillStyle='rgba(255,90,69,.18)'; ctx.fill();
    }
    if (e.kind==='needle' && e.state==='charge'){
      const k=1-e.timer/(e.windDur||0.65), d=Math.min(e.aimD||300,620), ix=e.x+Math.cos(e.face)*d, iy=e.y+Math.sin(e.face)*d, locked=e.timer<=0.2;
      ctx.strokeStyle=`rgba(255,182,71,${0.15+k*0.55})`; ctx.lineWidth=1+k*2; ctx.setLineDash([10,8]);
      ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(e.x+Math.cos(e.face)*640,e.y+Math.sin(e.face)*640); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle=`rgba(255,182,71,${0.1+k*0.25})`; ctx.beginPath(); ctx.ellipse(ix,iy,22,14,0,0,PI2); ctx.fill();
      ctx.strokeStyle=locked?COL.amber:`rgba(255,182,71,${0.4+k*0.4})`; ctx.lineWidth=locked?3:2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ix,iy,22*k,14*k,0,0,PI2); ctx.stroke();
    }
    if (isSpecBoss(e)) drawBossTelegraph(e);
  }
}
/* Actors. Pixel sprites render first; vector drawers remain load-failure fallbacks. */
function drawShadow(x,y,r){ ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x+4,y+r*0.8,r*1.05,r*0.45,0,0,PI2); ctx.fill(); }
function poly(pts){ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); }
const rockShape = () => Array.from({length:6},(_,i)=>{ const a=i/6*PI2+rand(-.3,.3), r=rand(.7,1.1); return [Math.cos(a)*r,Math.sin(a)*r]; });
const GM_SHARDS = Array.from({length:8},(_,i)=>({a:i/8*PI2,rad:rand(68,92),sz:rand(5,9),spd:rand(.6,1.1)*(i%2?1:-1),shape:rockShape(),bob:rand(PI2)}));
const GM_FIST = Array.from({length:6},()=>({x:rand(-9,9),y:rand(-9,9),s:rand(7,11),shape:rockShape()}));
const VECTOR = {
  volt(p){
    drawShadow(p.x,p.y,p.r);
    const blink = p.iT>0 && p.dashT<=0 && Math.floor(time*16)%2===0;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.aim); if (blink) ctx.globalAlpha=0.45;
    const st = p.dashT>0 ? 1.25 : 1; ctx.scale(st,1/st);
    // suit: black body, blue glow rim
    heroShape(); ctx.shadowColor=COL.volt; ctx.shadowBlur=16; ctx.fillStyle='#161c28'; ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.lineJoin='miter'; ctx.stroke();
    // forearm and shin fins (white)
    ctx.fillStyle=COL.spark;
    poly([[8,-12],[-4,-17],[0,-11]]); ctx.fill(); poly([[8,12],[-4,17],[0,11]]); ctx.fill();
    poly([[-8,-13],[-14,-16],[-10,-9]]); ctx.fill(); poly([[-8,13],[-14,16],[-10,9]]); ctx.fill();
    // two blue rails
    ctx.strokeStyle=COL.volt; ctx.lineWidth=2.2; ctx.shadowColor=COL.volt; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(-9,-5); ctx.lineTo(-1,-4); ctx.lineTo(3,-6); ctx.moveTo(-9,5); ctx.lineTo(-1,4); ctx.lineTo(3,6); ctx.stroke(); ctx.shadowBlur=0;
    // swept white collar
    ctx.fillStyle=COL.spark; poly([[2,-11],[11,-4],[6,0],[11,4],[2,11],[5,0]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.stroke();
    // head, spiky hair, visor
    ctx.fillStyle='#0e131d'; ctx.beginPath(); ctx.arc(8,0,6,0,PI2); ctx.fill();
    poly([[4,-4],[-3,-7],[3,-1],[-4,0],[3,1],[-3,7],[4,4]]); ctx.fill();
    ctx.strokeStyle=COL.volt; ctx.lineWidth=2.5; ctx.shadowColor=COL.volt; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(8,0,5,-0.9,0.9); ctx.stroke(); ctx.shadowBlur=0;
    ctx.restore();
    if (Math.random()<0.25){
      const a=rand(PI2); ctx.strokeStyle='rgba(38,191,255,.8)'; ctx.lineWidth=1.5;
      strokePts(jag(p.x+Math.cos(a)*10,p.y+Math.sin(a)*10,p.x+Math.cos(a)*rand(22,32),p.y+Math.sin(a)*rand(22,32),3,4));
    }
  },
  rusher(e){
    const white=e.flashT>0;
    drawShadow(e.x,e.y,e.r);
    ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.face);
    const wind=e.state==='windup', swing=e.state==='swing';
    if (wind){ const pulse=1+Math.sin(time*40)*0.06; ctx.scale(pulse,pulse); }
    // pipe: cocked back during the wind-up, sweeping across during the swing
    const pa = wind ? -2.3 : swing ? -2.3+(1-e.timer/RUSH.swingT)*3.6 : 0.5;
    ctx.save(); ctx.translate(6,12); ctx.rotate(pa); ctx.strokeStyle=COL.ink; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(30,0); ctx.stroke();
    ctx.strokeStyle='#8f97a6'; ctx.lineWidth=4; ctx.stroke(); ctx.strokeStyle=COL.threat; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(19,0); ctx.stroke(); ctx.restore();
    // hoodie torso
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(6,-17); ctx.lineTo(-12,-15); ctx.lineTo(-18,0); ctx.lineTo(-12,15); ctx.lineTo(6,17); ctx.closePath();
    ctx.shadowColor=COL.threat; ctx.shadowBlur=wind?20:8;
    ctx.fillStyle=white?'#ffffff':(wind&&Math.sin(time*40)>0?'#ff9a88':COL.threat); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
    ctx.strokeStyle='rgba(4,7,14,.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,-8); ctx.lineTo(2,-4); ctx.moveTo(-10,8); ctx.lineTo(2,4); ctx.stroke();
    // hood, pointed at the back, shadowed face at the front
    ctx.fillStyle=white?'#ffffff':'#c8402f'; poly([[13,0],[8,-9],[-2,-8],[-9,0],[-2,8],[8,9]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle=COL.ink; ctx.beginPath(); ctx.arc(10,0,5,-1.2,1.2); ctx.fill();
    // yellow work gloves
    ctx.fillStyle=white?'#ffffff':'#f0b43c'; ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(10,-15,5,0,PI2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(6,12,5,0,PI2); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  needle(e){
    const white=e.flashT>0, bob=Math.sin(time*5+e.bob)*3, ck=e.state==='charge'?1-e.timer/(e.windDur||0.65):0;
    drawShadow(e.x,e.y+10,e.r*0.9);
    ctx.save(); ctx.translate(e.x,e.y-10+bob); ctx.rotate(e.face);
    // rotor arms and twin rotors
    ctx.strokeStyle=COL.ink; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-2,-6); ctx.lineTo(-6,-19); ctx.moveTo(-2,6); ctx.lineTo(-6,19); ctx.stroke();
    for (const s of [-1,1]){
      ctx.fillStyle='rgba(255,182,71,.18)'; ctx.beginPath(); ctx.arc(-6,19*s,11,0,PI2); ctx.fill();
      ctx.strokeStyle=white?'#ffffff':COL.amber; ctx.lineWidth=2.5; ctx.stroke();
      ctx.strokeStyle='rgba(255,182,71,.7)'; ctx.lineWidth=2; ctx.beginPath(); const ra=time*30*s; ctx.moveTo(-6+Math.cos(ra)*10,19*s+Math.sin(ra)*10); ctx.lineTo(-6-Math.cos(ra)*10,19*s-Math.sin(ra)*10); ctx.stroke();
    }
    // angular hull with hazard stripes
    poly([[16,0],[6,-9],[-12,-7],[-15,0],[-12,7],[6,9]]);
    ctx.fillStyle=white?'#ffffff':'#2b303b'; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
    if (!white){ ctx.fillStyle=COL.amber; poly([[-4,-8],[0,-8],[-4,8],[-8,8]]); ctx.fill(); }
    // red eye, glows amber as the shot charges
    ctx.shadowColor=ck>0?COL.amber:'#ff3b30'; ctx.shadowBlur=8+ck*24; ctx.fillStyle=white?'#ffffff':(ck>0.5?COL.amber:'#ff3b30');
    ctx.beginPath(); ctx.arc(9,0,3.5+ck*3,0,PI2); ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
  },
  gravemark(e){
    const white=e.flashT>0, wind=e.state==='slamWind', stag=e.state==='stagger';
    const stone=white?'#ffffff':'#4a4e5a', dark=white?'#e6e6e6':'#33363f';
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(e.x+6,e.y+e.r*0.7,e.r*1.4,e.r*0.6,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(e.x,e.y);
    if (stag) ctx.rotate(Math.sin(time*30)*0.05);
    ctx.rotate(e.face); ctx.scale(1.3,1.3);
    const lift = wind ? (1-e.timer/e.windDur) : 0;
    const glow=(b)=>{ ctx.shadowColor=COL.boon; ctx.shadowBlur=b; };
    // stone coat behind
    ctx.fillStyle=dark; poly([[-6,-30],[-40,-26],[-46,0],[-40,26],[-6,30]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=4; ctx.stroke();
    // torso plates
    ctx.fillStyle=stone; poly([[22,-20],[10,-34],[-20,-32],[-28,0],[-20,32],[10,34],[22,20]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(4,7,14,.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-18,-14); ctx.lineTo(14,-12); ctx.moveTo(-18,14); ctx.lineTo(14,12); ctx.moveTo(-4,-30); ctx.lineTo(-4,30); ctx.stroke();
    // C-shaped shoulder pylons with purple inner glow
    for (const s of [-1,1]){
      ctx.fillStyle=stone; poly([[8,38*s],[-14,40*s],[-22,30*s],[-18,24*s],[-10,30*s],[4,28*s]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
      glow(14); ctx.strokeStyle=COL.boon; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(2,31*s); ctx.lineTo(-10,33*s); ctx.lineTo(-17,28*s); ctx.stroke(); ctx.shadowBlur=0;
    }
    // rock fist (left), raised during the slam wind-up
    ctx.save(); ctx.translate(18+lift*10,-38-lift*8); ctx.scale(1+lift*0.25,1+lift*0.25);
    glow(10+lift*30);
    for (const r of GM_FIST){ ctx.save(); ctx.translate(r.x,r.y); ctx.scale(r.s,r.s); poly(r.shape); ctx.restore(); ctx.fillStyle=stone; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke(); }
    ctx.shadowBlur=0; ctx.strokeStyle=COL.boon; ctx.lineWidth=1.5; ctx.globalAlpha=0.6+lift*0.4; ctx.beginPath(); ctx.moveTo(-6,-3); ctx.lineTo(2,1); ctx.lineTo(7,-5); ctx.stroke(); ctx.globalAlpha=1;
    ctx.restore();
    // telekinetic hand (right) with swirling purple rings
    ctx.save(); ctx.translate(20,36);
    ctx.fillStyle=dark; ctx.beginPath(); ctx.arc(0,0,8,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
    glow(16); ctx.strokeStyle=COL.boon; ctx.lineWidth=2;
    for (let i=0;i<2;i++){ ctx.beginPath(); ctx.ellipse(0,0,14+i*6,8+i*4,time*3+i,0,PI2*0.7); ctx.stroke(); }
    ctx.shadowBlur=0; ctx.restore();
    // helmet with the purple visor slit
    ctx.fillStyle=stone; poly([[24,-9],[18,-14],[4,-12],[2,0],[4,12],[18,14],[24,9]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
    glow(18); ctx.fillStyle=COL.boon; ctx.fillRect(18,-8,4,16); ctx.shadowBlur=0;
    ctx.restore();
    // floating shards orbit the body
    for (const s of GM_SHARDS){
      const a=s.a+e.spin*s.spd, rr=s.rad+Math.sin(time*2+s.bob)*4+lift*16, x=e.x+Math.cos(a)*rr, y=e.y+Math.sin(a)*rr*0.8-10;
      ctx.save(); ctx.translate(x,y); ctx.rotate(a*2); ctx.scale(s.sz,s.sz); poly(s.shape); ctx.restore();
      ctx.fillStyle=white?'#ffffff':'#3d414c'; ctx.fill(); glow(8); ctx.strokeStyle=COL.boon; ctx.lineWidth=1.5; ctx.stroke(); ctx.shadowBlur=0;
    }
  },
};
function drawBullet(b){
  if (typeof vfxBullet==='function' && vfxBullet(b)) return;
  if (b.kind==='rock' || b.kind==='rubble'){
    // Stone projectiles: grey rock with the owner's glow; friendly (reflected) ones glow blue.
    const c=b.friendly?COL.volt:(b.c||COL.boon);
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(b.x+4,b.y+b.r*0.7,b.r,b.r*0.45,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.t*4); ctx.scale(b.r,b.r); poly(GM_FIST[b.r>20?1:2].shape); ctx.restore();
    ctx.fillStyle='#4a4e5a'; ctx.fill(); ctx.shadowColor=c; ctx.shadowBlur=14; ctx.strokeStyle=c; ctx.lineWidth=2.5; ctx.stroke(); ctx.shadowBlur=0;
    return;
  }
  if (b.c && !b.friendly){
    ctx.strokeStyle=b.c; ctx.globalAlpha=.45; ctx.lineWidth=6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.06,b.y-b.vy*0.06); ctx.stroke(); ctx.globalAlpha=1;
    ctx.shadowColor=b.c; ctx.shadowBlur=16; ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,PI2); ctx.fill(); ctx.shadowBlur=0;
    ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke(); ctx.lineCap='butt';
    return;
  }
  ctx.strokeStyle='rgba(255,182,71,.45)'; ctx.lineWidth=6; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x-b.vx*0.06,b.y-b.vy*0.06); ctx.stroke();
  ctx.shadowColor=COL.amber; ctx.shadowBlur=16; ctx.fillStyle=COL.amber; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,PI2); ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
  ctx.fillStyle='#fff6dc'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.4,0,PI2); ctx.fill();
  ctx.lineCap='butt';
}
function drawPlayer(){
  const p=player, ghosts=fx.filter(f=>f.type==='ghost');
  // speed-arc trail through the dash afterimages
  if (ghosts.length>1){
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.shadowColor=COL.volt; ctx.shadowBlur=14;
    for (let i=1;i<ghosts.length;i++){ const a=ghosts[i-1], b=ghosts[i]; if (Math.hypot(a.x-b.x,a.y-b.y)>90) continue; const k=1-b.t/b.dur;
      ctx.globalAlpha=k*0.8; ctx.strokeStyle=COL.volt; ctx.lineWidth=2+k*10; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
    ctx.restore();
  }
  if (!drawVoltSprite(p)){
    for (const f of ghosts){
      const k=1-f.t/f.dur; ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.a); ctx.globalAlpha=k*0.5; heroShape(); ctx.fillStyle=COL.volt; ctx.fill(); ctx.restore(); }
    ctx.globalAlpha=1;
    VECTOR.volt(p);
  }
  if (p.guard>0){ ctx.save(); ctx.strokeStyle=HEROES.bastion.c; ctx.lineWidth=3; ctx.globalAlpha=0.6+0.3*Math.sin(time*8); ctx.beginPath(); for (let i=0;i<6;i++){ const a=i/6*PI2+time; ctx.lineTo(p.x+Math.cos(a)*28,p.y+Math.sin(a)*28); } ctx.closePath(); ctx.stroke(); ctx.restore(); }
  if (p.slowT>0){ ctx.save(); ctx.strokeStyle='#cff4ff'; ctx.globalAlpha=0.6; ctx.lineWidth=2; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.arc(p.x,p.y,24,0,PI2); ctx.stroke(); ctx.restore(); }
  if (p.reflectT>0){ ctx.save(); ctx.strokeStyle=HEROES.bastion.c; ctx.lineWidth=4; ctx.shadowColor=HEROES.bastion.c; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(p.x,p.y,32,0,PI2); ctx.stroke(); ctx.restore(); }
  if (inputMode==='kb' && mouse.active && state==='play'){
    ctx.strokeStyle='rgba(38,191,255,.35)'; ctx.lineWidth=2;
    const r=46; ctx.beginPath(); ctx.arc(p.x,p.y,r,p.aim-0.35,p.aim+0.35); ctx.stroke();
  }
}
function drawPack(k){
  const pop=Math.min(1,k.t/0.25), y=k.y-10+Math.sin(time*4+k.bob)*3;
  ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(k.x,k.y+4,12,5,0,0,PI2); ctx.fill();
  ctx.save(); ctx.translate(k.x,y); ctx.scale(pop,pop);
  ctx.shadowColor=COL.heal; ctx.shadowBlur=16+Math.sin(time*6)*6; ctx.fillStyle='#16302c'; ctx.fillRect(-11,-11,22,22); ctx.shadowBlur=0;
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.strokeRect(-11,-11,22,22);
  ctx.fillStyle=COL.heal; ctx.fillRect(-3,-7,6,14); ctx.fillRect(-7,-3,14,6);
  ctx.restore();
}
function drawActors(){
  // Depth sort by feet y so things lower on screen draw on top (3/4 view).
  const list=animationDeathActors();
  for (const b of obstacles) list.push({y:obstacleDepth(b),f:()=>drawObstacle(b)});
  for (const e of enemies) if (e.spawnT<=0) list.push({y:e.y,f:()=>drawEnemyActor(e)});
  for (const b of bullets) list.push({y:b.y,f:()=>drawBullet(b)});
  for (const k of packs) list.push({y:k.y,f:()=>drawPack(k)});
  if (state!=='over' || player.hp>0) list.push({y:player.y,f:drawPlayer});
  list.sort((a,b)=>a.y-b.y);
  for (const it of list) it.f();
}
function drawBars(){
  for (const e of enemies){
    if (e.spawnT<=0 && e.stunT>0 && !e.isBoss){
      ctx.strokeStyle=COL.volt; ctx.lineWidth=2;
      for (let i=0;i<2;i++){ const a=rand(PI2); strokePts(jag(e.x,e.y,e.x+Math.cos(a)*(e.r+12),e.y+Math.sin(a)*(e.r+12),3,4)); }
    }
    if (e.spawnT<=0){
      if (e.rootT>0){ ctx.strokeStyle=HEROES.thorn.c; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.6,e.r*1.3,e.r*0.55,0,0,PI2); ctx.stroke();
        for (let i=0;i<4;i++){ const a=i*1.57+0.4; ctx.beginPath(); ctx.moveTo(e.x+Math.cos(a)*e.r*1.3,e.y+e.r*0.6+Math.sin(a)*e.r*0.55); ctx.quadraticCurveTo(e.x+Math.cos(a)*e.r,e.y,e.x+Math.cos(a)*e.r*0.5,e.y-e.r*0.3); ctx.stroke(); } }
      if (e.exposedT>0){ ctx.save(); ctx.strokeStyle='#ffffff'; ctx.globalAlpha=0.5+0.4*Math.sin(time*20); ctx.lineWidth=3; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+10,0,PI2); ctx.stroke(); ctx.restore(); }
      if (e.markT>0){ const top=enemySpriteTop(e), y=top===null?e.y-e.r-(e.isBoss?70:30):top-12; ctx.save(); ctx.translate(e.x,y); ctx.rotate(time*3); ctx.strokeStyle=HEROES.echo.c; ctx.lineWidth=2.5; ctx.shadowColor=HEROES.echo.c; ctx.shadowBlur=10; ctx.strokeRect(-6,-6,12,12); ctx.restore(); }
      if (e.poison){ const top=enemySpriteTop(e), iconY=top===null?e.y-e.r-(e.isBoss?58:22):top-6; ctx.fillStyle=HEROES.thorn.c; for (let i=0;i<e.poison.stacks;i++){ ctx.beginPath(); ctx.arc(e.x-8+i*8,iconY+Math.sin(time*6+i)*2,3,0,PI2); ctx.fill(); } }
    }
    if (e.spawnT<=0 && !e.isBoss && e.hp<e.maxHp){
      const top=enemySpriteTop(e), w=34, x=e.x-w/2, y=top===null?e.y-e.r-(e.kind==='needle'?30:18):top-8;
      ctx.fillStyle=COL.ink; ctx.fillRect(x-2,y-2,w+4,7);
      ctx.fillStyle=KIND_COL[e.kind]; ctx.fillRect(x,y,w*clamp(e.hp/e.maxHp,0,1),3);
    }
  }
}
function drawFx(){
  const p=player;
  for (const f of fx){
    const k=f.t/f.dur;
    if (f.type==='slash'){
      const R=f.range, sweep=Math.min(1,k*2.4), al=1-Math.max(0,(k-0.3)/0.7);
      const s=f.a-f.arc/2*f.dir, e=s+f.arc*f.dir*sweep, cc=f.dir<0;
      const ix=p.x+Math.cos(f.a)*R*0.22, iy=p.y+Math.sin(f.a)*R*0.22;
      ctx.save(); ctx.globalAlpha=al;
      ctx.beginPath(); ctx.arc(p.x,p.y,R,s,e,cc); ctx.arc(ix,iy,R*0.74,e,s,!cc); ctx.closePath();
      ctx.shadowColor=COL.volt; ctx.shadowBlur=18; ctx.fillStyle=f.fin?'rgba(234,252,255,.95)':'rgba(234,252,255,.85)'; ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle=COL.volt; ctx.lineWidth=f.fin?3.5:2.5; ctx.stroke();
      ctx.strokeStyle='rgba(38,191,255,.6)'; ctx.lineWidth=1.5;
      for (let i=0;i<(f.fin?6:4);i++){ const a=s+(e-s)*rand(0.1,1); const r1=R*rand(1.02,1.12), r2=r1+rand(10,26); ctx.beginPath(); ctx.moveTo(p.x+Math.cos(a)*r1,p.y+Math.sin(a)*r1); ctx.lineTo(p.x+Math.cos(a)*r2,p.y+Math.sin(a)*r2); ctx.stroke(); }
      ctx.restore();
    } else if (f.type==='impact'){
      const sz=f.size*(0.6+k*0.6), n=10;
      ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot); ctx.globalAlpha=1-k;
      ctx.beginPath(); for (let i=0;i<n*2;i++){ const a=i/(n*2)*PI2, r=i%2?sz*0.42:sz*(i%4?0.8:1); i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath();
      ctx.fillStyle=k<0.35?'#ffffff':f.c; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
      ctx.restore();
    } else if (f.type==='shock'){
      const r=f.r*(1-Math.pow(1-k,3));
      ctx.save(); ctx.globalAlpha=1-k;
      const c=f.c||COL.volt, a0=f.gapA!==undefined?f.gapA+f.gap/2:0, a1=f.gapA!==undefined?f.gapA-f.gap/2+PI2:PI2;
      ctx.strokeStyle=COL.ink; ctx.lineWidth=18; ctx.beginPath(); ctx.arc(f.x,f.y,r,a0,a1); ctx.stroke();
      ctx.shadowColor=c; ctx.shadowBlur=30; ctx.strokeStyle=c; ctx.lineWidth=12; ctx.stroke();
      ctx.strokeStyle=COL.spark; ctx.lineWidth=4; ctx.stroke(); ctx.shadowBlur=0;
      ctx.restore();
    }
  }
  for (const b of bolts){
    const k=1-b.t/b.dur;
    for (let i=0;i<b.pts.length-1;i++){
      const a=b.pts[i], c=b.pts[i+1], seg=Math.max(4,Math.round(Math.hypot(c.x-a.x,c.y-a.y)/22)), pts=jag(a.x,a.y,c.x,c.y,seg,11);
      ctx.globalAlpha=k; ctx.lineJoin='round';
      ctx.strokeStyle=COL.ink; ctx.lineWidth=9*(b.w||1); strokePts(pts);
      const bc=b.c||COL.volt, bw=b.w||1; ctx.shadowColor=bc; ctx.shadowBlur=22; ctx.strokeStyle=bc; ctx.lineWidth=6*bw; strokePts(pts); ctx.shadowBlur=0;
      ctx.strokeStyle='#ffffff'; ctx.lineWidth=2*(b.w||1); strokePts(pts);
      if (Math.random()<.5){ const m=pts[Math.floor(pts.length/2)], ang=rand(PI2); ctx.strokeStyle=COL.volt; ctx.lineWidth=1.5; strokePts(jag(m[0],m[1],m[0]+Math.cos(ang)*30,m[1]+Math.sin(ang)*30,3,6)); }
    }
    ctx.globalAlpha=1; ctx.lineJoin='miter';
  }
  ctx.lineCap='round';
  for (const q of particles){
    ctx.globalAlpha=clamp(q.life/q.max,0,1); ctx.strokeStyle=q.color; ctx.lineWidth=q.w;
    ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x-q.vx*0.03,q.y-q.vy*0.03); ctx.stroke();
  }
  ctx.globalAlpha=1; ctx.lineCap='butt';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (const t of texts){
    const k=t.t/0.75, pop = t.t<0.08 ? 1.6-t.t/0.08*0.6 : 1, size=(t.small?16:typeof t.v==='string'?(t.big?40:22):(t.big?34:24))*pop;
    ctx.globalAlpha=1-Math.max(0,(k-0.5)/0.5);
    ctx.font=`900 ${size}px "Big Shoulders Display", Impact, sans-serif`;
    const y=t.y-k*38;
    ctx.lineWidth=5; ctx.strokeStyle=COL.ink; ctx.strokeText(t.v,t.x,y);
    ctx.fillStyle=t.c || (t.big?COL.amber:COL.spark); ctx.fillText(t.v,t.x,y);
  }
  ctx.globalAlpha=1;
}
// Live attack effects sit on the floor layer, under the actors.
function drawBossActiveFx(){ if (typeof vfxDrawActive!=='function') return; for (const e of enemies) if (isSpecBoss(e) && e.bstate==='ACTIVE' && e.atk && e.atk.step) vfxDrawActive(e,e.atk,e.atk.step); }
function render(){
  if (state==='cutscene' && typeof cut!=='undefined' && cut){ renderCinematic(); return; }
  if (inHub()){ renderHub(); return; }
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#080d18'; ctx.fillRect(0,0,W,H);
  const sx=(Math.random()*2-1)*shakeAmt, sy=(Math.random()*2-1)*shakeAmt;
  const view=combatViewport(); ctx.save(); ctx.beginPath(); ctx.rect(view.x,view.y,view.w,view.h); ctx.clip(); ctx.translate(view.cx+sx,view.cy+sy); ctx.scale(cam.zoom,cam.zoom); ctx.translate(-cam.x,-cam.y);
  drawCity(); drawFloor(); drawDecals(); drawExitPads(); drawZones(); drawBossHazards(); drawTelegraphs(); drawBossActiveFx(); if (typeof vfxDrawGround==='function') vfxDrawGround(); drawActors(); if (typeof vfxDraw==='function') vfxDraw(); drawStyleFx(); drawBlockFx(); drawGlints(); drawFrontWall(); drawBars(); drawComposureMeters(); drawExitIcons(); drawFx(); drawBossHitboxes();
  ctx.restore();
  drawExitPointers(); drawTransitOverlay();
  if (flash>0){ ctx.fillStyle=`rgba(38,191,255,${flash*0.7})`; ctx.fillRect(0,0,W,H); }
  const low = player.hp/player.maxHp<0.3 && state==='play' ? 0.25+Math.sin(time*5)*0.08 : 0;
  const hv = Math.max(hurtFlash, low);
  if (hv>0){
    const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
    g.addColorStop(0,'rgba(255,90,69,0)'); g.addColorStop(1,`rgba(255,90,69,${hv})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }
  if (stick.id!==null){
    ctx.strokeStyle='rgba(234,252,255,.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(stick.ox,stick.oy,60,0,PI2); ctx.stroke();
    ctx.fillStyle='rgba(38,191,255,.35)'; ctx.beginPath(); ctx.arc(stick.ox+stick.x*60,stick.oy+stick.y*60,24,0,PI2); ctx.fill();
  }
}
