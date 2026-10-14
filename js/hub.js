// Volt: The Fortress hub. Every run starts and ends here: walk the painted hall, talk to the heroes,
// spend Shards at Patch's terminal, pick a style at the armoury, then leave through the Deploy Gate.
// See docs/fortress-and-heroes-brief.md. Coordinates are pixels of assets/fortress/hub.jpg.
'use strict';

const HUB = { w:1484, h:1060, spawn:{x:742, y:690} };
const hubImg = new Image(); hubImg.src = 'assets/fortress/hub.jpg';
// Where feet can stand: a union of overlapping rectangles [x0,y0,x1,y1] traced over the painting.
const HUB_FLOOR = [
  [495,250,1010,712],   // main hall
  [300,250,1100,300],   // band under the windows
  [585,195,925,260],    // Halo's balcony
  [1000,262,1440,298],  // walkway in front of the trophy shelf
  [990,520,1440,598],   // armoury aisle
  [375,455,500,600],    // Patch's workshop
  [240,570,500,602],
  [455,590,500,712],    // corner by the bunk room
  [655,700,830,830],    // Deploy Gate approach
];
const HUB_BLOCK = [[575,365,905,585]]; // the command table

// Heroes stand at their stations. Placeholder holo-projections until their sprites exist.
const HUB_NPCS = [
  {id:'halo', x:755, y:215},
  {id:'bastion', x:548, y:470},
  {id:'patch', x:430, y:520},
  {id:'thorn', x:325, y:272},
  {id:'echo', x:1040, y:565},
];
// Things to use. `at` is where the player stands; `lx,ly` is where the marker floats.
const HUB_SPOTS = [
  {id:'terminal', name:'Upgrade terminal', verb:'Use', at:{x:300,y:586}, r:60, lx:225, ly:430, c:COL.heal},
  {id:'armoury', name:'Armoury', verb:'Choose style', at:{x:1270,y:545}, r:110, lx:1220, ly:330, c:COL.volt},
  {id:'gate', name:'Deploy Gate', verb:'Deploy', at:{x:742,y:805}, r:55, lx:742, ly:735, c:COL.volt},
  {id:'board', name:'Commendations', verb:'Read', at:{x:410,y:268}, r:55, lx:400, ly:110, c:COL.amber},
  {id:'trophies', name:'Trophy shelf', verb:'Look', at:{x:1280,y:275}, r:90, lx:1280, ly:150, c:COL.amber},
  {id:'bunk', name:'Your bunk', verb:'Look', at:{x:478,y:650}, r:40, lx:250, ly:640, c:COL.amber},
];

