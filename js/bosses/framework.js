// Volt: Shared boss framework. Every boss in docs/boss-gameplay-spec.md runs on this (Gravemark predates it).
'use strict';

// Spec distances are in "units"; 1 unit = 50 world px. Angles in boss data are degrees.
const U = 50, DEG = Math.PI/180;
const BOSSES = {};
const BOSS_PARRY = {};      // damage source id -> 'parry' | 'super', merged from every boss
let bossHazards = [];       // persistent boss-owned floor hazards (heated floor, pools, ...)
let bossDebug = { hitboxes:false };
let bossTicks = {};          // shared per-source damage intervals (e.g. overlapping acid pools hit as one)

function registerBoss(def){ BOSSES[def.id]=def; Object.assign(BOSS_PARRY, def.parryClass||{}); }
const isSpecBoss = e => !!(e && BOSSES[e.kind]);

function makeBoss(id, at, opt={}){
  const def=BOSSES[id], hp=def.hp*T.enemyHealth*(opt.hpMul||1)*(id==='redactor'?1.8:1.6);
  return { kind:id, isBoss:true, name:def.name, x:at.x, y:at.y, vx:0, vy:0, mx:0, my:0, r:def.radius*U, hp, maxHp:hp,
    flashT:0, stunT:0, spawnT:0, face:Math.PI/2, dead:false,
    bstate:'INTRO', stateT:0, phase:1, queuedPhase:1, seqI:0, atk:null, invuln:true, exposedT:0, vent:0 };
}
function bossPhaseFor(e){ const f=e.hp/e.maxHp; return 1+BOSSES[e.kind].phases.filter(t=>f<=t).length; }
function bossSetState(e,s){ e.bstate=s; e.stateT=0; }

/* ---- State machine: INTRO -> REPOSITION -> WINDUP -> ACTIVE -> RECOVERY, with PHASE_CHANGE / EXPOSED / DEAD ---- */
function bossUpdate(e,dt){
  const def=BOSSES[e.kind], p=player;
  e.stateT+=dt; e.mx=e.my=0;
  if (e.vent>0) e.vent-=dt;
  if (def.tick) def.tick(e,dt);
  const ph=bossPhaseFor(e); if (ph>e.queuedPhase) e.queuedPhase=ph;
  switch (e.bstate){
    case 'INTRO':
      e.face=Math.atan2(p.y-e.y,p.x-e.x);
      if (e.stateT>=1.5){ e.invuln=false; if (def.onPhaseStart) def.onPhaseStart(e); bossNextAttack(e); }
      break;
    case 'PHASE_CHANGE':
      if (e.stateT>=1.2){ e.invuln=false; if (def.onPhaseStart) def.onPhaseStart(e); bossNextAttack(e); }
      break;
    case 'EXPOSED':
      if (e.stateT>=e.exposedFor) bossEndAttack(e);
      break;
    case 'REPOSITION':
      // waitFor: some attacks can't start while a conflicting hazard is still live (e.g. Gravemark's well).
      if (e.holdT>0){ e.holdT-=dt; break; }
      if ((def.reposition(e,dt) || e.stateT>=1.5) && !(e.atk.def.waitFor && e.atk.def.waitFor(e))) bossBeginStep(e,0);
      break;
    case 'WINDUP': bossWindup(e,dt); break;
    case 'ACTIVE': bossActive(e,dt); break;
    case 'PAUSE': if (e.stateT>=e.atk.pause) bossBeginStep(e,e.atk.stepI+1); break;
    case 'RECOVERY': if (e.stateT>=Math.max(.3,e.atk.def.recovery*.72)) bossEndAttack(e); break;
  }
}
function bossNextAttack(e){
  const def=BOSSES[e.kind], seq=def.sequences[e.phase-1], id=seq[e.seqI % seq.length];
  e.seqI++;
  e.atk={ id, def:def.attacks[id] || (def.resolveAttack && def.resolveAttack(e,id)), stepI:-1, step:null };
  bossSetState(e,'REPOSITION');
}
function bossEndAttack(e){
  if (e.queuedPhase>e.phase){ bossPhaseChange(e); return; }
  bossNextAttack(e);
}
function bossPhaseChange(e){
  e.phase=e.queuedPhase; e.seqI=0; e.atk=null; e.invuln=true;
  bossClearOwned(e); bossSetState(e,'PHASE_CHANGE');
  banner(e.name.toUpperCase()+' · PHASE '+e.phase, true);
  fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.5,r:220,c:BOSSES[e.kind].color}); addShake(10);
}
function bossClearOwned(e){
  for (const m of enemies) if (m.owner===e && m.isIce) removeIceWalls(m);
  for (const m of enemies) if (m.owner===e && !m.dead) m.dead=true;
  for (const b of bullets) if (b.owner===e) b.dead=true;
  for (const h of bossHazards) if (h.owner===e) h.dead=true;
  bossHazards=bossHazards.filter(h=>!h.dead);
}
function bossBeginStep(e,i){
  const a=e.atk, steps=a.def.steps, p=player;
  if (i>=steps.length){ bossToRecovery(e); return; }
  const st={...steps[i]};if(st.speed)st.speed*=1.18;if(st.every)st.every*=.85;
  const w=Math.max(.38,st.windup*.85)*R.windMul;
  Object.assign(a,{ stepI:i, step:st, hit:false, locked:false, windup:w, lockAt:Math.max(0,Math.min(w*0.6,w-0.3)),
    aim:Math.atan2(p.y-e.y,p.x-e.x), target:{x:p.x,y:p.y}, origin:{x:e.x,y:e.y}, activeT:0, dist:0, stopped:false });
  (BOSS_PRIMS[st.prim].begin||(()=>{}))(e,a,st);
  bossSetState(e,'WINDUP');
}
function bossWindup(e,dt){
  const a=e.atk, p=player;
  // Targeted footprints track the player for the first 60% of the wind-up, then freeze (at least 0.3s of frozen warning).
  if (!a.locked){
    a.aim=Math.atan2(p.y-e.y,p.x-e.x); a.target={x:p.x,y:p.y}; a.origin={x:e.x,y:e.y};
    if (a.step.creep){ const d=Math.hypot(p.x-e.x,p.y-e.y), sp=a.step.creep*U*T.enemySpeed; if (a.step.creep<0 || d>e.r+p.r+U){ e.mx=Math.cos(a.aim)*sp; e.my=Math.sin(a.aim)*sp; e.walkT=(e.walkT||0)+Math.abs(sp)*dt; } }
    if (e.stateT>=a.lockAt) a.locked=true;
  }
  e.face=a.aim;
  if (e.stateT>=a.windup){ (BOSS_PRIMS[a.step.prim].activate||(()=>{}))(e,a); bossSetState(e,'ACTIVE'); if (typeof vfxOnActivate==='function') vfxOnActivate(e,a); }
}
function bossActive(e,dt){
  const a=e.atk;
  a.activeT+=dt;
  const done=BOSS_PRIMS[a.step.prim].active(e,a,dt);
  if (e.bstate!=='ACTIVE') return; // a parry interrupted this attack
  if (!done) return;
  if (a.step.after) a.step.after(e,a);
  if (a.stepI+1<a.def.steps.length){
    a.pause=(a.step.pause||0)*.8;
    if (a.pause>0) bossSetState(e,'PAUSE'); else bossBeginStep(e,a.stepI+1);
  } else bossToRecovery(e);
}
function bossToRecovery(e){
  if (e.atk.exposeInstead){ exposeEnemy(e); return; }
  bossSetState(e,'RECOVERY');
  if (e.atk.def.vent) e.vent=e.atk.def.recovery; // visual punish cue, no hidden multiplier
}
// A perfect parry cancels the attack and leaves the boss Exposed; its next action is deferred.
function bossExposed(e,dur){
  if (e.bstate==='INTRO'||e.bstate==='PHASE_CHANGE') return;
  e.exposedFor=dur; e.mx=e.my=0;
  bossSetState(e,'EXPOSED');
}
function bossKilled(e){
  bossClearOwned(e); e.atk=null; e.bstate='DEAD';
}

