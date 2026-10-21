// Volt: The five combat styles and the style select screen.
'use strict';

/* ---------- Combat styles ---------- */
// Like Hades' weapons: a style replaces Strike and Special. Dash and Overload are shared by every style.
// Boons hook the slot rather than the style (strike hits, heavy hits, power hits), so every boon works with every style.
// Each style has one "heavy hit" that triggers heavy-hit boons (Radiant Strike, Bulwark Strike).
const STYLE = () => STYLES[run.style] || STYLES.brawler;
function strikeDmg(base){ return base*R.dmgMul*(1+val('radiant')/100)*(STYLE().dmgMul?STYLE().dmgMul():1); }
function powerDmg(base){ return base*R.dmgMul*(1+val('resonance')/100)*(STYLE().dmgMul?STYLE().dmgMul():1); }
const powerReach = () => R.chainMax-4; // extra reach from Resonance and Relay Node
const powerTint = () => player.slots.power ? HEROES[BOON_BY_ID[player.slots.power.id].hero].c : null;
function strikeHit(e,dmg,ang,knock,stun,opt={}){
  damageEnemy(e,dmg,ang,knock,stun,Object.assign({src:'strike'},opt));
  if (has('mindspike')) e.markT=3;
  if (has('bramble')) poisonEnemy(e,1);
}
function heavyLanded(x,y){
  const p=player;
  if (has('radiant')){ burst(x,y,62,val('radiant','v2'),HEROES.halo.c); bolts.push({pts:[{x,y:y-260},{x,y}],t:0,dur:.18,c:HEROES.halo.c}); }
  if (has('bulwark')){ p.guard=val('bulwark'); texts.push({x:p.x,y:p.y-34,v:'GUARD',t:0,c:HEROES.bastion.c}); }
}
function powerHit(e,dmg,ang,knock,stun,first,opt={}){
  const solar=has('solar') && first;
  damageEnemy(e,dmg+(solar?val('solar'):0),ang,has('kinetic')?Math.max(knock,520):knock,solar?Math.max(stun,0.8):stun,Object.assign({src:'power'},opt));
  if (has('kinetic')) e.kbT=0.45;
  if (has('snare')){ rootEnemy(e,val('snare')); poisonEnemy(e,1); }
}
function inCone(e,x,y,a,range,arc){ const dx=e.x-x, dy=e.y-y, d=Math.hypot(dx,dy); return d<=range+e.r && (Math.abs(angDiff(Math.atan2(dy,dx),a))<=arc/2 || d<e.r+player.r+6); }
function setStrikeCd(s){ player.strikeCd=s; player.strikeCdMax=s; }
function setPowerCd(s){ player.powerCd=s; player.powerCdMax=s; }

