// Volt: Volt's notebook, the game's codex (like Hades' Codex). Everyone Volt meets gets a page written in
// Volt's own voice; more of each page unlocks as relationships and the story move on. Opened from Volt's
// bunk in the Fortress or from the pause menu. Seen entries are saved in save.codexSeen.
'use strict';

// Each entry: notes unlock in order; `when` reads the same context the story uses.
const seenAny = (c,...ids) => ids.some(id=>c.seen(id));
const talks = (prefix) => Object.keys(save.talk||{}).filter(k=>k.startsWith(prefix)).length;
const CODEX = [
  {id:'operation',group:'The mission',notes:[
    {text:'The Redactor steals registered hero powers through district relays. The Fortress shield protects the team inside. My lightning is not registered, so Patch can route their backup through my suit without broadcasting their signatures.'},
    {when:c=>!!save.missionBriefed,text:'Three district relay operators, then Gravemark, then the tower control room. If I go down, Patch extracts me. Borrowed upgrades burn out during extraction; permanent Fortress upgrades stay. His crews reconnect the relays between operations.'},
    {when:c=>c.wins>=1,text:'Shutting down the main drain returned stolen powers. The Redactor escaped through a backup network. We are going back to keep those relays offline. A win matters, even while there is more work to do.'},
  ]},
  { id:'volt', group:'Me', notes:[
    { text:"Me. Volt. The electricity is natural. I kept it quiet while helping around my neighbourhood. Then the whole city needed help. Apparently that meant climbing sixty floors and admitting I could not do everything alone. I joke when I am nervous. Bastion has noticed." },
    { when:c=>c.runs>=3, text:"Things I've learned: walls have opinions, Bastion's table is sacred, and when a white ring closes, you block. Things I haven't learned: how to land without falling over." },
    { when:c=>c.wins>=1, text:"I walked out of the Redactor's tower. Me. The rookie who climbed in through the window. Halo looked at me like she was doing maths. I think I passed. I'm writing it down so it's official." },
  ]},
  { id:'halo', group:'Heroes', notes:[
    { text:"Halo. THE Halo. The world's number one hero eleven years running. I had her poster on my wall when I was twelve. It's in my locker now, which is either inspiring or deeply embarrassing. Powers: light. All of it. She once stopped a runaway train by standing in front of it and glowing. Personality: calm. Terrifyingly calm. She hasn't smiled at me yet. I'm counting." },
    { when:c=>talks('h_')>=2, text:"She stands on that balcony every night, watching the city. Patch says she hasn't taken a night off in nine years. I asked her what she's looking for. She said, \"Anything that moves wrong.\" I don't think that's the whole answer." },
    { when:c=>seenAny(c,'h_partner2'), text:"The Redactor was her partner. When the tower came down she could save him or the district, and she chose the district. She's been standing on that balcony ever since, checking her answer. I don't think she's sure yet. Whatever happens, she's never making a call like that alone again. Not while I'm around." },
  ]},
  { id:'bastion', group:'Heroes', notes:[
    { text:"Fortress commander. Built like a door. Has a scar he won't explain and a table he won't let anyone touch. Powers: force fields, hexagon shields that can stop a truck. I've seen it. The truck lost. He's called me \"rookie\" forty times. Bastion: forty. Me: zero cool nicknames." },
    { when:c=>talks('b_')>=2, text:"He's tough on everyone, but he's the one who stays up rewatching footage of my runs. I caught him once. He said he was \"reviewing tactical errors.\" Then he handed me new gauntlet straps without making eye contact. I'm still not allowed near the table." },
    { when:c=>seenAny(c,'b_docks','ut_why'), text:"He used to guard the docks. The city pulled the heroes out, the floods came, and nobody answered the call. He followed orders, and he's never forgiven himself. I think that's why he shouts so much. Every rookie he keeps alive is one more person he didn't leave behind." },
  ]},
  { id:'echo', group:'Heroes', notes:[
    { text:"Psychic. About my age. Already knows what I'm going to write here, which is annoying. Reads minds, sees a few seconds ahead, and mostly uses both to win arguments. Officially my \"rival\". I didn't agree to that. Echo just announced it." },
    { when:c=>talks('e_')>=2, text:"Echo pretends not to care, but the voice in my comms telling me where to dodge is always theirs. I said thanks once. They said, \"Gross.\" Then they smiled when they thought I wasn't looking. I was looking. I'm getting better at that." },
    { when:c=>seenAny(c,'e_glass','ec_quiet') || c.runs>=6, text:"Being psychic means hearing everyone's worst thoughts, all the time. Echo told me my head goes quiet when I fight. Focused. I think that's why they hang around me. Everyone needs somewhere quiet. Apparently mine is... me? Weird. Nice, though." },
  ]},
  { id:'thorn', group:'Heroes', notes:[
    { text:"Ex-villain. Grows plants out of anything: concrete, steel, once a vending machine. Lives in the greenhouse and talks more to the ferns than to people. Half the Fortress still doesn't trust him. I don't get it. He's the only one who's asked if I've eaten today." },
    { when:c=>talks('t_')>=2, text:"He doesn't talk about his villain days. What I've pieced together: he worked for the Redactor, and when he tried to leave, the Redactor took his powers as a punishment. He grew them back. Slowly. Like the plants." },
    { when:c=>seenAny(c,'t_plant','vg_thorn2'), text:"Verdigris was his partner. The little plant in the blue pot was theirs, a gift from back when they both grew living things. Thorn's kept it alive the whole time, waiting for them to want it back. That might be the most hopeful thing anyone in this building does." },
  ]},
  { id:'patch', group:'Heroes', notes:[
    { text:"Engineer. Runs comms, builds the gear, fixes everything I break, makes the coffee. Deadpan. Very deadpan. I've never seen her surprised, and I once walked in on fire. Powers: none. She says engineering is the power. She's right. She can also probably hear me writing this." },
    { when:c=>talks('p_')>=2, text:"She names my suit repairs. Repair forty-one is called \"Again.\" I'm pretty sure she likes me. She denies it, then fixes my suit at three in the morning without being asked." },
    { when:c=>seenAny(c,'p_kiln') || c.runs>=8, text:"Patch was the only voice on comms the night the Redactor hit. She kept four heroes alive with a headset and a map. Nobody gave her a medal. I'm going to get her a medal. Or a better coffee machine. Probably the coffee machine." },
  ]},
  { id:'kilnheart', group:'Villains', notes:[
    { text:"Furnace suit running at nine hundred degrees. Punches like a building falling over. Calls me \"kid\". Do not hug." },
    { when:c=>c.seen('kh_why'), text:"She used to work the foundry that kept this city warm. When they shut it down, her neighbourhood's lights went out first. She's angry at the right people. She's just hitting the wrong ones." },
    { when:c=>(c.beaten.kilnheart||0)>=2 || c.seen('kh_why'), text:"She's not evil. She's tired. When this is over, someone should turn that foundry back on. It's on my list." },
  ]},
  { id:'bellwether', group:'Villains', notes:[
    { text:"Sound powers. Turns speakers into weapons and every fight into a concert. Hates critics. I am now a critic." },
    { when:c=>c.seen('bw_why'), text:"Ten years singing to empty rooms. Now the whole city has to listen. I told her being heard isn't the same as being listened to. She called me a terrible audience." },
    { when:c=>(c.beaten.bellwether||0)>=2 || c.seen('bw_why'), text:"Honestly? She's good. If she ever plays a show nobody's forced to attend, I'm buying a ticket." },
  ]},
  { id:'verdigris', group:'Villains', notes:[
    { text:"Living metal and acid. Turns rooftops into rust gardens. Extremely polite while trying to dissolve me." },
    { when:c=>c.seen('vg_thorn'), text:"Thorn's old partner. They used to grow living things together. Now everything they touch rusts." },
    { when:c=>c.seen('vg_thorn2'), text:"They asked if Thorn still has the plant. That's not something a lost cause asks." },
  ]},
  { id:'glasswake', group:'Villains', notes:[
    { text:"Mirrors and hard light. Makes copies of herself. All of them smug. Hit the one that's thinking." },
    { when:c=>c.seen('gw_why'), text:"For years nobody looked at her twice. Now nobody can look away. I get it more than I'd like to admit." },
    { when:c=>(c.beaten.glasswake||0)>=2 || c.seen('gw_why'), text:"When I said I could see her, the real her, she went quiet. Then she threw glass at me. Progress." },
  ]},
  { id:'undertow', group:'Villains', notes:[
    { text:"Water pressure and ice. Lives in the flooded docks and holds grudges deeper than the harbour." },
    { when:c=>c.seen('ut_why'), text:"The city pulled the heroes out of the docks. The floods came and nobody answered. The Redactor did. That's his whole reason, and it isn't a bad one." },
    { when:c=>(c.beaten.undertow||0)>=2 || c.seen('ut_why'), text:"He told me to prove the water's safe. So that's the job now." },
  ]},
  { id:'gravemark', group:'Villains', notes:[
    { text:"Stone golem. Gravity powers. Carves the names of heroes it beats into its roof. It threatens to put my name there next. I am keeping it off the list." },
    { when:c=>c.seen('gm_names'), text:"The names on the roof are heroes the city forgot. Gravemark remembers them. I don't know what to do with that." },
    { when:c=>(c.beaten.gravemark||0)>=2 || c.seen('gm_names'), text:"Halo faced it years ago. Even she could not keep it down. It always gets back up. So do I." },
  ]},
  { id:'redactor', group:'Villains', notes:[
    { text:"Steals powers and calls it \"reviewing\" them. Talks like a customer-service email that wants you dead." },
    { when:c=>c.seen('rd_halo2'), text:"He was Halo's partner. The city forgot his name. He decided nobody should have powers if powers mean somebody gets left behind." },
    { when:c=>(c.beaten.redactor||0)>=2 || c.seen('rd_why'), text:"He's wrong. But he's not wrong about why it hurts. Beat him anyway. Then maybe find out his name." },
  ]},
];
const codexKnown = e => e.group!=='Villains' || ((save.met&&save.met.villains&&save.met.villains[e.id])||0)>0 || !!(save.beaten||{})[e.id];
const codexCtx = () => storyContext('');
function codexUnlocked(e){ if (!codexKnown(e)) return 0; const c=codexCtx(); let n=0; for (const nt of e.notes){ if (nt.when && !nt.when(c)) break; n++; } return n; }
const codexNew = e => { const n=codexUnlocked(e), s=(save.codexSeen||{})[e.id]||0; return n>s; };
const codexAnyNew = () => CODEX.some(codexNew);

