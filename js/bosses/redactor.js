// Volt: The Redactor, main antagonist and final boss (docs/boss-gameplay-spec.md §7). Collects powers from defeated
// villains and decides who keeps theirs. Six floating shield plates, a power-suppressing Null Field, Final Verdict,
// and, from phase 2, attacks stolen from the villains Volt beat this run.
'use strict';

const RD_COL = '#e0283c';
const RD_LANES = { prim:'beams', windup:1.1, active:0.35, angles:[0,120,240], length:14, width:0.8, dmg:20, src:'redact_lanes' };
const RD_PLATES = 6, RD_PLATE_R = 4;
// What he copies from each villain (spec "Stolen attacks"): one recognisable attack, original warning times.
const RD_STOLEN = {
  kilnheart:  { label:'Borrowed Furnace',    recovery:1.1, steps:()=>[ {...KILN_PUNCH, lunge:0, creep:0, radius:4.5} ] },
  bellwether: { label:'Borrowed Resonance',  recovery:0.8, steps:()=>[ {...BW_RING} ] },
  verdigris:  { label:'Borrowed Growth',     recovery:0.8, steps:()=>[ {...VG_SEED, poolDur:3} ] },
  glasswake:  { label:'Borrowed Refraction', recovery:1.0, steps:()=>[ { prim:'beams', windup:1.0, active:0.35, angles:[-35,0,35], length:12, width:0.65, dmg:18, src:'glass_lanes' } ] },
  undertow:   { label:'Borrowed Tide',       recovery:1.2, steps:()=>[ {...UT_CHARGE} ] },
  gravemark:  { label:'Borrowed Gravity',    recovery:1.2, steps:()=>[ {...GM_DRIVER} ] },
};
// The run's stolen list: district villains in the order Volt beat them, then Gravemark.
function rdStolenList(){
  const beaten=(run.route?run.route.order:[]).filter(id=>DISTRICT_POOL.includes(id) && id!==curDistrict());
  return beaten.concat(['gravemark']).filter(id=>RD_STOLEN[id] && BOSSES[id]);
}
const rdNull = e => bossHazards.find(h=>h.owner===e && h.kind==='null' && !h.dead);
const rdPlates = e => enemies.filter(m=>m.isPlate && m.owner===e && !m.dead);
// Stolen attacks and Final Verdict never overlap the Null Field or a copied acid pool: those fade first.
function rdClearForBigAttack(e){
  const n=rdNull(e); if (n) n.dur=Math.min(n.dur,n.t+0.3);
  return bossHazards.some(h=>h.owner===e && (h.kind==='null' || h.src==='verd_acid'));
}

function rdSpawnPlates(e){
  for (const m of rdPlates(e)) m.dead=true;
  e.plateBroke=false;
  for (let i=0;i<RD_PLATES;i++) enemies.push({ kind:'plate', isPlate:true, anchored:true, owner:e, idx:i, hp:30, maxHp:30, r:22,
    x:e.x, y:e.y, vx:0, vy:0, mx:0, my:0, flashT:0, stunT:0, spawnT:0, face:0, dead:false, drawFn:rdDrawPlate });
}
function rdDrawPlate(m){
  // Tall black slabs with crimson cracks and glow, standing upright (concept-art/villains/redactor.webp).
  const bob=Math.sin(time*2+m.idx)*3;
  ctx.save(); ctx.translate(m.x,m.y-26+bob);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,36-bob,12,4,0,0,PI2); ctx.fill();
  ctx.shadowColor=RD_COL; ctx.shadowBlur=12; ctx.fillStyle=m.flashT>0?'#ffffff':'#0b0a0e'; ctx.strokeStyle=RD_COL; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.rect(-10,-18,20,36); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(224,40,60,.75)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-6,-12); ctx.lineTo(1,-2); ctx.lineTo(-3,6); ctx.moveTo(4,8); ctx.lineTo(7,14); ctx.stroke();
  ctx.restore();
}
// Called by killEnemy when a plate breaks.
function rdPlateBroken(m){
  const e=m.owner; if (!e || e.dead) return;
  if (rdPlates(e).length>0 || e.plateBroke) return;
  e.plateBroke=true;
  texts.push({x:e.x,y:e.y-e.r-40,v:'SHIELD DOWN',t:0,big:true,c:'#ffffff'}); addShake(10);
  if (e.queuedPhase>e.phase){ bossPhaseChange(e); return; } // a queued phase change runs first; no pause
  bossClearOwned(e); e.atk=null; e.mx=e.my=0;
  bossExposed(e,2.0); // normal damage, no bonus multiplier
}