/* ---------- Dialogue ---------- */
// Each visit, the first talk with a hero plays their highest-priority line you haven't heard whose
// condition holds (Hades-style); after that they repeat a short idle line. Text can be a string,
// an array of pages, or a function of the context returning either.
const HUB_LINES = {
  halo:[
    {id:'h_first', text:["The rookie. Bastion tells me you want a spot on the roster.","I didn't vote for you. Prove me wrong out there."]},
    {id:'h_won', when:c=>c.lastWon, text:["You walked into the Redactor's tower and walked out again.","I knew someone, once, who'd have said I was wrong about you. Maybe they'd have been right."]},
    {id:'h_gm', when:c=>c.beaten.gravemark, text:"Gravemark. I put it down once, years ago. It didn't stay down for me either. Remember that."},
    {id:'h_beat', when:c=>c.beatenAny, text:"One district back. The city's breathing easier tonight. Don't get comfortable."},
    {id:'h_death', when:c=>c.lastDied, text:"You went down. Everyone does, the first hundred times. What matters is the walk back to that gate."},
    {id:'h_runs5', when:c=>c.runs>=5, text:"You keep coming back. Most rookies have quit by now. ...Keep coming back."},
  ],
  bastion:[
    {id:'b_first', text:["Welcome to the Fortress, rookie. Patch's workshop is on the left, the armoury on the right.","The Deploy Gate's at the bottom. Walk through it when you're ready. And don't touch my table."]},
    {id:'b_lic', when:c=>c.lic>0, text:"Hero Licence came through for you. Take it to the armoury: there's a rack with your name on it now. Earned it."},
    {id:'b_cause', when:c=>c.lastDied && c.last.cause, text:c=>`Footage from your last run says you went down to ${causeText(c.last.cause)}. Run it back in your head before you go out again.`},
    {id:'b_beat', when:c=>c.beatenAny, text:"You took a district back. I've updated the map. Don't make me change it again."},
    {id:'b_runs3', when:c=>c.runs>=3, text:"Block what you can read. Dash what you can't. Everything else is noise."},
  ],
  echo:[
    {id:'e_first', text:["So you're the new one. I read your file. I read everyone's file.","Psychic. Keep up."]},
    {id:'e_won', when:c=>c.lastWon, text:"Don't look at me like that. Fine. You were good. Happy?"},
    {id:'e_beat', when:c=>c.beatenAny, text:"Okay, that one was decent. I'd have been faster. But decent."},
    {id:'e_death', when:c=>c.lastDied, text:"I saw that coming. Literally. Want a hint? ...No. Figure it out."},
    {id:'e_runs5', when:c=>c.runs>=5, text:"You keep coming back. That's either brave or stupid. I'm still reading which."},
  ],
  thorn:[
    {id:'t_first', text:["Thorn. Before you ask: yes, I was one of them.","No, I don't want to talk about it. Mind the ferns."]},
    {id:'t_verd', when:c=>c.beaten.verdigris, text:"Verdigris. We shared a district once. Their vines were never alive. Mine are. That's the whole difference."},
    {id:'t_death', when:c=>c.lastDied, text:"Plants get cut back and grow stronger. People can too, if they let themselves."},
    {id:'t_runs3', when:c=>c.runs>=3, text:"Half the Fortress still watches me like I'll turn. You get that look too, rookie. We'll prove them wrong."},
  ],
  patch:[
    {id:'p_first', text:["Patch. Comms, gear, coffee.","The terminal behind me turns Renown Shards into upgrades. Don't spill on it."]},
    {id:'p_shards', when:c=>c.shards>=12, text:c=>`You've got ${c.shards} shards burning a hole in your pocket. Terminal's right there.`},
    {id:'p_lic', when:c=>c.lic>0, text:"Licence paperwork cleared. The armoury will let you unlock a new rack. You're welcome."},
    {id:'p_death', when:c=>c.lastDied, text:"Your suit telemetry flatlined. Very dramatic. I've patched it. Again."},
  ],
};
const HUB_IDLE = {
  halo:["Not now, rookie. The city needs watching.","Every light out there is someone counting on us. Go.","Hm."],
  bastion:["Map doesn't change by staring at it. Gate's that way.","Still here? Good. Now go be somewhere else.","Keep your guard up, rookie."],
  echo:["I'm training. Unless you want to spar? No? Thought so.","Stop thinking so loud.","Gate's that way. You were about to ask."],
  thorn:["Mind the ferns.","The greenhouse is the only quiet place up here. Don't tell Echo.","Go on. The city won't wait."],
  patch:["Busy. Talk to the terminal, it's friendlier.","Comms are green. Go break something that isn't mine.","Did you just lean on my workbench?"],
};
function hubContext(){
  const last=save.last, beaten=save.beaten||{};
  return { runs:save.runs, last, lastWon:!!(last&&last.won), lastDied:!!(last&&!last.won), beaten, beatenAny:Object.keys(beaten).length>0, lic:save.licences, shards:save.shards };
}
const resolveText = (t,c) => { const v=typeof t==='function'?t(c):t; return Array.isArray(v)?v:[v]; };

/* ---------- State ---------- */
let hubVisit={talked:{}}, hubNear=null, talk=null;
const inHub = () => state==='hub' || state==='hubtalk' || state==='hubmenu';

