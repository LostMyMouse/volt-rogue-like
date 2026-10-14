// Volt: ?debug helpers for testing.
'use strict';

// ?debug: ] skips to the next Gravemark wave. window.__volt exposes state for testing.
if (new URLSearchParams(location.search).has('debug')){
  addEventListener('keydown', e => { if (e.key===']' && state==='play'){ const next=BOSS_WAVES.find(w=>w>wave)||RUN_WAVES; wave=next-1; buildRoom(next); roomPhase='reward'; startWave(); } });
  window.__volt = { get s(){ return {state,wave,player,enemies,bullets,boss,run,kills,packs,rocks,zones,R}; }, jump(w){ wave=w-1; buildRoom(w); show('#mDraft',false); if (state==='draft') state='play'; startWave(); }, exits(){ return exits; }, jumpTo(i){ jumpTo(exits[i]); }, transit(){ return transit; }, phase(){ return roomPhase; }, saveData(){ return save; }, fortress:openFortress, buy:buyMeta, gain(n){ gainShards(n,player.x,player.y); }, god(on=true){ player.iT = on?1e9:0; }, results:fillResults, portrait:setPortrait, draft:openDraft, pick:pickCard, setStyle(id){ run.style=id; const so=STYLES[id]; so.init && so.init(player); applyStyleHud(); }, act:{ strike(){ player.strikeCd=0; doStrike(); }, power(){ player.powerCd=0; doPower(); releasePower(); }, powerDown(){ player.powerCd=0; doPower(); }, powerUp(){ releasePower(); }, block(){ pressBlock(); }, unblock(){ releaseBlock(); }, dash(){ player.dashCd=0; player.dashT=0; doDash(); }, sig(){ player.sig=100; doSig(); } }, hurtMe(d){ player.iT=0; return hurtPlayer(d,0,'rusher'); }, give(id,r=0){ takeBoon(id,r); }, tech:takeTech, hurt(e,d){ damageEnemy(e,d,0,0,0); },
    step(n=60,dt=1/60){ for (let i=0;i<n && (state==='play'||state==='transit');i++){ time+=dt; if (state==='transit') updateTransit(dt); else if (hitStop>0) hitStop-=dt; else update(dt); updateFx(dt); } render(); updateHud(); },
    snap(){ return cv.toDataURL('image/jpeg',0.7); },
    // Boss harness (spec §Minimal required helpers): fight any boss, skip intro, set HP/phase, invulnerable player, hitboxes, force an attack.
    fightBoss(id,{skipIntro=false}={}){
      startGame(); if (state==='intro') dismissIntro(true); show('#mDraft',false); state='play'; draftCards=[];
      const w=+Object.keys(BOSS_PLAN).find(k=>BOSS_PLAN[k]===id)||5;
      wave=w-1; buildRoom(w); startWave(); player.x=ARENA.w/2; player.y=ARENA.h*0.75;
      if (skipIntro && isSpecBoss(boss)){ boss.invuln=false; bossNextAttack(boss); }
      return boss;
    },
    bossHp(frac){ if (boss) boss.hp=boss.maxHp*frac; },
    bossAttack(id){ if (isSpecBoss(boss)){ boss.atk={id,def:BOSSES[boss.kind].attacks[id],stepI:-1,step:null}; boss.invuln=false; bossBeginStep(boss,0); } },
    hitboxes(on=true){ bossDebug.hitboxes=on; },
    bossState(){ return boss && {kind:boss.kind,bstate:boss.bstate,phase:boss.phase,queued:boss.queuedPhase,hp:Math.round(boss.hp),atk:boss.atk&&boss.atk.id,step:boss.atk&&boss.atk.stepI,invuln:boss.invuln}; } };
  // ?debug&boss=kilnheart drops straight into that boss fight.
  if (new URLSearchParams(location.search).has('nointro')) window.__volt.noIntro=true;
  const want=new URLSearchParams(location.search).get('boss');
  if (want) setTimeout(()=>window.__volt.fightBoss(want),50);
}