registerBoss({
  id:'redactor', name:'The Redactor', title:'Architect of the drain', color:RD_COL,
  hp:7000, radius:0.9, speed:2.5, shards:60,
  phases:[0.7,0.4],
  parryClass:{ redact_lanes:'super', redact_verdict:'super' },
  sequences:[
    ['lanes','field','lanes'],
    ['stolen','lanes','stolen','field','lanes'],
    ['verdict','stolen','lanes','stolen','field','lanes'],
  ],
  attacks:{
    lanes:  { recovery:0.8, steps:[ RD_LANES ] },
    field:  { recovery:0.7, steps:[ { prim:'placeNull', windup:1.2, radius:4.5, dur:4, src:'redact_null' } ] },
    verdict:{ recovery:1.2, waitFor:rdClearForBigAttack, steps:[
      { prim:'annulus', windup:1.5, active:0.2, rIn:2, rOut:10, gap:65, gaps:2, dmg:24, src:'redact_verdict', pause:0.5 }, RD_LANES ] },
  },
  // 'stolen' entries in the sequence resolve to the next copied power from this run's list.
  resolveAttack(e,id){
    if (id!=='stolen') return null;
    const list=rdStolenList(); if (!list.length) return this.attacks.lanes;
    const src=list[(e.stolenI||0)%list.length]; e.stolenI=(e.stolenI||0)+1;
    const st=RD_STOLEN[src];
    return { label:st.label, stolenFrom:src, recovery:st.recovery*0.75, waitFor:rdClearForBigAttack, steps:st.steps().map(s=>({...s, color:BOSSES[src].color})) };
  },
  onPhaseStart(e){
    rdSpawnPlates(e);
    if (e.phase===3){ const list=rdStolenList(); e.stolenI=Math.max(0,list.indexOf('gravemark')); }
  },
  damageMul(e){ return 1-0.05*rdPlates(e).length; },
  // Moves clockwise between four anchors around the roof.
  reposition(e,dt){
    const A=[[-6,-4],[6,-4],[6,4],[-6,4]], p=player;
    if (e.stateT<dt*1.5){ e.anchorI=((e.anchorI??-1)+1)%4; }
    const t=A[e.anchorI], tx=clamp(ARENA.w/2+t[0]*U,90,ARENA.w-90), ty=clamp(ARENA.h/2+t[1]*U,90,ARENA.h-90), dx=tx-e.x, dy=ty-e.y, d=Math.hypot(dx,dy);
    e.face=Math.atan2(p.y-e.y,p.x-e.x);
    if (d<=0.5*U) return true;
    const sp=this.speed*U*T.enemySpeed; e.mx=dx/d*sp; e.my=dy/d*sp; return false;
  },
  // Plates orbit; they pause while Redaction Lanes or Final Verdict are warning or firing.
  tick(e,dt){
    const paused=e.atk && (e.atk.id==='lanes' || e.atk.id==='verdict') && (e.bstate==='WINDUP'||e.bstate==='ACTIVE');
    if (!paused) e.plateAng=(e.plateAng||0)+(e.phase===1?20:30)*DEG*dt;
    for (const m of rdPlates(e)){ const ang=(e.plateAng||0)+m.idx*PI2/RD_PLATES; m.x=e.x+Math.cos(ang)*RD_PLATE_R*U; m.y=e.y+Math.sin(ang)*RD_PLATE_R*U; }
  },
  intro:{ title:'Architect of the drain', first:"Powers are a privilege, rookie. I decide who keeps them. Tonight, I'm revoking yours.",
    repeat:["You again. Persistence is not a power.","Let's see what's left of you after the edit.","Every hero gets redacted eventually."] },
  quotes:[ "Request denied.", "Your file is closed, rookie.", "Did you really think the city would let you keep that spark?" ],
  cause:{ redact_lanes:'Redaction Lanes', redact_verdict:'the Final Verdict' },
  advice:{
    redact_lanes:[['halo',"His lanes are always a third of a circle apart. Live in the wide gaps between them."]],
    redact_verdict:[['bastion',"Final Verdict gives you two ways out, then a second warning. Read both."]],
  },
  draw(e){
    const white=e.flashT>0, wind=e.bstate==='WINDUP', c=RD_COL;
    const glow=wind?0.5+0.5*clamp(e.stateT/(e.atk?e.atk.windup:1),0,1):e.bstate==='ACTIVE'?1:0.35;
    const stolen=e.atk && e.atk.def && e.atk.def.stolenFrom ? BOSSES[e.atk.def.stolenFrom].color : null;
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(e.x+5,e.y+e.r*0.75,e.r*1.3,e.r*0.55,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(e.x,e.y); if (e.bstate==='EXPOSED') ctx.rotate(Math.sin(time*30)*0.05); ctx.rotate(e.face);
    const s=e.r/45; ctx.scale(s,s);
    // long black coat with white vertical panels and a crimson lining
    ctx.fillStyle=white?'#fff':'#0a0a0e'; ctx.strokeStyle=COL.ink; ctx.lineWidth=4;
    poly([[16,-24],[-6,-34],[-46,-30],[-58,0],[-46,30],[-6,34],[16,24]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle=white?'#fff':c; ctx.globalAlpha=0.75; poly([[-46,-30],[-58,0],[-52,-2],[-42,-24]]); ctx.fill(); poly([[-46,30],[-58,0],[-52,2],[-42,24]]); ctx.fill(); ctx.globalAlpha=1;
    ctx.fillStyle=white?'#fff':'#ddd6c6'; ctx.fillRect(-40,-14,40,6); ctx.fillRect(-40,8,40,6);
    // broad squared shoulders
    ctx.fillStyle=white?'#fff':'#141418'; for (const sd of [-1,1]){ ctx.beginPath(); ctx.rect(-12,sd*24-8,26,16); ctx.fill(); ctx.stroke(); }
    // hands: the right one holds a crimson cube of stolen power (tinted with the power he's using)
    ctx.fillStyle=white?'#fff':'#e8e2d4'; ctx.beginPath(); ctx.arc(14,-30,5,0,PI2); ctx.fill(); ctx.stroke();
    const oc=stolen||c; ctx.save(); ctx.translate(20,32); ctx.rotate(time*2); ctx.shadowColor=oc; ctx.shadowBlur=14+18*glow;
    ctx.fillStyle=oc; ctx.fillRect(-7-2*glow,-7-2*glow,14+4*glow,14+4*glow); ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; ctx.strokeRect(-4,-4,8,8); ctx.restore();
    // tall rectangular ivory mask with a single crimson eye-slit
    ctx.fillStyle=white?'#fff':'#ece6d6'; ctx.beginPath(); ctx.rect(-10,-11,30,22); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=8+10*glow; ctx.fillRect(14,-9,4,8); ctx.shadowBlur=0;
    ctx.restore();
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+24,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
