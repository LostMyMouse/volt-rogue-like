// Volt: Intro splash cards. Every villain fight opens with one; each hero gets one the first time they call in.
'use strict';

// Lines for characters without a spec-boss definition. Spec bosses carry their own `intro` block.
const CHARACTER_INTROS = {
  halo:{ kind:'hero', flourish:'is on comms!', first:"So you're the rookie everyone keeps talking about. Show me why." },
  bastion:{ kind:'hero', flourish:'is on comms!', first:"Bastion. I hold this city's line. Tonight I'm holding yours." },
  echo:{ kind:'hero', flourish:'is on comms!', first:"Echo. I already know how this ends. You're going to need me." },
  thorn:{ kind:'hero', flourish:'is on comms!', first:"Thorn. I used to be on the other side. Turns out I'm better at this one." },
  patch:{ kind:'hero', flourish:'is on comms!', first:"Patch. I build the gear, you break it. Try not to break yourself." },
};
// Volt answers every intro card, like Zagreus does in Hades. Villains get a first-meeting reply and
// a pool for rematches; heroes get one reply for their one-time introduction.
const VOLT_REPLIES = {
  kilnheart:{ first:"Then I'll just have to turn you off.", repeat:["I brought a bigger extinguisher.","Cool off, Kilnheart.","Let's see who burns out first."] },
  bellwether:{ first:"Funny. I was about to say the same about your music.", repeat:["Same song again? Change the record.","I'm cutting the power to the speakers.","Time for the last track."] },
  verdigris:{ first:"Then I'll scrape every roof clean.", repeat:["Weeding time.","Your garden's getting pruned.","Pest control, Verdigris. That's me."] },
  glasswake:{ first:"Then I'll just hit all of you.", repeat:["Smash enough mirrors and you find the real one.","Seven years' bad luck? I'll risk it.","I can see straight enough."] },
  undertow:{ first:"Good thing I don't plan on standing still.", repeat:["I've been practising holding my breath.","Electricity and water. You sure about this?","Tide's turning, Undertow."] },
  gravemark:{ first:"Carve it big. You'll want everyone to read it.", repeat:["Rocks don't remember. I do.","Back on your roof. Miss me?","Let's see which of us cracks first."] },
  redactor:{ first:"Revoke this.", repeat:["My file's still open.","You can't edit me out.","Let's finish this."] },
  halo:"Halo? THE Halo? ...I won't let you down.",
  bastion:"Then I'll hold the roof. Thanks, Bastion.",
  echo:"Do you, though?",
  thorn:"Glad you switched sides.",
  patch:"No promises.",
};
// Intro art is detected rather than listed: any assets/intro/<id>.png that loads is used, so new cut-outs
// (heroes, Volt) work the moment they're added. Characters without one fall back to their drawn bust.
const INTRO_ART = [];
for (const id of ['volt','halo','bastion','echo','thorn','patch','kilnheart','gravemark','bellwether','verdigris','glasswake','undertow','redactor']){ const im=new Image(); im.onload=()=>INTRO_ART.push(id); im.src=`assets/intro/${id}.png`; }

function introFor(id){
  const b=BOSSES[id];
  if (b && b.intro) return Object.assign({kind:'villain', title:b.title, flourish:'blocks your path!'}, b.intro);
  return CHARACTER_INTROS[id];
}
// Returns true if a card was shown (caller should wait for `done`), false if this character needs no card.
function maybeIntro(id, done, opt={}){
  const info=introFor(id); if (!info) return false;
  const met=save.met||(save.met={heroes:[],villains:{}});
  let pages;
  if (info.kind==='hero'){
    if (met.heroes.includes(id)) return false; // heroes are introduced once, ever
    pages=STORY.first[id]?storyPages(id,STORY.first[id]):[{who:id,text:info.first},{who:'volt',text:VOLT_REPLIES[id]}];
  } else {
    // The next story conversation with this villain (js/story.js); once those run out, a short exchange.
    pages=nextStory('encounter',id);
    const n=met.villains[id]||0;
    if (!pages){
      const r=VOLT_REPLIES[id];
      pages=[{who:id, text: n===0 ? info.first : pick(info.repeat)}];
      if (r) pages.push({who:'volt', text: n===0 ? r.first : pick(r.repeat)});
    }
    // The encounter's own defeat conversation already acknowledges this loss.
    const remembered=/_killed$/.test(pages.storyId||'')?null:rivalMemory(id);if(remembered)pages.unshift(remembered);
  }
  writeSave();
  const sp=SPEAKERS[id];
  // The card announces them; then they talk in the dialogue box.
  showIntro({ id, name:sp.name, c:sp.c, tag:(info.kind==='hero'?'Hero · ':'Villain · ')+(info.kind==='hero'?sp.role:info.title), flourish:opt.flourish||info.flourish },
    ()=>runDialogue(pages,info.kind==='hero'?'Comms':'Encounter',()=>{
      if(info.kind==='hero'){if(!met.heroes.includes(id))met.heroes.push(id);}else met.villains[id]=(met.villains[id]||0)+1;
      writeSave();done&&done();
    }));
  return true;
}

let introDone=null, introStart=0, introTimer=null;
function showIntro(card, done){
  sfx(card.tag && card.tag.startsWith('Hero')?'intro_hero':'intro_villain',{vary:false});
  const el=$('#introCard'), art=$('#introArt');
  if (window.__volt && window.__volt.noIntro){ done && done(); return; }
  state='intro'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; powerHeld=false;
  if (player){ player.blockHeld=false; player.charging=0; }
  el.style.setProperty('--c',card.c);
  $('#introTag').textContent=card.tag; $('#introName').textContent=card.name;
  $('#introSub').textContent=card.flourish;
  art.innerHTML='';art.style.backgroundImage='';art.classList.remove('bust');
  const image=new Image();image.alt=card.name;image.className='intro-character-art';
  image.onerror=()=>{image.onerror=null;image.src=`assets/portraits/${card.id}.png?v=2026-10-18-story`;};
  image.src=`assets/intro/${card.id}.png?v=2026-10-18-story`;art.appendChild(image);
  el.classList.remove('in','out'); el.hidden=false; void el.offsetWidth; el.classList.add('in');
  introDone=done; introStart=performance.now();
  clearTimeout(introTimer); introTimer=setTimeout(()=>dismissIntro(true),2800);
}
function dismissIntro(force){
  if (state!=='intro') return;
  if (!force && performance.now()-introStart<650) return; // a short beat so a held key can't skip it instantly
  clearTimeout(introTimer);
  const el=$('#introCard'); el.classList.add('out'); setTimeout(()=>{ if (state!=='intro') el.hidden=true; },300);
  state='play';
  const cb=introDone; introDone=null; cb && cb();
}
