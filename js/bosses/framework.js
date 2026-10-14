// Volt: Shared boss framework. Every boss in docs/boss-gameplay-spec.md runs on this (Gravemark predates it).
'use strict';

// Spec distances are in "units"; 1 unit = 50 world px. Angles in boss data are degrees.
const U = 50, DEG = Math.PI/180;
const BOSSES = {};
const BOSS_PARRY = {};      // damage source id -> 'parry' | 'super', merged from every boss
let bossHazards = [];       // persistent boss-owned floor hazards (heated floor, pools, ...)
let bossDebug = { hitboxes:false };

function registerBoss(def){ BOSSES[def.id]=def; Object.assign(BOSS_PARRY, def.parryClass||{}); }
const isSpecBoss = e => !!(e && BOSSES[e.kind]);

function makeBoss(id, at){
  const def=BOSSES[id], hp=def.hp*T.enemyHealth;
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
  const ph=bossPhaseFor(e); if (ph>e.queuedPhase) e.queuedPhase=ph;
  switch (e.bstate){
    case 'INTRO':
      e.face=Math.atan2(p.y-e.y,p.x-e.x);
      if (e.stateT>=1.5){ e.invuln=false; bossNextAttack(e); }
      break;
    case 'PHASE_CHANGE':
      if (e.stateT>=1.2){ e.invuln=false; bossNextAttack(e); }
      break;
    case 'EXPOSED':
      if (e.stateT>=e.exposedFor) bossEndAttack(e);
      break;
    case 'REPOSITION':
      if (def.reposition(e,dt) || e.stateT>=1.5) bossBeginStep(e,0);
      break;
    case 'WINDUP': bossWindup(e,dt); break;
    case 'ACTIVE': bossActive(e,dt); break;
    case 'PAUSE': if (e.stateT>=e.atk.pause) bossBeginStep(e,e.atk.stepI+1); break;
    case 'RECOVERY': if (e.stateT>=e.atk.def.recovery) bossEndAttack(e); break;
  }
}
function bossNextAttack(e){
  const def=BOSSES[e.kind], seq=def.sequences[e.phase-1], id=seq[e.seqI % seq.length];
  e.seqI++;
  e.atk={ id, def:def.attacks[id], stepI:-1, step:null };
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
  for (const b of bullets) if (b.owner===e) b.dead=true;
  for (const h of bossHazards) if (h.owner===e) h.dead=true;
  bossHazards=bossHazards.filter(h=>!h.dead);
}
function bossBeginStep(e,i){
  const a=e.atk, steps=a.def.steps, p=player;
  if (i>=steps.length){ bossToRecovery(e); return; }
  const st=steps[i], w=st.windup*R.windMul;
  Object.assign(a,{ stepI:i, step:st, hit:false, locked:false, windup:w, lockAt:Math.max(0,Math.min(w*0.6,w-0.3)),
    aim:Math.atan2(p.y-e.y,p.x-e.x), target:{x:p.x,y:p.y}, origin:{x:e.x,y:e.y}, activeT:0, dist:0, stopped:false });
  (BOSS_PRIMS[st.prim].begin||(()=>{}))(e,a);
  bossSetState(e,'WINDUP');
}
function bossWindup(e,dt){
  const a=e.atk, p=player;
  // Targeted footprints track the player for the first 60% of the wind-up, then freeze (at least 0.3s of frozen warning).
  if (!a.locked){
    a.aim=Math.atan2(p.y-e.y,p.x-e.x); a.target={x:p.x,y:p.y}; a.origin={x:e.x,y:e.y};
    if (e.stateT>=a.lockAt) a.locked=true;
  }
  e.face=a.aim;
  if (e.stateT>=a.windup){ (BOSS_PRIMS[a.step.prim].activate||(()=>{}))(e,a); bossSetState(e,'ACTIVE'); }
}
function bossActive(e,dt){
  const a=e.atk;
  a.activeT+=dt;
  const done=BOSS_PRIMS[a.step.prim].active(e,a,dt);
  if (e.bstate!=='ACTIVE') return; // a parry interrupted this attack
  if (!done) return;
  if (a.step.after) a.step.after(e,a);
  if (a.stepI+1<a.def.steps.length){
    a.pause=a.step.pause||0;
    if (a.pause>0) bossSetState(e,'PAUSE'); else bossBeginStep(e,a.stepI+1);
  } else bossToRecovery(e);
}
function bossToRecovery(e){
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
const BOSS_PRIMS = {
  // Frontal sector (punches, sweeps, cones). Fields: arc (deg), radius (u), dmg, knock (u), src.
  sector:{
    active(e,a){
      const s=a.step, p=player;
      if (!a.hit && inSectorShape(p.x,p.y,p.r,a.origin.x,a.origin.y,a.aim,s.arc*DEG,s.radius*U)){ a.hit=!!hurtPlayer(s.dmg,a.aim,s.src,{attacker:e}); if (a.hit && e.bstate==='ACTIVE' && s.knock){ p.vx+=Math.cos(a.aim)*s.knock*U*4; p.vy+=Math.sin(a.aim)*s.knock*U*4; } }
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
      if (done){ e.mx=e.my=0; addShake(a.stopped?10:4); if (a.stopped) sparks(e.x+Math.cos(a.aim)*e.r,e.y+Math.sin(a.aim)*e.r,a.aim+Math.PI,14,'#9aa0ad',480,1.0); }
      return done;
    },
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
  const p=player;
  for (const h of bossHazards){
    h.t+=dt; h.tick-=dt;
    if (h.t>=h.dur){ h.dead=true; continue; }
    if (h.t<h.arm) continue;
    const inside = h.shape==='sector' ? inSectorShape(p.x,p.y,p.r*0.5,h.x,h.y,h.aim,h.arc,h.radius) : Math.hypot(p.x-h.x,p.y-h.y)<h.radius+p.r*0.5;
    if (inside && h.tick<=0){ h.tick=h.every; hurtPlayer(h.dmg,Math.atan2(p.y-h.y,p.x-h.x),h.src,{}); }
  }
  bossHazards=bossHazards.filter(h=>!h.dead);
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
  const s=a.step, c=def.color, isSuper=BOSS_PARRY[s.src]!=='parry';
  const k=e.bstate==='ACTIVE'?1:clamp(e.stateT/a.windup,0,1), pulse=e.bstate==='ACTIVE';
  const ox=a.origin.x, oy=a.origin.y;
  if (s.prim==='sector'){
    const R=s.radius*U, half=s.arc*DEG/2;
    drawFootprint(()=>{ ctx.beginPath(); ctx.moveTo(ox,oy); ctx.arc(ox,oy,R,a.aim-half,a.aim+half); ctx.closePath(); }, c, k, isSuper, pulse,
      ()=>jaggedRing(ox,oy,R+6,a.aim-half,a.aim+half,40,6));
    if (!a.locked && e.bstate==='WINDUP'){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.5; ctx.setLineDash([6,6]); ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(a.aim)*R,oy+Math.sin(a.aim)*R); ctx.stroke(); ctx.restore(); }
  } else if (s.prim==='charge'){
    const L=s.length*U, Wd=s.width*U;
    ctx.save(); ctx.translate(e.bstate==='ACTIVE'?ox:e.x, e.bstate==='ACTIVE'?oy:e.y); ctx.rotate(a.aim);
    drawFootprint(()=>{ ctx.beginPath(); ctx.rect(0,-Wd/2,L,Wd); }, c, k, isSuper, false, ()=>{});
    ctx.strokeStyle=c; ctx.lineWidth=4; ctx.globalAlpha=0.5+0.5*k;
    for (let i=0;i<4;i++){ const x=L*(0.2+i*0.2)+((time*120)%40); ctx.beginPath(); ctx.moveTo(x,-Wd*0.3); ctx.lineTo(x+16,0); ctx.lineTo(x,Wd*0.3); ctx.stroke(); }
    ctx.restore();
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
function drawBossHazards(){
  for (const h of bossHazards){
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
