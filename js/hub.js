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
// `face` is where they look when you're not nearby (radians, 0 = east): Halo watches the city,
// Bastion the map, Patch the terminal. Up close, they turn to you.
// Each hero stands where they'd actually be. Thorn and Echo are inside rooms you can't enter
// (the greenhouse and the training corner), so you talk to them from outside: `r` is talk reach.
const HUB_NPCS = [
  {id:'halo', x:755, y:208, face:-Math.PI/2, r:75},          // at the balcony rail, watching the city
  {id:'bastion', x:742, y:352, face:Math.PI/2, r:75},        // head of the command table, over the map
  {id:'patch', x:205, y:588, face:-Math.PI*0.6, r:90},       // at the workbench, facing the screens
  {id:'thorn', x:215, y:236, face:-Math.PI*0.75, r:115},     // in the greenhouse, tending the plants
  {id:'echo', x:1185, y:712, face:Math.PI/2, r:125},         // in the training corner by the dummies
];
// Things to use. `at` is where the player stands; `lx,ly` is where the marker floats.
const HUB_SPOTS = [
  {id:'terminal', name:'Upgrade terminal', verb:'Use', at:{x:330,y:588}, r:55, lx:225, ly:430, c:COL.heal},
  {id:'armoury', name:'Armoury', verb:'Choose style', at:{x:1270,y:545}, r:110, lx:1220, ly:330, c:COL.volt},
  {id:'gate', name:'Deploy Gate', verb:'Deploy', at:{x:742,y:805}, r:55, lx:742, ly:735, c:COL.volt},
  {id:'board', name:'Commendations', verb:'Read', at:{x:410,y:268}, r:55, lx:400, ly:110, c:COL.amber},
  {id:'trophies', name:'Trophy shelf', verb:'Look', at:{x:1280,y:275}, r:90, lx:1280, ly:150, c:COL.amber},
  {id:'bunk', name:'Your bunk', verb:'Remember', at:{x:478,y:650}, r:40, lx:250, ly:640, c:COL.amber},
  {id:'training', name:'Training roof', verb:'Train', at:{x:1420,y:585}, r:45, lx:1250, ly:640, c:COL.heal},
];

