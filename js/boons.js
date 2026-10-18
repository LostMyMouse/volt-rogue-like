// Volt: Hero boons, Fortress tech, status effects and zones.
'use strict';

/* ---------- Hero boons ---------- */
// Heroes call in on comms between waves (Hades-style). Each boon fills one of Volt's slots (strike, power,
// dash, overload) or is a passive. One boon per slot: a new one replaces the old. Taking the same boon again
// levels it up (max 3). Design rule: nothing heals. Defensive boons block, deflect or avoid damage instead.
const RARITY = [ {name:'Common',c:COL.text,w:70}, {name:'Rare',c:COL.volt,w:24}, {name:'Epic',c:COL.boon,w:6} ];
const SLOT_NAME = { strike:'Strike', power:'Special', dash:'Dash', overload:'Overload', passive:'Passive' };
const HEROES = {
  halo:{ c:'#fff1d0', first:"Rookie. The city's watching tonight, and so am I. Take this.",
    lines:["Again? Fine. Make it count.","Light doesn't bend for anyone. Neither should you.","You're still standing. Good. Here."] },
  bastion:{ c:'#9fb0c8', first:"Shield channel ready. Choose the reinforcement you need for this roof.",
    lines:["Shields up, rookie.","Hold the line. Let them break on you.","Less flash, more footwork. Take this."] },
  echo:{ c:'#8b93ff', first:"Heard you were struggling. Loudly. Want help? Don't answer, I already know.",
    lines:["I read your next move. It was bad. Try this instead.","Stop thinking so loud and pick one.","Fine, I'll carry you. Again."] },
  thorn:{ c:'#6ad46a', first:"They don't trust me at the Fortress either. Guess we have that in common.",
    lines:["Nature doesn't rush. It just wins.","Let them come to you. Then don't let them leave.","Roots hold. So should you."] },
};
// v / v2 are [common, rare, epic]. Each extra level adds 40% of the base value.
const BOONS = [
  // Halo: light. Raw damage, blinding stuns, burning light.
  {id:'radiant', hero:'halo', slot:'strike', name:'Radiant Strike', v:[30,40,55], v2:[20,28,38], desc:(a,b)=>`Strike deals <b>+${a}%</b> damage. Heavy hits call down a light beam for <b>${b}</b> damage.`},
  {id:'solar', hero:'halo', slot:'power', name:'Solar Lance', v:[14,20,28], desc:a=>`Special's first target takes <b>+${a}</b> damage and is <b>blinded</b> (stunned 0.8s).`},
  {id:'flashstep', hero:'halo', slot:'dash', name:'Flashstep', v:[0.6,0.9,1.2], desc:a=>`Dashing releases a blinding flash: nearby enemies are <b>stunned ${a}s</b>.`},
  {id:'daybreak', hero:'halo', slot:'overload', name:'Daybreak', v:[14,20,28], desc:a=>`Overload leaves a sunlit zone for 4s that burns enemies for <b>${a}</b> damage per second.`},
  {id:'inspire', hero:'halo', slot:'passive', name:'Inspire', v:[15,22,30], desc:a=>`While above 80% health you deal <b>+${a}%</b> damage.`},
  {id:'guiding', hero:'halo', slot:'passive', name:'Guiding Light', v:[20,30,45], desc:a=>`Deal <b>+${a}%</b> damage to villains.`},
  {id:'halo_sig', hero:'halo', slot:'passive', name:'Spotlight', v:[25,35,50], desc:a=>`Overload charges <b>${a}%</b> faster.`},
  // Bastion: force fields. Guards, deflection, invulnerability, punishing walls.
  {id:'bulwark', hero:'bastion', slot:'strike', name:'Bulwark Strike', v:[50,70,100], desc:a=>`Landing a heavy hit raises a <b>Guard</b> that blocks <b>${a}%</b> of the next hit.`},
  {id:'kinetic', hero:'bastion', slot:'power', name:'Kinetic Ram', v:[20,30,42], desc:a=>`Special knocks enemies far back. Any that hit a wall or obstacle take <b>${a}</b> damage.`},
  {id:'aegis', hero:'bastion', slot:'dash', name:'Aegis Dash', v:[0.4,0.6,0.8], desc:a=>`For <b>${a}s</b> after dashing, Needle shots that touch you are <b>reflected</b>.`},
  {id:'fortress', hero:'bastion', slot:'overload', name:'Fortress', v:[1.0,1.5,2.0], desc:a=>`Overload makes you <b>invulnerable for ${a}s</b>.`},
  {id:'ironwill', hero:'bastion', slot:'passive', name:'Iron Will', v:[10,14,18], desc:a=>`Take <b>${a}%</b> less damage.`},
  {id:'retaliate', hero:'bastion', slot:'passive', name:'Retaliate', v:[14,20,28], desc:a=>`When hit, release a force pulse dealing <b>${a}</b> damage around you.`},
  {id:'hold', hero:'bastion', slot:'passive', name:'Hold the Line', v:[0.15,0.25,0.35], desc:a=>`After taking a hit you stay invulnerable <b>${a}s</b> longer.`},
  // Echo: psychic control. Marks, chain resonance, delayed echoes, slower enemy tells.
  {id:'mindspike', hero:'echo', slot:'strike', name:'Mind Spike', v:[20,30,40], desc:a=>`Strikes <b>mark</b> enemies for 3s. Marked enemies take <b>+${a}%</b> damage from everything.`},
  {id:'resonance', hero:'echo', slot:'power', name:'Resonance', v:[10,20,30], desc:a=>`Special deals <b>+${a}%</b> damage and reaches further: one more chain, bounce or hit, a longer lance or a wider pound.`},
  {id:'phase', hero:'echo', slot:'dash', name:'Phase Echo', v:[24,34,46], desc:a=>`Dashing leaves an echo of you that detonates after 0.5s for <b>${a}</b> damage.`},
  {id:'storm', hero:'echo', slot:'overload', name:'Psychic Storm', v:[30,45,60], desc:a=>`Overload deals <b>+${a}%</b> damage, marks everything it hits and stuns 1.5s longer.`},
  {id:'feedback', hero:'echo', slot:'passive', name:'Feedback', v:[16,24,34], desc:a=>`Marked, stunned or rooted enemies burst when they fall, dealing <b>${a}</b> damage nearby.`},
  {id:'foresight', hero:'echo', slot:'passive', name:'Foresight', v:[15,22,30], desc:a=>`Enemy wind-ups and telegraphs last <b>${a}%</b> longer.`},
  {id:'echo_cd', hero:'echo', slot:'passive', name:'Quick Thinking', v:[15,20,25], desc:a=>`Special recharges <b>${a}%</b> faster.`},
  // Thorn: nature. Poison stacks, roots, lingering thorn fields, executes.
  {id:'bramble', hero:'thorn', slot:'strike', name:'Bramble Strike', v:[4,6,8], desc:a=>`Strikes <b>poison</b>: <b>${a}</b> damage per second per stack, up to 3 stacks, for 3s.`},
  {id:'snare', hero:'thorn', slot:'power', name:'Root Snare', v:[1.0,1.4,1.8], desc:a=>`Special <b>roots</b> every enemy it hits for <b>${a}s</b> and poisons them.`},
  {id:'thorntrail', hero:'thorn', slot:'dash', name:'Thorn Trail', v:[10,15,22], desc:a=>`Dashing plants a thorn field for 4s that deals <b>${a}</b> damage per second.`},
  {id:'overgrowth', hero:'thorn', slot:'overload', name:'Overgrowth', v:[1.5,2.2,3.0], desc:a=>`Overload roots everything it hits for <b>${a}s</b> and applies 2 poison stacks.`},
  {id:'venom', hero:'thorn', slot:'passive', name:'Venom', v:[30,45,60], desc:a=>`Poison deals <b>+${a}%</b> damage.`},
  {id:'natsel', hero:'thorn', slot:'passive', name:'Natural Selection', v:[30,45,60], desc:a=>`Deal <b>+${a}%</b> damage to enemies below 30% health.`},
  {id:'deeproots', hero:'thorn', slot:'passive', name:'Deep Roots', v:[0.5,0.8,1.1], desc:a=>`Roots last <b>${a}s</b> longer and rooted enemies can't attack.`},
];
const BOON_BY_ID = Object.fromEntries(BOONS.map(b=>[b.id,b]));
// Patch's Fortress tech: offered after each Gravemark wave. Stat upgrades, never healing.
const TECH = [
  {id:'suit', name:'Reinforced Suit', desc:'<b>+25 max health</b>. Raises the cap only; it does not heal.'},
  {id:'capacitor', name:'Arc Capacitor', desc:'Overload charges <b>40%</b> faster.'},
  {id:'servos', name:'Servo Boots', desc:'Dash recharges <b>25%</b> faster.'},
  {id:'coil', name:'Coil Booster', desc:'Special recharges <b>20%</b> faster.'},
  {id:'longarc', name:'Long Arc', desc:'Strike reach and range <b>+15%</b>.'},
  {id:'relay', name:'Relay Node', desc:'Special reaches further: <b>+1</b> chain, bounce or hit, a longer lance or a wider pound.'},
  {id:'overclock', name:'Overclock', desc:'Move speed <b>+10%</b>.'},
];
const PATCH = { c:COL.heal, first:"Patch here. I stashed a Fortress tech locker on this roof. One item, rookie.",
  lines:["Tech locker's open. Don't break anything.","Pick one. I'm not made of prototypes."] };

