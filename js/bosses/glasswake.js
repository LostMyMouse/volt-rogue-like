// Volt: Glasswake, refraction and hard-light deception (docs/boss-gameplay-spec.md §4). An agile trickster:
// beam lanes, warned teleports, decoys that also fire. The real one always shows the same tells.
'use strict';

const GW_STEP = { prim:'step', windup:1.0, active:0.15, radius:2.0, minD:5, maxD:8, dmg:16, src:'glass_step' };

// Mirrors orbiting a Glasswake figure. Real: counter-clockwise, solid white ground ring. Decoy: clockwise, broken outline.
function drawGlassFigure(e, decoy){
  const c='#ff3f9a', white=e.flashT>0, spin=(decoy?1:-1)*time*1.6;
  // identity ring on the ground (never colour alone: solid vs broken)
  ctx.save(); ctx.lineWidth=3; ctx.strokeStyle=decoy?c:'#ffffff'; if (decoy) ctx.setLineDash([7,7]);
  ctx.globalAlpha=0.9; ctx.beginPath(); ctx.ellipse(e.x,e.y+e.r*0.7,e.r*1.5,e.r*0.6,0,0,PI2); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(e.x,e.y); if (e.bstate==='EXPOSED') ctx.rotate(Math.sin(time*30)*0.07); ctx.rotate(e.face||0);
  const s=e.r/30; ctx.scale(s,s);
  ctx.globalAlpha=decoy?0.75:1;
  // body: slim black-and-grey suit, white hair, visor
  ctx.fillStyle=white?'#fff':'#26242c'; ctx.strokeStyle=COL.ink; ctx.lineWidth=3;
  poly([[12,-10],[0,-14],[-12,-9],[-14,0],[-12,9],[0,14],[12,10]]); ctx.fill(); ctx.stroke();
  ctx.fillStyle=white?'#fff':'#7a7a86'; poly([[8,-6],[-8,-2],[-8,2],[8,6]]); ctx.fill();
  // crystal blades on the forearms
  ctx.fillStyle=c; ctx.globalAlpha*=0.85; for (const sd of [-1,1]){ poly([[10,sd*14],[30,sd*18],[12,sd*20]]); ctx.fill(); ctx.stroke(); } ctx.globalAlpha=decoy?0.75:1;
  ctx.fillStyle='#e8e8f0'; ctx.beginPath(); ctx.arc(2,0,8,0,PI2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=COL.ink; ctx.fillRect(4,-6,5,12);
  ctx.restore();
  // three hard-light mirrors orbiting close to the body
  for (let i=0;i<3;i++){ const ang=spin+i*PI2/3, R=e.r+16, x=e.x+Math.cos(ang)*R, y=e.y-8+Math.sin(ang)*R*0.6;
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang+Math.PI/2); ctx.globalAlpha=decoy?0.6:0.85;
    ctx.fillStyle='rgba(255,63,154,.25)'; ctx.strokeStyle=c; ctx.lineWidth=2; ctx.shadowColor=c; ctx.shadowBlur=10;
    poly([[0,-10],[8,7],[-8,7]]); ctx.fill(); ctx.stroke(); ctx.restore(); }
}

registerBoss({
  id:'glasswake', name:'Glasswake', title:'Refraction and hard light', color:'#ff3f9a',
  hp:2000, radius:0.6, speed:3.4, shards:30,
  phases:[0.6,0.3],
  parryClass:{ glass_lunge:'parry', glass_lanes:'super', glass_step:'super', glass_refract:'super' },
  sequences:[
    ['lanes','lunge','step','lanes'],
    ['refract','lunge','step','lanes'],
    ['refract','lunge','lanes','double'],
  ],
  attacks:{
    lanes:  { recovery:1.0, steps:[ { prim:'beams', windup:1.0, active:0.35, angles:[-35,0,35], length:12, width:0.65, dmg:18, src:'glass_lanes' } ] },
    step:   { recovery:1.1, steps:[ GW_STEP ] },
    double: { recovery:1.5, steps:[ {...GW_STEP, pause:0.4}, {...GW_STEP, windup:0.9} ] },
    lunge:  { recovery:1.0, steps:[ { prim:'charge', windup:0.7, width:1.2, length:4, speed:14, endSlash:1.0, dmg:16, src:'glass_lunge' } ] },
    refract:{ recovery:1.2, steps:[ { prim:'refract', windup:1.2, decoys:2, offset:4, spread:110, warn:1.0, fire:0.3, length:10, width:0.65, dmg:14, src:'glass_refract' } ] },
  },
  // Keeps 4-6 units from Volt, drifting sideways when in range.
  reposition(e,dt){
    const p=player, dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, sp=this.speed*U*T.enemySpeed;
    e.face=Math.atan2(dy,dx);
    if (e.stateT<dt*1.5){ e.strafeDir=Math.random()<.5?-1:1; }
    if (d<4*U){ e.mx=-dx/d*sp; e.my=-dy/d*sp; return false; }
    if (d>6*U){ e.mx=dx/d*sp; e.my=dy/d*sp; return false; }
    if (e.stateT<0.5){ e.mx=-dy/d*sp*0.7*e.strafeDir; e.my=dx/d*sp*0.7*e.strafeDir; return false; }
    return true;
  },
  intro:{ title:'Refraction and hard light', first:"Which one of me are you looking at? Doesn't matter. You'll be wrong either way.",
    repeat:["Seen through me yet? No? Thought not.","Same trick, rookie. Still works.","Mirror, mirror. Who falls first?"] },
  quotes:[
    "You hit my reflection three times. Flattering, really.",
    "Easy to beat someone who can't see straight.",
    "Next time, look before you leap. Or don't. I enjoy this.",
  ],
  cause:{ glass_lanes:"Glasswake's Prism Lanes", glass_step:"a Mirror Step", glass_refract:'a refracted beam', glass_lunge:"Glasswake's Shard Lunge" },
  advice:{
    glass_lanes:[['halo',"Three beams, always the same spread. Stand between them, or behind her."]],
    glass_step:[['bastion',"She shows you where she's landing. Don't be standing there."]],
    glass_refract:[['echo',"The real one has the solid white ring. Hit the decoys and their beams vanish, but every warned beam still hurts."]],
    glass_lunge:[['bastion',"Only the real Glasswake lunges. Parry it and her glass cracks."]],
  },
  draw(e){
    drawGlassFigure(e,false);
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=this.color; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+22,0,PI2); ctx.stroke(); ctx.restore(); }
  },
  drawDecoy(d){ drawGlassFigure(d,true); },
});