/* ---- Hit tests (player collision radius expands every footprint) ---- */
function inSectorShape(px,py,pr,ox,oy,aim,arc,radius){
  const dx=px-ox, dy=py-oy, d=Math.hypot(dx,dy);
  if (d>radius+pr) return false;
  if (d<pr) return true;
  return Math.abs(angDiff(Math.atan2(dy,dx),aim)) <= arc/2 + Math.asin(Math.min(1,pr/d));
}
function inLaneShape(px,py,pr,ox,oy,aim,len,width){
  const dx=px-ox, dy=py-oy, t=dx*Math.cos(aim)+dy*Math.sin(aim), perp=Math.abs(-dx*Math.sin(aim)+dy*Math.cos(aim));
  return t>-pr && t<len+pr && perp<width/2+pr;
}

/* ---- Attack primitives, reused by every boss ---- */
// Is this angle inside one of a ring attack's safe gaps right now? (Gaps can rotate.) The player's own radius must fit.
function ringGapAt(a,s,ang,d){
  const base=a.gapA+(s.rotate||0)*DEG*a.activeT, half=s.gap*DEG/2 - Math.asin(Math.min(1,player.r/Math.max(d,player.r)));
  for (let i=0;i<s.gaps;i++){ if (Math.abs(angDiff(ang,base+i*PI2/s.gaps))<half) return true; }
  return false;
}
function diskSpots(a){
  const s=a.step, h=s.spread*U/2, ox=Math.cos(a.axis)*h, oy=Math.sin(a.axis)*h;
  return s.n===1 ? [a.target] : [{x:a.target.x-ox,y:a.target.y-oy},{x:a.target.x+ox,y:a.target.y+oy}];
}
// How far a beam reaches before props or ice stop it.
function beamReach(x,y,ang,max){ for (let d=20; d<max; d+=12){ const px=x+Math.cos(ang)*d, py=y+Math.sin(ang)*d; if (px<10||py<10||px>ARENA.w-10||py>ARENA.h-10||inObstacle(px,py)) return d; } return max; }
// Ice wall geometry: two collinear segments centred `ahead` units in front of the boss, across its aim, `gap` apart.
function iceSegments(e,a){
  const s=a.step, cx=e.x+Math.cos(a.aim)*s.ahead*U, cy=e.y+Math.sin(a.aim)*s.ahead*U, perp=a.aim+Math.PI/2, off=(s.gap/2+s.seg/2)*U;
  return [-1,1].map(sd=>({x:cx+Math.cos(perp)*off*sd, y:cy+Math.sin(perp)*off*sd, ang:perp}));
}
function iceCircles(g,s){
  const n=7, half=s.seg*U/2, r=s.thick*U*0.62, out=[];
  for (let i=0;i<n;i++){ const t=-half+i*(2*half/(n-1)); out.push({x:g.x+Math.cos(g.ang)*t, y:g.y+Math.sin(g.ang)*t, r}); }
  return out;
}
function removeIceWalls(w){
  w.dead=true;
  obstacles=obstacles.filter(o=>o.wall!==w); // collision stops the same tick the ice disappears
}
function breakIce(w){
  removeIceWalls(w); w.killed=true;
  for (const o of w.obstacles){ for (let i=0;i<4;i++) particles.push({x:o.cx,y:o.cy,vx:rand(-260,260),vy:rand(-260,260),life:.45,max:.45,color:'#cff4ff',w:3}); }
  addShake(4);
  // Break both segments within 2s of creation and the boss's next attack is delayed by 1s (once per pair).
  const pr=w.owner && w.owner.icePair;
  if (pr && !pr.rewarded && pr.walls.every(x=>x.killed) && run.time-pr.born<=2){ pr.rewarded=true; w.owner.holdT=(w.owner.holdT||0)+1.0; texts.push({x:w.x,y:w.y-30,v:'SHATTERED ICE',t:0,c:'#cff4ff'}); }
}
function updateIceWalls(dt){
  for (const w of enemies) if (w.isIce && !w.dead){
    if (run.time-w.born>=w.dur) removeIceWalls(w);
  }
}
// Where a sector attack's apex sits: at the boss, or `lunge` units ahead of it.
function sectorApex(a){ const l=(a.step.lunge||0)*U; return {x:a.origin.x+Math.cos(a.aim)*l, y:a.origin.y+Math.sin(a.aim)*l}; }
const BOSS_PRIMS = {
  // Frontal sector (punches, sweeps, cones). Fields: arc (deg), radius (u), dmg, knock (u), src.
  sector:{
    active(e,a){
      const s=a.step, p=player, ap=sectorApex(a);
      if (s.lunge && a.activeT<s.active){ const sp=s.lunge*U/s.active; e.mx=Math.cos(a.aim)*sp; e.my=Math.sin(a.aim)*sp; }
      if (!a.hit && inSectorShape(p.x,p.y,p.r,ap.x,ap.y,a.aim,s.arc*DEG,s.radius*U)){ a.hit=!!hurtPlayer(s.dmg,a.aim,s.src,{attacker:e}); if (a.hit && e.bstate==='ACTIVE' && s.knock){ p.vx+=Math.cos(a.aim)*s.knock*U*4; p.vy+=Math.sin(a.aim)*s.knock*U*4; } }
      return a.activeT>=s.active;
    },
    activate(e,a){ addShake(6); sparks(e.x+Math.cos(a.aim)*e.r,e.y+Math.sin(a.aim)*e.r,a.aim,10,BOSSES[e.kind].color,520,0.6); },
  },
  // Straight charge along a frozen lane. Fields: width (u), length (u), speed (u/s), dmg, src.
  charge:{
    active(e,a,dt){
      const s=a.step, p=player, sp=s.speed*U*T.enemySpeed;
      e.mx=Math.cos(a.aim)*sp; e.my=Math.sin(a.aim)*sp; a.dist+=sp*dt;
      if (Math.random()<.8) particles.push({x:e.x,y:e.y,vx:-e.mx*.3+rand(-40,40),vy:-e.my*.3+rand(-40,40),life:.2,max:.2,color:BOSSES[e.kind].color,w:3});
      if (!a.hit && Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r+4) a.hit=!!hurtPlayer(s.dmg,a.aim,s.src,{attacker:e});
      if (e.bstate!=='ACTIVE'){ e.mx=e.my=0; return false; }
      const done=a.dist>=s.length*U || a.stopped;
      if (done && s.endSlash && !a.hit && Math.hypot(p.x-e.x,p.y-e.y)<(s.endSlash*U)+e.r+p.r){ a.hit=!!hurtPlayer(s.dmg,a.aim,s.src,{attacker:e}); if (e.bstate!=='ACTIVE'){ e.mx=e.my=0; return false; } }
      if (done){ e.mx=e.my=0; addShake(a.stopped?10:4); if (a.stopped) sparks(e.x+Math.cos(a.aim)*e.r,e.y+Math.sin(a.aim)*e.r,a.aim+Math.PI,14,'#9aa0ad',480,1.0); }
      return done;
    },
  },
  // Null Field: a no-damage zone on the captured player position. Inside, Power and Overload can't be used. Fields: radius (u), dur, src.
  placeNull:{
    active(e,a){
      const s=a.step; bossHazards=bossHazards.filter(h=>!(h.owner===e && h.kind==='null'));
      bossHazards.push({ owner:e, kind:'null', src:s.src, shape:'disk', x:a.target.x, y:a.target.y, radius:s.radius*U, t:0, arm:0, dur:s.dur, every:99, tick:0, dmg:0, c:BOSSES[e.kind].color, fill:BOSSES[e.kind].color });
      return true;
    },
  },
  // Places a Gravity Well hazard on the captured player position. Fields: radius, inner (u), dur, charge (s), pull (u/s), dmg, src.
  placeWell:{
    active(e,a){
      const s=a.step;
      bossHazards=bossHazards.filter(h=>!(h.owner===e && h.kind==='well'));
      bossHazards.push({ owner:e, kind:'well', src:s.src, shape:'disk', x:a.target.x, y:a.target.y, radius:s.radius*U, inner:s.inner*U, pull:s.pull*U,
        t:0, arm:0, dur:s.dur, charge:s.charge, every:99, tick:0, dmg:s.dmg, c:BOSSES[e.kind].color, fill:BOSSES[e.kind].color });
      addShake(4); return true;
    },
  },
  // One projectile down a frozen lane. Fields: width (u, also the projectile size), speed (u/s), dmg, src, kind.
  lane:{
    active(e,a){
      const s=a.step, sp=s.speed*U*T.enemySpeed, r=s.width*U/2;
      bullets.push({ x:e.x+Math.cos(a.aim)*(e.r+r), y:e.y+Math.sin(a.aim)*(e.r+r), vx:Math.cos(a.aim)*sp, vy:Math.sin(a.aim)*sp, r, dmg:s.dmg, src:s.src, kind:s.kind, owner:e, c:BOSSES[e.kind].color, knock:s.knock, dead:false, t:0 });
      addShake(7); sparks(e.x+Math.cos(a.aim)*e.r,e.y+Math.sin(a.aim)*e.r,a.aim,12,'#9aa0ad',520,.5);
      return true;
    },
  },
  // Projectiles orbit the boss, then fly radially outward. Fields: n, radius (u), r (u), spin (deg/s), hold (s), speed (u/s), life (s), dmg, src.
  orbit:{
    activate(e,a){
      const s=a.step; a.rubble=[];
      for (let i=0;i<s.n;i++){ const b={ x:e.x, y:e.y, vx:0, vy:0, r:Math.max(9,s.r*U), dmg:s.dmg, src:s.src, kind:'rubble', owner:e, c:BOSSES[e.kind].color, dead:false, t:0, maxT:s.hold+s.life,
        orbit:{ ang:a.aim+i/s.n*PI2, rad:s.radius*U } }; bullets.push(b); a.rubble.push(b); }
    },
    active(e,a,dt){
      const s=a.step;
      for (const b of a.rubble){ if (b.dead || !b.orbit) continue; b.orbit.ang+=s.spin*DEG*dt; b.x=e.x+Math.cos(b.orbit.ang)*b.orbit.rad; b.y=e.y+Math.sin(b.orbit.ang)*b.orbit.rad; }
      if (a.activeT<s.hold) return false;
      for (const b of a.rubble){ if (b.dead || !b.orbit) continue; const sp=s.speed*U*T.enemySpeed; b.vx=Math.cos(b.orbit.ang)*sp; b.vy=Math.sin(b.orbit.ang)*sp; b.orbit=null; }
      addShake(6); return true;
    },
  },
  // Boss-centred ring band with one safe sector aimed at the captured player position. Fields: rIn, rOut (u), gap (deg), active, dmg, src.
  annulus:{
    activate(e,a){ addShake(14); fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.35,r:a.step.rOut*U,c:BOSSES[e.kind].color,gapA:a.aim,gap:a.step.gap*DEG}); },
    active(e,a){
      const s=a.step, p=player, dx=p.x-a.origin.x, dy=p.y-a.origin.y, d=Math.hypot(dx,dy);
      const inBand = d>s.rIn*U-p.r && d<s.rOut*U+p.r;
      const half=s.gap*DEG/2 - Math.asin(Math.min(1,p.r/Math.max(d,p.r))), ang=Math.atan2(dy,dx);
      let inGap=false; for (let i=0;i<(s.gaps||1);i++) if (d>0 && Math.abs(angDiff(ang,a.aim+i*PI2/(s.gaps||1)))<half) inGap=true;
      if (!a.hit && inBand && !inGap) a.hit=!!hurtPlayer(s.dmg,Math.atan2(dy,dx),s.src,{});
      return a.activeT>=s.active;
    },
  },
  // Expanding sonic rings with safe gaps. Fields: r0, rMax (u), speed (u/s), thick (u), gaps (n opposite gaps),
  // gap (deg), rotate (deg/s, gaps turn together), count (rings), every (s between rings), dmg, src.
  // Gap angles are fixed when the attack begins so the warning can show them; each ring can hit once.
  ring:{
    begin(e,a,s){ a.gapA=rand(PI2); },
    activate(e,a){ a.rings=[]; a.nextRing=0; },
    active(e,a){
      const s=a.step, p=player;
      if (a.rings.length<(s.count||1) && a.activeT>=a.nextRing){ a.rings.push({born:a.activeT, hit:false}); a.nextRing+=s.every||0; addShake(5); }
      const dx=p.x-a.origin.x, dy=p.y-a.origin.y, d=Math.hypot(dx,dy), ang=Math.atan2(dy,dx);
      let alive=false;
      for (const rg of a.rings){
        const R=(s.r0+(a.activeT-rg.born)*s.speed*T.enemySpeed)*U; rg.R=R;
        if (R<s.rMax*U) alive=true; else continue;
        if (rg.hit || Math.abs(d-R)>s.thick*U/2+p.r) continue;
        if (ringGapAt(a,s,ang,d)) continue;
        rg.hit=!!hurtPlayer(rg.dmg||s.dmg,ang,s.src,{});
      }
      return !alive && a.rings.length>=(s.count||1);
    },
  },
  // Several targeted ground disks around the captured player position. Fields: n, radius (u), spread (u), active, dmg, src.
  disks:{
    begin(e,a){ a.axis=rand(PI2); },
    active(e,a){
      const s=a.step, p=player;
      if (!a.hit && diskSpots(a).some(c=>Math.hypot(p.x-c.x,p.y-c.y)<s.radius*U+p.r)) a.hit=!!hurtPlayer(s.dmg,a.axis,s.src,{slow:s.slow});
      return a.activeT>=s.active;
    },
    activate(e,a){ addShake(6); for (const c of diskSpots(a)) fx.push({type:'shock',x:c.x,y:c.y,t:0,dur:.25,r:a.step.radius*U,c:BOSSES[e.kind].color}); },
  },
  // Spawns damageable buds on marked spots; after a visible growth warning each fires a small aimed fan, then wilts.
  // Fields: n, dist (u), hp, grow (s), lock (s before firing), fan [deg...], speed (u/s), dmg, src, r (u).
  buds:{
    begin(e,a){ const s=a.step; a.spots=[]; for (let i=0;i<s.n;i++){ const ang=a.aim+(i-(s.n-1)/2)*1.2; a.spots.push({x:clamp(e.x+Math.cos(ang)*s.dist*U,60,ARENA.w-60), y:clamp(e.y+Math.sin(ang)*s.dist*U,60,ARENA.h-60)}); } },
    activate(e,a){
      const s=a.step; a.buds=a.spots.map(sp=>({ kind:'bud', isBud:true, anchored:true, owner:e, x:sp.x, y:sp.y, r:(s.r||0.45)*U, hp:s.hp, maxHp:s.hp,
        vx:0, vy:0, mx:0, my:0, flashT:0, stunT:0, spawnT:0, face:0, dead:false, growT:0, step:s, c:BOSSES[e.kind].color, drawFn:drawBud }));
      enemies.push(...a.buds);
    },
    active(e,a){
      if (!a.buds.every(b=>b.dead||b.fired)) return false;
      if (a.buds.every(b=>b.killed)) a.exposeInstead=true; // every bud destroyed before it fired
      return true;
    },
  },
  // Fan of straight beams from the boss. Fields: angles [deg], length, width (u), active, dmg, src.
  beams:{
    activate(e,a){ addShake(6); a.beamHit=[]; },
    active(e,a){
      const s=a.step, p=player;
      for (let i=0;i<s.angles.length;i++){ if (a.beamHit[i]) continue; const ang=a.aim+s.angles[i]*DEG;
        if (inLaneShape(p.x,p.y,p.r,a.origin.x,a.origin.y,ang,s.length*U,s.width*U)) a.beamHit[i]=!!hurtPlayer(s.dmg,ang,s.src,{}); }
      return a.activeT>=s.active;
    },
  },
  // Warned teleport: a destination disk 5-8 units away; arrive with a damaging pulse. Fields: radius, minD, maxD (u), active, dmg, src.
  step:{
    begin(e,a){
      const s=a.step; let best=null;
      for (let i=0;i<30 && !best;i++){ const ang=rand(PI2), d=rand(s.minD,s.maxD)*U, x=e.x+Math.cos(ang)*d, y=e.y+Math.sin(ang)*d;
        if (x>80 && y>80 && x<ARENA.w-80 && y<ARENA.h-80 && !inObstacle(x,y,e.r+10)) best={x,y}; }
      a.dest=best||{x:ARENA.w/2,y:ARENA.h/2};
    },
    activate(e,a){
      for (let i=0;i<10;i++) particles.push({x:e.x+rand(-14,14),y:e.y+rand(-14,14),vx:rand(-200,200),vy:rand(-200,200),life:.3,max:.3,color:BOSSES[e.kind].color,w:3});
      e.x=a.dest.x; e.y=a.dest.y; a.origin={x:e.x,y:e.y};
      fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.25,r:a.step.radius*U,c:BOSSES[e.kind].color}); addShake(6);
    },
    active(e,a){ const s=a.step, p=player; if (!a.hit && Math.hypot(p.x-e.x,p.y-e.y)<s.radius*U+p.r) a.hit=!!hurtPlayer(s.dmg,Math.atan2(p.y-e.y,p.x-e.x),s.src,{}); return a.activeT>=s.active; },
  },
  // Decoys appear, then every emitter (boss + decoys) warns one parallel beam and fires it.
  // Fields: decoys, offset (u), spread (deg), warn (s), fire (s), length, width (u), dmg, src.
  refract:{
    begin(e,a){
      const s=a.step; a.decoys=[];
      for (const sd of [-1,1].slice(0,s.decoys)){ const ang=a.aim+Math.PI+sd*(180-s.spread)*DEG; // ±110° from the direction to Volt
        const x=clamp(e.x+Math.cos(a.aim+sd*s.spread*DEG)*s.offset*U,60,ARENA.w-60), y=clamp(e.y+Math.sin(a.aim+sd*s.spread*DEG)*s.offset*U,60,ARENA.h-60);
        const d={ kind:'decoy', isDecoy:true, anchored:true, owner:e, x, y, r:e.r, hp:1, maxHp:1, vx:0, vy:0, mx:0, my:0, flashT:0, stunT:0, spawnT:0, face:a.aim, dead:false, drawFn:(m)=>BOSSES[e.kind].drawDecoy(m) };
        a.decoys.push(d); enemies.push(d); }
    },
    active(e,a){
      const s=a.step, p=player, live=[{x:e.x,y:e.y,ref:e}].concat(a.decoys.filter(d=>!d.dead).map(d=>({x:d.x,y:d.y,ref:d})));
      a.firing=a.activeT>=s.warn;
      if (a.firing){ a.beamHit=a.beamHit||new Set();
        for (const em of live){ if (a.beamHit.has(em.ref)) continue; if (inLaneShape(p.x,p.y,p.r,em.x,em.y,a.aim,s.length*U,s.width*U)){ if (hurtPlayer(s.dmg,a.aim,s.src,{})) a.beamHit.add(em.ref); } } }
      if (a.activeT>=s.warn+s.fire){ for (const d of a.decoys) d.dead=true; return true; }
      return false;
    },
  },
  // A beam that locks, then sweeps through an arc. Stops at props and ice. Fields: length, width (u), sweep (deg), sweepT (s), dmg, slow, src.
  jet:{
    begin(e,a){ a.dir=Math.random()<.5?-1:1; },
    activate(e,a){ addShake(5); },
    active(e,a){
      const s=a.step, p=player, ang=a.aim+a.dir*s.sweep*DEG*clamp(a.activeT/s.sweepT,0,1), L=beamReach(a.origin.x,a.origin.y,ang,s.length*U);
      a.beamAng=ang; a.beamLen=L;
      if (!a.hit && inLaneShape(p.x,p.y,p.r,a.origin.x,a.origin.y,ang,L,s.width*U)) a.hit=!!hurtPlayer(s.dmg,ang,s.src,{slow:s.slow});
      if (Math.random()<.6){ const d=rand(L); particles.push({x:a.origin.x+Math.cos(ang)*d,y:a.origin.y+Math.sin(ang)*d,vx:rand(-60,60),vy:rand(-60,60),life:.25,max:.25,color:BOSSES[e.kind].color,w:2}); }
      return a.activeT>=s.sweepT;
    },
  },
  // Two breakable ice wall segments with a walkable gap, across the line to Volt. Fields: seg, thick, gap, ahead (u), hp, dur, src.
  iceWall:{
    begin(e,a){ a.segs=iceSegments(e,a); },
    activate(e,a){
      // only one wall pair at a time: the old one melts away
      for (const m of enemies) if (m.owner===e && m.isIce) removeIceWalls(m);
      const s=a.step, p=player, born=run.time;
      a.wallSegs=[];
      for (const g of iceSegments(e,a)){
        const circles=iceCircles(g,s);
        if (circles.some(c=>Math.hypot(p.x-c.x,p.y-c.y)<c.r+p.r || Math.hypot(e.x-c.x,e.y-c.y)<c.r+e.r)) continue; // never entomb anyone
        const wall={ kind:'ice', isIce:true, anchored:true, owner:e, x:g.x, y:g.y, r:1.3*U, hp:s.hp, maxHp:s.hp, vx:0, vy:0, mx:0, my:0, flashT:0, stunT:0, spawnT:0, face:g.ang, dead:false,
          seg:g, born, dur:s.dur, obstacles:[], drawFn:()=>{} };
        for (const c of circles){ const ob={kind:'ice', circle:true, cx:c.x, cy:c.y, rad:c.r, x:c.x-c.r, y:c.y-c.r, w:c.r*2, h:c.r*2, ht:30, wall}; wall.obstacles.push(ob); obstacles.push(ob); }
        wall.obstacles[0].drawSeg=true;
        enemies.push(wall); a.wallSegs.push(wall);
      }
      e.icePair={walls:a.wallSegs, born, rewarded:false};
      addShake(5); return;
    },
    active(e,a){ return true; },
  },
  // Boss-centred disk impact, optionally followed by evenly spaced radial projectiles.
  // Fields: radius (u), dmg, src, active (s), shots:{n, speed (u/s), r (u), dmg, src}.
  selfDisk:{
    activate(e,a){ addShake(12); fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.3,r:a.step.radius*U,c:BOSSES[e.kind].color}); },
    active(e,a){
      const s=a.step, p=player;
      if (!a.hit && Math.hypot(p.x-a.origin.x,p.y-a.origin.y)<s.radius*U+p.r) a.hit=!!hurtPlayer(s.dmg,Math.atan2(p.y-e.y,p.x-e.x),s.src,{});
      if (a.activeT>=s.active){
        if (s.shots){ const sh=s.shots; for (let i=0;i<sh.n;i++){ const ang=a.aim+i/sh.n*PI2, sp=sh.speed*U*T.enemySpeed;
          bullets.push({x:e.x+Math.cos(ang)*(e.r+6),y:e.y+Math.sin(ang)*(e.r+6),vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:Math.max(6,sh.r*U),dmg:sh.dmg,src:sh.src,owner:e,c:BOSSES[e.kind].color,dead:false,t:0}); } }
        return true;
      }
      return false;
    },
  },
};

