// Volt: Kilnheart, heat and pressure (docs/boss-gameplay-spec.md §1). Close-range bruiser with generous punish windows.
'use strict';

// Punch: creeps in while aim tracks, then lunges 1 unit into a 3.5-unit sector (same 4.5-unit total reach as the spec).
const KILN_PUNCH = { prim:'sector', windup:0.85, active:0.15, arc:70, radius:3.5, lunge:1.0, creep:1.2, dmg:20, knock:1.5, src:'kiln_punch' };
// Phase 2+: the punched sector stays heated for 3s. Only one heated sector at a time.
function kilnHeat(e,a){
  bossHazards=bossHazards.filter(h=>!(h.owner===e && h.src==='kiln_heat'));
  const ap=sectorApex(a);
  bossHazards.push({ owner:e, src:'kiln_heat', shape:'sector', x:ap.x, y:ap.y, aim:a.aim, arc:KILN_PUNCH.arc*DEG, radius:KILN_PUNCH.radius*U,
    t:0, arm:0.1, dur:3, every:0.75, tick:0, dmg:6, c:'#ff7a1a', fill:'#ff5a1a' });
}

registerBoss({
  id:'kilnheart', name:'Kilnheart', title:'Heat and pressure', color:'#ff7a1a',
  hp:1800, radius:0.9, speed:2.8, shards:30,
  phases:[0.6,0.3],
  parryClass:{ kiln_punch:'parry', kiln_rush:'parry', kiln_shot:'parry', kiln_slam:'super', kiln_heat:'super', kiln_erupt:'super' },
  sequences:[
    ['punch','punch','rush'],
    ['punchHot','erupt','slam','rush'],
    ['punchHot','erupt','rush','slam','double'],
  ],
  attacks:{
    punch:    { recovery:1.1, steps:[ KILN_PUNCH ] },
    punchHot: { recovery:1.1, steps:[ {...KILN_PUNCH, after:kilnHeat} ] },
    rush:     { recovery:1.4, vent:true, steps:[ { prim:'charge', windup:1.1, creep:-0.9, width:2.0, length:9, speed:12, dmg:24, src:'kiln_rush' } ] },
    slam:     { recovery:1.3, vent:true, steps:[ { prim:'selfDisk', windup:1.0, active:0.15, radius:3.2, dmg:22, src:'kiln_slam',
                  shots:{ n:8, speed:6, r:0.18, dmg:12, src:'kiln_shot' } } ] },
    // Phase 2+: the floor splits open under Volt. Can't be parried: read the circles and move.
    erupt:    { label:'Eruption', recovery:1.0, steps:[ { prim:'disks', windup:1.0, active:0.15, n:3, radius:1.5, spread:2.6, dmg:18, src:'kiln_erupt' } ] },
    double:   { recovery:1.5, steps:[ {...KILN_PUNCH, dmg:18}, {...KILN_PUNCH, windup:0.75, dmg:18, after:kilnHeat} ] },
  },
  // Between attacks: close to 3 units of Volt, then stop. She doesn't chase through wind-up or recovery.
  reposition(e,dt){
    const p=player, dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, sp=this.speed*U*T.enemySpeed;
    if (e.stateT<dt*1.5){ e.strafeDir=Math.random()<.5?-1:1; e.strafeFor=rand(0.35,0.75); }
    e.face=Math.atan2(dy,dx);
    const nx=-dy/d*e.strafeDir, ny=dx/d*e.strafeDir;
    if (d>3*U+e.r){ e.mx=(dx/d+nx*0.35)*sp; e.my=(dy/d+ny*0.35)*sp; e.walkT=(e.walkT||0)+sp*dt; return false; }
    // In range: shuffle sideways around Volt for a beat before committing.
    if (e.stateT<e.strafeFor){ e.mx=nx*sp*0.8; e.my=ny*sp*0.8; e.walkT=(e.walkT||0)+sp*dt; return false; }
    return true;
  },
  intro:{ first:"Feel that heat? That's the city's pressure, and I'm the valve. Step closer, rookie.",
    repeat:["Back for another burn?","The furnace never cools. Neither do I.","You again? I'll stoke the fire."] },
  quotes:[
    "You call that heat? I've had kettles put up more of a fight.",
    "Pressure finds every crack, rookie. You're all cracks.",
    "Run back to your Fortress. Tell them the furnace is still lit.",
  ],
  cause:{ kiln_erupt:"Kilnheart's Eruption", kiln_punch:"Kilnheart's Furnace Punch", kiln_rush:"Kilnheart's Boiler Rush", kiln_slam:"Kilnheart's Pressure Slam", kiln_shot:"a Pressure Slam ember", kiln_heat:"Kilnheart's heated floor" },
  advice:{
    kiln_punch:[['bastion',"Kilnheart telegraphs every punch. When the white ring closes, block it and make her pay."]],
    kiln_rush:[['echo',"She charges in a straight line. Step sideways, not backwards. Or parry it and watch her fold."]],
    kiln_slam:[['halo',"Get out of the disk first, then thread between the embers. Or knock the embers back at her."]],
    kiln_shot:[['halo',"Those embers can be parried. Send them back where they came from."]],
    kiln_heat:[['thorn',"Don't fight on scorched ground. Pull her somewhere cooler."]],
  },
  draw(e){
    const white=e.flashT>0, wind=e.bstate==='WINDUP', act=e.bstate==='ACTIVE', ex=e.bstate==='EXPOSED';
    const glow=wind?0.6+0.4*clamp(e.stateT/(e.atk?e.atk.windup:1),0,1):act?1:e.vent>0?0.8+0.2*Math.sin(time*30):0.45;
    const armour=white?'#ffffff':'#2a2321', plate=white?'#e8e8e8':'#3a302c', fire='#ff7a1a';
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(e.x+6,e.y+e.r*0.75,e.r*1.35,e.r*0.6,0,0,PI2); ctx.fill();
    const moving=Math.hypot(e.mx,e.my)>5, stride=Math.sin((e.walkT||0)/22);
    const heave = wind && e.atk && e.atk.step.prim==='selfDisk' ? clamp(e.stateT/e.atk.windup,0,1) : 0;
    if (moving && Math.abs(stride)>0.97 && Math.random()<0.5){ for (let i=0;i<3;i++) particles.push({x:e.x+rand(-20,20),y:e.y+e.r*0.6,vx:rand(-60,60),vy:rand(-30,10),life:.3,max:.3,color:'#4a4e5a',w:3}); }
    ctx.save(); ctx.translate(e.x,e.y-heave*18+(moving?Math.abs(stride)*-3:0)); if (ex) ctx.rotate(Math.sin(time*30)*0.05); ctx.rotate(e.face+(moving?stride*0.06:0));
    const s=e.r/45*(1+heave*0.12); ctx.scale(s,s);
    const lean=wind && e.atk && e.atk.step.prim==='sector' ? -6*clamp(e.stateT/e.atk.windup,0,1) : act ? 8 : 0;
    // legs and broad armoured body
    ctx.fillStyle=plate; ctx.strokeStyle=COL.ink; ctx.lineWidth=4;
    const st=moving?stride*10:0; // legs step alternately while walking
    ctx.beginPath(); ctx.roundRect(-34+st,-30,26,22,6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-34-st,8,26,22,6); ctx.fill(); ctx.stroke();
    poly([[-30,-26],[-46,-14],[-46,14],[-30,26],[-14,30],[-14,-30]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle=armour; poly([[24,-30],[10,-42],[-22,-40],[-34,-20],[-34,20],[-22,40],[10,42],[24,30]]); ctx.fill(); ctx.stroke();
    // chest furnace vents: brighter on wind-up, wide open (flickering) during the punish window
    ctx.shadowColor=fire; ctx.shadowBlur=10+20*glow;
    for (let i=0;i<3;i++){ const y=-14+i*9; ctx.fillStyle=`rgba(255,${120+80*glow|0},40,${0.35+0.65*glow})`; ctx.fillRect(-4,y-2,20,4); ctx.fillRect(-4,-y-2,20,4); }
    ctx.shadowBlur=0;
    // gauntlets: huge forearms with glowing slits
    for (const sd of [-1,1]){
      const fx0=14+lean*(sd>0?1:0.4), fy=40*sd;
      ctx.fillStyle=plate; ctx.beginPath(); ctx.roundRect(fx0-14,fy-14,36,28,8); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=4; ctx.stroke();
      ctx.fillStyle=`rgba(255,140,40,${0.4+0.6*glow})`; ctx.shadowColor=fire; ctx.shadowBlur=8+16*glow;
      for (let j=0;j<3;j++) ctx.fillRect(fx0-6+j*9,fy-9,4,18);
      ctx.shadowBlur=0;
      if (glow>0.7 && Math.random()<0.3) particles.push({x:e.x+rand(-30,30),y:e.y+rand(-30,30),vx:rand(-30,30),vy:rand(-120,-40),life:.4,max:.4,color:fire,w:2});
    }
    // head: topknot behind, glowing visor in front
    ctx.fillStyle='#14100f'; ctx.beginPath(); ctx.arc(4,0,13,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath(); ctx.arc(-10,0,6,0,PI2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle=fire; ctx.lineWidth=4; ctx.shadowColor=fire; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(4,0,10,-0.8,0.8); ctx.stroke(); ctx.shadowBlur=0;
    ctx.restore();
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=fire; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+14,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
