// Volt: Bellwether, sonic force (docs/boss-gameplay-spec.md §2). A rhythmic arena-control fight: walk into
// the gaps of expanding rings, parry her Focused Burst back at her.
'use strict';

const BW_RING = { prim:'ring', windup:1.0, r0:1.5, rMax:14, speed:4, thick:0.6, gaps:2, gap:50, dmg:16, src:'bell_ring' };

registerBoss({
  id:'bellwether', name:'Bellwether', title:'Sonic force', color:'#f5b915',
  hp:2000, radius:0.8, speed:2.6, shards:30,
  phases:[0.6,0.3],
  parryClass:{ bell_burst:'parry', bell_ring:'super', bell_drop:'super' },
  sequences:[
    ['ring','burst','ring'],
    ['ring','drop','burst','twin'],
    ['twin','burst','drop','turning'],
  ],
  attacks:{
    ring:   { recovery:0.8, steps:[ BW_RING ] },
    twin:   { recovery:0.8, steps:[ {...BW_RING, count:2, every:1.4, dmg:14} ] },
    turning:{ recovery:0.8, steps:[ {...BW_RING, windup:1.0, gap:60, rotate:18} ] },
    burst:  { recovery:1.1, vent:true, steps:[ { prim:'sector', windup:0.8, active:0.2, arc:40, radius:10, dmg:20, knock:1, src:'bell_burst' } ] },
    drop:   { recovery:1.0, steps:[ { prim:'disks', windup:1.0, active:0.15, n:2, radius:1.5, spread:4, dmg:18, src:'bell_drop' } ] },
  },
  // Holds the centre of the roof; if Volt is standing there, keeps 2 units away.
  reposition(e,dt){
    const p=player, cx=ARENA.w/2, cy=ARENA.h/2, pd=Math.hypot(p.x-cx,p.y-cy);
    let tx=cx, ty=cy;
    if (pd<2*U){ const a=Math.atan2(cy-p.y,cx-p.x)||0; tx=p.x+Math.cos(a)*2*U; ty=p.y+Math.sin(a)*2*U; }
    const dx=tx-e.x, dy=ty-e.y, d=Math.hypot(dx,dy);
    e.face=Math.atan2(p.y-e.y,p.x-e.x);
    if (d<=1*U) return true;
    const sp=this.speed*U*T.enemySpeed; e.mx=dx/d*sp; e.my=dy/d*sp; e.walkT=(e.walkT||0)+sp*dt;
    return false;
  },
  intro:{ title:'Sonic force', first:"Hear that? That's the whole city humming my song. You're just a wrong note.",
    repeat:["Encore? Fine. Try to keep the beat this time.","Same stage, same rookie. Let's turn it up.","Feel the bass, Volt. Then fall to it."] },
  quotes:[
    "Off-beat from start to finish. Painful to listen to.",
    "You never found the gaps. Everyone finds the gaps.",
    "That's a wrap, rookie. No encore for you.",
  ],
  cause:{ bell_ring:"Bellwether's Broken Ring", bell_burst:"Bellwether's Focused Burst", bell_drop:"a Resonator Drop" },
  advice:{
    bell_ring:[['echo',"Her rings always have gaps, and they line up before they fire. Walk into one and let the sound pass."]],
    bell_burst:[['bastion',"Focused Burst is a straight cone with a glint. Parry it and her speakers choke."]],
    bell_drop:[['thorn',"The resonators mark the ground first. Two spots, never more. Step off them."]],
  },
  draw(e){
    const white=e.flashT>0, wind=e.bstate==='WINDUP', act=e.bstate==='ACTIVE', gold=this.color;
    const pulse=wind?0.5+0.5*clamp(e.stateT/(e.atk?e.atk.windup:1),0,1):act?1:e.vent>0?0.85+0.15*Math.sin(time*30):0.4;
    const moving=Math.hypot(e.mx,e.my)>5, stride=Math.sin((e.walkT||0)/18);
    ctx.fillStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(e.x+5,e.y+e.r*0.75,e.r*1.4,e.r*0.55,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(e.x,e.y+(moving?-Math.abs(stride)*2:0)); if (e.bstate==='EXPOSED') ctx.rotate(Math.sin(time*30)*0.06); ctx.rotate(e.face);
    const s=e.r/40; ctx.scale(s,s);
    // wide black cargo pants (legs), torso, arms
    ctx.fillStyle=white?'#fff':'#1a1a1f'; ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5;
    const st=moving?stride*8:0; ctx.beginPath(); ctx.ellipse(-14+st,-12,14,11,0,0,PI2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-14-st,12,14,11,0,0,PI2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=white?'#fff':'#2c2c33'; poly([[14,-16],[2,-24],[-12,-20],[-16,0],[-12,20],[2,24],[14,16]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle=gold; ctx.fillRect(-10,-3,20,6);
    // back-mounted speaker pods
    for (const sd of [-1,1]){ ctx.fillStyle=white?'#fff':'#3a3530'; ctx.beginPath(); ctx.roundRect(-30,sd*30-12,22,24,8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle=gold; ctx.lineWidth=3; ctx.shadowColor=gold; ctx.shadowBlur=8*pulse; ctx.beginPath(); ctx.arc(-19,sd*30,7,0,PI2); ctx.stroke(); ctx.shadowBlur=0; ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; }
    // speaker gauntlets: cones that pulse with each beat and hang open after a Burst
    const open=e.vent>0?1:0;
    for (const sd of [-1,1]){
      const gx=16+(act?8:0), gy=sd*28;
      ctx.fillStyle=white?'#fff':'#2a2620'; ctx.beginPath(); ctx.arc(gx,gy,13+open*2,0,PI2); ctx.fill(); ctx.stroke();
      ctx.fillStyle=gold; ctx.globalAlpha=0.5+0.5*pulse; ctx.shadowColor=gold; ctx.shadowBlur=10+18*pulse; ctx.beginPath(); ctx.arc(gx,gy,8+3*pulse,0,PI2); ctx.fill(); ctx.shadowBlur=0; ctx.globalAlpha=1;
      ctx.fillStyle=COL.ink; ctx.beginPath(); ctx.arc(gx,gy,3,0,PI2); ctx.fill();
      if (pulse>0.6){ ctx.strokeStyle=gold; ctx.globalAlpha=0.4; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(gx,gy,18+((time*60)%14),-1,1); ctx.stroke(); ctx.globalAlpha=1; ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; }
    }
    // head: short hair, gold earrings
    ctx.fillStyle=white?'#fff':'#5a3a28'; ctx.beginPath(); ctx.arc(4,0,9,0,PI2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#14100f'; ctx.beginPath(); ctx.arc(0,0,8,Math.PI*0.6,Math.PI*1.4); ctx.fill();
    ctx.fillStyle=gold; ctx.beginPath(); ctx.arc(5,-9,2.4,0,PI2); ctx.arc(5,9,2.4,0,PI2); ctx.fill();
    ctx.restore();
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=gold; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+18,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