/* ---- Persistent hazards (owned by a boss, cleared on phase change and death) ---- */
function updateBossHazards(dt){
  const p=player; let suppressed=false;
  for (const k in bossTicks) bossTicks[k]-=dt;
  for (const h of bossHazards){
    h.t+=dt; h.tick-=dt;
    if (h.t>=h.dur){ h.dead=true; continue; }
    if (h.t<h.arm) continue;
    const inside = h.shape==='sector' ? inSectorShape(p.x,p.y,p.r*0.5,h.x,h.y,h.aim,h.arc,h.radius) : Math.hypot(p.x-h.x,p.y-h.y)<h.radius+p.r*0.5;
    if (h.kind==='well'){ updateWell(h,dt); continue; }
    if (h.kind==='null'){ if (Math.hypot(p.x-h.x,p.y-h.y)<h.radius){ suppressed=true; } continue; }
    if (inside && h.shared){ if ((bossTicks[h.src]||0)<=0){ bossTicks[h.src]=h.every; hurtPlayer(h.dmg,Math.atan2(p.y-h.y,p.x-h.x),h.src,{}); } }
    else if (inside && h.tick<=0){ h.tick=h.every; hurtPlayer(h.dmg,Math.atan2(p.y-h.y,p.x-h.x),h.src,{}); }
  }
  bossHazards=bossHazards.filter(h=>!h.dead);
  // Suppression never cancels a dash or an ability already running, but a charge in progress fizzles (no cooldown).
  if (suppressed && !p.suppressed) texts.push({x:p.x,y:p.y-40,v:'SUPPRESSED',t:0,c:'#e0283c'});
  if (suppressed && p.charging) p.charging=0;
  p.suppressed=suppressed;
}

