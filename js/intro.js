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
const INTRO_ART = ['kilnheart','gravemark','bellwether','verdigris','glasswake','undertow']; // assets/intro/<id>.png; others fall back to their drawn bust

function introFor(id){
  const b=BOSSES[id];
  if (b && b.intro) return Object.assign({kind:'villain', title:b.title, flourish:'blocks your path!'}, b.intro);
  return CHARACTER_INTROS[id];
}
// Returns true if a card was shown (caller should wait for `done`), false if this character needs no card.
function maybeIntro(id, done, opt={}){
  const info=introFor(id); if (!info) return false;
  const met=save.met||(save.met={heroes:[],villains:{}});
  let line;
  if (info.kind==='hero'){
    if (met.heroes.includes(id)) return false; // heroes are introduced once, ever
    met.heroes.push(id); line=info.first;
  } else {
    const n=met.villains[id]||0; met.villains[id]=n+1;
    line = n===0 ? info.first : pick(info.repeat);
  }
  writeSave();
  const sp=SPEAKERS[id];
  showIntro({ id, name:sp.name, c:sp.c, tag:(info.kind==='hero'?'Hero · ':'Villain · ')+(info.kind==='hero'?sp.role:info.title), flourish:opt.flourish||info.flourish, line }, done);
  return true;
}

let introDone=null, introStart=0, introTimer=null;
function showIntro(card, done){
  const el=$('#introCard'), art=$('#introArt');
  if (window.__volt && window.__volt.noIntro){ done && done(); return; }
  state='intro'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; powerHeld=false;
  if (player){ player.blockHeld=false; player.charging=0; }
  el.style.setProperty('--c',card.c);
  $('#introTag').textContent=card.tag; $('#introName').textContent=card.name;
  $('#introSub').textContent=card.flourish; $('#introLine').textContent='“'+card.line+'”';
  if (INTRO_ART.includes(card.id)){ art.innerHTML=''; art.style.backgroundImage=`url(assets/intro/${card.id}.png)`; art.classList.remove('bust'); }
  else { art.style.backgroundImage=''; art.classList.add('bust'); art.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${PORTRAIT_SVG[card.id]||BUST}</svg>`; }
  el.classList.remove('in','out'); el.hidden=false; void el.offsetWidth; el.classList.add('in');
  introDone=done; introStart=performance.now();
  clearTimeout(introTimer); introTimer=setTimeout(()=>dismissIntro(true),5200);
}
function dismissIntro(force){
  if (state!=='intro') return;
  if (!force && performance.now()-introStart<650) return; // a short beat so a held key can't skip it instantly
  clearTimeout(introTimer);
  const el=$('#introCard'); el.classList.add('out'); setTimeout(()=>{ if (state!=='intro') el.hidden=true; },300);
  state='play';
  const cb=introDone; introDone=null; cb && cb();
}