/* ---------- Dialogue ---------- */
// Each visit, the first talk with a hero plays their highest-priority line you haven't heard whose
// condition holds (Hades-style); after that they repeat a short idle line. Text can be a string,
// an array of pages, or a function of the context returning either.
// Volt answers in most conversations, like Zagreus in Hades: V('...') marks a Volt line.
const V = (text,expression) => ({who:'volt', text, expression});
// E(text, 'pleased'|'stern'): the hero's own line with a portrait expression.
const E = (text,expression) => ({text, expression});
const HUB_LINES = {
  halo:[
    {id:'h_first', text:["You must be the rookie.", V("Hi. Yes. That's me. Volt. Huge fan. I mean, hi.",'pleased'), E("Bastion says you asked to join the roster. I didn't vote for you.",'stern'), V("Oh. Okay. That's... fair."), E("Prove me wrong.",'stern')]},
    {id:'h_partner2', when:c=>c.seen('rd_halo2'), text:[E("He told you.",'stern'), V("Is it true? You left him in the tower?",'stern'), E("The tower was coming down. Half the district was still inside. I could reach him, or I could reach them.",'stern'), V("So you chose them."), "I've stood on this balcony every night since, making sure it was the right call.", V("Was it?"), "Ask me again when you've beaten him."]},
    {id:'h_partner', when:c=>c.seen('rd_halo1'), text:["The Redactor talked to you.", V("He asked if you still stand out here. And who used to stand here with you."), "...", V("Halo?"), E("Leave it, rookie.",'stern')]},
    {id:'h_won', when:c=>c.lastWon, text:["You walked out of the Redactor's tower.", V("I did! I mean. Yes. I did that.",'pleased'), "...", E("I knew someone once who'd have said I was wrong about you.",'pleased'), V("Were you?"), E("Go to bed, rookie.",'pleased')]},
    {id:'h_gm', when:c=>c.beaten.gravemark, text:["Gravemark.", V("You put it down once, right? How?"), "I didn't. It got back up. They always get back up.", V("So what do I do?"), E("Get up faster.",'stern')]},
    {id:'h_beat', when:c=>c.beatenAny, text:["One district back.", V("Did you see? Did you see the part where I—",'pleased'), E("I saw.",'pleased'), V("...And?"), E("Don't get comfortable.",'stern')]},
    {id:'h_death', when:c=>c.lastDied, text:[E("You went down.",'stern'), V("Yeah. That was... yeah."), "Everyone does, the first hundred times.", V("Did you?"), "...Walk back to the gate, rookie."]},
    {id:'h_runs5', when:c=>c.runs>=5, text:["Most rookies have quit by now.", V("I'm not most rookies.",'stern'), E("No. You're not.",'pleased')]},
  ],
  bastion:[
    {id:'b_first', text:["So. You're Volt.", V("That's me! Hi. Nice table.",'pleased'), E("Don't touch my table.",'stern'), V("I wasn't going to—"), E("Workshop's left. Armoury's right. Gate's at the bottom. My table is in the middle. Don't touch it.",'stern')]},
    {id:'b_docks', when:c=>c.seen('ut_why'), text:["Undertow told you about the docks.", V("Is it true? You just... left?"), "I followed orders.", E("I have regretted it every single day since.",'stern'), V("Does Echo know?",'pleased'), E("If you tell Echo, you're on toilet duty for a year.",'stern')]},
    {id:'b_lic', when:c=>c.lic>0, text:["Hero Licence came through.", V("An actual licence? With my name on it?",'pleased'), "Take it to the armoury. And don't frame it.", V("I'm going to frame it.",'pleased'), E("I know.",'pleased')]},
    {id:'b_cause', when:c=>c.lastDied && c.last.cause, text:c=>["Pulled the footage from last night.", V("Oh no.",'stern'), `You went down to ${causeText(c.last.cause)}.`, V("I had it. I had it right up until I didn't have it."), E("That's what everyone says. Watch for the tell next time.",'stern')]},
    {id:'b_beat', when:c=>c.beatenAny, text:["Updated the map. One district back.", V("Can I put the marker on? Please?",'pleased'), E("...Fine. Don't touch anything else.",'stern')]},
    {id:'b_runs3', when:c=>c.runs>=3, text:["Rule one: block what you can read.", V("And rule two?"), "Dash what you can't.", V("Rule three?"), E("Stop asking how many rules there are.",'stern')]},
  ],
  echo:[
    {id:'e_first', text:[E("Oh, great. The new one.",'stern'), V("Hi! I'm Vol—"), "Volt. I know. I read your file. I read everyone's file.", V("You read minds. That's not reading a file."), E("Potato, potahto.",'pleased')]},
    {id:'e_glass', when:c=>c.seen('gw_echo'), text:["Glasswake was terrified of me.", V("I noticed. You were very smug about it."), E("I'm always smug. That was premium smug.",'pleased')]},
    {id:'e_won', when:c=>c.lastWon, text:["Don't look at me like that.", V("Like what?"), "Like you won and you want me to say it.", V("I did win.",'pleased'), E("...Fine. You were good. Happy?",'pleased'), V("Extremely.",'pleased')]},
    {id:'e_beat', when:c=>c.beatenAny, text:["That last villain. Decent.", V("Decent? I took back a whole district!",'pleased'), "I'd have been faster.", V("You would not."), E("I would. And I'd have looked better doing it.",'pleased')]},
    {id:'e_death', when:c=>c.lastDied, text:[E("I saw that coming. Literally.",'pleased'), V("And you didn't think to warn me?"), "I thought about it.", V("And?"), E("And then I didn't.",'pleased')]},
    {id:'e_runs5', when:c=>c.runs>=5, text:["You keep coming back.", V("Yep."), "That's either really brave or really stupid. I'm still reading which.", V("Can't you just tell me?"), E("Where's the fun in that?",'pleased')]},
  ],
  thorn:[
    {id:'t_first', text:["...", V("Hi. I'm—"), E("Thorn. And yes. I was one of them.",'stern'), V("I wasn't going to ask."), "Everyone asks. Mind the ferns."]},
    {id:'t_plant', when:c=>c.seen('vg_thorn2'), text:["Verdigris asked about the plant.", V("The one in the blue pot. They said they gave it to you."), "They did. Back when we still grew things that were alive.", "I'm keeping it going until they want it back.", V("Do you think they will?"), E("Plants are patient. So am I.",'pleased')]},
    {id:'t_verd', when:c=>c.beaten.verdigris, text:["You beat Verdigris.", V("Are you... okay with that?"), "Their vines were never alive. Mine are. That's the whole difference.", "...Yes. I'm okay."]},
    {id:'t_death', when:c=>c.lastDied, text:["Plants get cut back. Then they grow back stronger.", V("Is this a pep talk?"), "It's botany. Take it however you like."]},
    {id:'t_runs3', when:c=>c.runs>=3, text:["Half this Fortress still watches me like I'm going to turn.", V("They watch me like I'm going to trip."), E("Then we prove them wrong.",'pleased'), V("Together?",'pleased'), E("...Don't make it a thing.",'pleased')]},
  ],
  patch:[
    {id:'p_first', text:["Patch. Comms, gear, coffee.", V("In that order?"), "Depends on the night. The terminal's for upgrades. Shards go in, a better you comes out.", V("A better me?"), E("A slightly better you. Let's be realistic.",'pleased')]},
    {id:'p_kiln', when:c=>c.seen('kh_patch'), text:["Kilnheart complimented my suit design.", V("And then insulted me."), E("Both were correct.",'pleased'), V("Patch!",'stern'), E("I stand by it.",'pleased')]},
    {id:'p_shards', when:c=>c.shards>=12, text:c=>[`You've got ${c.shards} shards just sitting there.`, V("Is this a sales pitch?"), E("It's an observation. A pointed one. Terminal's right there.",'pleased')]},
    {id:'p_lic', when:c=>c.lic>0, text:["Licence paperwork cleared.", V("Thanks, Patch!"), E("Don't thank me. Thank the forms. There were nine.",'pleased')]},
    {id:'p_death', when:c=>c.lastDied, text:["Your suit telemetry flatlined last night.", V("It felt dramatic."), "It looked dramatic. I've patched it. That's repair number...", E("I've lost count. Let's call it 'again'.",'pleased')]},
  ],
};
const HUB_IDLE = {
  halo:["Not now, rookie.","The city doesn't sleep. Neither do I.","...Hm."],
  bastion:["Gate's that way.","Still here? Good. Now be somewhere else.","Did you touch my table?"],
  echo:["I'm training. Want to spar? No? Smart.","You're thinking really loud right now.","Yes. The gate's that way. You were about to ask."],
  thorn:["Mind the ferns.","This is the only quiet spot in the Fortress. Don't ruin it.","Go on. The city won't wait."],
  patch:["Busy. Talk to the terminal, it's friendlier.","Comms are green. Go break something that isn't mine.","Are you leaning on my workbench?"],
};
function hubContext(){
  const last=save.last, beaten=save.beaten||{};
  return { runs:save.runs, last, lastWon:!!(last&&last.won), lastDied:!!(last&&!last.won), beaten, beatenAny:Object.keys(beaten).length>0, lic:save.licences, shards:save.shards, seen:id=>!!((save.story&&save.story[id])||(save.talk&&save.talk[id])) };
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
  for (const n of HUB_NPCS){ const d=Math.hypot(p.x-n.x,p.y-n.y); if (d<n.r && d-n.r*0.4<nd){ nd=d-n.r*0.4; near={npc:n}; } }
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
  cam.zoom=Math.max(clamp(Math.min(W,H)/(inputMode==='touch'?560:820),0.45,1.25), W/HUB.w, H/HUB.h); // closer on phones; never past the painting's edges
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
  if (s.id==='gate'){ if (save.tutorialDone) startGame(); else startTutorial(true); return; }
  if (s.id==='training'){ startTutorial(false); return; }
  if (s.id==='terminal'){ state='hubmenu'; keys.clear(); openFortress(); return; }
  if (s.id==='armoury'){ state='hubmenu'; keys.clear(); openStyles(); return; }
  const n=(v,w)=>`${v} ${w}${v===1?'':'s'}`;
  if (s.id==='board'){
    const beatenN=Object.values(c.beaten).reduce((a,b)=>a+b,0);
    const list=COMMENDATIONS.map(x=>`${(save.comm||{})[x.id]?'✦':'·'} ${x.name}: ${x.desc}`);
    openTalk(null,[`Commendations, pinned up by Bastion: ${commendCount()} of ${COMMENDATIONS.length} earned. Each one is a Hero Licence for the armoury, and every completed run earns one more.`, list.slice(0,5).join('\n'), list.slice(5).join('\n'), `${n(c.runs,'run')} logged, ${n(beatenN,'villain')} defeated, ${n(c.lic,'Hero Licence')} waiting at the armoury.`+(c.last?` Last run: ${c.last.won?'city secured':'down in '+n(c.last.districts||0,'district')+' cleared'}, rank ${c.last.rank}.`:'')],s);
  } else if (s.id==='trophies'){
    const got=Object.keys(c.beaten);
    openTalk(null,[got.length ? 'The trophy shelf: '+got.map(id=>`${SPEAKERS[id].name}${c.beaten[id]>1?' ×'+c.beaten[id]:''}`).join(', ')+'.' : "An empty shelf, waiting. Beat a villain and something of theirs ends up here."],s);
  } else if (s.id==='bunk'){
    // Lying back on the bunk replays how all this started.
    playCutscene(()=>{ state='hub'; hubNear=null; });
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
// Pages are strings (said by `who`, or narration for a spot) or {who,text} for another speaker.
function openTalk(who,pages,spot){
  talk={npc:who, spot, pages:pages.map(pg=>typeof pg==='string'?{who,text:pg}:{who,...pg}), i:0, t:performance.now()}; state='hubtalk'; keys.clear(); stick.id=null; player.vx=player.vy=0;
  if (who) player.aim=Math.atan2(HUB_NPCS.find(n=>n.id===who).y-player.y, HUB_NPCS.find(n=>n.id===who).x-player.x); // Volt turns to face them
  $('#hubTalk').dataset.label='Fortress'; show('#hubPrompt',false); show('#hubTalk',true); showTalkPage();
}
function showTalkPage(){
  const pg=talk.pages[talk.i], el=$('#hubTalk'), pt=$('#talkPortrait');
  if (pg.who){ const sp=SPEAKERS[pg.who]; setPortrait(pt,pg.who,pg.expression||'neutral'); pt.hidden=false; el.style.setProperty('--c',sp.c); $('#talkWho').innerHTML=`<b>${sp.name}</b> · ${sp.role}`; }
  else { pt.hidden=true; el.style.setProperty('--c',talk.spot.c); $('#talkWho').innerHTML=`<b>${talk.spot.name}</b>`; }
  el.classList.toggle('is-volt', pg.who==='volt');
  $('#talkLine').textContent=pg.text; const key=inputMode==='touch'?'Tap':'E'; $('#talkNext').textContent = key+(talk.i<talk.pages.length-1 ? ' · next' : ' · close');
}
function advanceTalk(){
  if ((state!=='hubtalk' && state!=='dialogue') || !talk || performance.now()-talk.t<250) return;
  talk.t=performance.now();
  if (++talk.i<talk.pages.length){ showTalkPage(); return; }
  const done=talk.done; show('#hubTalk',false); talk=null;
  if (done){ done(); return; }
  state='hub'; hubNear=null; // the prompt reappears next frame
}
// The same box during a run: an exchange after an intro card, with the action frozen until it ends.
function runDialogue(pages, label, done){
  if (window.__volt && window.__volt.noIntro){ done && done(); return; } // tests skip cards and their dialogue
  talk={pages, i:0, t:performance.now(), done:()=>{ state='play'; done && done(); }};
  state='dialogue'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; powerHeld=false;
  if (player){ player.blockHeld=false; player.charging=0; }
  $('#hubTalk').dataset.label=label; show('#hubTalk',true); showTalkPage();
}
// Closing a Fortress menu opened from the hub drops you back into it.
function hubMenuClosed(){ if (state==='hubmenu'){ state='hub'; hubNear=null; refreshHubHud(); } }

/* ---------- Drawing ---------- */
const BUST_IMG = {};
for (const n of HUB_NPCS){ const i=new Image(); i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${PORTRAIT_SVG[n.id]||BUST}</svg>`); BUST_IMG[n.id]=i; }
function drawHubNpc(n){
  if (npcSpriteReady(n.id)) return drawHubNpcSprite(n);
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
function drawHubNpcSprite(n){
  const c=SPEAKERS[n.id].c, near=hubNear&&hubNear.npc===n, d=Math.hypot(player.x-n.x,player.y-n.y);
  // Heroes keep to their own business; they only turn to Volt while you're talking to them.
  const face = talk && talk.npc===n.id ? Math.atan2(player.y-n.y,player.x-n.x) : n.face;
  ctx.save();
  ctx.globalAlpha=near?0.9:0.45; ctx.strokeStyle=c; ctx.lineWidth=near?3:2; ctx.beginPath(); ctx.ellipse(n.x,n.y,26,10,0,0,PI2); ctx.stroke();
  ctx.globalAlpha=0.5; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(n.x,n.y,20,7,0,0,PI2); ctx.fill(); ctx.globalAlpha=1;
  drawNpcSprite(n.id,n.x,n.y,face,{talking:!!(talk && talk.npc===n.id && talk.pages[talk.i]?.who===n.id)});
  if (near || d<200){
    const y=n.y-92; ctx.globalAlpha=near?1:0.7;
    ctx.font='700 13px "Chakra Petch", sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.lineWidth=4; ctx.strokeStyle=COL.ink; ctx.strokeText(SPEAKERS[n.id].name.toUpperCase(),n.x,y); ctx.fillStyle=c; ctx.fillText(SPEAKERS[n.id].name.toUpperCase(),n.x,y);
  }
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
  list.push({y:player.y,f:()=>{ if (drawVoltSprite(player,1.5)) return; ctx.save(); ctx.translate(player.x,player.y); ctx.scale(1.4,1.4); ctx.translate(-player.x,-player.y); VECTOR.volt(player); ctx.restore(); }}); // drawn larger to match the painting's scale
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
