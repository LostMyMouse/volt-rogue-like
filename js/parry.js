// Volt: Block and parry.
'use strict';

/* ---------- Block and parry (Volt's core mechanic, see docs/boss-gameplay-spec.md) ---------- */
// Every enemy attack is "parryable" (a white glint ring closes on it just before it lands) or a "super"
// (jagged hazard border, dodge only). Tap Block as the glint closes for a perfect parry: no damage, the
// attacker is staggered and Exposed, shots reflect. Holding Block takes 40% damage. Blocking a super Shatters.
// Not blocking a parryable attack makes it hit harder.
const PARRY_CLASS = { rusher:'parry', needle:'parry', charge:'parry', slam:'super', rock:'super', cracks:'super' };
const BLOCK = { held:0.4, failMul:1.5, exposed:1.5, exposedMul:1.5, guardHits:3, guardWindow:2, guardBreak:0.6, shatterStun:0.5, shatterLock:1.0, whiffT:0.25, whiffLock:0.35, glint:0.25, sig:15 };
const parryWindow = () => T.parryWindow;
function pressBlock(){
  const p=player; if (state!=='play' || p.blockLock>0 || p.stunT>0 || p.dashT>0) return;
  p.blockHeld=true; p.blockT=0; p.blockUsed=false; p.charging=0;
}
function releaseBlock(){
  const p=player; if (!p || !p.blockHeld) return;
  p.blockHeld=false;
  // Tapping without catching anything is a whiff: a short lockout so Block can't be spammed.
  if (!p.blockUsed && p.blockT<BLOCK.whiffT) p.blockLock=Math.max(p.blockLock,BLOCK.whiffLock);
}
function exposeEnemy(e){
  const dur=BLOCK.exposed*(run.style==='titan'?1.4:1);
  e.exposedT=dur;
  if (e.kind==='gravemark'){ e.state='stagger'; e.timer=dur; e.mx=e.my=0; e.slamsLeft=0; }
  else { e.stunT=Math.max(e.stunT,dur*0.8); e.state=e.kind==='rusher'?'recover':'move'; e.timer=dur; }
  texts.push({x:e.x,y:e.y-e.r-28,v:'EXPOSED',t:0,big:true,c:COL.spark});
}
function onParry(ang,opt){
  const p=player;
  p.blockUsed=true; p.parries=(p.parries||0)+1; run.parries=(run.parries||0)+1;
  p.iT=Math.max(p.iT,0.25); p.dashCd=0; p.sig=Math.min(100,p.sig+BLOCK.sig);
  if (opt.attacker && !opt.attacker.dead) exposeEnemy(opt.attacker);
  hitStop=Math.max(hitStop,0.14); flash=Math.max(flash,0.12); addShake(8);
  const fx0=p.x-Math.cos(ang)*24, fy0=p.y-Math.sin(ang)*24;
  sparks(fx0,fy0,ang+Math.PI,18,'#ffffff',620,1.0); sparks(fx0,fy0,ang+Math.PI,10,COL.volt,480,1.4);
  fx.push({type:'shock',x:fx0,y:fy0,t:0,dur:.25,r:70,c:'#ffffff'});
  texts.push({x:p.x,y:p.y-46,v:'PARRY',t:0,big:true,c:'#ffffff'});
}
// Called at the top of hurtPlayer. Returns {result, dmg}: result is 'parried' | 'blocked' | 'shattered' | 'hit'.
function resolveBlock(dmg,ang,src,opt){
  const p=player, cls=PARRY_CLASS[src]||'super';
  if (!p.blockHeld) return {result:'hit', dmg: cls==='parry' ? dmg*BLOCK.failMul : dmg};
  if (cls==='super'){
    p.blockHeld=false; p.blockLock=BLOCK.shatterLock; p.stunT=BLOCK.shatterStun;
    texts.push({x:p.x,y:p.y-46,v:'SHATTERED',t:0,big:true,c:COL.threat}); addShake(10);
    for (let i=0;i<8;i++){ const a=i/8*PI2; particles.push({x:p.x+Math.cos(a)*26,y:p.y+Math.sin(a)*26,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:.35,max:.35,color:COL.volt,w:3}); }
    return {result:'shattered', dmg};
  }
  if (p.blockT<=parryWindow()){ onParry(ang,opt); return {result:'parried', dmg:0}; }
  // Held block: reduced damage; three blocked hits in quick succession break the guard.
  p.blockUsed=true;
  p.blockHits=(p.blockHits||[]).filter(t=>run.time-t<BLOCK.guardWindow); p.blockHits.push(run.time);
  const magnetar=run.style==='magnetar';
  sparks(p.x-Math.cos(ang)*22,p.y-Math.sin(ang)*22,ang+Math.PI,8,COL.volt,360,.8);
  if (p.blockHits.length>=BLOCK.guardHits){
    p.blockHeld=false; p.blockLock=BLOCK.guardBreak; p.blockHits=[];
    texts.push({x:p.x,y:p.y-46,v:'GUARD BREAK',t:0,big:true,c:COL.amber}); addShake(6);
  } else texts.push({x:p.x,y:p.y-40,v:'BLOCK',t:0,c:COL.volt});
  return {result:'blocked', dmg: magnetar ? 0 : dmg*BLOCK.held};
}
function tickBlock(dt){
  const p=player;
  if (p.blockHeld) p.blockT+=dt;
  if (p.blockLock>0) p.blockLock-=dt;
  if (p.stunT>0) p.stunT-=dt;
}
// Time until a parryable attack lands, for the glint cue. Returns -1 when no glint should show.
function glintFor(e){
  const p=player;
  if (e.kind==='rusher' && e.state==='windup') return e.timer;
  if (e.kind==='rusher' && e.state==='swing' && !e.hitDone) return 0;
  if (e.kind==='gravemark'){
    if (e.state==='chargeWind') return e.timer+Math.max(0,(Math.hypot(p.x-e.x,p.y-e.y)-e.r-p.r)/(GM.chargeSpeed*T.enemySpeed));
    if (e.state==='charging' && !e.hitDone) return Math.max(0,(Math.hypot(p.x-e.x,p.y-e.y)-e.r-p.r)/(GM.chargeSpeed*T.enemySpeed));
  }
  return -1;
}
function drawGlint(x,y,r,tti){
  if (tti<0 || tti>BLOCK.glint) return;
  const k=1-tti/BLOCK.glint, rr=r+8+(1-k)*46;
  ctx.save(); ctx.globalAlpha=0.35+0.65*k; ctx.strokeStyle='#ffffff'; ctx.lineWidth=2+3*k; ctx.shadowColor='#ffffff'; ctx.shadowBlur=14;
  ctx.beginPath(); ctx.arc(x,y,rr,0,PI2); ctx.stroke();
  // four inward ticks make the cue readable without colour
  for (let i=0;i<4;i++){ const a=i*Math.PI/2+Math.PI/4; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*(rr+8),y+Math.sin(a)*(rr+8)); ctx.lineTo(x+Math.cos(a)*(rr-4),y+Math.sin(a)*(rr-4)); ctx.stroke(); }
  ctx.restore();
}
function drawGlints(){
  for (const e of enemies){ if (e.spawnT>0) continue; drawGlint(e.x,e.y-(e.kind==='gravemark'?10:0),e.r,glintFor(e)); }
  const p=player;
  for (const b of bullets){
    if (b.friendly) continue;
    const dx=p.x-b.x, dy=p.y-b.y, d=Math.hypot(dx,dy), sp=Math.hypot(b.vx,b.vy), closing=(b.vx*dx+b.vy*dy)/(d||1);
    if (closing<sp*0.8) continue;
    drawGlint(b.x,b.y,b.r,Math.max(0,(d-p.r-b.r)/sp));
  }
}
// Supers get a jagged hazard edge so they read as "dodge, don't block" without relying on colour.
function jaggedRing(x,y,r,a0=0,a1=PI2,teeth=48,depth=7){
  const n=Math.max(6,Math.round(teeth*(a1-a0)/PI2));
  ctx.beginPath();
  for (let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n, rr=r+(i%2?depth:0); i?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); }
  ctx.stroke();
}
function drawBlockFx(){
  const p=player;
  if (p.blockHeld){
    const k=p.blockT<=parryWindow() ? 1 : 0.6;
    ctx.save(); ctx.strokeStyle=k===1?'#ffffff':COL.volt; ctx.lineWidth=k===1?4:3; ctx.shadowColor=COL.volt; ctx.shadowBlur=16; ctx.globalAlpha=0.9;
    ctx.beginPath(); for (let i=0;i<=6;i++){ const a=i/6*PI2+Math.PI/6; ctx.lineTo(p.x+Math.cos(a)*30,p.y+Math.sin(a)*30); } ctx.stroke();
    if (run.style==='magnetar'){ ctx.lineWidth=7; ctx.beginPath(); ctx.arc(p.x,p.y,36,p.aim-1.1,p.aim+1.1); ctx.stroke(); }
    ctx.restore();
  }
  if (p.stunT>0){ ctx.save(); ctx.strokeStyle=COL.threat; ctx.lineWidth=2; for (let i=0;i<3;i++){ const a=time*6+i*2.1; ctx.beginPath(); ctx.arc(p.x+Math.cos(a)*14,p.y-30+Math.sin(a)*5,4,0,PI2); ctx.stroke(); } ctx.restore(); }
}
