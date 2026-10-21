// Volt: The comms boon draft.
'use strict';

/* Comms draft between waves */
let draftCards=[], lastCaller=null;
function rollRarity(){
  const rk=metaRank('rapport'), w=[RARITY[0].w, RARITY[1].w+6*rk, RARITY[2].w+3*rk], tot=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot; for (let i=0;i<w.length;i++){ if ((r-=w[i])<0) return i; } return 0;
}
function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
let draftKind='boon', draftHero=null;
function openDraft(kind='boon', hero=null, reroll=false){
  if (!reroll){
    const who0 = kind==='tech' ? 'patch' : (hero||pick(Object.keys(HEROES).filter(h=>h!==lastCaller)));
    if (maybeIntro(who0, ()=>openDraftNow(kind,who0,false))) return;
    // A hero with something new to say talks first (once per hero per run), then offers boons.
    const told=run.story||(run.story={});
    if (!told[who0]){ const pages=nextStory('comms',who0); if (pages){ told[who0]=true; runDialogue(pages,'Comms',()=>openDraftNow(kind,who0,false)); return; } }
    return openDraftNow(kind,who0,false);
  }
  return openDraftNow(kind,hero,reroll);
}
function openDraftNow(kind, hero, reroll, restored=null){
  const p=player; draftKind=kind;
  let who, line;
  if(restored){who=hero;line=restored.line;draftCards=checkpointCopy(restored.cards);}
  else if (kind==='tech'){
    who='patch'; const n=reroll?run.calls.patch:(run.calls.patch=(run.calls.patch||0)+1); line=reroll?"Different crate, same rules.":n===1?PATCH.first:commsLine('patch');
    draftCards=shuffle(TECH.filter(t=>!t.variant||!p.tech[t.id])).slice(0,3).map(t=>({kind:'tech',id:t.id}));
  } else {
    who=hero||pick(Object.keys(HEROES).filter(h=>h!==lastCaller)); lastCaller=who; draftHero=who;
    const n=reroll?run.calls[who]:(run.calls[who]=(run.calls[who]||0)+1); line=reroll?"Fine. Something else, then.":n===1?HEROES[who].first:commsLine(who);
    const pool=BOONS.filter(b=>b.weapon===run.style && b.hero===who && !(p.owned[b.id] && p.owned[b.id].level>=3));
    draftCards=shuffle(pool).slice(0,3).map(b=>{ const o=p.owned[b.id]; return {kind:'boon',id:b.id,rarity:o?o.rarity:rollRarity(),levelUp:!!o}; });
  }
  if(!restored&&kind!=='tech'){const pool=eligibleHybrids(who);if(pool.length)draftCards[draftCards.length-1]={kind:'hybrid',id:pick(pool)};}
  draftHero=who;
  const comms=$('#draftComms'), sp=SPEAKERS[who];
  comms.style.setProperty('--c',sp.c); setPortrait($('#draftPortrait'),who);
  $('#draftLine').textContent=line; $('#draftWho').innerHTML=`<b>${sp.name}</b> · ${sp.role}`;playVoice(who,line);
  const box=$('#draftCards'); box.innerHTML='';
  draftCards.forEach((c,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='card';
    if(c.kind==='hybrid'){const h=HYBRIDS[c.id];b.style.setProperty('--c',COL.boon);b.innerHTML=`<span class="card-top"><span class="tag">Hybrid · ${h.heroes.map(id=>SPEAKERS[id].name).join(' + ')}</span><span class="card-key">${i+1}</span></span><strong>${h.name}</strong><span class="card-desc">${h.desc}</span><span class="card-foot">Combine the powers collected this run</span>`;}else if (c.kind==='tech'){
      const t=TECH.find(x=>x.id===c.id), n=p.tech[c.id]||0;
      b.style.setProperty('--c',COL.heal);
      b.innerHTML=`<span class="card-top"><span class="tag">Fortress tech</span><span class="card-key">${i+1}</span></span><strong>${t.name}</strong><span class="card-desc">${t.desc}</span><span class="card-foot">${n?'Owned ×'+n+' · stacks':'New'}</span>`;
    } else {
      const def=BOON_BY_ID[c.id], o=p.owned[c.id], lvl=o?o.level+1:1, rar=RARITY[c.rarity];
      const base=k=>def[k]?Math.round(def[k][c.rarity]*(1+0.4*(lvl-1))*100)/100:0;
      const old=def.slot!=='passive' && p.slots[def.slot] && p.slots[def.slot].id!==c.id ? BOON_BY_ID[p.slots[def.slot].id] : null;
      b.style.setProperty('--c',HEROES[def.hero].c); b.style.setProperty('--r',rar.c);
      b.innerHTML=`<span class="card-top"><span class="tag">${SLOT_NAME[def.slot]} · <em>${rar.name}</em></span><span class="card-key">${i+1}</span></span><strong>${def.name}${lvl>1?' '+'I'.repeat(lvl):''}</strong><span class="card-desc">${def.desc(base('v'),base('v2'))}</span><span class="card-foot">${c.levelUp?`Level up · ${lvl}/3`:old?`Replaces ${old.name}`:'New'}</span>`;
    }
    // Keep the consequences of choosing visible before the long mechanics copy.
    const foot=b.querySelector('.card-foot'),title=b.querySelector('strong');
    const icon=document.createElement('span');icon.className='power-art';icon.innerHTML=powerEmblem(run.style,c.kind==='boon'?BOON_BY_ID[c.id].hero:c.kind==='hybrid'?HYBRIDS[c.id].heroes[0]:'patch');title.before(icon);
    if(foot&&title){foot.classList.add('card-decision');title.after(foot);}
    const desc=b.querySelector('.card-desc');
    if(desc){desc.innerHTML=desc.innerHTML.replace(/<br\s*\/?>/gi,' ');const full=plainPowerCopy(desc.textContent);desc.textContent=full.split(/(?<=[.!?])\s+/)[0];
      if(full!==desc.textContent){const details=document.createElement('span');details.className='card-details';details.hidden=true;details.textContent=full;desc.after(details);
       const more=document.createElement('button');more.type='button';more.className='power-details-toggle';more.textContent='Details';more.setAttribute('aria-expanded','false');more.onclick=e=>{e.stopPropagation();details.hidden=!details.hidden;more.setAttribute('aria-expanded',String(!details.hidden));more.textContent=details.hidden?'Details':'Less';};
       // A separate control avoids nesting a button inside the selection button.
       b.afterDetails=more;
      }
    }
    b.addEventListener('click',()=>pickCard(i));
    box.appendChild(b);
    const wrap=document.createElement('div');wrap.className='power-choice';b.replaceWith(wrap);wrap.append(b);if(b.afterDetails)wrap.append(b.afterDetails);
  });
  const rr=$('#btnReroll'); rr.hidden=run.rerolls<=0; rr.textContent=`Reroll (${run.rerolls})`;
  state='draft'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null;
  show('#mDraft',true);$('#mDraft .panel').scrollTop=0; box.querySelector('.card')?.focus({preventScroll:true});
}
function plainPowerCopy(text){return text.replace(/\b\d+(?:\.\d+)?-range\s*/g,'').replace(/within \d+(?:\.\d+)? range/g,'nearby').replace(/at \d+(?:\.\d+)? radians per second/g,'as they fly').replace(/\s+/g,' ').trim();}
function rerollDraft(){ if (state!=='draft' || run.rerolls<=0) return; run.rerolls--; openDraft(draftKind,draftHero,true); }
function pickCard(i){
  if (state!=='draft' || !draftCards[i]) return;
  const c=draftCards[i]; sfx('power_pick');
  if(c.kind==='hybrid'){if(!takeHybrid(c.id))return;}else if (c.kind==='tech') takeTech(c.id); else takeBoon(c.id,c.rarity);
  const name=c.kind==='hybrid'?HYBRIDS[c.id].name:c.kind==='tech'?TECH.find(x=>x.id===c.id).name:BOON_BY_ID[c.id].name;
  show('#mDraft',false);stopVoice();state='play';draftCards=[];
  texts.push({x:player.x,y:player.y-40,v:name.toUpperCase(),t:0,big:true,c:c.kind==='hybrid'?COL.boon:c.kind==='tech'?COL.heal:HEROES[BOON_BY_ID[c.id].hero].c});
  startWave();
}
function refreshSlotHud(){
  const map={strike:'s',power:'p',dash:'d',overload:'q'};
  for (const [slot,k] of Object.entries(map)){
    const o=player.slots[slot], c=o?HEROES[BOON_BY_ID[o.id].hero].c:'';
    for (const el of [hud.ab[k],hud.tb[k]]){ el.classList.toggle('boon',!!o); if (o) el.style.setProperty('--bc',c); el.title=o?BOON_BY_ID[o.id].name:''; }
  }
}
function fillBuild(el){
  el.innerHTML='';
  const list=ownedList();
  if (!list.length){ el.innerHTML='<span class="hint">No powers yet. Clear a wave and someone will call in.</span>'; return; }
  for (const b of list){ const c=document.createElement('span'); c.className='boon-chip'; c.textContent=(b.slot&&b.slot!=='tech'?SLOT_NAME[b.slot]+': ':'')+b.name; c.style.setProperty('--c',b.c); el.appendChild(c); }
}

