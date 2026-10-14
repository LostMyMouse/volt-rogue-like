// Volt: Undertow, water pressure and ice (docs/boss-gameplay-spec.md §5). A bulky controller who reshapes the
// roof: sweeping jets, breakable ice walls with a gap, slowing depth charges, and a parryable Glacier Hook.
'use strict';

const UT_CHARGE = { prim:'disks', windup:1.0, active:0.15, n:1, radius:2.3, spread:0, dmg:20, slow:1.5, src:'under_charge' };
const UT_JET = { prim:'jet', windup:1.0, length:10, width:1.0, sweep:60, sweepT:1.2, dmg:16, slow:1.5, src:'under_jet' };

registerBoss({
  id:'undertow', name:'Undertow', title:'Water pressure and ice', color:'#7fd8ff',
  hp:2500, radius:1.0, speed:2.1, shards:30,
  phases:[0.6,0.3],
  parryClass:{ under_hook:'parry', under_jet:'super', under_charge:'super' },
  sequences:[
    ['jet','hook','charge','jet'],
    ['divide','hook','charge','jet'],
    ['divide','hook','double','jet90'],
  ],
  attacks:{
    jet:    { recovery:1.0, steps:[ UT_JET ] },
    jet90:  { recovery:1.0, steps:[ {...UT_JET, sweep:90, sweepT:1.5} ] },
    hook:   { recovery:1.2, vent:true, steps:[ { prim:'sector', windup:0.9, active:0.15, arc:90, radius:3.0, lunge:1.0, creep:0.6, dmg:20, knock:1.5, src:'under_hook' } ] },
    charge: { recovery:1.2, steps:[ UT_CHARGE ] },
    double: { recovery:1.4, steps:[ {...UT_CHARGE, dmg:18, pause:0.4}, {...UT_CHARGE, dmg:18} ] },
    divide: { recovery:0.8, steps:[ { prim:'iceWall', windup:1.2, seg:3, thick:0.7, gap:3, ahead:4, hp:40, dur:5, src:'under_ice' } ] },
  },
  // Approaches to 4 units, then stops.
  reposition(e,dt){
    const p=player, dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, sp=this.speed*U*T.enemySpeed;
    e.face=Math.atan2(dy,dx);
    if (d<=4*U+e.r) return true;
    e.mx=dx/d*sp; e.my=dy/d*sp; e.walkT=(e.walkT||0)+sp*dt; return false;
  },
  intro:{ title:'Water pressure and ice', first:"The tide always comes in, rookie. Stand still and it'll take you with it.",
    repeat:["Back in the water? Brave. Or stupid.","Pressure builds. It always breaks something.","Let's see how long you can hold your breath."] },
  quotes:[
    "Washed out. Like I said you would be.",
    "Cold, isn't it? You'll get used to it at the bottom.",
    "The docks keep what they catch.",
  ],
  cause:{ under_jet:"Undertow's Pressure Jet", under_charge:'a Depth Charge', under_hook:"Undertow's Glacier Hook" },
  advice:{
    under_jet:[['echo',"The jet shows its whole sweep before it fires. Get behind him or outside the arc. Ice blocks it too."]],
    under_charge:[['halo',"Depth Charges slow you. Leave the circle early: getting hit while slow snowballs."]],
    under_hook:[['bastion',"The hook has a white tell. Parry it and his gauntlet cracks wide open."]],
  },
  draw(e){
    const white=e.flashT>0, wind=e.bstate==='WINDUP', c=this.color, moving=Math.hypot(e.mx,e.my)>5, stride=Math.sin((e.walkT||0)/24);
    const glow=wind?0.5+0.5*clamp(e.stateT/(e.atk?e.atk.windup:1),0,1):e.bstate==='ACTIVE'?1:e.vent>0?0.85:0.45;
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(e.x+6,e.y+e.r*0.75,e.r*1.4,e.r*0.6,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(e.x,e.y+(moving?-Math.abs(stride)*3:0)); if (e.bstate==='EXPOSED') ctx.rotate(Math.sin(time*30)*0.05); ctx.rotate(e.face);
    const s=e.r/50; ctx.scale(s,s);
    // heavy diving suit: boots, bulky torso, back tanks with glowing water
    ctx.fillStyle=white?'#fff':'#262c38'; ctx.strokeStyle=COL.ink; ctx.lineWidth=4;
    const st=moving?stride*10:0; ctx.beginPath(); ctx.roundRect(-36+st,-34,30,24,8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-36-st,10,30,24,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle=white?'#fff':'#323a4a'; ctx.beginPath(); ctx.ellipse(-2,0,30,36,0,0,PI2); ctx.fill(); ctx.stroke();
    for (const sd of [-1,1]){ ctx.fillStyle=white?'#fff':'#1d2430'; ctx.beginPath(); ctx.arc(-24,sd*22,13,0,PI2); ctx.fill(); ctx.stroke();
      ctx.fillStyle=c; ctx.globalAlpha=0.5+0.4*glow; ctx.shadowColor=c; ctx.shadowBlur=12*glow; ctx.beginPath(); ctx.arc(-24,sd*22,8,0,PI2); ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1; }
    // hoses
    ctx.strokeStyle=COL.ink; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-24,-14); ctx.quadraticCurveTo(-6,-26,6,-30); ctx.moveTo(-24,14); ctx.quadraticCurveTo(-6,26,6,30); ctx.stroke();
    // ice gauntlets: huge crystal fists (the hook fist cracks open during recovery)
    const lean=wind && e.atk && e.atk.step.prim==='sector' ? -8*glow : e.bstate==='ACTIVE'?10:0;
    for (const sd of [-1,1]){ const gx=22+(sd>0?lean:0), gy=sd*38;
      ctx.fillStyle=white?'#fff':'rgba(190,240,255,.85)'; ctx.strokeStyle='#e8fbff'; ctx.lineWidth=2; ctx.shadowColor=c; ctx.shadowBlur=8+10*glow;
      poly([[gx+16,gy],[gx+6,gy-15],[gx-12,gy-12],[gx-16,gy+2],[gx-8,gy+15],[gx+8,gy+13]]); ctx.fill(); ctx.stroke(); ctx.shadowBlur=0;
      ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
      if (e.vent>0 && sd>0){ ctx.strokeStyle='rgba(4,7,14,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(gx-6,gy-10); ctx.lineTo(gx+2,gy); ctx.lineTo(gx-4,gy+10); ctx.stroke(); } }
    // head with dark hair, porthole collar
    ctx.fillStyle=white?'#fff':'#4a3a30'; ctx.beginPath(); ctx.arc(8,0,12,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.fillStyle='#14100f'; ctx.beginPath(); ctx.arc(4,0,11,Math.PI*0.55,Math.PI*1.45); ctx.fill();
    ctx.restore();
    if (moving && Math.random()<0.3) particles.push({x:e.x+rand(-20,20),y:e.y+e.r*0.6,vx:rand(-40,40),vy:rand(-40,0),life:.3,max:.3,color:c,w:2});
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+20,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
