// Volt: Shared helpers, damage, dash, Overload and taking hits.
'use strict';

/* ---------- Helpers ---------- */
const liveEnemies = () => enemies.filter(e => !e.dead && e.spawnT<=0);
function nearestEnemy(x,y,max,exclude){
  let best=null, bd=max;
  for (const e of enemies){ if (e.dead||e.spawnT>0||(exclude&&exclude.includes(e))) continue; const d=Math.hypot(e.x-x,e.y-y); if (d<bd){bd=d;best=e;} }
  return best;
}
function addShake(n){ shakeAmt = Math.min(26, shakeAmt + n*T.shake); }
function sparks(x,y,ang,n,color,spd=420,spread=1.2){
  for (let i=0;i<n;i++){ const a=ang+rand(-spread,spread), s=rand(spd*.35,spd); particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.15,.35),max:.35,color,w:rand(1.5,3.5)}); }
}
function collide(o){
  o.x=clamp(o.x,o.r+22,ARENA.w-o.r-22); o.y=clamp(o.y,o.r+22,ARENA.h-o.r-22);
  let hit=false;
  for (const b of obstacles){
    if (b.circle){
      const dx=o.x-b.cx, dy=o.y-b.cy, d=Math.hypot(dx,dy)||0.01, m=b.rad+o.r;
      if (d<m){ o.x=b.cx+dx/d*m; o.y=b.cy+dy/d*m; hit=true; }
      continue;
    }
    const cx=clamp(o.x,b.x,b.x+b.w), cy=clamp(o.y,b.y,b.y+b.h), dx=o.x-cx, dy=o.y-cy, d2=dx*dx+dy*dy;
    if (d2<o.r*o.r){
      hit=true;
      if (d2<0.0001){ o.y=b.y+b.h+o.r; }
      else { const d=Math.sqrt(d2), p=o.r-d; o.x+=dx/d*p; o.y+=dy/d*p; }
    }
  }
  return hit;
}
const inObstacle = (x,y,pad=0) => obstacles.some(b => b.circle ? Math.hypot(x-b.cx,y-b.cy)<b.rad+pad : x>b.x-pad&&x<b.x+b.w+pad&&y>b.y-pad&&y<b.y+b.h+pad);

function banner(text, warn){ const b=$('#banner'); b.textContent=text; b.classList.toggle('warn',!!warn); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }

