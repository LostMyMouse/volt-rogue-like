// Volt: The opening cutscene. Plays the first time you enter the Fortress (and can be replayed from Volt's
// bunk). Comic-panel slides over the existing art: a slow pan, letterbox bars and typewriter captions.
// Click, tap or press a key to continue; Skip ends it.
'use strict';

const CUTSCENE = [
  { bg:'assets/arena/rooftop.webp', text:"Every city has heroes. This one had more than most." },
  { bg:'assets/arena/rooftop.webp', dim:true, art:'assets/intro/redactor.png', c:'#e0283c', text:"Then the Redactor arrived. He doesn't steal money. He steals powers." },
  { bg:'assets/arena/rooftop.webp', dim:true, row:['kilnheart','bellwether','verdigris','glasswake','undertow'], text:"His villains carved the city into districts. Heat. Sound. Rust. Glass. Tide." },
  { bg:'assets/arena/rooftop.webp', dim:true, art:'assets/intro/gravemark.png', c:'#b56cff', text:"And on the highest roof, Gravemark keeps watch for him." },
  { bg:'assets/fortress/hub.jpg', portrait:'halo', text:"The heroes who are left hold out in the Fortress. Halo still watches the skyline. Every night." },
  { bg:'assets/fortress/hub.jpg', dim:true, text:"They're short on heroes." },
  { bg:'assets/arena/rooftop.webp', portrait:'volt', who:'volt', text:"Hi. Volt. Rookie. I'm here to help. ...Please let me help." },
];

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
  const p=CUTSCENE[cut.i], img=$('#csImg'), fig=$('#csFigure');
  img.style.backgroundImage=`url(${p.bg})`; img.classList.toggle('dim',!!p.dim);
  img.classList.remove('kb'); void img.offsetWidth; img.classList.add('kb'); // restart the slow pan
  fig.innerHTML=''; fig.className='cs-figure';
  if (p.art){ fig.classList.add('art'); fig.style.setProperty('--c',p.c||COL.volt); fig.innerHTML=`<img src="${p.art}" alt="">`; }
  else if (p.row){ fig.classList.add('row'); fig.innerHTML=p.row.map(id=>`<span style="--c:${SPEAKERS[id].c}"><img src="assets/portraits/${id}.png" alt=""><b>${SPEAKERS[id].name}</b></span>`).join(''); }
  else if (p.portrait){ fig.classList.add('solo'); fig.style.setProperty('--c',SPEAKERS[p.portrait].c); fig.innerHTML=`<img src="assets/portraits/${p.portrait}.png" alt=""><b>${SPEAKERS[p.portrait].name}</b>`; }
  el.classList.toggle('speaking',!!p.who);
  const t=$('#csText'); t.textContent=''; let n=0;
  cut.typing=setInterval(()=>{ n+=2; t.textContent=p.text.slice(0,n); if (n>=p.text.length){ clearInterval(cut.typing); cut.typing=null; } }, 28);
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