/* ---------- What heroes say when they offer powers ---------- */
// Generic lines plus situational ones (low health, which villain's district you're in, late in the run,
// a clean run, good parrying). A situational line wins when one fits; nothing repeats within a run.
const COMMS_LINES = {
  halo:{
    any:["Again? Fine. Make it count.","Light doesn't bend for anyone. Neither should you.","You're still standing. Good. Here.","I'm not here to hold your hand. I'm here to make sure it's steady.","Breathe. Aim. Then shine.","Every hero starts somewhere. Yours is this roof.","Take it. Use it. Don't make me watch you waste it.","The city doesn't need perfect. It needs you upright."],
    low:["You're running on fumes. Take this, and stop bleeding.","Get up. Heroes get up.","I've seen that look before. In a mirror. Take this."],
    late:["You've come further than most. Don't stop now.","The Redactor's tower is close. I can see it from here. So can you."],
    clean:["Not a scratch. Show-off. Keep it up."], parry:["Clean parries. Somebody's been paying attention."],
    kilnheart:"Kilnheart burns hot and fast. Be faster.", bellwether:"Bellwether loves an audience. Don't give them one.", verdigris:"Verdigris wants you slow. Don't be.",
    glasswake:"Glasswake lies with light. I don't. Trust this.", undertow:"Undertow drags people down. Keep your head up.", gravemark:"Gravemark. Of course. Take this, and don't let it pin you.", redactor:"The control room is ahead. Shut down the drain, then get clear.",
  },
  bastion:{
    any:["Shields up, rookie.","Hold the line. Let them break on you.","Less flash, more footwork. Take this.","Gear check: you're still in one piece. Good.","Rule two: hit them before they hit you.","I've seen worse rookies. Not many. Some.","Stand your ground. Here's something to stand on.","Don't make me come down there."],
    low:["You're bleeding out there. Defensive gear, now.","Back off, reset, go again. That's an order.","Medic's a long way off, rookie. This'll have to do."],
    late:["Deep in their territory now. Stay sharp.","Long night. Longer if you get sloppy."],
    clean:["No hits taken. Don't let it go to your head."], parry:["Textbook parries. I'll pretend I didn't see, so you don't get cocky."],
    kilnheart:"Kilnheart telegraphs everything. Read the wind-up.", bellwether:"Watch the gaps in Bellwether's rings. Move through them.", verdigris:"Keep moving. Verdigris turns standing still into a death sentence.",
    glasswake:"Glasswake's copies don't think. Hit the one that does.", undertow:"Undertow's on my old docks. Make him pay for every metre.", gravemark:"Gravemark hits like a building. Don't be standing there.", redactor:"Final push. Everything we've got is behind you.",
  },
  echo:{
    any:["I read your next move. It was bad. Try this instead.","Stop thinking so loud and pick one.","Fine, I'll carry you. Again.","You were about to ask for help. Don't. Just take it.","I've seen how this goes. You'll want this one.","Pick the left one. ...Kidding. Pick whatever.","Your brain is very busy right now. Here's something simpler.","I'm not saying I'm worried. I'm saying here."],
    low:["Your thoughts are getting fuzzy. That's the blood loss. Take this.","Okay. I'm actually worried. Don't tell anyone."],
    late:["Almost there. I can hear the tower humming.","You're tired. I can tell. Your inner monologue got shorter."],
    clean:["Not a single hit? Who are you and what did you do with Volt?"], parry:["Okay, those parries were decent. I'd have done them faster."],
    kilnheart:"Kilnheart's angry. Angry people telegraph.", bellwether:"Bellwether's head is all bass. Go left when it drops.", verdigris:"Verdigris is so patient it's creepy. Be impatient.",
    glasswake:"The real Glasswake is the one thinking about their hair. Trust me.", undertow:"Undertow keeps thinking about the docks. Use it.", gravemark:"Gravemark's mind is just rock grinding. Loud, slow rock.", redactor:"His mind's a locked filing cabinet. Hit it anyway.",
  },
  thorn:{
    any:["Nature doesn't rush. It just wins.","Let them come to you. Then don't let them leave.","Roots hold. So should you.","Grow where you're planted. Even on a rooftop.","Here. Something with thorns.","Patience is a weapon. Use it.","Quiet night. Let's keep it that way. Mostly.","I don't call much. When I do, take what I'm giving."],
    low:["Bent, not broken. Take this.","Even burned forests grow back. Hold on."],
    late:["Deep roots now. Don't pull up."],
    clean:["Clean work. The ferns would be proud."], parry:["You're learning to wait for the right moment. Good."],
    kilnheart:"Fire and plants don't mix. Stay out of the heat.", bellwether:"Even sound has roots. Cut them.", verdigris:"Verdigris. Don't hold back on my account.",
    glasswake:"Mirrors don't grow. Break them.", undertow:"Water's good for roots. Not for you. Keep moving.", gravemark:"Stone cracks when roots get in. Find the cracks.", redactor:"He took my powers once. Don't let him take yours.",
  },
  patch:{
    any:["Tech locker's open. Don't break anything.","Pick one. I'm not made of prototypes.","Fresh from the bench. Some of it was even tested.","Fortress tech, still warm. Literally. Don't lick it.","I fought Bastion for this budget. Choose wisely.","Upgrade time. Try to bring the parts back in one piece."],
    low:["Your suit's flashing red. That's bad. Here's something less bad."],
    late:["Deep in the city now. Comms are getting patchy. Pun intended."],
    clean:["Zero damage reports. Are you even out there?"], parry:[],
  },
};
function commsLine(who){
  const L=COMMS_LINES[who]; if (!L) return '...';
  const used=run.lines||(run.lines=[]), fresh=a=>a.filter(t=>!used.includes(t));
  const d=run.route && curDistrict(), situational=[];
  if (player.hp<player.maxHp*0.4) situational.push(...fresh(L.low||[]));
  if (d && isBossRoom() && L[d] && !used.includes(L[d])) situational.push(L[d]);
  if (run.route && run.route.i>=3) situational.push(...fresh(L.late||[]));
  if (run.hits===0 && (run.roomsCleared||0)>=3) situational.push(...fresh(L.clean||[]));
  if ((run.parries||0)>=5) situational.push(...fresh(L.parry||[]));
  let pool = situational.length && Math.random()<0.7 ? situational : fresh(L.any);
  if (!pool.length) pool=L.any;
  const line=pick(pool); used.push(line); return line;
}