function enterHub(){
  reset(); powerHeld=false; transit=null; exits=[];
  for (const id of ['#mStart','#mOver','#mPause','#mDraft','#mFortress','#mCity','#mStyle']) show(id,false);
  document.body.classList.add('in-hub');
  player.x=HUB.spawn.x; player.y=HUB.spawn.y; player.aim=-Math.PI/2;
  cam.x=player.x; cam.y=player.y-120;
  hubVisit={talked:{}}; hubNear=null; talk=null; show('#hubTalk',false);
  state='hub'; keys.clear(); stick.id=null;
  refreshHubHud(); banner('THE FORTRESS');
}
function leaveHub(){ document.body.classList.remove('in-hub'); show('#hubTalk',false); show('#hubPrompt',false); hubNear=null; }
function refreshHubHud(){ $('#hubShards').textContent='◆ '+save.shards; $('#hubLic').textContent='✦ '+save.licences; const h=$('#hubHint'); h.hidden=save.runs>0; h.textContent = inputMode==='touch' ? 'Drag to move · Tap the prompt to interact · The Deploy Gate starts a run' : 'WASD to move · E to interact · The Deploy Gate starts a run'; }

/* ---------- Movement ---------- */
const inRect = (x,y,r) => x>=r[0] && x<=r[2] && y>=r[1] && y<=r[3];
function hubCollide(p){
  for (const b of HUB_BLOCK) if (inRect(p.x,p.y,b)){
    const d=[p.x-b[0], b[2]-p.x, p.y-b[1], b[3]-p.y], m=Math.min(...d);
    if (m===d[0]) p.x=b[0]; else if (m===d[1]) p.x=b[2]; else if (m===d[2]) p.y=b[1]; else p.y=b[3];
  }
  for (const n of HUB_NPCS){ const dx=p.x-n.x, dy=p.y-n.y, d=Math.hypot(dx,dy)||0.01, m=30; if (d<m){ p.x=n.x+dx/d*m; p.y=n.y+dy/d*m; } }
  if (HUB_FLOOR.some(r=>inRect(p.x,p.y,r))) return;
  let best=null, bd=Infinity;
  for (const r of HUB_FLOOR){ const x=clamp(p.x,r[0],r[2]), y=clamp(p.y,r[1],r[3]), d=Math.hypot(x-p.x,y-p.y); if (d<bd){ bd=d; best={x,y}; } }
  p.x=best.x; p.y=best.y;
}
function updateHub(dt){
  const p=player, mv=moveInput(), sp=T.moveSpeed*0.8, k=Math.min(1,((mv.x||mv.y)?14:11)*dt);
  p.vx+=(mv.x*sp-p.vx)*k; p.vy+=(mv.y*sp-p.vy)*k;
  p.x+=p.vx*dt; p.y+=p.vy*dt; hubCollide(p);
  if (mv.x||mv.y) p.aim=Math.atan2(mv.y,mv.x);
  // The nearest thing in reach gets the prompt.
  let near=null, nd=Infinity;
  for (const n of HUB_NPCS){ const d=Math.hypot(p.x-n.x,p.y-n.y); if (d<75 && d<nd){ nd=d; near={npc:n}; } }
  for (const s of HUB_SPOTS){ const d=Math.hypot(p.x-s.at.x,p.y-s.at.y); if (d<s.r && d<nd){ nd=d; near={spot:s}; } }
  if ((near&&(near.npc||near.spot))!==(hubNear&&(hubNear.npc||hubNear.spot))){
    hubNear=near; const el=$('#hubPrompt');
    if (!near) show('#hubPrompt',false);
    else {
      const sp2=near.npc?SPEAKERS[near.npc.id]:null;
      $('#hubPromptText').textContent = near.npc ? `Talk · ${sp2.name}` : `${near.spot.verb} · ${near.spot.name}`;
      el.style.setProperty('--c', near.npc?sp2.c:near.spot.c); show('#hubPrompt',true);
    }
  }
}
function hubCam(dt){
  cam.zoom=Math.max(clamp(Math.min(W,H)/820,0.45,1.25), W/HUB.w, H/HUB.h); // never show past the painting's edges
  const k=Math.min(1,5*dt); cam.x+=(player.x-cam.x)*k; cam.y+=(player.y-60-cam.y)*k;
  const hw=W/2/cam.zoom, hh=H/2/cam.zoom;
  cam.x = hw*2>=HUB.w ? HUB.w/2 : clamp(cam.x,hw,HUB.w-hw);
  cam.y = hh*2>=HUB.h ? HUB.h/2 : clamp(cam.y,hh,HUB.h-hh);
}

