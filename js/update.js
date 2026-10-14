// Volt: Wave spawning and the per-frame simulation.
'use strict';

/* ---------- Waves ---------- */
function spawnPoint(){
  for (let i=0;i<40;i++){
    const x=rand(90,ARENA.w-90), y=rand(90,ARENA.h-90);
    if (Math.hypot(x-player.x,y-player.y)<340 || inObstacle(x,y,30)) continue;
    return {x,y};
  }
  return {x:90,y:90};
}
const waveHp = () => T.enemyHealth*(1+(wave-1)*0.04);
function makeEnemy(kind,delay,at){
  const {x,y}=at||spawnPoint();
  const base={kind,x,y,vx:0,vy:0,mx:0,my:0,flashT:0,stunT:0,spawnT:delay,face:Math.atan2(player.y-y,player.x-x),dead:false};
  if (kind==='rusher'){ const hp=44*waveHp(); return Object.assign(base,{r:17,hp,maxHp:hp,state:'chase',timer:rand(.4,1)}); }
  if (kind==='gravemark'){
    const tier=BOSS_WAVES.indexOf(wave), hp=[900,1400,2000][Math.max(0,tier)]*T.enemyHealth;
    return Object.assign(base,{isBoss:true,name:'Gravemark',r:50,hp,maxHp:hp,state:'walk',timer:1.6,tier:Math.max(0,tier),summoned:false,slamsLeft:0,lastAtk:'',spin:rand(PI2)});
  }
  const hp=30*waveHp(); return Object.assign(base,{r:14,hp,maxHp:hp,state:'move',timer:rand(1,2),strafe:Math.random()<.5?1:-1,bob:rand(PI2)});
}
function startWave(){
  wave++; waveClearing=false; roomPhase='fight';
  let i=0; const add=(k,n)=>{ for (let j=0;j<n;j++) enemies.push(makeEnemy(k,0.8+i++*0.18)); };
  if (BOSS_WAVES.includes(wave)){
    const tier=BOSS_WAVES.indexOf(wave), id=BOSS_PLAN[wave];
    if (BOSSES[id]){
      // Spec bosses fight alone (no ordinary enemies) and open with a 1.5s intro.
      boss=makeBoss(id,{x:ARENA.w/2,y:ARENA.h*0.35}); enemies.push(boss);
      maybeIntro(id,null);
    } else {
      boss=makeEnemy('gravemark',1.4,{x:ARENA.w/2,y:ARENA.h*0.32}); enemies.push(boss);
      add('rusher',[2,2,3][tier]); add('needle',[0,1,1][tier]);
      maybeIntro('gravemark',null, wave===RUN_WAVES?{flourish:'makes a final stand!'}:{});
    }
  } else {
    add('rusher',2+Math.floor(wave*0.6));
    add('needle',wave>=2?1+Math.floor((wave-2)/3):0);
    banner('WAVE '+wave);
  }
}