function has(id){ return player.owned[id]; }
function val(id,key='v'){
  const o=player.owned[id]; if (!o) return 0;
  const base=BOON_BY_ID[id][key][o.rarity];
  return Math.round(base*(1+0.4*(o.level-1))*100)/100;
}
// Run modifiers are rebuilt from scratch whenever the build changes, so tuning sliders stay live underneath.
function recalcRun(){
  const p=player, t=p.tech;
  R = { strikeMul:1, reachMul:1+0.15*(t.longarc||0), powerCdMul:Math.pow(0.8,t.coil||0)*(1-val('echo_cd')/100),
        dashCdMul:Math.pow(0.75,t.servos||0), sigRate:0.55*(1+0.4*(t.capacitor||0))*(1+val('halo_sig')/100),
        chainMax:4+(t.relay||0)+(has('resonance')?1:0), moveMul:1+0.1*(t.overclock||0),
        dmgTakenMul:1-val('ironwill')/100, windMul:1+val('foresight')/100, dmgMul:1+0.05*metaRank('training') };
  p.maxHp = 100+25*(t.suit||0)+10*metaRank('vitality');
}
function ownedList(){
  const out=[];
  for (const s of ['strike','power','dash','overload']){ const o=player.slots[s]; if (o) out.push(o); }
  for (const o of player.passives) out.push(o);
  return out.map(o=>({name:BOON_BY_ID[o.id].name+(o.level>1?' '+'I'.repeat(o.level):''), c:HEROES[BOON_BY_ID[o.id].hero].c, slot:BOON_BY_ID[o.id].slot, rarity:o.rarity, level:o.level, hero:BOON_BY_ID[o.id].hero}))
    .concat(Object.entries(player.tech).filter(([,n])=>n>0).map(([id,n])=>({name:TECH.find(x=>x.id===id).name+(n>1?' ×'+n:''), c:COL.heal, slot:'tech'})));
}
function takeBoon(id,rarity){
  const p=player, def=BOON_BY_ID[id], cur=p.owned[id];
  if (cur){ cur.level=Math.min(3,cur.level+1); }
  else {
    const o={id,rarity,level:1};
    if (def.slot==='passive') p.passives.push(o);
    else { const old=p.slots[def.slot]; if (old) delete p.owned[old.id]; p.slots[def.slot]=o; }
    p.owned[id]=o;
  }
  recalcRun(); refreshSlotHud();
}
function takeTech(id){ player.tech[id]=(player.tech[id]||0)+1; recalcRun(); refreshSlotHud(); }