const STYLES = {
  brawler: {
    name:'Brawler', trainer:'Your own style', strikeLabel:'Strike', powerLabel:'Special', cost:0,
    strikeDesc:'Fast 3-hit combo. Swings knock enemy shots out of the air.', powerDesc:'Chain lightning that jumps between up to 4 enemies and stuns.',
    heavy:'The third hit of the combo.', strength:'All-rounder. Parries Needle shots.', weakness:'Has to fight up close.',
    strike(){
      const p=player;
      p.combo = p.comboT>0 ? (p.combo+1)%3 : 0;
      const fin = p.combo===2;
      p.comboT = 0.55; setStrikeCd(fin ? 0.34 : 0.17);
      const a=p.aim, range=T.strikeRange*R.reachMul*(fin?1.25:1), arc=fin?2.5:1.9;
      p.vx += Math.cos(a)*(fin?280:170); p.vy += Math.sin(a)*(fin?280:170);
      fx.push({type:'slash',a,range,arc,t:0,dur:fin?0.2:0.13,dir:p.combo===1?-1:1,fin});
      let hit=0;
      for (const e of attackTargets()) if (inCone(e,p.x,p.y,a,range,arc)){ strikeHit(e,strikeDmg(T.strikeDamage*(fin?1.7:1)),Math.atan2(e.y-p.y,e.x-p.x),fin?560:300,fin?0.28:0.1); hit++; }
      for (const b of bullets){
        if (b.friendly) continue;
        const dx=b.x-p.x, dy=b.y-p.y, d=Math.hypot(dx,dy);
        if (d<range+8 && Math.abs(angDiff(Math.atan2(dy,dx),a))<arc/2){ b.dead=true; sparks(b.x,b.y,a,10,COL.amber); fx.push({type:'impact',x:b.x,y:b.y,t:0,dur:.1,size:22,rot:rand(PI2),c:COL.amber}); texts.push({x:b.x,y:b.y-10,v:'PARRY',t:0,big:false,c:COL.amber}); hit++; }
      }
      if (hit){ hitStop=Math.max(hitStop,T.hitPause*(fin?1.7:1)); addShake(fin?10:5); if (fin) heavyLanded(p.x+Math.cos(a)*range*0.85,p.y+Math.sin(a)*range*0.85); }
      else sparks(p.x+Math.cos(a)*range*.7,p.y+Math.sin(a)*range*.7,a,3,COL.volt,260,.5);
    },
    powerPress(){
      const p=player; setPowerCd(T.powerCooldown*R.powerCdMul);
      let first=null, best=1e9;
      for (const e of attackTargets()){
        const dx=e.x-p.x, dy=e.y-p.y, d=Math.hypot(dx,dy); if (d>460) continue;
        const ad=Math.abs(angDiff(Math.atan2(dy,dx),p.aim)), sc=d*(1+ad*2.2);
        if (ad<0.8 && sc<best){ best=sc; first=e; }
      }
      if (!first) first=nearestEnemy(p.x,p.y,230);
      const start={x:p.x+Math.cos(p.aim)*18,y:p.y+Math.sin(p.aim)*18};
      if (!first){
        const end={x:p.x+Math.cos(p.aim)*360,y:p.y+Math.sin(p.aim)*360};
        bolts.push({pts:[start,end],t:0,dur:.14,c:powerTint()}); sparks(end.x,end.y,p.aim+Math.PI,6,COL.volt); addShake(2); return;
      }
      const pts=[start], chain=[]; let cur=first, dmg=powerDmg(T.powerDamage), prev=start;
      const decay=has('resonance')?1:0.8;
      while (cur && chain.length<R.chainMax){
        chain.push(cur); pts.push({x:cur.x,y:cur.y});
        powerHit(cur,dmg,Math.atan2(cur.y-prev.y,cur.x-prev.x),170,0.45,chain.length===1);
        prev={x:cur.x,y:cur.y}; dmg*=decay;
        cur=nearestEnemy(cur.x,cur.y,250,chain);
      }
      bolts.push({pts,t:0,dur:.22,c:powerTint()});
      flash=Math.max(flash,.06); hitStop=Math.max(hitStop,T.hitPause*1.3); addShake(7);
    },
  },

  caster: {
    name:'Arc Caster', trainer:'Volt, unleashed', strikeLabel:'Bolt', powerLabel:'Lance', cost:2, strikeSlow:0.75,
    strikeDesc:'Rapid lightning bolts. Hold to keep firing.', powerDesc:'Hold to charge, release to fire a lance that pierces everything in a line.',
    heavy:'Every 4th bolt: bigger, pierces, staggers.', strength:'Fights from a safe distance. Shreds Needles.', weakness:'Low damage per hit, no parry. Rushers that reach you are a problem.',
    strike(){
      const p=player; if (p.charging) return;
      setStrikeCd(0.16); p.shotN=(p.shotN||0)+1;
      const heavy=p.shotN%4===0, a=p.aim+rand(-0.04,0.04), s=heavy?820:960, ox=p.x+Math.cos(a)*20, oy=p.y+Math.sin(a)*20;
      shots.push({kind:'bolt',x:ox,y:oy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0,life:560*R.reachMul/s,dmg:strikeDmg(heavy?15:6),heavy,r:heavy?9:5,pierce:heavy?1:0,hit:[]});
      p.vx-=Math.cos(a)*(heavy?90:30); p.vy-=Math.sin(a)*(heavy?90:30);
      sparks(ox,oy,a,heavy?6:2,COL.volt,320,.4);
    },
    powerPress(){ player.charging=0.001; },
    powerRelease(){
      const p=player; if (!p.charging) return;
      const k=clamp(p.charging/1.0,0.25,1); p.charging=0;
      const L=640*(1+0.15*powerReach()), w=14+16*k, a=p.aim, sx=p.x+Math.cos(a)*18, sy=p.y+Math.sin(a)*18;
      const hits=attackTargets().map(e=>{ const dx=e.x-sx, dy=e.y-sy, t=dx*Math.cos(a)+dy*Math.sin(a), perp=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a)); return {e,t,perp}; })
        .filter(h=>h.t>-h.e.r && h.t<L && h.perp<w+h.e.r).sort((x,y)=>x.t-y.t);
      hits.forEach((h,i)=>powerHit(h.e,powerDmg(16+44*k),a,200+300*k,0.2+0.35*k,i===0));
      bolts.push({pts:[{x:sx,y:sy},{x:sx+Math.cos(a)*L,y:sy+Math.sin(a)*L}],t:0,dur:.18+.12*k,c:powerTint(),w:1+k*1.6});
      setPowerCd(T.powerCooldown*R.powerCdMul*1.1);
      p.vx-=Math.cos(a)*260*k; p.vy-=Math.sin(a)*260*k;
      flash=Math.max(flash,.05+.08*k); hitStop=Math.max(hitStop,T.hitPause*(1+k)); addShake(4+8*k);
    },
    update(dt){ const p=player; if (p.charging) p.charging=Math.min(1.2,p.charging+dt); updateShots(dt); },
  },

  titan: {
    name:'Titan', trainer:'Trained by Bastion', strikeLabel:'Haymaker', powerLabel:'Pound', cost:3, move:0.9, strikeSlow:0.35,
    strikeDesc:'Slow, enormous punches with huge knockback. Every hit breaks enemy wind-ups.', powerDesc:'Ground pound: a shockwave that stuns and throws back everything around you.',
    heavy:'Every Haymaker.', strength:'Crowd control. A parry from Titan leaves enemies Exposed for longer.', weakness:'Slow to swing and slow to recover. Missing is punished.',
    strike(){
      const p=player; setStrikeCd(0.58);
      const a=p.aim, range=T.strikeRange*1.2*R.reachMul, arc=2.2;
      p.vx+=Math.cos(a)*240; p.vy+=Math.sin(a)*240;
      fx.push({type:'slash',a,range,arc,t:0,dur:0.24,dir:(p.combo=(p.combo+1)%2)?1:-1,fin:true,heavy:true});
      let hit=0;
      for (const e of attackTargets()) if (inCone(e,p.x,p.y,a,range,arc)){ strikeHit(e,strikeDmg(30),Math.atan2(e.y-p.y,e.x-p.x),900,0.38,{titan:true}); hit++; }
      if (hit){ hitStop=Math.max(hitStop,T.hitPause*2.2); addShake(13); heavyLanded(p.x+Math.cos(a)*range*0.85,p.y+Math.sin(a)*range*0.85); }
      else { addShake(3); sparks(p.x+Math.cos(a)*range*.7,p.y+Math.sin(a)*range*.7,a,5,COL.spark,300,.6); }
    },
    powerPress(){
      const p=player, r=150*(1+0.12*powerReach());
      setPowerCd(T.powerCooldown*R.powerCdMul*1.45);
      const hits=attackTargets().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<r+e.r).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y));
      hits.forEach((e,i)=>powerHit(e,powerDmg(26),Math.atan2(e.y-p.y,e.x-p.x),650,0.7,i===0,{titan:true}));
      fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.35,r,c:powerTint()||COL.spark});
      for (let i=0;i<5;i++) stainAtColor(p.x+rand(-r*.6,r*.6),p.y+rand(-r*.6,r*.6),rand(18,34),'#000');
      for (let i=0;i<16;i++) sparks(p.x,p.y,rand(PI2),1,'#9aa0ad',520,0.3);
      p.iT=Math.max(p.iT,0.2); hitStop=Math.max(hitStop,0.09); addShake(16); flash=Math.max(flash,.05);
    },
  },

  speedster: {
    name:'Speedster', trainer:'Trained by Halo', strikeLabel:'Flash', powerLabel:'Blitz', cost:4, move:1.15, strikeSlow:1, dmgTaken:1.25,
    dmgMul(){ return 1+(player.mom||0); },
    strikeDesc:'Flash-step through the nearest enemy you aim at. Damage builds with Momentum.', powerDesc:'Blitz: a burst of afterimage strikes on everything nearby. Spends half your Momentum.',
    heavy:'Every 5th Flash.', strength:'Up to double damage at full Momentum, which builds while you keep moving.', weakness:'Fragile (take 25% more damage). Standing still drains Momentum.',
    strike(){
      const p=player; setStrikeCd(0.14); p.hitN=(p.hitN||0)+1;
      const heavy=p.hitN%5===0;
      let t=null, best=1e9;
      for (const e of attackTargets()){ const dx=e.x-p.x, dy=e.y-p.y, d=Math.hypot(dx,dy); if (d>240) continue; const ad=Math.abs(angDiff(Math.atan2(dy,dx),p.aim)); if (ad>1.0 && d>90) continue; const sc=d*(1+ad); if (sc<best){ best=sc; t=e; } }
      if (!t){ p.vx+=Math.cos(p.aim)*420; p.vy+=Math.sin(p.aim)*420; sparks(p.x,p.y,p.aim+Math.PI,4,COL.volt,300,.4); p.hitN--; return; }
      const a=Math.atan2(t.y-p.y,t.x-p.x), ox=p.x, oy=p.y;
      fx.push({type:'ghost',x:ox,y:oy,a,t:0,dur:.22});
      p.x=t.x+Math.cos(a)*(t.r+p.r+8); p.y=t.y+Math.sin(a)*(t.r+p.r+8); collide(p);
      p.aim=a; p.iT=Math.max(p.iT,0.09); p.vx=Math.cos(a)*160; p.vy=Math.sin(a)*160;
      bolts.push({pts:[{x:ox,y:oy},{x:p.x,y:p.y}],t:0,dur:.1,w:0.6});
      strikeHit(t,strikeDmg(heavy?17:8),a,heavy?420:160,heavy?0.28:0.08);
      if (heavy){ heavyLanded(t.x,t.y); addShake(7); hitStop=Math.max(hitStop,T.hitPause*1.4); } else addShake(2);
      p.mom=Math.min(1,(p.mom||0)+0.04);
    },
    powerPress(){
      const p=player, targets=attackTargets().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<230).sort((x,y)=>Math.hypot(x.x-p.x,x.y-p.y)-Math.hypot(y.x-p.x,y.y-p.y));
      setPowerCd(T.powerCooldown*R.powerCdMul*1.3);
      if (!targets.length){ fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.25,r:60,c:COL.volt}); return; }
      const n=6+powerReach();
      for (let i=0;i<n;i++){
        const e=targets[i%targets.length]; if (e.dead) continue;
        const a=rand(PI2); fx.push({type:'ghost',x:e.x+Math.cos(a)*30,y:e.y+Math.sin(a)*30,a:a+Math.PI,t:-i*0.03,dur:.25});
        powerHit(e,powerDmg(6),a+Math.PI,120,0.15,i===0);
      }
      p.mom=(p.mom||0)*0.5; p.iT=Math.max(p.iT,0.25); addShake(9); hitStop=Math.max(hitStop,T.hitPause*1.5);
    },
    update(dt){
      const p=player, spd=Math.hypot(p.vx,p.vy);
      p.mom=clamp((p.mom||0)+(spd>T.moveSpeed*0.6||p.dashT>0 ? 0.55*dt : -1.0*dt),0,1);
    },
    onDash(){ player.mom=Math.min(1,(player.mom||0)+0.25); },
  },

  magnetar: {
    name:'Magnetar', trainer:'Trained by Echo', strikeLabel:'Disc', powerLabel:'Pull', cost:5,
    strikeDesc:'Throw a magnetic disc that ricochets between enemies, then flies back to you.', powerDesc:'Magnet Pull: yank nearby enemies together in front of you, stunning them briefly.',
    heavy:'The first enemy each throw hits.', strength:'Its blocks take no damage and reflect every shot.', weakness:'Nearly empty-handed until the disc comes back.',
    init(p){ p.disc={state:'held',x:p.x,y:p.y,vx:0,vy:0,t:0,bounces:0,hit:[],first:true}; },
    strike(){
      const p=player, d=p.disc; if (p.shield) return;
      if (d.state==='held'){
        setStrikeCd(0.2); const a=p.aim;
        Object.assign(d,{state:'out',x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,vx:Math.cos(a)*1000,vy:Math.sin(a)*1000,t:0,age:0,bounces:2+powerReach(),hit:[],first:true,dist:0});
        sparks(d.x,d.y,a,4,COL.volt,300,.4);
      } else {
        // Empty-handed: a weak jab while the disc is away.
        setStrikeCd(0.32); const a=p.aim;
        fx.push({type:'slash',a,range:58,arc:1.4,t:0,dur:0.1,dir:1,fin:false});
        for (const e of attackTargets()) if (inCone(e,p.x,p.y,a,58,1.4)) strikeHit(e,strikeDmg(5),a,180,0.05);
      }
    },
    powerPress(){
      const p=player, r=280*(1+0.12*powerReach()), cx=p.x+Math.cos(p.aim)*90, cy=p.y+Math.sin(p.aim)*90;
      setPowerCd(T.powerCooldown*R.powerCdMul);
      const hits=attackTargets().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<r+e.r).sort((x,y)=>Math.hypot(x.x-cx,x.y-cy)-Math.hypot(y.x-cx,y.y-cy));
      hits.forEach((e,i)=>{ const d=Math.hypot(cx-e.x,cy-e.y); bolts.push({pts:[{x:e.x,y:e.y},{x:cx,y:cy}],t:0,dur:.16,c:powerTint(),w:0.5}); powerHit(e,powerDmg(8),Math.atan2(cy-e.y,cx-e.x),Math.min(700,d*3.2),0.35,i===0); });
      fx.push({type:'shock',x:cx,y:cy,t:0,dur:.25,r:60,c:powerTint()||COL.volt});
      addShake(hits.length?7:2);
    },
    update(dt){
      const p=player, d=p.disc;
      if(d.state!=='held')d.age=(d.age||0)+dt;
      if (d.state==='out'){
        d.t+=dt; const px=d.x, py=d.y; d.x+=d.vx*dt; d.y+=d.vy*dt; d.dist+=Math.hypot(d.x-px,d.y-py);
        if (d.x<24||d.y<24||d.x>ARENA.w-24||d.y>ARENA.h-24||inObstacle(d.x,d.y)||d.dist>560*R.reachMul){ d.state='back'; d.hit=[]; sparks(d.x,d.y,rand(PI2),5,COL.volt,260,Math.PI); }
        for (const e of attackTargets()){
          if (d.state!=='out' || d.hit.includes(e) || Math.hypot(e.x-d.x,e.y-d.y)>e.r+14) continue;
          d.hit.push(e);
          const heavy=d.first; d.first=false;
          strikeHit(e,strikeDmg(heavy?18:10),Math.atan2(d.vy,d.vx),heavy?380:220,heavy?0.28:0.1);
          if (heavy) heavyLanded(e.x,e.y);
          addShake(heavy?6:3);
          d.bounces--;
          const next=d.bounces>0 ? nearestEnemy(e.x,e.y,320,d.hit) : null;
          if (next){ const a=Math.atan2(next.y-d.y,next.x-d.x); d.vx=Math.cos(a)*1000; d.vy=Math.sin(a)*1000; d.dist=0; }
          else { d.state='back'; d.hit=[]; }
        }
      } else if (d.state==='back'){
        const a=Math.atan2(p.y-d.y,p.x-d.x); d.vx=Math.cos(a)*1150; d.vy=Math.sin(a)*1150; d.x+=d.vx*dt; d.y+=d.vy*dt;
        for (const e of attackTargets()) if (!d.hit.includes(e) && Math.hypot(e.x-d.x,e.y-d.y)<e.r+12){ d.hit.push(e); strikeHit(e,strikeDmg(4),a,120,0.05); }
        // Close catches must not bypass the throw's recovery. Longer flights retain their quick catch.
        if (Math.hypot(p.x-d.x,p.y-d.y)<p.r+12){ d.state='held'; p.strikeCd=Math.max(Math.min(p.strikeCd,0.05),.34-(d.age??.34)); sparks(p.x,p.y,a+Math.PI,6,COL.volt,260,.6); }
      } else { d.x=p.x; d.y=p.y; }
    },
  },
};

