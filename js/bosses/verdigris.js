// Volt: Verdigris, living metal and toxic growth (docs/boss-gameplay-spec.md §3). A patient zoning boss:
// acid pools eat the roof, a parryable vine sweep, and buds you can break before they fire.
'use strict';

const VG_POOL_CAP = 3;
// Corrosive Seed leaves an acid pool on each impact. At most three; the oldest fades out first.
function verdPools(e,a){
  for (const sp of diskSpots(a)){
    const mine=bossHazards.filter(h=>h.owner===e && h.src==='verd_acid' && !h.fading);
    if (mine.length>=VG_POOL_CAP){ const old=mine[0]; old.fading=true; old.t=Math.max(old.t,old.dur-0.4); }
    bossHazards.push({ owner:e, src:'verd_acid', shape:'disk', x:sp.x, y:sp.y, radius:a.step.radius*U, t:0, arm:0.15, dur:a.step.poolDur||5, every:0.75, tick:0, dmg:6, shared:true, c:'#b8e62e', fill:'#7fa318' });
  }
}
const VG_SEED = { prim:'disks', windup:0.9, active:0.15, n:1, radius:1.6, spread:0, dmg:14, src:'verd_seed', after:verdPools };

registerBoss({
  id:'verdigris', name:'Verdigris', title:'Living metal and toxic growth', color:'#b8e62e',
  hp:2200, radius:0.7, speed:2.4, shards:30,
  phases:[0.6,0.3],
  parryClass:{ verd_vine:'parry', verd_thorn:'parry', verd_seed:'super', verd_acid:'super' },
  sequences:[
    ['seed','vine','seed'],
    ['seed','thorns','vine','seed'],
    ['twin','vine','thorns','twin','vine'],
  ],
  attacks:{
    seed:  { recovery:0.8, steps:[ VG_SEED ] },
    twin:  { recovery:0.8, steps:[ {...VG_SEED, windup:1.1, n:2, spread:3.8} ] },
    vine:  { recovery:1.1, steps:[ { prim:'sector', windup:0.9, active:0.2, arc:100, radius:6, dmg:18, knock:1, src:'verd_vine' } ] },
    thorns:{ recovery:0.9, steps:[ { prim:'buds', windup:1.2, n:3, dist:3, hp:20, grow:1.5, lock:0.4, fan:[-15,0,15], speed:7, dmg:10, src:'verd_thorn' } ] },
  },
  // Keeps 5-7 units from Volt: backs off when crowded, closes in when far.
  reposition(e,dt){
    const p=player, dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, sp=this.speed*U*T.enemySpeed;
    e.face=Math.atan2(dy,dx);
    if (d<5*U){ e.mx=-dx/d*sp; e.my=-dy/d*sp; e.walkT=(e.walkT||0)+sp*dt; return false; }
    if (d>7*U){ e.mx=dx/d*sp; e.my=dy/d*sp; e.walkT=(e.walkT||0)+sp*dt; return false; }
    return true;
  },
  intro:{ title:'Living metal and toxic growth', first:"Rust always wins, rookie. Every roof in this city is already mine. It just doesn't know it yet.",
    repeat:["Back to feed the garden?","Everything you build, I grow through.","Mind your step. The roof is hungry."] },
  quotes:[
    "Compost. That's all you'll be.",
    "You let my garden grow. Shame.",
    "Rust takes everything eventually. You just went first.",
  ],
  cause:{ verd_seed:'a Corrosive Seed', verd_acid:"Verdigris's acid pools", verd_vine:"Verdigris's Vine Sweep", verd_thorn:'a thorn volley' },
  advice:{
    verd_seed:[['thorn',"She aims the seeds at you. Bait them to the edges so the middle stays clean."]],
    verd_acid:[['thorn',"Never fight standing in acid. Rotate around the roof and keep the centre clear."]],
    verd_vine:[['bastion',"The vine sweep has a white tell. Parry it, or just get behind her."]],
    verd_thorn:[['echo',"Break the buds before they bloom. All three, and she's wide open."]],
  },
  draw(e){
    const white=e.flashT>0, wind=e.bstate==='WINDUP', c=this.color, moving=Math.hypot(e.mx,e.my)>5;
    const glow=wind?0.5+0.5*clamp(e.stateT/(e.atk?e.atk.windup:1),0,1):e.bstate==='ACTIVE'?1:0.4;
    ctx.fillStyle='rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(e.x+5,e.y+e.r*0.8,e.r*1.5,e.r*0.6,0,0,PI2); ctx.fill();
    ctx.save(); ctx.translate(e.x,e.y); if (e.bstate==='EXPOSED') ctx.rotate(Math.sin(time*30)*0.07); ctx.rotate(e.face);
    const s=e.r/35; ctx.scale(s,s);
    // trailing metal tendrils, swaying
    ctx.lineCap='round';
    for (let i=0;i<7;i++){ const off=(i-3)*0.32, sw=Math.sin(time*2.4+i)*0.25+(moving?Math.sin(time*8+i)*0.15:0);
      ctx.strokeStyle=COL.ink; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(-6,off*20); ctx.quadraticCurveTo(-34,off*40+sw*30,-62,off*60+sw*50); ctx.stroke();
      ctx.strokeStyle=white?'#fff':(i%2?'#3f6b52':'#7a5a3a'); ctx.lineWidth=4; ctx.stroke(); }
    // leaf-blade shoulders (oxidised copper)
    for (const sd of [-1,1]){ ctx.fillStyle=white?'#fff':'#a8673a'; ctx.beginPath(); ctx.moveTo(4,sd*10); ctx.quadraticCurveTo(-8,sd*40,-30,sd*34); ctx.quadraticCurveTo(-10,sd*22,4,sd*10); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke(); }
    // body with glowing veins
    ctx.fillStyle=white?'#fff':'#2f4a3a'; ctx.beginPath(); ctx.ellipse(0,0,16,14,0,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=3.5; ctx.stroke();
    ctx.strokeStyle=c; ctx.lineWidth=2; ctx.shadowColor=c; ctx.shadowBlur=6+14*glow; ctx.globalAlpha=0.5+0.5*glow;
    ctx.beginPath(); ctx.moveTo(-10,-4); ctx.lineTo(0,-1); ctx.lineTo(8,-6); ctx.moveTo(-10,5); ctx.lineTo(2,2); ctx.lineTo(9,7); ctx.stroke(); ctx.globalAlpha=1; ctx.shadowBlur=0;
    // claws reaching forward (raised during the vine sweep wind-up)
    const reach=wind && e.atk && e.atk.step.prim==='sector' ? 10*glow : 0;
    for (const sd of [-1,1]){ ctx.strokeStyle=white?'#fff':'#a8673a'; ctx.lineWidth=3; for (let j=-1;j<=1;j++){ ctx.beginPath(); ctx.moveTo(12,sd*14); ctx.quadraticCurveTo(26+reach,sd*(16+j*4),34+reach,sd*(10+j*6)); ctx.stroke(); } }
    // copper mask
    ctx.fillStyle=white?'#fff':'#b8743f'; poly([[20,0],[10,-7],[4,0],[10,7]]); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
    ctx.restore();
    if (Math.random()<0.15) particles.push({x:e.x+rand(-12,12),y:e.y+rand(-12,12),vx:0,vy:rand(20,60),life:.5,max:.5,color:c,w:2});
    if (e.bstate==='INTRO' || e.bstate==='PHASE_CHANGE'){ ctx.save(); ctx.strokeStyle=c; ctx.globalAlpha=0.4+0.3*Math.sin(time*10); ctx.lineWidth=3; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.arc(e.x,e.y,e.r+18,0,PI2); ctx.stroke(); ctx.restore(); }
  },
});
