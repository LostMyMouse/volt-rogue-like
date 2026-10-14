// Volt: Gravemark boss AI.
'use strict';

/* ---------- Gravemark ---------- */
// Signature: a purple ring slam with a gap (concept-art/gravemark.webp). Escape through the gap or outrun the ring.
// Health never refills between waves. The only healing is these rare drops (full HP walks over them).
const PACK = { heal:20, chance:{ rusher:0.02, needle:0.02, gravemark:0.25 } };
const RUSH = { reach:72, arc:2.3, step:420, swingT:0.16, wind:0.5 };
const GM = { speed:75, slamR:[250,265,280], gap:1.25, slamWind:[1.15,1.0,0.95], chargeSpeed:640 };
function stainAt(x,y,r){ decals.push({x,y,r,pts:Array.from({length:10},()=>rand(.6,1.2)),rot:rand(PI2),c:COL.boon,drops:[]}); if (decals.length>60) decals.shift(); }
function updateGravemark(e,dt,dx,dy,d,a){
  const p=player; e.timer-=dt; e.spin+=dt;
  if (!e.summoned && e.hp<e.maxHp*0.5){
    e.summoned=true;
    for (let i=0;i<2;i++) enemies.push(makeEnemy('needle',0.6+i*0.2));
    texts.push({x:e.x,y:e.y-e.r-30,v:'RISE, NEEDLES',t:0,big:true,c:COL.boon});
  }
  const turn=(to,k)=>{ e.face+=angDiff(to,e.face)*Math.min(1,k*dt); };
  switch (e.state){
    case 'walk': {
      turn(a,4);
      if (d>e.r+p.r+30){ e.mx=Math.cos(e.face)*GM.speed*T.enemySpeed; e.my=Math.sin(e.face)*GM.speed*T.enemySpeed; }
      if (e.timer<=0) gravemarkChoose(e,d,a);
      break;
    }
    case 'slamWind': {
      if (e.timer<=0) gravemarkSlam(e);
      break;
    }
    case 'hurlWind': {
      turn(a,6);
      if (e.timer<=0){
        const n=1+(e.tier>=1?1:0)+(e.tier>=2?1:0);
        const hx=e.x+Math.cos(e.face+1.2)*34, hy=e.y+Math.sin(e.face+1.2)*34;
        for (let i=0;i<n;i++){
          // First rock aims at the player, the rest lead their movement or land beside them.
          const lead=i===0?0:0.45*i, tx=clamp(p.x+p.vx*lead+rand(-40,40)*(i?1:0.3),40,ARENA.w-40), ty=clamp(p.y+p.vy*lead+rand(-40,40)*(i?1:0.3),40,ARENA.h-40);
          rocks.push({x0:hx,y0:hy,tx,ty,t:-i*0.18,dur:0.95,r:48,spin:rand(PI2)});
        }
        e.state='recover'; e.timer=0.9;
      }
      break;
    }
    case 'chargeWind': {
      if (e.timer>0.2) turn(a,10);
      if (e.timer<=0){ e.state='charging'; e.timer=0.55; e.hitDone=false; addShake(4); }
      break;
    }
    case 'charging': {
      const s=GM.chargeSpeed*T.enemySpeed; e.mx=Math.cos(e.face)*s; e.my=Math.sin(e.face)*s;
      if (Math.random()<.8) sparks(e.x,e.y,e.face+Math.PI,2,'#9aa0ad',300,.6);
      if (!e.hitDone && d<e.r+p.r+6){ if (hurtPlayer(20,e.face,'charge',{attacker:e})) e.hitDone=true; }
      if (e.timer<=0){ e.state='recover'; e.timer=0.7; }
      break;
    }
    case 'stagger': case 'recover': {
      if (e.timer<=0){ e.state='walk'; e.timer=rand(0.5,1.1); }
      break;
    }
  }
}
function gravemarkChoose(e,d,a){
  const R=GM.slamR[e.tier], opts=[];
  if (d<R*0.85) opts.push('slam','slam');
  if (d>200) opts.push('hurl');
  if (d>170 && d<560) opts.push('charge');
  let pick=opts.filter(o=>o!==e.lastAtk); if (!pick.length) pick=opts.length?opts:['hurl'];
  const atk=pick[Math.floor(Math.random()*pick.length)]; e.lastAtk=atk;
  if (atk==='slam'){ e.slamsLeft=e.tier>=1?1:0; startSlam(e,a,GM.slamWind[e.tier]); }
  else if (atk==='hurl'){ e.state='hurlWind'; e.timer=e.windDur=0.55*R.windMul; }
  else { e.state='chargeWind'; e.timer=e.windDur=0.7*R.windMul; e.face=a; }
}
function startSlam(e,playerA,wind){
  // The gap opens away from the player so they always have to move to find it.
  wind*=R.windMul; e.state='slamWind'; e.timer=wind; e.windDur=wind;
  e.gapA=playerA+(Math.random()<.5?-1:1)*rand(1.4,2.6);
}
function gravemarkSlam(e){
  const p=player, R=GM.slamR[e.tier], dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
  const inGap=Math.abs(angDiff(a,e.gapA))<GM.gap/2 && d>e.r;
  if (d<R+p.r*0.5 && !inGap) hurtPlayer(22,a,'slam');
  fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.4,r:R,c:COL.boon,gapA:e.gapA,gap:GM.gap});
  addShake(16); hitStop=Math.max(hitStop,0.06); flash=Math.max(flash,.05);
  for (let i=0;i<14;i++){ const ang=rand(PI2); if (Math.abs(angDiff(ang,e.gapA))<GM.gap/2) continue; sparks(e.x+Math.cos(ang)*R*rand(.4,1),e.y+Math.sin(ang)*R*rand(.4,1),ang,2,'#9aa0ad',300,.6); }
  if (e.tier>=2){
    // Final fight: the slam leaves glowing cracks that stay dangerous for a few seconds.
    for (let i=0;i<4;i++){ let ang; do { ang=rand(PI2); } while (Math.abs(angDiff(ang,e.gapA))<GM.gap/2+0.2); const rr=rand(R*0.45,R*0.9);
      cracks.push({x:e.x+Math.cos(ang)*rr,y:e.y+Math.sin(ang)*rr,r:44,t:0,arm:0.35,dur:3.6,seed:rand(PI2)}); }
  }
  if (e.slamsLeft>0){ e.slamsLeft--; e.state='slamWind'; e.timer=e.windDur=0.7*R.windMul; e.gapA+=rand(1.8,2.4)*(Math.random()<.5?-1:1); }
  else { e.state='recover'; e.timer=1.0; }
}
function gravemarkCrash(e){
  e.state='stagger'; e.timer=1.4; e.mx=e.my=0;
  addShake(14); sparks(e.x+Math.cos(e.face)*e.r,e.y+Math.sin(e.face)*e.r,e.face+Math.PI,16,'#9aa0ad',520,1.2);
  texts.push({x:e.x,y:e.y-e.r-24,v:'STUNNED',t:0,big:true,c:COL.volt});
}