/* ---------- Interaction ---------- */
function hubInteract(){
  if (state!=='hub' || !hubNear) return;
  if (hubNear.npc) return talkTo(hubNear.npc.id);
  const s=hubNear.spot, c=hubContext();
  if (s.id==='gate'){ startGame(); return; }
  if (s.id==='terminal'){ state='hubmenu'; keys.clear(); openFortress(); return; }
  if (s.id==='armoury'){ state='hubmenu'; keys.clear(); openStyles(); return; }
  const n=(v,w)=>`${v} ${w}${v===1?'':'s'}`;
  if (s.id==='board'){
    const beatenN=Object.values(c.beaten).reduce((a,b)=>a+b,0);
    openTalk(null,[`Commendations, pinned up by Bastion: ${n(c.runs,'run')} logged, ${n(beatenN,'villain')} defeated, ${n(c.lic,'Hero Licence')} waiting at the armoury.`+(c.last?` Last run: ${c.last.won?'city secured':'down in '+n(c.last.districts||0,'district')+' cleared'}, rank ${c.last.rank}.`:'')],s);
  } else if (s.id==='trophies'){
    const got=Object.keys(c.beaten);
    openTalk(null,[got.length ? 'The trophy shelf: '+got.map(id=>`${SPEAKERS[id].name}${c.beaten[id]>1?' ×'+c.beaten[id]:''}`).join(', ')+'.' : "An empty shelf, waiting. Beat a villain and something of theirs ends up here."],s);
  } else if (s.id==='bunk'){
    openTalk(null,["Your bunk. The Halo poster has been up since you were twelve. One day."],s);
  }
}
function talkTo(id){
  const c=hubContext(); let pages=null;
  if (!hubVisit.talked[id]){
    const seen=save.talk||(save.talk={});
    const e=HUB_LINES[id].find(l=>!seen[l.id] && (!l.when || l.when(c)));
    if (e){ seen[e.id]=1; writeSave(); pages=resolveText(e.text,c); }
  }
  hubVisit.talked[id]=true;
  openTalk(id, pages || [pick(HUB_IDLE[id])]);
}
function openTalk(who,pages,spot){
  talk={who,pages,i:0,t:performance.now()}; state='hubtalk'; keys.clear(); stick.id=null; player.vx=player.vy=0;
  const el=$('#hubTalk'), pt=$('#talkPortrait');
  if (who){ const sp=SPEAKERS[who]; setPortrait(pt,who); pt.hidden=false; el.style.setProperty('--c',sp.c); $('#talkWho').innerHTML=`<b>${sp.name}</b> · ${sp.role}`; }
  else { pt.hidden=true; el.style.setProperty('--c',spot.c); $('#talkWho').innerHTML=`<b>${spot.name}</b>`; }
  show('#hubPrompt',false); show('#hubTalk',true); showTalkPage();
}
function showTalkPage(){ $('#talkLine').textContent=talk.pages[talk.i]; $('#talkNext').textContent = talk.i<talk.pages.length-1 ? 'E · next' : 'E · close'; }
function advanceTalk(){
  if (state!=='hubtalk' || performance.now()-talk.t<250) return;
  talk.t=performance.now();
  if (++talk.i<talk.pages.length){ showTalkPage(); return; }
  show('#hubTalk',false); talk=null; state='hub'; hubNear=null; // the prompt reappears next frame
}
// Closing a Fortress menu opened from the hub drops you back into it.
function hubMenuClosed(){ if (state==='hubmenu'){ state='hub'; hubNear=null; refreshHubHud(); } }

