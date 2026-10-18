// Enemy Composure: parries create large openings; direct attacks maintain pressure.
'use strict';
const COMPOSURE = { normal:70, boss:300, parry:35, bossParry:60, breakTime:3, recoverAfter:5, regen:0.05, multiplier:2 };
function hasComposure(e){ return e && !e.dead && !e.isBud && !e.isPlate && !e.isIce && !e.isDecoy && !e.tutDummy; }
function initComposure(e){
  if (e.maxComposure===undefined){ e.maxComposure=e.kind==='redactor'?360:e.isBoss?COMPOSURE.boss:COMPOSURE.normal; e.composure=e.maxComposure; e.composureBrokenT=0; e.composureRest=0; e.composureBreaks=0; }
  return e;
}
function damageComposure(e,amount,cause='attack'){
  if (!hasComposure(e) || e.invuln || amount<=0) return false;
  initComposure(e); if (e.composureBrokenT>0) return false;
  e.composure=Math.max(0,e.composure-amount); e.composureRest=0;
  if (e.composure>0) return false;
  e.composureBrokenT=COMPOSURE.breakTime; e.composureBreaks++;
  exposeEnemy(e,COMPOSURE.breakTime);
  texts.push({x:e.x,y:e.y-e.r-55,v:'COMPOSURE BREAK · ×2',t:0,big:true,c:COL.amber});
  fx.push({type:'shock',x:e.x,y:e.y,t:0,dur:.4,r:e.r+70,c:COL.amber});
  hitStop=Math.max(hitStop,.12); addShake(e.isBoss?10:6); sfx('guardbreak',{vol:.8});
  return true;
}
function tickComposure(e,dt){
  if (!hasComposure(e)) return;
  initComposure(e);
  if(typeof tut!=='undefined'&&tut&&e.tutWeak&&tut.age<tut.readyAt)return;
  if (e.composureBrokenT>0){
    e.composureBrokenT=Math.max(0,e.composureBrokenT-dt);
    if (!e.composureBrokenT){ e.composure=e.maxComposure; e.composureRest=0; }
    return;
  }
  e.composureRest+=dt;
  if (e.composureRest>COMPOSURE.recoverAfter) e.composure=Math.min(e.maxComposure,e.composure+e.maxComposure*COMPOSURE.regen*dt);
}
function drawComposureMeters(){
  for (const e of enemies){
    if (!hasComposure(e)||e.isBoss||e.spawnT>0) continue;
    initComposure(e);
    if (e.composure===e.maxComposure && !(typeof tut!=='undefined' && tut)) continue;
    const top=enemySpriteTop(e),w=44,x=e.x-w/2,y=(top===null?e.y-e.r-30:top-18);
    ctx.save(); ctx.fillStyle=COL.ink; ctx.fillRect(x-2,y-2,w+4,8);
    ctx.fillStyle=e.composureBrokenT>0?'#ffffff':COL.amber; ctx.fillRect(x,y,w*e.composure/e.maxComposure,4);
    ctx.restore();
  }
}
function updateComposureHud(){
  const bar=$('#bossComposure'); if (!bar) return;
  bar.hidden=!(boss && !boss.dead);
  if (bar.hidden) return;
  initComposure(boss); const value=Math.round(100*boss.composure/boss.maxComposure);
  bar.style.setProperty('--composure',value/100); bar.setAttribute('aria-valuenow',value);
  bar.classList.toggle('broken',boss.composureBrokenT>0);
  bar.querySelector('span').textContent=boss.composureBrokenT>0?'COMPOSURE BROKEN · DOUBLE DAMAGE':'COMPOSURE';
}
