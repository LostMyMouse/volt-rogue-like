// Volt: Rooftop layouts, jump points, Renown Shards and Fortress upgrades.
'use strict';

/* ---------- Rooftops and jump points ---------- */
// Hades-style room flow. Clearing a rooftop opens 1-3 jump points on its edges, each showing the reward waiting
// on the next rooftop. Walk onto one to leap across. The reward is claimed on landing, before the fight starts.
// Gravemark's rooftops have a single way in. Odds mirror Hades: mostly boons, some upgrades, meta currency rare.
const REWARD_ODDS = { boon:60, tech:25, shards:15 };
const DOOR_COUNT_ODDS = [[1,20],[2,50],[3,30]];
const SHARD_ROOM = [12,18], SHARD_BOSS = [30,40,60];
const PADS = [ {x:ARENA.w/2, y:44, side:'top'}, {x:44, y:ARENA.h*0.48, side:'left'}, {x:ARENA.w-44, y:ARENA.h*0.48, side:'right'} ];
const LANDING = { top:{x:ARENA.w/2, y:ARENA.h-90}, left:{x:ARENA.w-90, y:ARENA.h*0.48}, right:{x:90, y:ARENA.h*0.48} };
const REWARD_STYLE = {
  tech:{ c:COL.heal, label:'Fortress tech' },
  shards:{ c:COL.boon, label:'Renown shards' },
  boss:{ c:COL.boon, label:'Gravemark' },
};
let exits=[], roomPhase='reward', clearT=0, arrivalT=0, transit=null;
const weighted = list => { const tot=list.reduce((a,[,w])=>a+w,0); let r=Math.random()*tot; for (const [v,w] of list){ if ((r-=w)<0) return v; } return list[0][0]; };