/* ---------- Player actions ---------- */
function updateAim(mv){
  const p=player;
  if (inputMode==='kb' && mouse.active){ const w=screenToWorld(mouse.x,mouse.y); p.aim=Math.atan2(w.y-p.y,w.x-p.x); }
  else { const t=nearestEnemy(p.x,p.y,360); if (t) p.aim=Math.atan2(t.y-p.y,t.x-p.x); else if (mv.x||mv.y) p.aim=Math.atan2(mv.y,mv.x); }
}
function damageEnemy(e,dmg,ang,knock,stun,opt={}){
  if (e.dead) return;
  if (e.invuln){ if (!opt.quiet) sparks(e.x-Math.cos(ang)*e.r,e.y-Math.sin(ang)*e.r,ang+Math.PI,4,'#9aa0ad',260,.8); return; }
  // Boon multipliers stack multiplicatively, like Hades.
  let m=1;
  if (e.exposedT>0) m*=BLOCK.exposedMul;
  if (e.markT>0) m*=1+(has('mindspike')?val('mindspike'):25)/100;
  if (has('inspire') && player.hp>=player.maxHp*0.8) m*=1+val('inspire')/100;
  if (has('guiding') && e.isBoss) m*=1+val('guiding')/100;
  if (has('natsel') && e.hp<e.maxHp*0.3) m*=1+val('natsel')/100;
  dmg*=m;
  e.hp-=dmg; e.flashT=opt.quiet?0.04:0.09;
  if (opt.quiet){
    texts.push({x:e.x+rand(-10,10),y:e.y-e.r,v:Math.round(dmg),t:0.15,c:opt.c,small:true});
    player.sig=Math.min(100,player.sig+dmg*R.sigRate*0.5);
    if (e.hp<=0) killEnemy(e,rand(PI2));
    return;
  }
  if (e.isBoss){
    // Too heavy to juggle: tiny knockback, no stun. Only heavy hits during the slam wind-up stagger it.
    e.vx+=Math.cos(ang)*knock*0.06; e.vy+=Math.sin(ang)*knock*0.06;
    // Bosses are never interrupted by damage. Only a perfect parry staggers them (see Block and parry).
  } else {
    e.vx+=Math.cos(ang)*knock; e.vy+=Math.sin(ang)*knock;
    e.stunT=Math.max(e.stunT,stun);
    if (stun>=0.25 && (e.state==='windup'||e.state==='charge')){ e.state = e.kind==='rusher'?'recover':'move'; e.timer = 0.7; texts.push({x:e.x,y:e.y-e.r-18,v:'BREAK',t:0,c:COL.volt}); }
  }
  const hx=e.x-Math.cos(ang)*e.r, hy=e.y-Math.sin(ang)*e.r;
  fx.push({type:'impact',x:hx,y:hy,t:0,dur:.13,size:Math.min(dmg,40)*1.4+20,rot:rand(PI2),c:opt.c||COL.volt});
  sparks(hx,hy,ang,8,COL.spark);
  texts.push({x:e.x+rand(-8,8),y:e.y-e.r,v:Math.round(dmg),t:0,big:dmg>=18,c:m>1.001?(opt.c||'#ffd27a'):opt.c});
  player.sig=Math.min(100,player.sig+dmg*R.sigRate);
  if (e.hp<=0) killEnemy(e,ang);
}
function killEnemy(e,ang){
  e.dead=true; kills++;
  if (has('feedback') && (e.markT>0||e.stunT>0||e.rootT>0)) burst(e.x,e.y,95,val('feedback'),HEROES.echo.c);
  if (Math.random() < (PACK.chance[e.kind]||0)+0.01*metaRank('scavenger')) packs.push({x:e.x,y:e.y,t:0,bob:rand(PI2)});
  const c = KIND_COL[e.kind];
  if (e.isBoss){
    bossKilled(e);
    boss=null; run.bossKills++; gainShards(Math.round(BOSSES[e.kind].shards*(isFinalVillain()?1.5:1)),e.x,e.y-80);
    save.licences++; run.licences++; writeSave(); texts.push({x:e.x,y:e.y-120,v:'+1 HERO LICENCE',t:0,big:true,c:COL.spark});
    fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.6,r:340,c:KIND_COL[e.kind]});
    for (let i=0;i<5;i++) sparks(e.x,e.y,rand(PI2),14,i%2?KIND_COL[e.kind]:'#9aa0ad',700,Math.PI);
    flash=.3; hitStop=Math.max(hitStop,0.25); addShake(24);
    banner(e.name.toUpperCase()+' DOWN');
  }
  sparks(e.x,e.y,ang,18,c,560,1.6); sparks(e.x,e.y,ang,10,COL.spark,700,.8);
  fx.push({type:'impact',x:e.x,y:e.y,t:0,dur:.2,size:62,rot:rand(PI2),c});
  const pts=[]; const n=12; for (let i=0;i<n;i++){ pts.push(rand(.6,1.25)); }
  decals.push({x:e.x+Math.cos(ang)*14,y:e.y+Math.sin(ang)*14,r:e.r*1.7,pts,rot:rand(PI2),c,drops:Array.from({length:6},()=>({a:ang+rand(-.7,.7),d:rand(26,70),r:rand(2,6)}))});
  if (decals.length>60) decals.shift();
  hitStop=Math.max(hitStop,T.hitPause*1.4); addShake(7);
}
function doDash(){
  const p=player; if (state!=='play'||p.dashCd>0||p.dashT>0||p.stunT>0) return;
  if (p.blockHeld){ p.blockHeld=false; }
  const mv=moveInput(); let dx=mv.x, dy=mv.y;
  if (!dx&&!dy){ dx=Math.cos(p.aim); dy=Math.sin(p.aim); }
  const m=Math.hypot(dx,dy); p.dashDir={x:dx/m,y:dy/m};
  p.dashT=T.dashTime; p.dashCd=T.dashCooldown*R.dashCdMul+T.dashTime; p.iT=Math.max(p.iT,T.dashTime+0.06);
  p.charging=0; p.shield=false; { const so=STYLE(); so.onDash && so.onDash(); }
  if (has('flashstep')){ fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.25,r:120,c:HEROES.halo.c}); for (const e of liveEnemies()) if (!e.isBoss && Math.hypot(e.x-p.x,e.y-p.y)<120+e.r){ e.stunT=Math.max(e.stunT,val('flashstep')); if (e.state==='windup'||e.state==='charge'){ e.state=e.kind==='rusher'?'recover':'move'; e.timer=0.6; } } }
  if (has('aegis')) p.reflectT=T.dashTime+val('aegis');
  if (has('phase')) zones.push({kind:'echo',x:p.x,y:p.y,a:p.aim,t:0,dur:0.8,dmg:val('phase'),r:90,c:HEROES.echo.c});
  if (has('thorntrail')) zones.push({kind:'thorns',x:p.x,y:p.y,t:0,dur:4,dps:val('thorntrail'),r:58,c:HEROES.thorn.c,seed:rand(PI2)});
  sparks(p.x,p.y,Math.atan2(-p.dashDir.y,-p.dashDir.x),10,COL.volt,500,.5);
  addShake(1.5);
}
function doSig(){
  const p=player; if (state!=='play'||p.sig<100) return;
  p.sig=0;
  fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.45,r:290});
  const storm=has('storm');
  for (const e of liveEnemies()){ const dx=e.x-p.x, dy=e.y-p.y, d=Math.hypot(dx,dy); if (d<290+e.r){
    damageEnemy(e,42*(1+val('storm')/100),Math.atan2(dy,dx),760,storm?2.4:0.9,{src:'overload'});
    if (storm) e.markT=4;
    if (has('overgrowth')){ rootEnemy(e,val('overgrowth')); poisonEnemy(e,2); }
  } }
  if (has('daybreak')) zones.push({kind:'light',x:p.x,y:p.y,t:0,dur:4,dps:val('daybreak'),r:160,c:HEROES.halo.c});
  if (has('fortress')){ p.iT=Math.max(p.iT,val('fortress')); texts.push({x:p.x,y:p.y-64,v:'FORTRESS',t:0,c:HEROES.bastion.c}); }
  for (const b of bullets){ if (Math.hypot(b.x-p.x,b.y-p.y)<290){ b.dead=true; sparks(b.x,b.y,0,5,COL.amber,300,Math.PI); } }
  for (let i=0;i<10;i++){ const a=rand(PI2); bolts.push({pts:[{x:p.x,y:p.y},{x:p.x+Math.cos(a)*rand(160,290),y:p.y+Math.sin(a)*rand(160,290)}],t:0,dur:rand(.15,.3)}); }
  hitStop=Math.max(hitStop,0.14); addShake(18); flash=.28;
  texts.push({x:p.x,y:p.y-40,v:'OVERLOAD',t:0,big:true,c:COL.volt});
}
function hurtPlayer(dmg,ang,src,opt={}){
  const p=player; if (p.iT>0||state!=='play') return false;
  const so=STYLE(), blk=resolveBlock(dmg,ang,src,opt);
  if (blk.result==='parried') return 'parried';
  dmg=blk.dmg*R.dmgTakenMul*(so.dmgTaken||1);
  if (blk.result==='blocked'){
    dmg=Math.round(dmg); p.iT=0.3; p.vx+=Math.cos(ang)*210; p.vy+=Math.sin(ang)*210;
    if (dmg>0){ p.hp-=dmg; run.dmgTaken+=dmg; run.lastHit=src; texts.push({x:p.x,y:p.y-24,v:'-'+dmg,t:0,c:COL.threat,small:true}); if (p.hp<=0){ if (run.lastStands>0){ run.lastStands--; p.hp=1; p.iT=2; banner('LAST STAND',true); } else { p.hp=0; gameOver(); } } }
    return 'blocked';
  }
  if (p.guard>0){ dmg*=1-p.guard/100; p.guard=0; texts.push({x:p.x,y:p.y-44,v:'BLOCKED',t:0,c:HEROES.bastion.c}); fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.25,r:40,c:HEROES.bastion.c}); }
  dmg=Math.round(dmg);
  if (dmg<=0){ p.iT=0.4; return true; }
  p.hp-=dmg; p.iT=0.6+val('hold'); p.vx+=Math.cos(ang)*420; p.vy+=Math.sin(ang)*420;
  if (has('retaliate')) burst(p.x,p.y,120,val('retaliate'),HEROES.bastion.c);
  run.hits++; run.dmgTaken+=dmg; run.lastHit=src;
  hurtFlash=.4; addShake(11); hitStop=Math.max(hitStop,0.08);
  sparks(p.x,p.y,ang,12,COL.threat,480);
  texts.push({x:p.x,y:p.y-24,v:'-'+dmg,t:0,c:COL.threat});
  if (p.hp<=0){
    if (run.lastStands>0){ run.lastStands--; p.hp=1; p.iT=2; banner('LAST STAND',true); texts.push({x:p.x,y:p.y-50,v:'LAST STAND',t:0,big:true,c:COL.heal}); }
    else { p.hp=0; gameOver(); }
  }
  return true;
}
