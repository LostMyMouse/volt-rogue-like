// Volt: The opening cutscene, written as a cold open: the Redactor's broadcast, the heroes arguing in the
// Fortress (each gets a name card the first time they speak), and Volt crashing the meeting. Plays the
// first time you enter the Fortress; replay it from Volt's bunk. Click, tap or press a key to continue
// (the first press finishes a line that is still typing); Skip ends it.
'use strict';

const CS_ROOF='assets/arena/rooftop.webp', CS_FORT='assets/fortress/hub.jpg';
// who: speaker id; expr: portrait expression; card: a name-card intro with a tagline; art/row: a big figure.
const CUTSCENE = [
  { bg:CS_ROOF, dim:true, art:'assets/intro/redactor.png', c:'#e0283c', who:'redactor', expr:'pleased', tag:'Every screen in the city', text:"Good evening. This is a courtesy notice regarding your heroes' powers." },
  { bg:CS_ROOF, dim:true, art:'assets/intro/redactor.png', c:'#e0283c', who:'redactor', expr:'pleased', text:"They've been reviewed. Most of them failed." },
  { bg:CS_ROOF, dim:true, row:['kilnheart','bellwether','verdigris','glasswake','undertow'], who:'redactor', text:"My associates will be managing your districts from now on. Please direct all complaints to no one." },
  { bg:CS_ROOF, dim:true, art:'assets/intro/gravemark.png', c:'#b56cff', who:'gravemark', expr:'stern', text:"And any heroes who object can take it up with me. On the roof." },
  { bg:CS_ROOF, dim:true, art:'assets/intro/redactor.png', c:'#e0283c', who:'redactor', text:"Have a quiet night. You won't have a choice." },

  { bg:CS_FORT, card:'bastion', tagline:'Runs the Fortress. Hates surprises.', who:'bastion', expr:'stern', tag:'The Fortress · ten minutes later', text:"Four districts dark. Half my roster drained. Somebody give me good news." },
  { bg:CS_FORT, card:'patch', tagline:'Engineer. Comms. Coffee.', who:'patch', text:"Good news: the coffee machine survived." },
  { bg:CS_FORT, dim:true, who:'bastion', expr:'stern', text:"Patch." },
  { bg:CS_FORT, dim:true, who:'patch', expr:'pleased', text:"Bad news: so did the Redactor." },
  { bg:CS_FORT, card:'echo', tagline:'Psychic. Usually right. Insufferable about it.', who:'echo', text:"Can we skip to the part where I'm right? We need more people." },
  { bg:CS_FORT, card:'thorn', tagline:'Ex-villain. Still earning trust.', who:'thorn', text:"People who aren't scared of him. That's a short list." },
  { bg:CS_FORT, card:'halo', tagline:"The world's number one hero. For now.", who:'halo', expr:'stern', text:"Then we make it longer." },

  { bg:CS_FORT, dim:true, who:'patch', text:"Uh. Small thing. Someone's climbing the outside of the Fortress." },
  { bg:CS_FORT, dim:true, who:'bastion', expr:'stern', text:"Nobody climbs a sixty-storey wall." },
  { bg:CS_ROOF, card:'volt', tagline:'Rookie hero. Very, very new.', who:'volt', expr:'pleased', text:"Hi! Sorry. Your front door has, like, nine locks." },
  { bg:CS_FORT, dim:true, portrait:'volt', who:'volt', text:"I'm Volt. I'm a hero. Rookie hero. I saw the broadcast, and I want to help." },
  { bg:CS_FORT, dim:true, portrait:'echo', who:'echo', expr:'pleased', text:"Oh, I like them." },
  { bg:CS_FORT, dim:true, portrait:'halo', who:'halo', text:"You're bleeding." },
  { bg:CS_FORT, dim:true, portrait:'volt', who:'volt', text:"The wall had opinions." },
  { bg:CS_FORT, dim:true, portrait:'halo', who:'halo', text:"Bastion. Give the rookie a run." },
  { bg:CS_FORT, dim:true, portrait:'bastion', who:'bastion', expr:'stern', text:"Training roof. Now. And don't touch my table." },
  { bg:CS_FORT, dim:true, portrait:'volt', who:'volt', expr:'pleased', text:"What table?" },
];

