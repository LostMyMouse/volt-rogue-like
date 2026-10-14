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
  const p=player; draftKind=kind;
  let who, line;
  if (kind==='tech'){
    who='patch'; const n=reroll?run.calls.patch:(run.calls.patch=(run.calls.patch||0)+1); line=reroll?"Different crate, same rules.":n===1?PATCH.first:pick(PATCH.lines);
    draftCards=shuffle(TECH.slice()).slice(0,3).map(t=>({kind:'tech',id:t.id}));
  } else {
    who=hero||pick(Object.keys(HEROES).filter(h=>h!==lastCaller)); lastCaller=who; draftHero=who;
    const n=reroll?run.calls[who]:(run.calls[who]=(run.calls[who]||0)+1); line=reroll?"Fine. Something else, then.":n===1?HEROES[who].first:pick(HEROES[who].lines);
    const pool=BOONS.filter(b=>b.hero===who && !(p.owned[b.id] && p.owned[b.id].level>=3));
    draftCards=shuffle(pool).slice(0,3).map(b=>{ const o=p.owned[b.id]; return {kind:'boon',id:b.id,rarity:o?o.rarity:rollRarity(),levelUp:!!o}; });
  }
  const comms=$('#draftComms'), sp=SPEAKERS[who];
  comms.style.setProperty('--c',sp.c); setPortrait($('#draftPortrait'),who);
  $('#draftLine').textContent=line; $('#draftWho').innerHTML=`<b>${sp.name}</b> · ${sp.role}`;
  const box=$('#draftCards'); box.innerHTML='';
  draftCards.forEach((c,i)=>{
    const b=document.createElement('button'); b.type='button'; b.className='card';
    if (c.kind==='tech'){
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
    b.addEventListener('click',()=>pickCard(i));
    box.appendChild(b);
  });
  const rr=$('#btnReroll'); rr.hidden=run.rerolls<=0; rr.textContent=`Reroll (${run.rerolls})`;
  state='draft'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null;
  show('#mDraft',true); box.firstChild && box.firstChild.focus();
}
function rerollDraft(){ if (state!=='draft' || run.rerolls<=0) return; run.rerolls--; openDraft(draftKind,draftHero,true); }
function pickCard(i){
  if (state!=='draft' || !draftCards[i]) return;
  const c=draftCards[i];
  if (c.kind==='tech') takeTech(c.id); else takeBoon(c.id,c.rarity);
  const name=c.kind==='tech'?TECH.find(x=>x.id===c.id).name:BOON_BY_ID[c.id].name;
  show('#mDraft',false); state='play'; draftCards=[];
  texts.push({x:player.x,y:player.y-40,v:name.toUpperCase(),t:0,big:true,c:c.kind==='tech'?COL.heal:HEROES[BOON_BY_ID[c.id].hero].c});
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
  if (!list.length){ el.innerHTML='<span class="hint">No boons yet. Clear a wave and someone will call in.</span>'; return; }
  for (const b of list){ const c=document.createElement('span'); c.className='boon-chip'; c.textContent=(b.slot&&b.slot!=='tech'?SLOT_NAME[b.slot]+': ':'')+b.name; c.style.setProperty('--c',b.c); el.appendChild(c); }
}

function updateCam(dt){
  cam.zoom=clamp(Math.min(W,H)/760,0.5,1.3);
  const p=player, lead=40;
  const tx=p.x+Math.cos(p.aim)*lead, ty=p.y+Math.sin(p.aim)*lead;
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
}