function updateCam(dt){
  if(boss?.kind==='glasswake'&&boss.atk?.hallPuzzle&&['WINDUP','ACTIVE'].includes(boss.bstate)){
    const figures=[boss,...boss.atk.decoys.filter(d=>!d.dead),player],xs=figures.map(f=>f.x),ys=figures.map(f=>f.y),left=Math.min(...xs)-95,right=Math.max(...xs)+95,top=Math.min(...ys)-130,bottom=Math.max(...ys)+40;
    const uiTop=inputMode==='touch'?145:155,viewH=Math.max(120,H-uiTop-24),zoom=Math.min(.85,(W-90)/(right-left),viewH/(bottom-top)),cx=(left+right)/2,cy=(top+bottom)/2-((uiTop+viewH/2)-H/2)/zoom,k=1-Math.exp(-dt*10);
    cam.zoom+=(zoom-cam.zoom)*k;cam.x+=(cx-cam.x)*k;cam.y+=(cy-cam.y)*k;return;
  }
  if(typeof shop!=='undefined'&&shop&&roomPhase==='shop'){
    cam.zoom=Math.min(.8,(W-80)/1100,(H-90)/620);cam.x=800;cam.y=400;return;
  }
  if(typeof tut!=='undefined'&&tut&&inputMode==='touch'){
    const v=combatViewport(),target=enemies.find(e=>!e.dead&&(e.tutWeak||e.tutDummy)),cx=target?(player.x+target.x)/2:player.x,cy=target?(player.y+target.y)/2-25:player.y-30;
    const span=target?Math.abs(player.y-target.y)+190:240;
    cam.zoom=clamp(Math.min(v.h/span,v.w/600),.35,.9);cam.x=cx;cam.y=cy;return;
  }
  cam.zoom = (inputMode==='touch' ? clamp(Math.min(W,H)/540,0.62,1.3) : clamp(Math.min(W,H)/760,0.5,1.3))*(curDistrict()==='redactor'?.85:1);
  const p=player, lead=40;
  const tx=p.x+Math.cos(p.aim)*lead, ty=p.y+Math.sin(p.aim)*lead-(curDistrict()==='redactor'?50:0);
  const k=Math.min(1,6*dt); cam.x+=(tx-cam.x)*k; cam.y+=(ty-cam.y)*k;
  const hw=W/2/cam.zoom, hh=H/2/cam.zoom, m=140;
  cam.x = hw*2>ARENA.w+m*2 ? ARENA.w/2 : clamp(cam.x,hw-m,ARENA.w-hw+m);
  cam.y = hh*2>ARENA.h+m*2 ? ARENA.h/2 : clamp(cam.y,hh-m,ARENA.h-hh+m);
}
function updateFx(dt){
  for (const f of fx) f.t+=dt; fx=fx.filter(f=>f.t<f.dur);
  for (const b of bolts) b.t+=dt; bolts=bolts.filter(b=>b.t<b.dur);
  for (const q of particles){ q.life-=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vx*=Math.pow(.02,dt); q.vy*=Math.pow(.02,dt); }
  particles=particles.filter(q=>q.life>0);
  for (const t of texts) t.t+=dt; texts=texts.filter(t=>t.t<.75);
  if (typeof vfxUpdate==='function') vfxUpdate(dt);
}