const portraitSrc = (id,expr) => expr && expr!=='neutral' ? `assets/portraits/${id}/${expr}-256.png` : `assets/portraits/${id}.png`;
let cut=null;
function playCutscene(done){
  if (window.__volt && window.__volt.noIntro){ done && done(); return; }
  cut={i:-1, done, typing:null};
  state='cutscene'; keys.clear(); stick.id=null;
  show('#cutscene',true); nextCutPanel();
}
function nextCutPanel(){
  if (!cut) return;
  const el=$('#cutscene');
  if (cut.typing){ clearInterval(cut.typing); cut.typing=null; $('#csText').textContent=CUTSCENE[cut.i].text; return; } // first tap finishes the line
  if (++cut.i>=CUTSCENE.length){ endCutscene(); return; }
  const p=CUTSCENE[cut.i], prev=CUTSCENE[cut.i-1], img=$('#csImg'), fig=$('#csFigure');
  // Only restart the slow pan when the location changes, so a conversation feels like one continuous shot.
  if (!prev || prev.bg!==p.bg){ img.style.backgroundImage=`url(${p.bg})`; img.classList.remove('kb'); void img.offsetWidth; img.classList.add('kb'); }
  img.classList.toggle('dim',!!p.dim || !!p.card);
  fig.innerHTML=''; fig.className='cs-figure';
  if (p.card){
    const sp=SPEAKERS[p.card]; fig.classList.add('namecard'); fig.style.setProperty('--c',sp.c);
    fig.innerHTML=`<img src="${portraitSrc(p.card,p.expr)}" alt=""><div class="cs-card"><span>${p.card==='volt'?'Introducing':'Meet'}</span><b>${sp.name}</b><i>${p.tagline}</i></div>`;
  } else if (p.art){ fig.classList.add('art'); fig.style.setProperty('--c',p.c||COL.volt); fig.innerHTML=`<img src="${p.art}" alt="">`; }
  else if (p.row){ fig.classList.add('row'); fig.innerHTML=p.row.map(id=>`<span style="--c:${SPEAKERS[id].c}"><img src="assets/portraits/${id}.png" alt=""><b>${SPEAKERS[id].name}</b></span>`).join(''); }
  else if (p.portrait){ fig.classList.add('solo'); fig.style.setProperty('--c',SPEAKERS[p.portrait].c); fig.innerHTML=`<img src="${portraitSrc(p.portrait,p.expr)}" alt="">`; }
  // Caption: who's talking, in their colour, with a small location tag when the scene changes.
  const sp=p.who && SPEAKERS[p.who], cap=$('#csCaption');
  cap.style.setProperty('--c', sp ? sp.c : COL.volt);
  $('#csWho').textContent = sp ? sp.name : ''; $('#csWho').hidden=!sp;
  $('#csTag').textContent = p.tag||''; $('#csTag').hidden=!p.tag;
  el.classList.toggle('villain', !!sp && sp.role==='Villain');
  const t=$('#csText'); t.textContent=''; let n=0;
  cut.typing=setInterval(()=>{ n+=2; t.textContent=p.text.slice(0,n); if (n>=p.text.length){ clearInterval(cut.typing); cut.typing=null; } }, 26);
  $('#csCount').textContent=`${cut.i+1} / ${CUTSCENE.length}`;
}
function endCutscene(){
  if (!cut) return;
  clearInterval(cut.typing); const done=cut.done; cut=null;
  show('#cutscene',false); save.seenIntro=1; writeSave();
  done && done();
}
$('#cutscene').addEventListener('pointerdown', e => { if (e.target.id==='csSkip') return; nextCutPanel(); });
$('#csSkip').addEventListener('click', endCutscene);