// Gravity well: a force zone (no damage) pulling toward its centre, then a separately warned inner detonation.
// Pull = cap x clamp(1 - d/radius); added to walking, collision-resolved, ignored while dashing.
function updateWell(h,dt){
  const p=player, dx=h.x-p.x, dy=h.y-p.y, d=Math.hypot(dx,dy)||1;
  if (p.dashT<=0 && d<h.radius){ const pull=h.pull*clamp(1-d/h.radius,0,1); p.x+=dx/d*pull*dt; p.y+=dy/d*pull*dt; collide(p); }
  if (h.t>=h.dur-0.02 && !h.fired){
    h.fired=true; h.dead=true;
    if (d<h.inner+p.r) hurtPlayer(h.dmg,Math.atan2(-dy,-dx),h.src,{});
    fx.push({type:'shock',x:h.x,y:h.y,t:0,dur:.3,r:h.inner*1.6,c:h.c}); addShake(8);
    stainAtColor(h.x,h.y,h.inner*0.9,'#2a1748');
  }
}

// Buds grow in place, lock their aim 0.4s before firing, fire a fan of thorns, then wilt (no reward, no kill).
function updateBud(b,dt){
  const s=b.step, p=player; b.growT+=dt; b.flashT-=dt;
  if (!b.aim && b.growT>=s.grow-s.lock) b.aim=Math.atan2(p.y-b.y,p.x-b.x);
  if (b.growT>=s.grow && !b.fired){
    b.fired=true; b.dead=true;
    for (const da of s.fan){ const ang=b.aim+da*DEG, sp=s.speed*U*T.enemySpeed;
      bullets.push({x:b.x,y:b.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:7,dmg:s.dmg,src:s.src,owner:b.owner,c:b.c,dead:false,t:0}); }
    sparks(b.x,b.y,b.aim,8,b.c,320,0.6);
  }
}
function drawBud(b){
  const s=b.step, k=clamp(b.growT/s.grow,0,1), white=b.flashT>0;
  if (b.aim){ ctx.save(); ctx.strokeStyle=b.c; ctx.globalAlpha=0.6; ctx.lineWidth=2; ctx.setLineDash([6,6]);
    for (const da of s.fan){ const ang=b.aim+da*DEG; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+Math.cos(ang)*260,b.y+Math.sin(ang)*260); ctx.stroke(); } ctx.restore(); }
  ctx.save(); ctx.translate(b.x,b.y); const sc=0.5+0.5*k; ctx.scale(sc,sc);
  ctx.shadowColor=b.c; ctx.shadowBlur=8+16*k;
  for (let i=0;i<5;i++){ const ang=i/5*PI2+time*0.6; ctx.fillStyle=white?'#fff':'#5a7a3a'; ctx.beginPath(); ctx.ellipse(Math.cos(ang)*10,Math.sin(ang)*10,12,5,ang,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2; ctx.stroke(); }
  ctx.fillStyle=white?'#fff':b.c; ctx.beginPath(); ctx.arc(0,0,7+4*k,0,PI2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
  ctx.restore();
  // growth timer ring
  ctx.save(); ctx.strokeStyle=b.c; ctx.lineWidth=3; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(b.x,b.y,b.r+8,-Math.PI/2,-Math.PI/2+PI2*k); ctx.stroke(); ctx.restore();
}

/* ---- Parry glint timing for spec bosses: seconds until a parryable component lands, or -1 ---- */
function bossGlint(e){
  const a=e.atk, p=player; if (!a || !a.step) return -1;
  const s=a.step; if (BOSS_PARRY[s.src]!=='parry') return -1;
  if (s.prim==='charge'){
    const travel=Math.max(0,(Math.hypot(p.x-e.x,p.y-e.y)-e.r-p.r)/(s.speed*U*T.enemySpeed));
    if (e.bstate==='WINDUP') return a.windup-e.stateT+travel;
    if (e.bstate==='ACTIVE' && !a.hit) return travel;
    return -1;
  }
  // Thrown lanes (Mass Driver) glint through the wind-up too: up close the rock lands the moment it spawns,
  // so the cue has to start before the throw for the parry to be possible.
  if (s.prim==='lane'){
    if (e.bstate!=='WINDUP') return -1; // once thrown, the rock itself glints
    const travel=Math.max(0,(Math.hypot(p.x-e.x,p.y-e.y)-e.r-p.r-s.width*U)/(s.speed*U*T.enemySpeed));
    return a.windup-e.stateT+travel;
  }
  if (s.prim!=='sector') return -1; // other projectile attacks glint on the projectile itself
  if (e.bstate==='WINDUP') return a.windup-e.stateT;
  if (e.bstate==='ACTIVE' && !a.hit) return 0;
  return -1;
}

/* ---- Telegraph rendering: reads the same geometry the hit tests use ---- */
function hatch(c,spacing,alpha){
  ctx.save(); ctx.clip(); ctx.globalAlpha=alpha; ctx.strokeStyle=c; ctx.lineWidth=2;
  const off=(time*40)%spacing; ctx.beginPath();
  for (let x=-ARENA.h-200+off; x<ARENA.w+200; x+=spacing){ ctx.moveTo(x,-100); ctx.lineTo(x+ARENA.h+200,ARENA.h+100); }
  ctx.stroke(); ctx.restore();
}
function drawFootprint(path, c, k, isSuper, pulse, jagged){
  // Outline = warning, patterned interior, brief bright fill on activation. Supers get a jagged edge.
  ctx.save();
  path(); ctx.fillStyle=pulse?c:`rgba(0,0,0,0)`; if (pulse){ ctx.globalAlpha=0.55; ctx.fill(); ctx.globalAlpha=1; }
  path(); hatch(c,18,0.18+0.3*k);
  path(); ctx.strokeStyle=c; ctx.lineWidth=2+2*k; ctx.globalAlpha=0.55+0.45*k; ctx.stroke();
  if (isSuper && jagged){ ctx.globalAlpha=0.9; ctx.lineWidth=2; jagged(); }
  ctx.restore();
}
function drawBossTelegraph(e){
  const def=BOSSES[e.kind], a=e.atk;
  if (!a || !a.step || !(e.bstate==='WINDUP'||e.bstate==='ACTIVE')) return;
  const s=a.step, c=s.color||def.color, isSuper=BOSS_PARRY[s.src]!=='parry';
  // While live, attacks with a drawn effect (js/vfx.js) skip the flat fill and show the effect instead.
  const k=e.bstate==='ACTIVE'?1:clamp(e.stateT/a.windup,0,1), pulse=e.bstate==='ACTIVE' && !(typeof vfxOwnsActive==='function' && vfxOwnsActive(s));
  const ox=a.origin.x, oy=a.origin.y;
  if (s.prim==='sector'){
    const R=s.radius*U, half=s.arc*DEG/2, ap=sectorApex(a);
    drawFootprint(()=>{ ctx.beginPath(); ctx.moveTo(ap.x,ap.y); ctx.arc(ap.x,ap.y,R,a.aim-half,a.aim+half); ctx.closePath(); }, c, k, isSuper, pulse,
      ()=>jaggedRing(ap.x,ap.y,R+6,a.aim-half,a.aim+half,40,6));
    if (s.lunge){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.35+0.4*k; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ap.x,ap.y); ctx.stroke(); ctx.restore(); }
    if (!a.locked && e.bstate==='WINDUP'){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.5; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(a.aim)*R,oy+Math.sin(a.aim)*R); ctx.stroke(); ctx.restore(); }
  } else if (s.prim==='charge'){
    const L=s.length*U, Wd=s.width*U;
    ctx.save(); ctx.translate(e.bstate==='ACTIVE'?ox:e.x, e.bstate==='ACTIVE'?oy:e.y); ctx.rotate(a.aim);
    drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-Wd/2,L,Wd); }, c, k, isSuper, false, ()=>{});
    ctx.strokeStyle=c; ctx.lineWidth=4; ctx.globalAlpha=0.5+0.5*k;
    for (let i=0;i<4;i++){ const x=L*(0.2+i*0.2)+((time*120)%40); ctx.beginPath(); ctx.moveTo(x,-Wd*0.3); ctx.lineTo(x+16,0); ctx.lineTo(x,Wd*0.3); ctx.stroke(); }
    ctx.restore();
  } else if (s.prim==='lane'){
    const Wd=s.width*U, L=1600;
    ctx.save(); ctx.translate(ox,oy); ctx.rotate(a.aim);
    drawFootprint(()=>{ ctx.beginPath(); ctx.rect(e.r,-Wd/2,L,Wd); }, c, k, isSuper, false, ()=>{});
    ctx.restore();
  } else if (s.prim==='placeWell'){
    drawWellShape(a.target.x,a.target.y,s.radius*U,s.inner*U,c,k,false);
  } else if (s.prim==='ring'){
    drawRingTelegraph(e,a,s,c,k);
  } else if (s.prim==='buds' && e.bstate==='WINDUP'){
    for (const sp of a.spots){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.4+0.5*k; ctx.lineWidth=2; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.arc(sp.x,sp.y,24,0,PI2); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(sp.x-8,sp.y); ctx.lineTo(sp.x+8,sp.y); ctx.moveTo(sp.x,sp.y-8); ctx.lineTo(sp.x,sp.y+8); ctx.stroke(); ctx.restore(); }
  } else if (s.prim==='beams'){
    for (const da of s.angles){ const ang=a.aim+da*DEG; ctx.save(); ctx.translate(ox,oy); ctx.rotate(ang);
      drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-s.width*U/2,s.length*U,s.width*U); }, c, k, isSuper, pulse, ()=>{ ctx.beginPath(); ctx.moveTo(0,-s.width*U/2-5); for (let x=0;x<=s.length*U;x+=14) ctx.lineTo(x,-s.width*U/2-((x/14)%2?9:5)); ctx.stroke(); });
      ctx.restore(); }
  } else if (s.prim==='step'){
    if (e.bstate==='WINDUP'){ const R=s.radius*U; drawFootprint(()=>{ ctx.beginPath(); ctx.arc(a.dest.x,a.dest.y,R,0,PI2); }, c, k, isSuper, false, ()=>jaggedRing(a.dest.x,a.dest.y,R+5,0,PI2,32,6));
      ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.35; ctx.setLineDash([4,8]); ctx.beginPath(); ctx.moveTo(e.x,e.y); ctx.lineTo(a.dest.x,a.dest.y); ctx.stroke(); ctx.restore(); }
  } else if (s.prim==='refract'){
    if (e.bstate==='ACTIVE'){ const emit=[{x:e.x,y:e.y}].concat((a.decoys||[]).filter(d=>!d.dead));
      for (const em of emit){ ctx.save(); ctx.translate(em.x,em.y); ctx.rotate(a.aim);
        drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-s.width*U/2,s.length*U,s.width*U); }, c, a.firing?1:clamp(a.activeT/s.warn,0,1), true, a.firing && pulse!==false && !(typeof vfxOwnsActive==='function' && vfxOwnsActive(s)), ()=>{ ctx.beginPath(); ctx.moveTo(0,-s.width*U/2-5); for (let x=0;x<=s.length*U;x+=14) ctx.lineTo(x,-s.width*U/2-((x/14)%2?9:5)); ctx.stroke(); });
        ctx.restore(); } }
  } else if (s.prim==='jet'){
    const L=s.length*U, Wd=s.width*U;
    if (e.bstate==='WINDUP'){
      const a0=Math.min(a.aim,a.aim+a.dir*s.sweep*DEG), a1=Math.max(a.aim,a.aim+a.dir*s.sweep*DEG);
      ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.3+0.4*k; ctx.setLineDash([6,8]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.arc(ox,oy,L,a0,a1); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      const ta=a.aim+a.dir*s.sweep*DEG*0.6; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(ox,oy,L*0.55,a.aim,ta,a.dir<0); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(ox,oy); ctx.rotate(a.aim); drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-Wd/2,beamReach(ox,oy,a.aim,L),Wd); }, c, k, isSuper, false, ()=>{}); ctx.restore();
    } else {
      ctx.save(); ctx.translate(ox,oy); ctx.rotate(a.beamAng||a.aim); drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-Wd/2,a.beamLen||L,Wd); }, c, 1, isSuper, pulse, ()=>{}); ctx.restore();
    }
  } else if (s.prim==='iceWall' && e.bstate==='WINDUP'){
    for (const g of a.segs){ ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(g.ang); ctx.strokeStyle=c; ctx.globalAlpha=0.4+0.5*k; ctx.lineWidth=2; ctx.setLineDash([6,6]);
      ctx.strokeRect(-s.seg*U/2,-s.thick*U/2,s.seg*U,s.thick*U); ctx.restore(); }
  } else if (s.prim==='disks'){
    for (const sp of diskSpots(a)) drawFootprint(()=>{ ctx.beginPath(); ctx.arc(sp.x,sp.y,s.radius*U,0,PI2); }, c, k, isSuper, pulse, ()=>jaggedRing(sp.x,sp.y,s.radius*U+5,0,PI2,28,6));
  } else if (s.prim==='orbit' && e.bstate==='WINDUP'){
    const R=s.radius*U;
    ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.3+0.5*k; ctx.lineWidth=2; ctx.setLineDash([8,8]); ctx.lineDashOffset=-time*30;
    ctx.beginPath(); ctx.arc(ox,oy,R,0,PI2); ctx.stroke(); ctx.setLineDash([]);
    for (let i=0;i<s.n;i++){ const ang=a.aim+i/s.n*PI2+e.stateT*s.spin*DEG*0.3, x=ox+Math.cos(ang)*R, y=oy+Math.sin(ang)*R;
      ctx.beginPath(); ctx.arc(x,y,s.r*U+4,0,PI2); ctx.stroke();
      const t=ang+0.35; ctx.beginPath(); ctx.moveTo(ox+Math.cos(t-0.08)*(R-10),oy+Math.sin(t-0.08)*(R-10)); ctx.lineTo(ox+Math.cos(t)*R,oy+Math.sin(t)*R); ctx.lineTo(ox+Math.cos(t-0.08)*(R+10),oy+Math.sin(t-0.08)*(R+10)); ctx.stroke(); }
    ctx.restore();
  } else if (s.prim==='annulus'){
    const r0=s.rIn*U, r1=s.rOut*U, g=s.gap*DEG/2, n=s.gaps||1;
    for (let i=0;i<n;i++){ const a0=a.aim+i*PI2/n+g, a1=a.aim+(i+1)*PI2/n-g;
      drawFootprint(()=>{ ctx.beginPath(); ctx.arc(ox,oy,r1,a0,a1); ctx.arc(ox,oy,r0,a1,a0,true); ctx.closePath(); }, c, k, isSuper, pulse, ()=>jaggedRing(ox,oy,r1+6,a0,a1,60,7)); }
    if (e.bstate==='WINDUP'){ ctx.save(); ctx.translate(ox,oy); ctx.rotate(a.aim); ctx.strokeStyle=`rgba(244,251,255,${0.35+0.4*Math.sin(time*12)**2})`; ctx.lineWidth=4; ctx.lineCap='round';
      for (let i=0;i<3;i++){ const x=r0+30+i*30; ctx.beginPath(); ctx.moveTo(x,-12); ctx.lineTo(x+12,0); ctx.lineTo(x,12); ctx.stroke(); } ctx.restore(); }
  } else if (s.prim==='selfDisk'){
    const R=s.radius*U;
    drawFootprint(()=>{ ctx.beginPath(); ctx.arc(ox,oy,R,0,PI2); }, c, k, isSuper, pulse, ()=>jaggedRing(ox,oy,R+6,0,PI2,56,7));
    if (s.shots && e.bstate==='WINDUP'){ // projectile spoke previews
      ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.25+0.35*k; ctx.setLineDash([4,8]); ctx.lineWidth=2;
      for (let i=0;i<s.shots.n;i++){ const ang=a.aim+i/s.shots.n*PI2; ctx.beginPath(); ctx.moveTo(ox+Math.cos(ang)*R,oy+Math.sin(ang)*R); ctx.lineTo(ox+Math.cos(ang)*(R+160),oy+Math.sin(ang)*(R+160)); ctx.stroke(); }
      ctx.restore();
    }
  }
}
// (effects for live attacks are drawn by vfxDrawActive, called from render after the telegraphs)
// Rings: during the wind-up, show the safe lanes (white) running out from the boss and which way they'll turn.
// While active, draw each expanding band with the gaps cut out and a jagged edge (super).
function drawRingTelegraph(e,a,s,c,k){
  const ox=a.origin.x, oy=a.origin.y, rot=(s.rotate||0)*DEG, t=e.bstate==='ACTIVE'?a.activeT:0, base=a.gapA+rot*t, g=s.gap*DEG/2, Rmax=s.rMax*U;
  ctx.save();
  for (let i=0;i<s.gaps;i++){
    const ga=base+i*PI2/s.gaps;
    ctx.globalAlpha=e.bstate==='WINDUP'?0.25+0.35*k:0.18; ctx.fillStyle='rgba(244,251,255,.5)';
    ctx.beginPath(); ctx.moveTo(ox,oy); ctx.arc(ox,oy,Rmax,ga-g,ga+g); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=0.7; ctx.strokeStyle='#f4fbff'; ctx.lineWidth=2; ctx.setLineDash([10,8]);
    for (const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(ga+sd*g)*Rmax,oy+Math.sin(ga+sd*g)*Rmax); ctx.stroke(); }
    ctx.setLineDash([]);
    if (rot && e.bstate==='WINDUP'){ // rotation arrows on each gap
      const R=180, dir=Math.sign(rot); ctx.lineWidth=4; ctx.beginPath(); ctx.arc(ox,oy,R,ga-g*0.8*dir,ga+g*0.8*dir,dir<0); ctx.stroke();
      const ta=ga+g*0.8*dir; ctx.beginPath(); ctx.moveTo(ox+Math.cos(ta)*(R-10),oy+Math.sin(ta)*(R-10)); ctx.lineTo(ox+Math.cos(ta+0.12*dir)*R,oy+Math.sin(ta+0.12*dir)*R); ctx.lineTo(ox+Math.cos(ta)*(R+10),oy+Math.sin(ta)*(R+10)); ctx.stroke();
    }
  }
  ctx.restore();
  const bands = e.bstate==='ACTIVE' ? (a.rings||[]).filter(r=>r.R<Rmax).map(r=>r.R) : [s.r0*U];
  for (const R of bands){
    const th=s.thick*U;
    for (let i=0;i<s.gaps;i++){
      const a0=base+i*PI2/s.gaps+g, a1=base+(i+1)*PI2/s.gaps-g;
      drawFootprint(()=>{ ctx.beginPath(); ctx.arc(ox,oy,R+th/2,a0,a1); ctx.arc(ox,oy,Math.max(1,R-th/2),a1,a0,true); ctx.closePath(); }, c, e.bstate==='ACTIVE'?1:k, true, e.bstate==='ACTIVE', ()=>jaggedRing(ox,oy,R+th/2+4,a0,a1,Math.max(8,R/10|0),5));
    }
  }
}
// Force zone (outer, swirling arrows, no hatch: it pulls but never damages) around a damage zone (inner, charges up).
function drawWellShape(x,y,R,ri,c,k,live,charge=0){
  ctx.save();
  ctx.strokeStyle=c; ctx.globalAlpha=live?0.7:0.35+0.4*k; ctx.lineWidth=2; ctx.setLineDash([3,9]); ctx.lineDashOffset=time*40;
  ctx.beginPath(); ctx.arc(x,y,R,0,PI2); ctx.stroke(); ctx.setLineDash([]);
  for (let i=0;i<6;i++){ const ang=i/6*PI2+time*1.6, r1=R*0.92, r2=R*0.62; ctx.beginPath(); ctx.moveTo(x+Math.cos(ang)*r1,y+Math.sin(ang)*r1); ctx.quadraticCurveTo(x+Math.cos(ang+0.5)*R*0.8,y+Math.sin(ang+0.5)*R*0.8,x+Math.cos(ang+0.7)*r2,y+Math.sin(ang+0.7)*r2); ctx.stroke(); }
  ctx.globalAlpha=1; ctx.lineWidth=2+3*charge; ctx.beginPath(); ctx.arc(x,y,ri,0,PI2); ctx.stroke();
  if (charge>0){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,ri,0,PI2); ctx.fillStyle=c; ctx.globalAlpha=0.15+0.45*charge; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(x,y,ri,0,PI2); hatch(c,12,0.5*charge); jaggedRing(x,y,ri+5,0,PI2,28,6); }
  ctx.restore();
}
// Null Field: broken crimson boundary, crosshatched interior. Never damaging, so no jagged edge.
function drawNullField(h){
  const fade=Math.min(1,(h.dur-h.t)/0.3)*Math.min(1,h.t/0.2);
  ctx.save(); ctx.globalAlpha=fade;
  ctx.beginPath(); ctx.arc(h.x,h.y,h.radius,0,PI2); ctx.fillStyle='rgba(224,40,60,.08)'; ctx.fill();
  ctx.beginPath(); ctx.arc(h.x,h.y,h.radius,0,PI2); hatch(h.c,16,0.22);
  ctx.beginPath(); ctx.arc(h.x,h.y,h.radius,0,PI2); ctx.save(); ctx.clip(); ctx.globalAlpha=fade*0.22; ctx.strokeStyle=h.c; ctx.lineWidth=2; ctx.beginPath();
  for (let x=-ARENA.h; x<ARENA.w+ARENA.h; x+=16){ ctx.moveTo(x,ARENA.h+100); ctx.lineTo(x+ARENA.h+200,-100); } ctx.stroke(); ctx.restore();
  ctx.strokeStyle=h.c; ctx.lineWidth=3; ctx.setLineDash([14,10]); ctx.lineDashOffset=time*30; ctx.beginPath(); ctx.arc(h.x,h.y,h.radius,0,PI2); ctx.stroke();
  ctx.setLineDash([]); ctx.font='900 18px "Big Shoulders Display", Impact, sans-serif'; ctx.textAlign='center'; ctx.fillStyle=h.c; ctx.globalAlpha=fade*0.8; ctx.fillText('NULL FIELD',h.x,h.y-h.radius+24);
  ctx.restore();
}
function drawBossHazards(){
  for (const h of bossHazards){
    if (h.kind==='null'){ drawNullField(h); continue; }
    if (h.kind==='well'){ drawWellShape(h.x,h.y,h.radius,h.inner,h.c,1,true,clamp((h.t-(h.dur-h.charge))/h.charge,0,1)); continue; }
    const fade=Math.min(1,(h.dur-h.t)/0.4)*Math.min(1,h.t/0.2);
    ctx.save(); ctx.globalAlpha=fade;
    const path = h.shape==='sector' ? ()=>{ ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.arc(h.x,h.y,h.radius,h.aim-h.arc/2,h.aim+h.arc/2); ctx.closePath(); }
                                    : ()=>{ ctx.beginPath(); ctx.arc(h.x,h.y,h.radius,0,PI2); };
    path(); ctx.fillStyle=h.fill; ctx.globalAlpha=fade*(0.25+0.08*Math.sin(time*6)); ctx.fill();
    ctx.globalAlpha=fade; path(); hatch(h.c,14,0.35);
    ctx.strokeStyle=h.c; ctx.lineWidth=2; ctx.globalAlpha=fade*0.9;
    if (h.shape==='sector') jaggedRing(h.x,h.y,h.radius+5,h.aim-h.arc/2,h.aim+h.arc/2,36,6); else jaggedRing(h.x,h.y,h.radius+5,0,PI2,40,6);
    ctx.restore();
  }
}
// Debug: draw every live hit shape in white.
function drawBossHitboxes(){
  if (!bossDebug.hitboxes) return;
  ctx.save(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
  for (const e of enemies){ if (!e.isBoss) continue; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,PI2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,PI2); ctx.stroke();
  for (const b of bullets){ ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,PI2); ctx.stroke(); }
  ctx.restore();
}