let codexSel='volt', codexBack=null;
function openCodex(from){
  codexBack=from; if (from==='hub'){ state='hubmenu'; keys.clear(); }
  if (!CODEX.find(e=>e.id===codexSel && codexKnown(e))) codexSel='volt';
  fillCodex(); show('#mCodex',true);
  const b=$(`#codexTabs [data-id="${codexSel}"]`); b && b.focus();
}
function closeCodex(){ show('#mCodex',false); if (codexBack==='hub') hubMenuClosed(); else if (codexBack==='pause') $('#btnResume').focus(); codexBack=null; }
function fillCodex(){
  { const cur=CODEX.find(x=>x.id===codexSel); (save.codexSeen||(save.codexSeen={}))[cur.id]=Math.max(save.codexSeen[cur.id]||0,codexUnlocked(cur)); writeSave(); } // reading a page clears its New badge
  const tabs=$('#codexTabs'); tabs.innerHTML='';
  let group='';
  for (const e of CODEX){
    if (e.group!==group){ group=e.group; const h=document.createElement('span'); h.className='tag codex-group'; h.textContent=group; tabs.appendChild(h); }
    const known=codexKnown(e), sp=SPEAKERS[e.id];
    const b=document.createElement('button'); b.type='button'; b.className='codex-tab'+(e.id===codexSel?' sel':''); b.dataset.id=e.id; b.disabled=!known;
    b.style.setProperty('--c', sp.c);
    b.innerHTML = known ? `<img src="assets/portraits/${e.id}.png" alt=""><span>${sp.name}</span>${codexNew(e)?'<i>New</i>':''}` : `<span class="codex-q">?</span><span>Unknown</span>`;
    b.addEventListener('click',()=>{ codexSel=e.id; fillCodex(); const t=$(`#codexTabs [data-id="${e.id}"]`); t&&t.focus(); });
    tabs.appendChild(b);
  }
  const e=CODEX.find(x=>x.id===codexSel), sp=SPEAKERS[e.id], n=codexUnlocked(e), page=$('#codexPage');
  page.style.setProperty('--c', sp.c);
  page.innerHTML = `<div class="codex-head"><img src="assets/portraits/${e.id}.png" alt=""><div><span class="tag">${e.id==='volt'?`Rookie hero · ${sp.pronouns}`:sp.role}</span><h3>${sp.name}</h3></div></div>`
    + e.notes.map((nt,i)=> i<n ? `<p>${nt.text}</p>` : i===n ? `<p class="codex-locked">More to write here. ${e.group==='Villains'?'Keep fighting them.':e.id==='volt'?'Keep going.':'Keep talking to them.'}</p>` : '').join('');
}
$('#btnCodexClose').addEventListener('click', closeCodex);
$('#btnCodexReplay').addEventListener('click', () => { show('#mCodex',false); const back=codexBack; codexBack=null; playCutscene(()=>{ if (back==='pause'){ state='paused'; show('#mPause',true); } else { state='hub'; hubNear=null; } }); });
$('#btnPauseCodex').addEventListener('click', () => openCodex('pause'));