/* ---------- Update ---------- */
function update(dt){
  const p=player; run.time+=dt;
  const mv=moveInput(); updateAim(mv);
  p.strikeCd-=dt; p.powerCd-=dt; p.dashCd-=dt; p.iT-=dt; p.comboT-=dt; p.reflectT-=dt; tickBlock(dt);
  if ((mouse.left||strikeHeld) && p.strikeCd<=0) doStrike();

  if (p.dashT>0){
    p.vx=p.dashDir.x*T.dashSpeed; p.vy=p.dashDir.y*T.dashSpeed; p.dashT-=dt; p.ghostT-=dt;
    if (p.ghostT<=0){ p.ghostT=0.018; fx.push({type:'ghost',x:p.x,y:p.y,a:p.aim,t:0,dur:.2}); }
    if (Math.random()<.7) particles.push({x:p.x+rand(-10,10),y:p.y+rand(-10,10),vx:-p.dashDir.x*rand(200,500),vy:-p.dashDir.y*rand(200,500),life:.18,max:.18,color:COL.volt,w:2});
    if (p.dashT<=0){ p.vx*=0.3; p.vy*=0.3; }
  } else {
    const so=STYLE(), sp=p.stunT>0 ? 0 : T.moveSpeed*R.moveMul*(so.move||1)*(p.strikeCd>0?(so.strikeSlow??0.55):1)*(p.charging?0.5:1)*(p.blockHeld?0.4:1);
    const k=Math.min(1,((mv.x||mv.y)?14:11)*dt);
    p.vx+=(mv.x*sp-p.vx)*k; p.vy+=(mv.y*sp-p.vy)*k;
  }
  p.x+=p.vx*dt; p.y+=p.vy*dt; collide(p);
  { const so=STYLE(); so.update && so.update(dt); }

  for (const e of enemies){
    if (e.dead) continue;
    if (e.spawnT>0){ e.spawnT-=dt; continue; }
    e.flashT-=dt; e.stunT-=dt; tickStatus(e,dt); if (e.dead) continue;
    const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1, a=Math.atan2(dy,dx);
    e.mx=0; e.my=0;
    if (isSpecBoss(e)) bossUpdate(e,dt);
    else if (e.kind==='gravemark') updateGravemark(e,dt,dx,dy,d,a);
    else if (e.stunT<=0){
      if (e.kind==='rusher'){
        const sp=150*T.enemySpeed;
        if (e.state==='chase'){
          e.face=a; e.mx=dx/d*sp; e.my=dy/d*sp; e.timer-=dt;
          if (d<RUSH.reach+RUSH.step*RUSH.swingT && e.timer<=0 && !(e.rootT>0 && has('deeproots'))){ e.state='windup'; e.timer=e.windDur=RUSH.wind*R.windMul; e.lungeA=a; }
        } else if (e.state==='windup'){
          // Tracks the player until the last 0.18s, then commits: that's the dodge window.
          e.timer-=dt; if (e.timer>0.18){ e.lungeA=a; e.face=a; }
          if (e.timer<=0){ e.state='swing'; e.timer=RUSH.swingT; e.hitDone=false; sparks(e.x,e.y,e.lungeA,6,COL.threat,380,.9); }
        } else if (e.state==='swing'){
          const s=RUSH.step*T.enemySpeed; e.mx=Math.cos(e.lungeA)*s; e.my=Math.sin(e.lungeA)*s; e.timer-=dt;
          if (!e.hitDone && d<RUSH.reach+p.r && (d<e.r+p.r+4 || Math.abs(angDiff(a,e.lungeA))<RUSH.arc/2)){ if (hurtPlayer(12,e.lungeA,'rusher',{attacker:e})) e.hitDone=true; }
          if (e.timer<=0){ e.state='recover'; e.timer=0.6; }
        } else {
          e.timer-=dt; if (e.timer<=0){ e.state='chase'; e.timer=rand(.4,1); }
        }
      } else {
        const sp=125*T.enemySpeed;
        if (e.state!=='charge' || e.timer>0.2) e.face=a; // aim locks for the last 0.2s of the charge
        const radial = d>360?1:d<250?-1:0;
        e.mx=(dx/d*radial + -dy/d*e.strafe*0.75)*sp; e.my=(dy/d*radial + dx/d*e.strafe*0.75)*sp;
        if (e.state==='move'){
          e.timer-=dt; if (Math.random()<dt*.3) e.strafe*=-1;
          if (e.timer<=0 && d<620 && !(e.rootT>0 && has('deeproots'))){ e.state='charge'; e.timer=e.windDur=0.65*R.windMul; }
        } else if (e.state==='charge'){
          e.mx*=0.15; e.my*=0.15; e.timer-=dt; e.aimD=d;
          if (e.timer<=0){
            const s=330*T.enemySpeed, fa=e.face;
            bullets.push({x:e.x+Math.cos(fa)*16,y:e.y+Math.sin(fa)*16,vx:Math.cos(fa)*s,vy:Math.sin(fa)*s,r:7,dead:false,t:0});
            sparks(e.x+Math.cos(fa)*16,e.y+Math.sin(fa)*16,fa,5,COL.amber,300,.4);
            e.state='move'; e.timer=rand(1.6,2.8);
          }
        }
      }
    }
    if (e.rootT>0 && (!e.isBoss || e.state==='walk' || e.bstate==='REPOSITION')){ e.mx=0; e.my=0; }
    const kd=Math.min(1,(e.kbT>0?3:8)*dt); e.vx-=e.vx*kd; e.vy-=e.vy*kd;
    e.x+=(e.mx+e.vx)*dt; e.y+=(e.my+e.vy)*dt;
    if (!e.isBoss) for (const o of enemies){ if (o===e||o.dead||o.spawnT>0) continue; const ox=e.x-o.x, oy=e.y-o.y, od=Math.hypot(ox,oy), m=e.r+o.r+2; if (od>0&&od<m){ const w=o.kind==='gravemark'?1:.5; e.x+=ox/od*(m-od)*w; e.y+=oy/od*(m-od)*w; } }
    const tx=e.x, ty=e.y, hitWall=collide(e) || Math.abs(e.x-tx)+Math.abs(e.y-ty)>0.5;
    if (e.kind==='gravemark' && e.state==='charging' && hitWall) gravemarkCrash(e);
    if (isSpecBoss(e) && e.bstate==='ACTIVE' && e.atk && e.atk.step.prim==='charge' && hitWall) e.atk.stopped=true;
    if (hitWall && e.kbT>0 && !e.isBoss){ e.kbT=0; damageEnemy(e,val('kinetic'),Math.atan2(e.vy,e.vx)+Math.PI,0,0.3,{src:'boon',c:HEROES.bastion.c}); texts.push({x:e.x,y:e.y-e.r-20,v:'SLAM',t:0,c:HEROES.bastion.c}); addShake(5); }
  }
  enemies=enemies.filter(e=>!e.dead);

  // Gravemark is solid: the player can't walk through it.
  if (boss && boss.spawnT<=0){ const ox=p.x-boss.x, oy=p.y-boss.y, od=Math.hypot(ox,oy)||0.01, m=boss.r+p.r; if (od<m){ p.x=boss.x+ox/od*m; p.y=boss.y+oy/od*m; collide(p); } }

  for (const b of bullets){
    b.t+=dt; b.px=b.x; b.py=b.y; b.x+=b.vx*dt; b.y+=b.vy*dt;
    if (b.t>4){ b.dead=true; continue; }
    if (b.x<20||b.y<20||b.x>ARENA.w-20||b.y>ARENA.h-20||inObstacle(b.x,b.y)){ b.dead=true; sparks(b.x,b.y,Math.atan2(-b.vy,-b.vx),6,COL.amber,250); continue; }
    if (b.friendly){
      for (const e of liveEnemies()) if (Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){ b.dead=true; damageEnemy(e,b.dmg||18,Math.atan2(b.vy,b.vx),200,0.2,{src:'boon',c:HEROES.bastion.c}); break; }
      continue;
    }
    if (Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){
      const res = p.reflectT>0 ? 'aegis' : hurtPlayer(b.dmg||10,Math.atan2(b.vy,b.vx),b.src||'needle',{bullet:b});
      if (res==='aegis' || res==='parried' || (res==='blocked' && run.style==='magnetar')){
        b.dmg = res==='parried' ? 2*(b.dmg||10) : 18;
        // Aegis: send it back at the nearest enemy.
        const t=nearestEnemy(p.x,p.y,900), s=Math.hypot(b.vx,b.vy)*1.3, ra=t?Math.atan2(t.y-b.y,t.x-b.x):Math.atan2(-b.vy,-b.vx);
        b.vx=Math.cos(ra)*s; b.vy=Math.sin(ra)*s; b.friendly=true; sparks(b.x,b.y,ra,8,HEROES.bastion.c,320,.6); texts.push({x:p.x,y:p.y-30,v:'REFLECT',t:0,c:HEROES.bastion.c});
      } else if (res){ b.dead=true; }
    }
  }
  bullets=bullets.filter(b=>!b.dead);

  for (const r of rocks){
    r.t+=dt;
    if (r.t>=r.dur){
      r.dead=true;
      if (Math.hypot(p.x-r.tx,p.y-r.ty)<r.r+p.r*0.5) hurtPlayer(14,Math.atan2(p.y-r.ty,p.x-r.tx),'rock');
      fx.push({type:'impact',x:r.tx,y:r.ty,t:0,dur:.18,size:60,rot:rand(PI2),c:COL.boon});
      sparks(r.tx,r.ty,rand(PI2),12,'#9aa0ad',420,Math.PI); addShake(5);
      stainAt(r.tx,r.ty,r.r*0.8);
    }
  }
  rocks=rocks.filter(r=>!r.dead);
  for (const c of cracks){ c.t+=dt; if (c.t>c.arm && c.t<c.dur && Math.hypot(p.x-c.x,p.y-c.y)<c.r+p.r*0.4) hurtPlayer(8,Math.atan2(p.y-c.y,p.x-c.x),'cracks'); }
  cracks=cracks.filter(c=>c.t<c.dur);
  for (const k of packs){
    k.t+=dt;
    if (k.t>0.4 && p.hp<p.maxHp && Math.hypot(p.x-k.x,p.y-k.y)<p.r+16){
      k.dead=true; const h=Math.min(PACK.heal,p.maxHp-p.hp); p.hp+=h;
      texts.push({x:p.x,y:p.y-28,v:'+'+Math.round(h),t:0,c:COL.heal}); sparks(k.x,k.y,-Math.PI/2,10,COL.heal,300,Math.PI);
    }
  }
  packs=packs.filter(k=>!k.dead);
  updateZones(dt);
  updateBossHazards(dt);

  if (roomPhase==='fight' && !enemies.length){
    roomPhase='cleared'; clearT=0.9; waveClearing=true;
    if (wave>=RUN_WAVES){ winRun(); return; }
    banner('CLEAR',true);
  }
  if (roomPhase==='cleared'){ clearT-=dt; if (clearT<=0){ openExits(); roomPhase='exits'; } }
  else if (roomPhase==='exits') updateExits(dt);
  else if (roomPhase==='reward' && arrivalT>0){ arrivalT-=dt; if (arrivalT<=0) startWave(); }
  updateCam(dt);
}