/* Arc Caster bolts (the player's own projectiles) */
function updateShots(dt){
  for (const s of shots){
    s.t+=dt; s.x+=s.vx*dt; s.y+=s.vy*dt;
    if (s.t>s.life || s.x<20||s.y<20||s.x>ARENA.w-20||s.y>ARENA.h-20||inObstacle(s.x,s.y)){ s.dead=true; sparks(s.x,s.y,Math.atan2(-s.vy,-s.vx),3,COL.volt,220); continue; }
    for (const e of attackTargets()){
      if (s.hit.includes(e) || Math.hypot(e.x-s.x,e.y-s.y)>e.r+s.r) continue;
      s.hit.push(e);
      strikeHit(e,s.dmg,Math.atan2(s.vy,s.vx),s.heavy?260:70,s.heavy?0.28:0.04);
      if (s.heavy && s.hit.length===1){ heavyLanded(e.x,e.y); hitStop=Math.max(hitStop,T.hitPause); addShake(4); }
      if (s.pierce>0) s.pierce--; else { s.dead=true; break; }
    }
  }
  shots=shots.filter(s=>!s.dead);
}
function stainAtColor(x,y,r,c){ decals.push({x,y,r,pts:Array.from({length:9},()=>rand(.6,1.2)),rot:rand(PI2),c,drops:[]}); if (decals.length>60) decals.shift(); }