/* ---------- Drawing ---------- */
const BUST_IMG = {};
for (const n of HUB_NPCS){ const i=new Image(); i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${PORTRAIT_SVG[n.id]||BUST}</svg>`); BUST_IMG[n.id]=i; }
function drawHubNpc(n){
  const c=SPEAKERS[n.id].c, near=hubNear&&hubNear.npc===n, pulse=0.5+0.5*Math.sin(time*2.2+n.x), fy=n.y-62+Math.sin(time*1.6+n.x)*3;
  ctx.save();
  // floor emitter and light column: a comms hologram until the hero sprites exist
  ctx.globalAlpha=0.5+0.3*pulse; ctx.strokeStyle=c; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(n.x,n.y,26,11,0,0,PI2); ctx.stroke();
  ctx.globalAlpha=0.16; ctx.fillStyle=c; ctx.fill();
  const g=ctx.createLinearGradient(0,n.y,0,fy-30); g.addColorStop(0,c); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=0.18+(near?0.12:0); ctx.fillStyle=g; ctx.fillRect(n.x-22,fy-30,44,n.y-fy+30);
  ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(n.x,fy,28,0,PI2);
  ctx.fillStyle='rgba(8,13,24,.82)'; ctx.fill();
  ctx.shadowColor=c; ctx.shadowBlur=near?22:12; ctx.strokeStyle=c; ctx.lineWidth=near?4:3; ctx.stroke(); ctx.shadowBlur=0;
  ctx.save(); ctx.clip(); ctx.globalAlpha=0.32; ctx.fillStyle=c; ctx.fillRect(n.x-28,fy-28,56,56); ctx.globalAlpha=1;
  if (BUST_IMG[n.id].complete) ctx.drawImage(BUST_IMG[n.id],n.x-26,fy-24,52,52);
  ctx.restore();
  ctx.font='700 13px "Chakra Petch", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=4; ctx.strokeStyle=COL.ink; ctx.strokeText(SPEAKERS[n.id].name.toUpperCase(),n.x,fy-42); ctx.fillStyle=c; ctx.fillText(SPEAKERS[n.id].name.toUpperCase(),n.x,fy-42);
  ctx.restore();
}
function drawHubSpot(s){
  const near=hubNear&&hubNear.spot===s, y=s.ly+Math.sin(time*3+s.lx)*4;
  ctx.save(); ctx.globalAlpha=near?1:0.55; ctx.fillStyle=s.c; ctx.strokeStyle=COL.ink; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(s.lx,y+9); ctx.lineTo(s.lx-9,y-3); ctx.lineTo(s.lx+9,y-3); ctx.closePath(); ctx.stroke(); ctx.shadowColor=s.c; ctx.shadowBlur=near?16:6; ctx.fill();
  if (near){ ctx.shadowBlur=0; ctx.font='700 13px "Chakra Petch", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=4; ctx.strokeText(s.name.toUpperCase(),s.lx,y-18); ctx.fillText(s.name.toUpperCase(),s.lx,y-18); }
  ctx.restore();
}
function renderHub(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#080d18'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2,H/2); ctx.scale(cam.zoom,cam.zoom); ctx.translate(-cam.x,-cam.y);
  if (hubImg.complete && hubImg.naturalWidth) ctx.drawImage(hubImg,0,0,HUB.w,HUB.h);
  // The hologram map breathes.
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.10+0.06*Math.sin(time*2.4);
  const hg=ctx.createRadialGradient(742,445,10,742,445,170); hg.addColorStop(0,COL.volt); hg.addColorStop(1,'rgba(38,191,255,0)'); ctx.fillStyle=hg; ctx.fillRect(560,270,370,350); ctx.restore();
  for (const s of HUB_SPOTS) drawHubSpot(s);
  const list=HUB_NPCS.map(n=>({y:n.y,f:()=>drawHubNpc(n)}));
  list.push({y:player.y,f:()=>{ if (drawVoltSprite(player,1.35)) return; ctx.save(); ctx.translate(player.x,player.y); ctx.scale(1.4,1.4); ctx.translate(-player.x,-player.y); VECTOR.volt(player); ctx.restore(); }}); // drawn larger to match the painting's scale
  list.sort((a,b)=>a.y-b.y); for (const it of list) it.f();
  drawFx();
  ctx.restore();
  // Vignette keeps the eye on the room.
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75); v.addColorStop(0,'rgba(4,7,14,0)'); v.addColorStop(1,'rgba(4,7,14,.55)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  if (stick.id!==null){
    ctx.strokeStyle='rgba(234,252,255,.25)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(stick.ox,stick.oy,60,0,PI2); ctx.stroke();
    ctx.fillStyle='rgba(38,191,255,.35)'; ctx.beginPath(); ctx.arc(stick.ox+stick.x*60,stick.oy+stick.y*60,24,0,PI2); ctx.fill();
  }
}

$('#hubPrompt').addEventListener('click', hubInteract);
$('#hubTalk').addEventListener('pointerdown', () => advanceTalk());
