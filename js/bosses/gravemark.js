// Volt: Gravemark, gravity manipulation (docs/boss-gameplay-spec.md §6). A heavy controller: pull wells,
// orbiting rubble, a rock cannon and a collapsing ring with one safe sector. Guards rooftops 10 and 15 in the slice.
'use strict';

const GM_DRIVER = { prim:'lane', windup:1.0, width:1.4, speed:9, dmg:24, knock:1.5, src:'gm_driver', kind:'rock' };
const gmWell = e => bossHazards.some(h=>h.owner===e && h.kind==='well');

registerBoss({
  id:'gravemark', name:'Gravemark', title:'Stone and gravity', color:'#b56cff',
  hp:2850, radius:1.0, speed:2.0, shards:40,
  phases:[0.6,0.3],
  parryClass:{ gm_driver:'parry', gm_rubble:'parry', gm_well:'super', gm_collapse:'super' },
  sequences:[
    ['well','driver','orbit'],
    ['well','driver','collapse','orbit'],
    ['well','double','orbit6','collapse'],
  ],
  attacks:{
    well:    { recovery:0.8, steps:[ { prim:'placeWell', windup:1.0, radius:3.5, inner:1.2, dur:4, charge:0.8, pull:1.5, dmg:20, src:'gm_well' } ] },
    driver:  { recovery:1.2, vent:true, steps:[ GM_DRIVER ] },
    double:  { recovery:1.5, vent:true, steps:[ {...GM_DRIVER, dmg:20, pause:0.35}, {...GM_DRIVER, windup:0.85, dmg:20} ] },
    // The well never overlaps Orbit or Collapse: wait for it to finish first.
    orbit:   { recovery:1.1, waitFor:gmWell, steps:[ { prim:'orbit', windup:1.1, n:5, radius:3.2, r:0.35, spin:90, hold:2.4, speed:7, life:2, dmg:14, src:'gm_rubble' } ] },
    orbit6:  { recovery:1.1, waitFor:gmWell, steps:[ { prim:'orbit', windup:1.1, n:6, radius:3.2, r:0.35, spin:90, hold:2.4, speed:7, life:2, dmg:14, src:'gm_rubble' } ] },
    collapse:{ recovery:1.3, waitFor:gmWell, steps:[ { prim:'annulus', windup:1.2, active:0.2, rIn:2.0, rOut:7.0, gap:80, dmg:22, src:'gm_collapse' } ] },
  },
  // Prefers the centre of the roof.
  reposition(e,dt){
    const cx=ARENA.w/2, cy=ARENA.h/2, dx=cx-e.x, dy=cy-e.y, d=Math.hypot(dx,dy), p=player;
    e.face=Math.atan2(p.y-e.y,p.x-e.x);
    if (d<=2*U) return true;
    const sp=this.speed*U*T.enemySpeed; e.mx=dx/d*sp; e.my=dy/d*sp;
    return false;
  },
  intro:{ title:'Stone and gravity', first:"Another rookie on my roof. I'll carve your name next to the others.",
    repeat:["The stone remembers you.","Every fall makes you lighter. Every stone makes me heavier.","Back again? Then stay down this time."] },
  quotes:[
    "Is this what the Fortress sends now? I've crushed sturdier gravel.",
    "Little spark. You flickered, and then you went out.",
    "Run home to your heroes. Tell them Gravemark sends its regards.",
    "The roof will remember you. As a stain.",
  ],
  cause:{ gm_driver:"Gravemark's Mass Driver", gm_rubble:'orbiting grave-rubble', gm_well:"a Gravity Well detonation", gm_collapse:"Gravemark's Collapse Ring" },
  advice:{
    gm_driver:[['bastion',"That rock cannon telegraphs a straight lane. Parry the rock and it goes right back at Gravemark."]],
    gm_rubble:[['echo',"The rubble circles before it flies. Stay outside the orbit, then slip between the spokes."]],
    gm_well:[['halo',"The pull is weak. Walk against it, or dash out before the centre detonates."]],
    gm_collapse:[['thorn',"The ring always leaves one way out, and it points at where you stood. Or hug Gravemark: the middle is safe."]],
  },
  draw(e){
    // Reuses the stone-golem drawing; map framework states onto its pose inputs.
    const w=e.bstate==='WINDUP';
    e.spin=time*0.9; e.state = w ? 'slamWind' : e.bstate==='EXPOSED' ? 'stagger' : 'walk';
    e.windDur = e.atk && e.atk.windup || 1; e.timer = w ? Math.max(0,e.atk.windup-e.stateT) : 0;
    VECTOR.gravemark(e);
    if (e.vent>0){ ctx.save(); ctx.strokeStyle=this.color; ctx.globalAlpha=0.5+0.4*Math.sin(time*25); ctx.lineWidth=3; ctx.beginPath(); ctx.arc(e.x+Math.cos(e.face-0.9)*e.r*0.9,e.y+Math.sin(e.face-0.9)*e.r*0.9,14,0,PI2); ctx.stroke(); ctx.restore(); }
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=this.color; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+20,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