/* Input entry points: every style goes through these */
function doStrike(){
  const p=player; if (state!=='play'||p.strikeCd>0||p.dashT>0||p.blockHeld||p.stunT>0) return;
  STYLE().strike();
  if (p.strikeCd>0){p.motionAttack='strike'; const n=(p.combo||0)%3; playerAnim(['strike1','strike2','strike3'][n]); sfx(['strike1','strike2','strike3'][n],{vol:0.8}); comicAttack(p.x,p.y,p.aim,42+n*8); }
}
let powerHeld=false;
function doPower(){
  const p=player; powerHeld=true;
  if (state!=='play'||p.powerCd>0||p.dashT>0||p.blockHeld||p.stunT>0) return;
  if (p.suppressed){ texts.push({x:p.x,y:p.y-40,v:'SUPPRESSED',t:0,c:'#e0283c'}); return; }
  STYLE().powerPress();
  if (p.powerCd>0 || p.charging) sfx('special');
  if (typeof tut!=='undefined' && tut) tut.usedSpecial=true;
  if (p.powerCd>0 || p.charging){p.motionAttack='power'; playerAnim('strike2'); comicAttack(p.x,p.y,p.aim,72); }
}
function releasePower(){
  powerHeld=false;
  if (state!=='play') { player.charging=0; player.shield=false; return; }
  const s=STYLE(); s.powerRelease && s.powerRelease();
}