// The first rooftop and Gravemark's arenas use the concept-art layout; everything else is shuffled props.
const CONCEPT_LAYOUT = [
  {x:70,y:60,w:200,h:200,ht:120,kind:'tower',circle:true},
  {x:1210,y:40,w:220,h:170,ht:110,kind:'hut'},
  {x:940,y:60,w:110,h:60,ht:40,kind:'box'},
  {x:90,y:760,w:230,h:140,ht:70,kind:'ac'},
  {x:1200,y:770,w:190,h:130,ht:80,kind:'vent'},
];
const PROPS = [
  {w:200,h:200,ht:120,kind:'tower',circle:true}, {w:220,h:170,ht:110,kind:'hut'}, {w:230,h:140,ht:70,kind:'ac'},
  {w:190,h:130,ht:80,kind:'vent'}, {w:160,h:100,ht:60,kind:'ac'}, {w:110,h:60,ht:40,kind:'box'}, {w:90,h:90,ht:50,kind:'box'}, {w:150,h:110,ht:70,kind:'vent'},
];
const FLOOR_TINTS = ['#1b2537','#1d2434','#1a2639','#1f2539','#1b2733'];
let floorTint = FLOOR_TINTS[0];
function finishObstacles(list){ for (const b of list) if (b.circle){ b.cx=b.x+b.w/2; b.cy=b.y+b.h/2; b.rad=b.w/2; } return list; }
function randomLayout(){
  const keep=[...PADS, ...Object.values(LANDING), {x:ARENA.w/2,y:ARENA.h/2}];
  const out=[], n=4+Math.floor(Math.random()*3);
  for (let tries=0; out.length<n && tries<400; tries++){
    const t=pick(PROPS), b=Object.assign({}, t, {x:rand(60,ARENA.w-60-t.w), y:rand(70,ARENA.h-60-t.h)});
    const cx=b.x+b.w/2, cy=b.y+b.h/2;
    if (keep.some(k=>Math.hypot(k.x-cx,k.y-cy) < Math.max(b.w,b.h)/2 + (k.x===ARENA.w/2&&k.y===ARENA.h/2?230:150))) continue;
    if (out.some(o=>b.x<o.x+o.w+70 && b.x+b.w+70>o.x && b.y<o.y+o.h+70 && b.y+b.h+70>o.y)) continue;
    out.push(b);
  }
  return out;
}
function buildRoom(n){
  const concept = n<=1 || BOSS_WAVES.includes(n);
  obstacles = finishObstacles(concept ? CONCEPT_LAYOUT.map(b=>Object.assign({},b)) : randomLayout());
  floorTint = concept ? FLOOR_TINTS[0] : pick(FLOOR_TINTS);
  for (const s of floorBlots){ s.x=rand(0,ARENA.w); s.y=rand(0,ARENA.h); }
  for (const s of stains){ s.x=rand(60,ARENA.w-60); s.y=rand(60,ARENA.h-60); }
  enemies=[]; bullets=[]; decals=[]; rocks=[]; cracks=[]; packs=[]; zones=[]; exits=[]; boss=null;
}
function rollReward(taken){
  for (let tries=0; tries<30; tries++){
    const type=weighted(Object.entries(REWARD_ODDS));
    if (type==='boon'){
      const heroes=Object.keys(HEROES).filter(h=>h!==lastCaller && !taken.some(t=>t.hero===h));
      if (heroes.length) return {type, hero:pick(heroes)};
    } else if (!taken.some(t=>t.type===type)) return {type};
  }
  return {type:'tech'};
}
function openExits(){
  const next=wave+1;
  if (BOSS_WAVES.includes(next)){ exits=[{...PADS[0], reward:{type:'boss'}, hold:0, t:0}]; return; }
  const count=weighted(DOOR_COUNT_ODDS), spots=count===1?[PADS[0]]:shuffle(PADS.slice()).slice(0,count), taken=[];
  exits=spots.map(s=>{ const r=rollReward(taken); taken.push(r); return {...s, reward:r, hold:0, t:0}; });
}
function exitNear(){ return exits.find(x=>Math.hypot(player.x-x.x,player.y-x.y)<58); }
function updateExits(dt){
  for (const x of exits){
    x.t+=dt;
    const on=Math.hypot(player.x-x.x,player.y-x.y)<58;
    x.hold = on ? x.hold+dt : Math.max(0,x.hold-dt*2);
    if (x.hold>=0.6){ jumpTo(x); return; }
  }
}
function jumpTo(x){
  if (!x || state!=='play') return;
  state='transit'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null;
  const out={top:[0,-1],left:[-1,0],right:[1,0]}[x.side];
  transit={t:0, ex:x, from:{x:player.x,y:player.y}, to:{x:x.x+out[0]*160, y:x.y+out[1]*160}, swapped:false};
  player.vx=player.vy=0; player.dashT=0;
  sparks(player.x,player.y,Math.atan2(out[1],out[0])+Math.PI,14,COL.volt,520,.7);
}
const TRANSIT_OUT=0.45, TRANSIT_TOTAL=1.05;
function updateTransit(dt){
  const tr=transit, p=player; tr.t+=dt;
  if (!tr.swapped){
    const k=Math.min(1,tr.t/TRANSIT_OUT), e=k*k;
    p.x=tr.from.x+(tr.to.x-tr.from.x)*e; p.y=tr.from.y+(tr.to.y-tr.from.y)*e - Math.sin(Math.PI*k)*60;
    if (Math.random()<.8) particles.push({x:p.x,y:p.y,vx:rand(-60,60),vy:rand(-60,60),life:.25,max:.25,color:COL.volt,w:2});
    if (tr.t>=TRANSIT_OUT){
      tr.swapped=true;
      buildRoom(wave+1);
      const land=LANDING[tr.ex.side], back={top:[0,1],left:[1,0],right:[-1,0]}[tr.ex.side];
      tr.land=land; tr.from={x:land.x+back[0]*180, y:land.y+back[1]*180};
      p.x=tr.from.x; p.y=tr.from.y; cam.x=land.x; cam.y=land.y;
    }
  } else {
    const k=Math.min(1,(tr.t-TRANSIT_OUT)/(TRANSIT_TOTAL-TRANSIT_OUT)), e=1-(1-k)*(1-k);
    p.x=tr.from.x+(tr.land.x-tr.from.x)*e; p.y=tr.from.y+(tr.land.y-tr.from.y)*e - Math.sin(Math.PI*k)*60;
    if (k>=1){
      p.x=tr.land.x; p.y=tr.land.y; addShake(6); sparks(p.x,p.y,-Math.PI/2,16,COL.volt,420,Math.PI);
      fx.push({type:'shock',x:p.x,y:p.y,t:0,dur:.3,r:70,c:COL.volt});
      const reward=tr.ex.reward; transit=null; state='play';
      arrive(reward);
    }
  }
}
function arrive(reward){
  roomPhase='reward';
  if (reward.type==='boon') openDraft('boon',reward.hero);
  else if (reward.type==='tech') openDraft('tech');
  else if (reward.type==='shards'){
    const n=Math.round(rand(SHARD_ROOM[0],SHARD_ROOM[1]));
    gainShards(n, player.x, player.y-40);
    banner('+'+n+' RENOWN', true); arrivalT=1.4;
  } else { arrivalT=0.6; }
}
// Screen-edge pointers so off-screen jump points are never missed.
function drawExitPointers(){
  if (roomPhase!=='exits' || state!=='play') return;
  const m=34;
  for (const x of exits){
    const sx=(x.x-cam.x)*cam.zoom+W/2, sy=(x.y-74-cam.y)*cam.zoom+H/2;
    if (sx>m && sx<W-m && sy>m+40 && sy<H-m) continue;
    const cx=clamp(sx,m,W-m), cy=clamp(sy,m+50,H-m-70), a=Math.atan2(sy-cy,sx-cx), st=rewardStyle(x.reward), img=rewardIcon(x.reward);
    ctx.save(); ctx.translate(cx,cy);
    ctx.fillStyle=COL.ink; ctx.shadowColor=st.c; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(0,0,20,0,PI2); ctx.fill(); ctx.shadowBlur=0;
    ctx.save(); ctx.beginPath(); ctx.arc(0,0,17,0,PI2); ctx.clip(); if (img.complete && img.naturalWidth) ctx.drawImage(img,-17,-17,34,34); ctx.restore();
    ctx.strokeStyle=st.c; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,20,0,PI2); ctx.stroke();
    ctx.rotate(a); ctx.fillStyle=st.c; ctx.beginPath(); ctx.moveTo(32,0); ctx.lineTo(23,-8); ctx.lineTo(23,8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
function drawTransitOverlay(){
  if (!transit) return;
  const tr=transit, k = !tr.swapped ? Math.max(0,(tr.t-0.15)/(TRANSIT_OUT-0.15)) : 1-Math.min(1,(tr.t-TRANSIT_OUT)/0.35);
  if (k<=0) return;
  ctx.fillStyle=`rgba(4,7,14,${Math.min(1,k)})`; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=`rgba(38,191,255,${0.35*Math.min(1,k)})`; ctx.lineWidth=2;
  for (let i=0;i<14;i++){ const y=(i*97+time*900)%H, x=(i*211)%W; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+120,y-40); ctx.stroke(); }
}

/* Jump-point visuals: a glowing pad on the floor, the reward medallion floating above it */
const ICON_CACHE = {};
function rewardIcon(r){
  const key = r.type==='boon' ? r.hero : r.type;
  if (ICON_CACHE[key]) return ICON_CACHE[key];
  let inner, bg;
  if (r.type==='boon'){ inner=PORTRAIT_SVG[r.hero]; bg=HEROES[r.hero].c; }
  else if (r.type==='tech'){ bg=COL.heal; inner='<circle cx="32" cy="32" r="13" fill="none" stroke="#0b111c" stroke-width="7"/><g stroke="#0b111c" stroke-width="7" stroke-linecap="round"><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6"/></g>'; }
  else if (r.type==='shards'){ bg='#2a1748'; inner='<path d="M32 6 L50 26 L32 58 L14 26 Z" fill="#b56cff" stroke="#f4fbff" stroke-width="2"/><path d="M14 26 H50 M32 6 L26 26 L32 58 L38 26 Z" fill="none" stroke="#f4fbff" stroke-width="1.5" opacity=".7"/>'; }
  else { bg='#1a1428'; inner=PORTRAIT_SVG.gravemark; }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>${inner}</svg>`;
  const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  return ICON_CACHE[key]=img;
}
function rewardStyle(r){ return r.type==='boon' ? {c:HEROES[r.hero].c, label:SPEAKERS[r.hero].name+' · boon'} : REWARD_STYLE[r.type]; }
function drawExitPads(){
  for (const x of exits){
    const st=rewardStyle(x.reward), pop=Math.min(1,x.t/0.35), pulse=0.5+0.5*Math.sin(time*5+x.x);
    ctx.save(); ctx.globalAlpha=pop;
    const g=ctx.createRadialGradient(x.x,x.y,0,x.x,x.y,70); g.addColorStop(0,st.c); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=pop*(0.25+0.15*pulse); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x.x,x.y,70,46,0,0,PI2); ctx.fill();
    ctx.globalAlpha=pop; ctx.strokeStyle=st.c; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.lineDashOffset=-time*30;
    ctx.beginPath(); ctx.ellipse(x.x,x.y,48,30,0,0,PI2); ctx.stroke(); ctx.setLineDash([]);
    if (x.hold>0){ ctx.lineWidth=6; ctx.beginPath(); ctx.ellipse(x.x,x.y,48,30,0,-Math.PI/2,-Math.PI/2+PI2*Math.min(1,x.hold/0.6)); ctx.stroke(); }
    // chevrons pointing off the roof
    const a={top:-Math.PI/2,left:Math.PI,right:0}[x.side];
    ctx.translate(x.x,x.y); ctx.rotate(a); ctx.strokeStyle=st.c; ctx.lineWidth=4; ctx.lineCap='round';
    for (let i=0;i<3;i++){ const o=8+i*12+((time*30)%12); ctx.globalAlpha=pop*(0.3+0.25*i); ctx.beginPath(); ctx.moveTo(o,-9); ctx.lineTo(o+9,0); ctx.lineTo(o,9); ctx.stroke(); }
    ctx.restore();
  }
}
function drawExitIcons(){
  for (const x of exits){
    const st=rewardStyle(x.reward), img=rewardIcon(x.reward), pop=Math.min(1,x.t/0.35), bob=Math.sin(time*3+x.y)*4;
    const near=Math.hypot(player.x-x.x,player.y-x.y)<140, R=near?30:26, cy=x.y-74+bob;
    ctx.save(); ctx.globalAlpha=pop;
    ctx.shadowColor=st.c; ctx.shadowBlur=20; ctx.fillStyle=COL.ink; ctx.beginPath(); ctx.arc(x.x,cy,R+5,0,PI2); ctx.fill(); ctx.shadowBlur=0;
    ctx.save(); ctx.beginPath(); ctx.arc(x.x,cy,R,0,PI2); ctx.clip(); if (img.complete && img.naturalWidth) ctx.drawImage(img,x.x-R,cy-R,R*2,R*2); ctx.restore();
    ctx.strokeStyle=st.c; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x.x,cy,R+4,0,PI2); ctx.stroke();
    ctx.font='900 16px "Big Shoulders Display", Impact, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const ly=cy+R+16, label=st.label.toUpperCase();
    ctx.lineWidth=4; ctx.strokeStyle=COL.ink; ctx.strokeText(label,x.x,ly); ctx.fillStyle=st.c; ctx.fillText(label,x.x,ly);
    if (near){ ctx.font='700 11px "Chakra Petch", sans-serif'; const hint=inputMode==='touch'?'STAND TO JUMP':'STAND ON IT OR PRESS E'; ctx.strokeText(hint,x.x,ly+16); ctx.fillStyle=COL.text; ctx.fillText(hint,x.x,ly+16); }
    ctx.restore();
  }
}

/* ---------- Renown Shards and Fortress upgrades (kept between runs) ---------- */
// The rarer, out-of-run upgrade path, like Darkness and the Mirror of Night in Hades.
// Saved in this browser only, under a volt- prefixed key.
const META=[
  {id:'vitality', name:'Hero Conditioning', desc:'+10 max health per rank.', cost:[15,25,40,60]},
  {id:'training', name:'Combat Drills', desc:'+5% Strike and Power damage per rank.', cost:[12,20,32,50]},
  {id:'laststand', name:'Last Stand', desc:'Once per rank each run, a lethal hit leaves you at 1 health with 2s of invulnerability.', cost:[40,80]},
  {id:'rapport', name:'Rapport', desc:'Boons roll Rare and Epic more often.', cost:[20,35,55]},
  {id:'reroll', name:'Second Opinion', desc:'Reroll a comms offer once per rank each run.', cost:[25,50]},
  {id:'scavenger', name:'Scavenger', desc:'+1% health pack drop chance per rank.', cost:[18,30,45]},
];
function gainShards(n,x,y){
  run.shards+=n; save.shards+=n; writeSave();
  texts.push({x,y,v:'+'+n+' ◆',t:0,big:true,c:COL.boon});
}
function buyMeta(id){
  const m=META.find(x=>x.id===id), r=metaRank(id); if (!m || r>=m.cost.length) return;
  const c=m.cost[r]; if (save.shards<c) return;
  save.shards-=c; save.meta[id]=r+1; writeSave(); fillFortress();
}
function fillFortress(){
  $('#fortShards').textContent=save.shards;
  const list=$('#fortList'); list.innerHTML='';
  for (const m of META){
    const r=metaRank(m.id), max=m.cost.length, cost=m.cost[r];
    const row=document.createElement('div'); row.className='meta-row';
    row.innerHTML=`<div class="meta-text"><strong>${m.name}</strong><span>${m.desc}</span><span class="pips">${'<i class="on"></i>'.repeat(r)}${'<i></i>'.repeat(max-r)}</span></div>`;
    const b=document.createElement('button'); b.type='button'; b.className='btn meta-buy';
    if (r>=max){ b.textContent='Maxed'; b.disabled=true; }
    else { b.textContent=`${cost} ◆`; b.disabled=save.shards<cost; b.addEventListener('click',()=>buyMeta(m.id)); }
    row.appendChild(b); list.appendChild(row);
  }
}
let fortReturn=null;
function openFortress(){ fortReturn=state; fillFortress(); show('#mFortress',true); $('#btnFortClose').focus(); }
function closeFortress(){ show('#mFortress',false); $('#startShards').textContent='◆ '+save.shards; const back=fortReturn==='start'?'#btnStart':'#btnAgain'; $(back) && $(back).focus(); }