/* Status effects and friendly zones */
function burst(x,y,r,dmg,c,stun=0){
  fx.push({type:'shock',x,y,t:0,dur:.3,r,c});
  for (const e of liveEnemies()){ const d=Math.hypot(e.x-x,e.y-y); if (d<r+e.r) damageEnemy(e,dmg,Math.atan2(e.y-y,e.x-x),220,stun,{src:'boon',c}); }
}
function poisonEnemy(e,stacks=1){
  const dps=val('bramble')||5;
  if (!e.poison) e.poison={stacks:0,t:0,acc:0,dps};
  e.poison.stacks=Math.min(3,e.poison.stacks+stacks); e.poison.t=3; e.poison.dps=Math.max(e.poison.dps,dps);
}
function rootEnemy(e,s){ s+=val('deeproots'); if (e.isBoss) s*=0.35; e.rootT=Math.max(e.rootT||0,s); }
function tickStatus(e,dt){
  if (e.markT>0) e.markT-=dt;
  if (e.exposedT>0) e.exposedT-=dt;
  if (e.rootT>0) e.rootT-=dt;
  if (e.kbT>0) e.kbT-=dt;
  const pz=e.poison;
  if (pz && pz.t>0){
    pz.t-=dt; pz.acc+=dt;
    if (pz.acc>=0.5){ pz.acc-=0.5; damageEnemy(e,pz.dps*pz.stacks*0.5*(1+val('venom')/100),0,0,0,{quiet:true,c:'#6ad46a'}); }
    if (pz.t<=0) e.poison=null;
  }
}
function updateZones(dt){
  for (const z of zones){
    z.t+=dt;
    if (z.kind==='echo'){
      if (!z.fired && z.t>=0.5){ z.fired=true; burst(z.x,z.y,90,z.dmg,HEROES.echo.c,0.2); addShake(4); }
      continue;
    }
    z.acc=(z.acc||0)+dt;
    if (z.acc>=0.25){ z.acc-=0.25; for (const e of liveEnemies()) if (Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r*0.5) damageEnemy(e,z.dps*0.25,0,0,0,{quiet:true,c:z.c}); }
  }
  zones=zones.filter(z=>z.t<z.dur);
}