/* Style-specific visuals, drawn above actors */
function drawStyleFx(){
  const p=player, st=run.style;
  for (const s of shots){
    ctx.save(); ctx.lineCap='round'; ctx.shadowColor=COL.volt; ctx.shadowBlur=s.heavy?18:10;
    ctx.strokeStyle=COL.volt; ctx.lineWidth=s.heavy?9:5; ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-s.vx*0.03,s.y-s.vy*0.03); ctx.stroke();
    ctx.strokeStyle='#ffffff'; ctx.lineWidth=s.heavy?3:2; ctx.stroke(); ctx.restore();
  }
  if (st==='caster' && p.charging){
    const k=clamp(p.charging/1.0,0.25,1), L=640*(1+0.15*powerReach()), a=p.aim;
    ctx.save(); ctx.globalAlpha=0.25+0.5*k; ctx.strokeStyle=powerTint()||COL.volt; ctx.lineWidth=2+10*k; ctx.setLineDash([14,10]); ctx.lineDashOffset=-time*80;
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+Math.cos(a)*L,p.y+Math.sin(a)*L); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha=1; ctx.fillStyle=COL.spark; ctx.shadowColor=COL.volt; ctx.shadowBlur=20; ctx.beginPath(); ctx.arc(p.x+Math.cos(a)*22,p.y+Math.sin(a)*22,4+8*k,0,PI2); ctx.fill();
    ctx.restore();
  }
  if (st==='speedster' && p.mom>0.02){
    ctx.save(); ctx.strokeStyle=COL.volt; ctx.globalAlpha=0.35+0.5*p.mom; ctx.lineWidth=3; ctx.shadowColor=COL.volt; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.arc(p.x,p.y,30,-Math.PI/2,-Math.PI/2+PI2*p.mom); ctx.stroke(); ctx.restore();
  }
  if (st==='magnetar' && p.disc){
    const d=p.disc;
    if (d.state!=='held'){
      ctx.save(); ctx.translate(d.x,d.y); ctx.rotate(time*30);
      ctx.shadowColor=COL.volt; ctx.shadowBlur=16; ctx.fillStyle='#1b2433'; ctx.beginPath(); ctx.arc(0,0,11,0,PI2); ctx.fill();
      ctx.strokeStyle=COL.volt; ctx.lineWidth=3; ctx.stroke(); ctx.strokeStyle=COL.spark; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.stroke();
      ctx.restore();
    }
    if (d.state==='held' && !p.blockHeld && !p.weaponDiscInPose){
      ctx.save(); ctx.fillStyle='#1b2433'; ctx.strokeStyle=COL.volt; ctx.lineWidth=2.5; const hx=p.x+Math.cos(p.aim-1.4)*18, hy=p.y+Math.sin(p.aim-1.4)*18;
      ctx.beginPath(); ctx.arc(hx,hy,8,0,PI2); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
}
function applyStyleHud(){
  const s=STYLE();
  for (const el of [hud.ab.s,hud.ab.p]) el.querySelector('b').textContent = el===hud.ab.s ? s.strikeLabel : s.powerLabel;
  hud.tb.s.querySelector('span').textContent=s.strikeLabel; hud.tb.p.querySelector('span').textContent=s.powerLabel;
}

/* Style select (Fortress armoury). Hero Licences come from commendations (js/commend.js). */
function styleUnlocked(id){ return save.unlocked.includes(id); }
function fillStyles(){
  $('#styleLic').textContent=save.licences;
  const list=$('#styleList'); list.innerHTML='';
  for (const [id,s] of Object.entries(STYLES)){
    const open=styleUnlocked(id), sel=save.style===id;
    const b=document.createElement('button'); b.type='button'; b.className='style-card'+(sel?' sel':'')+(open?'':' locked');
    b.innerHTML=`<span class="card-top"><span class="tag">${s.trainer}</span><span class="style-state">${sel?'Equipped':open?'Equip':`Unlock · ${s.cost} licence${s.cost>1?'s':''}`}</span></span>
      <strong>${s.name}</strong>
      <span class="style-line"><b>${s.strikeLabel}:</b> ${s.strikeDesc}</span>
      <span class="style-line"><b>${s.powerLabel}:</b> ${s.powerDesc}</span>
      <span class="style-line"><b>Heavy hit:</b> ${s.heavy}</span>
      <span class="style-line good">+ ${s.strength}</span>
      <span class="style-line bad">− ${s.weakness}</span>`;
    b.addEventListener('click',()=>{
      if (!open){ if (save.licences<s.cost) return; save.licences-=s.cost; save.unlocked.push(id); }
      save.style=id; writeSave(); fillStyles(); refreshStyleButtons();
    });
    if (!open && save.licences<s.cost) b.setAttribute('aria-disabled','true');
    list.appendChild(b);
  }
}
function refreshStyleButtons(){ const n=STYLES[save.style].name; for (const id of ['#startStyle','#overStyle']) if ($(id)) $(id).textContent=n; }
function openStyles(){ fillStyles(); show('#mStyle',true); $('#btnStyleClose').focus(); }
function closeStyles(){ show('#mStyle',false); refreshStyleButtons(); hubMenuClosed(); }
