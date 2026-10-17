// Volt: HUD, menus, run results and button wiring.
'use strict';

/* ---------- HUD ---------- */
const hud = { district:$('#hudDistrict'), bossName:$('#bossName'), bossTitle:$('#bossTitle'), tick1:$('#bossTick1'), tick2:$('#bossTick2'), blockAb:$('#abBlock'), blockTb:$('#tBlock'), shards:$('#hudShards'), boss:$('#bossBar'), hp:$('#hp'), hpText:$('#hpText'), wave:$('#waveNum'), ab:{ s:$('#abStrike'), p:$('#abPower'), d:$('#abDash'), q:$('#abSig') }, tb:{ s:$('#tStrike'), p:$('#tPower'), d:$('#tDash'), q:$('#tSig') } };
const last = {};
function setVar(el,name,v){ const key=el.id+name, r=Math.round(v*100)/100; if (last[key]!==r){ last[key]=r; el.style.setProperty(name,r); } }
function updateHud(){
  const p=player;
  { const on=state==='play'; if (document.body.classList.contains('playing')!==on) document.body.classList.toggle('playing',on); }
  setVar(hud.hp,'--hp',clamp(p.hp/p.maxHp,0,1)); hud.hp.classList.toggle('low',p.hp/p.maxHp<0.3);
  const hpT=String(Math.ceil(p.hp)); if (hud.hpText.textContent!==hpT) hud.hpText.textContent=hpT;
  const showBoss=!!(boss && boss.spawnT<=0 && state!=='start'); if (hud.boss.hidden===showBoss) hud.boss.hidden=!showBoss;
  if (showBoss && hud.bossKind!==boss){
    hud.bossKind=boss;
    hud.bossName.textContent=boss.name; hud.boss.style.setProperty('--bc',KIND_COL[boss.kind]||COL.boon); hud.bossTitle.textContent=isSpecBoss(boss)?BOSSES[boss.kind].title:'Boss';
    const th=isSpecBoss(boss)?BOSSES[boss.kind].phases:[]; [hud.tick1,hud.tick2].forEach((t,i)=>{ t.hidden=th[i]===undefined; if (th[i]!==undefined) t.style.setProperty('--at',(th[i]*100)+'%'); });
  }
  if (showBoss) setVar(hud.boss,'--hp',clamp(boss.hp/boss.maxHp,0,1));
  if (showBoss && isSpecBoss(boss)){ const lbl=(boss.atk && boss.atk.def && boss.atk.def.label) || BOSSES[boss.kind].title; if (hud.bossTitle.textContent!==lbl) hud.bossTitle.textContent=lbl; }
  { const sup=!!player.suppressed; for (const el of [hud.ab.p,hud.ab.q,hud.tb.p,hud.tb.q]) el.classList.toggle('suppressed',sup); }
  const bl=clamp(Math.max(p.blockLock,p.stunT)/BLOCK.shatterLock,0,1); setVar(hud.blockAb,'--cd',bl); setVar(hud.blockTb,'--cd',bl);
  hud.blockAb.classList.toggle('ready',p.blockHeld); hud.blockTb.classList.toggle('ready',p.blockHeld);
  const sT='◆ '+run.shards; if (hud.shards.textContent!==sT) hud.shards.textContent=sT;
  const r=run.route, dId=r&&curDistrict(), wT=dId?dId+':'+r.room:'';
  if (hud.wave.dataset.w!==wT){ hud.wave.dataset.w=wT; hud.district.textContent=dId?DISTRICTS[dId].name:'Rooftop'; hud.wave.innerHTML = !dId ? '–' : isBossRoom() ? 'Boss' : `${r.room}<small>/${roomsIn(dId)}</small>`; }
  const cds = { s:clamp(p.strikeCd/(p.strikeCdMax||0.34),0,1), p:clamp(p.powerCd/(p.powerCdMax||1),0,1), d:clamp(p.dashCd/(T.dashCooldown+T.dashTime),0,1) };
  for (const k of ['s','p','d']){ setVar(hud.ab[k],'--cd',cds[k]); setVar(hud.tb[k],'--cd',cds[k]); }
  const ch=p.sig/100; setVar(hud.ab.q,'--ch',ch); setVar(hud.tb.q,'--ch',ch);
  const ready=p.sig>=100; hud.ab.q.classList.toggle('ready',ready); hud.tb.q.classList.toggle('ready',ready);
}

/* ---------- Flow ---------- */
function show(id,on){ $(id).hidden=!on; }
function startGame(){
  reset(); lastCaller=null; routeStart(); exits=[]; roomPhase='reward'; arrivalT=0; transit=null; powerHeld=false;
  { const so=STYLE(); so.init && so.init(player); } applyStyleHud();
  save.runs++; writeSave(); leaveHub();
  show('#splash',false); show('#mStart',false); show('#mOver',false); show('#mPause',false); show('#mDraft',false); show('#mFortress',false); show('#mCity',false); refreshSlotHud(); state='play';
  openCityMap();
}
function openPause(){ if (state!=='play') return; state='paused'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; fillBuild($('#pauseBuild')); show('#mPause',true); $('#btnResume').focus(); }
function closePause(){ show('#mPause',false); state='play'; }
function gameOver(){ state='over'; playVoice('volt',"Not... yet..."); fillResults(); setTimeout(()=>{ if (state!=='over') return; show('#mOver',true); $('#btnAgain').focus(); },650); }
function winRun(){ state='over'; run.won=true; commendWin(); banner(run.route && curDistrict()==='redactor' ? 'THE CITY\'S POWER RETURNS' : 'CITY SECURED'); fillResults(); setTimeout(()=>{ if (state!=='over') return; show('#mOver',true); $('#btnAgain').focus(); },1600); }

/* ---------- Run results ---------- */
// Rank: reward progress and bosses, punish sloppiness. Roughly 330 for a clean win.
const RANKS = [
  {r:'S', min:280, title:'Legend in the Making', c:'#ffe08a'},
  {r:'A', min:190, title:'City Defender',        c:COL.volt},
  {r:'B', min:110, title:'Rising Hero',          c:COL.heal},
  {r:'C', min:50,  title:'Rookie on Probation',  c:COL.text},
  {r:'D', min:-1e9,title:'Sidekick Material',    c:COL.threat},
];
const CAUSE = { rusher:"a Rusher's pipe", needle:'a Needle drone shot' }; // bosses add theirs in their definitions
// Dialogue speakers use the full illustrated portrait roster.
const SPEAKERS = {
  halo:{name:'Halo', role:"The world's #1 hero", c:'#fff1d0'},
  bastion:{name:'Bastion', role:'Fortress commander', c:'#9fb0c8'},
  echo:{name:'Echo', role:'Psychic · your rival', c:'#8b93ff'},
  thorn:{name:'Thorn', role:'Reformed villain', c:'#6ad46a'},
  gravemark:{name:'Gravemark', role:'Villain', c:COL.boon},
  kilnheart:{name:'Kilnheart', role:'Villain', c:'#ff7a1a'},
  bellwether:{name:'Bellwether', role:'Villain', c:'#f5b915'},
  verdigris:{name:'Verdigris', role:'Villain', c:'#b8e62e'},
  glasswake:{name:'Glasswake', role:'Villain', c:'#ff3f9a'},
  undertow:{name:'Undertow', role:'Villain', c:'#7fd8ff'},
  redactor:{name:'The Redactor', role:'Villain', c:'#e0283c'},
  patch:{name:'Patch', role:'Fortress engineer', c:COL.heal},
  volt:{name:'Volt', role:'Rookie hero', gender:'male', pronouns:'he/him', c:COL.volt},
};
const QUOTES = {
  won: [['halo',"District by district, and Gravemark in the dirt. The city noticed tonight. So did I."],['bastion',"Clean work, rookie. Don't let it go to your head. The next roof won't be so kind."],['echo',"Okay. Fine. That was impressive. Don't tell anyone I said that."]],
  high:[['halo',"Not bad. I've seen worse first years. I was one of them."],['thorn',"You fight like someone with something to prove. Good. Keep proving it."],['bastion',"Solid. Now do it again without the close calls."]],
  mid: [['halo',"Heroes aren't measured by how they fall. Get up. Again."],['thorn',"I spent years on the wrong side of this fight. Losing isn't the end. Quitting is."],['echo',"I'd have lasted longer. Probably. ...That was decent, I guess."],['bastion',"You hesitated. Hesitation gets people hurt. Dash first, think second."]],
  rusher:[['bastion',"Watch the coral arc. When the pipe goes back, you go sideways."]],
  needle:[['echo',"Those drones telegraph like bad poker players. Watch the amber line, then move."]],
  villain:[['gravemark',"Is this what the Fortress sends now? I've crushed sturdier gravel."],['gravemark',"Little spark. You flickered, and then you went out."],['gravemark',"Run home to your heroes. Tell them Gravemark sends its regards."],['gravemark',"The roof will remember you. As a stain."]],
};
const pick = a => a[Math.floor(Math.random()*a.length)];
// Which villain taunts a D rank: whoever's attack landed the final blow, else Gravemark.
function villainFor(src){ for (const id in BOSSES) if (BOSSES[id].cause && BOSSES[id].cause[src]) return id; return 'gravemark'; }
function bossAdvice(src){ for (const id in BOSSES) if (BOSSES[id].advice && BOSSES[id].advice[src]) return BOSSES[id].advice[src]; return null; }
function causeText(src){ if (CAUSE[src]) return CAUSE[src]; for (const id in BOSSES) if (BOSSES[id].cause && BOSSES[id].cause[src]) return BOSSES[id].cause[src]; return 'the rooftop'; }
// Comms portraits: a real image in assets/portraits/<id>.png wins; until then each speaker gets a drawn bust
// (Gravemark uses a crop of its concept sheet).
const BUST = '<path d="M6 64 C8 46 20 40 32 40 C44 40 56 46 58 64 Z" fill="#0b111c"/><circle cx="32" cy="27" r="12" fill="#0b111c"/>';
const PORTRAIT_SVG = {
  volt: `<path d="M6 64 C8 46 20 40 32 40 C44 40 56 46 58 64 Z" fill="#0b111c"/><path d="M14 46 L24 40 L32 50 L40 40 L50 46 L42 52 L32 56 L22 52 Z" fill="#f4fbff"/><path d="M27 56 L25 64 M37 56 L39 64" stroke="#26bfff" stroke-width="2.5"/><path d="M20 23 L18 8 L25 15 L27 4 L32 13 L37 3 L39 14 L46 8 L44 23 Z" fill="#161c28" stroke="#f4fbff" stroke-width="1"/><path d="M21 29 C21 20 26 17 32 17 C38 17 43 20 43 29 C43 36 38 40 32 40 C26 40 21 36 21 29 Z" fill="#161c28"/><path d="M22 26 L42 26 L38 32 L32 30 L26 32 Z" fill="#26bfff"/>`,
  halo: `<circle cx="32" cy="14" r="13" fill="none" stroke="#fff6d6" stroke-width="3"/>${BUST}<path d="M22 27 h20" stroke="#fff1d0" stroke-width="3"/><path d="M14 52 L32 44 L50 52" stroke="#fff1d0" stroke-width="3" fill="none"/>`,
  bastion: `<path d="M2 64 C4 42 16 38 32 38 C48 38 60 42 62 64 Z" fill="#0b111c"/><rect x="18" y="13" width="28" height="27" rx="4" fill="#0b111c"/><rect x="22" y="23" width="20" height="5" fill="#9fb0c8"/><path d="M6 50 h52" stroke="#9fb0c8" stroke-width="3"/>`,
  echo: `<path d="M17 36 C14 20 20 11 32 11 C44 11 50 20 47 36 Z" fill="#0b111c"/>${BUST}<path d="M24 26 h16" stroke="#8b93ff" stroke-width="3"/><path d="M47 20 a9 9 0 0 1 0 13 M51 16 a15 15 0 0 1 0 21" stroke="#8b93ff" stroke-width="2.5" fill="none"/>`,
  redactor: `${BUST}<rect x="24" y="17" width="16" height="20" rx="2" fill="#ece6d6"/><rect x="30.5" y="21" width="3" height="12" fill="#e0283c"/><path d="M10 50 h44" stroke="#e0283c" stroke-width="3"/>`,
  gravemark: `${BUST}<rect x="30" y="18" width="4" height="14" fill="#b56cff"/>`,
  patch: `${BUST}<path d="M19 27 a13 13 0 0 1 26 0" stroke="#55e6c1" stroke-width="3" fill="none"/><rect x="16" y="25" width="6" height="9" rx="2" fill="#55e6c1"/><path d="M19 33 q2 7 9 7" stroke="#55e6c1" stroke-width="2" fill="none"/><rect x="24" y="24" width="16" height="4" fill="#55e6c1"/>`,
  thorn: `${BUST}<path d="M20 20 L16 8 L25 16 L28 4 L33 15 L39 5 L40 16 L49 9 L44 21" fill="#0b111c" stroke="#6ad46a" stroke-width="2"/><circle cx="27" cy="28" r="2" fill="#6ad46a"/><circle cx="37" cy="28" r="2" fill="#6ad46a"/><path d="M18 52 l6 -6 l2 8 M46 52 l-6 -6 l-2 8" stroke="#6ad46a" stroke-width="2.5" fill="none"/>`,
};
// Add an id here when its PNG lands in assets/portraits/.
const PORTRAIT_FILES = ["halo", "bastion", "echo", "thorn", "patch", "gravemark", "kilnheart", "bellwether", "verdigris", "glasswake", "undertow", "redactor", "volt"];
const PORTRAIT_EXPRESSIONS = ['neutral','pleased','stern'];
function setPortrait(el,who,expression='neutral'){
  const sp=SPEAKERS[who]; if(!sp || !el)return;
  if(!PORTRAIT_EXPRESSIONS.includes(expression))expression='neutral';
  const token=who+':'+expression;el.dataset.portrait=token;
  el.innerHTML='';el.style.backgroundImage='';el.style.backgroundColor='transparent';el.style.backgroundSize='contain';el.style.clipPath='none';el.className='portrait';
  el.setAttribute('aria-label',sp.name+' — '+expression);
  if(!PORTRAIT_FILES.includes(who)){el.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${PORTRAIT_SVG[who]||BUST}</svg>`;return;}
  const img=new Image();
  img.onload=()=>{if(el.dataset.portrait!==token)return;el.innerHTML='';el.style.backgroundImage=`url(${img.src})`;el.classList.add('has-img');};
  img.onerror=()=>{if(el.dataset.portrait===token)el.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true">${PORTRAIT_SVG[who]||BUST}</svg>`;};
  img.src=expression==='neutral'?`assets/portraits/${who}.png`:`assets/portraits/${who}/${expression}-256.png`;
}
// Rooftops plus villain rooms in a full run with the villains built so far.
function routeLength(){ const p=Math.min(DISTRICT_PICKS,builtPool().length); return p*(ROOMS_PER_DISTRICT+1)+(BOSSES.gravemark?ROOMS_PER_DISTRICT+1:0)+(BOSSES.redactor?3:0) || 15; }
function runScore(){
  return Math.round((run.roomsCleared||0)*10 + run.bossKills*30 + kills*0.5 + (run.won?60:0) - run.hits*3);
}
function fillResults(){
  // Rank thresholds scale with the length of a full run (they were tuned for 15 rooftops).
  const full=routeLength(), score=runScore()*15/full, rk=RANKS.find(x=>score>=x.min), dTotal=run.route?run.route.picks+(BOSSES.gravemark?1:0)+(BOSSES.redactor?1:0):0;
  const where = run.route && curDistrict() ? DISTRICTS[curDistrict()].name+(isBossRoom()?' · villain':' · rooftop '+run.route.room) : 'the rooftops';
  $('#resTag').textContent = (run.won ? 'Run complete · City secured' : 'Hero down · '+where)+' · '+STYLE().name;
  const rEl=$('#resRank'); rEl.textContent=rk.r; rEl.style.setProperty('--rank',rk.c);
  $('#resRankTag').textContent=`${rk.r}-Rank hero · ${Math.round(score)} pts`;
  $('#overTitle').textContent=rk.title;
  $('#resCause').textContent = run.won ? `Gravemark defeated ${run.bossKills} time${run.bossKills===1?'':'s'}.` : `Defeated by ${causeText(run.lastHit)}.`;
  $('#statWaves').textContent=`${run.districtsCleared||0}/${dTotal}`;
  $('#statKills').textContent=kills;
  const t=Math.floor(run.time); $('#statTime').textContent=`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
  $('#statHits').textContent=run.hits+(run.parries?` · ${run.parries} parried`:'');
  $('#resShards').textContent = `◆ ${run.shards} Renown Shards found this run · ${save.shards} banked for Fortress upgrades`+(run.licences?` · +${run.licences} Hero Licence${run.licences>1?'s':''} (${(run.commends||[]).join(', ')}) · ${save.licences} to spend at the armoury`:'');
  const boons=$('#resBoons'); boons.innerHTML='';
  const owned=ownedList();
  if (!owned.length){ const e=document.createElement('span'); e.className='hint'; e.textContent='No powers taken this run.'; boons.appendChild(e); }
  for (const b of owned){ const c=document.createElement('span'); c.className='boon-chip'; c.textContent=b.name; c.style.setProperty('--c',b.c||COL.boon); boons.appendChild(c); }
  let pool;
  if (run.won) pool=QUOTES.won;
  else if (rk.r==='D'){ const v=villainFor(run.lastHit); pool = v==='gravemark' ? QUOTES.villain : BOSSES[v].quotes.map(l=>[v,l]); }
  else if (rk.r==='S'||rk.r==='A') pool=QUOTES.high;
  else { const adv=QUOTES[run.lastHit] || bossAdvice(run.lastHit); pool = (adv && Math.random()<0.65) ? adv : QUOTES.mid; }
  const [who,line]=pick(pool), sp=SPEAKERS[who];
  const q=$('#resQuote'); q.classList.toggle('villain',sp.role==='Villain'); q.style.setProperty('--c',sp.c);
  save.last={won:run.won, cause:run.lastHit, districts:run.districtsCleared||0, rank:rk.r};
  if (run.won) save.wins=(save.wins||0)+1;
  else { const v=villainOf(run.lastHit); if (v){ save.killedBy=save.killedBy||{}; save.killedBy[v]=(save.killedBy[v]||0)+1; } }
  writeSave();
  setPortrait($('#resPortrait'),who,sp.role==='Villain'?'pleased':run.won||rk.r==='S'||rk.r==='A'?'pleased':'stern'); $('#resLine').textContent=line; $('#resWho').innerHTML=`<b>${sp.name}</b> · ${sp.role}`;
}
let tuneReturn=null;
function openTune(){
  tuneReturn = state==='play' ? 'play' : null;
  if (state==='play'){ state='paused'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null; }
  buildTune(); $('#tuneOut').hidden=true; show('#mTune',true); $('#btnTuneClose').focus();
}
function closeTune(){ show('#mTune',false); if (tuneReturn==='play' && $('#mPause').hidden) state='play'; tuneReturn=null; }

/* ---------- Title screen ---------- */
// The key art with the main menu. Start/Continue plays the active slot; Save Slots manages all three.
const hasSave = () => save.runs>0 || !!save.seenIntro;
const slotSummary = s => { const b=Object.keys(s.beaten||{}).length; return `${s.runs} run${s.runs===1?'':'s'} · ${b} villain${b===1?'':'s'} beaten · ◆ ${s.shards} · ✦ ${s.licences}`; };
function refreshSplash(){
  const any=hasSave();
  $('#btnStart span').textContent = any ? 'Continue' : 'Start Game';
  $('#splashMeta').textContent = any ? `Slot ${activeSlot} · ${slotSummary(save)}` : '';
  $('#splashPressWord').textContent = inputMode==='touch' ? 'Tap' : 'Press'; $('#splashKey').textContent = inputMode==='touch' ? 'Start' : inputMode==='pad' ? 'A' : 'Enter';
}
function startFromSplash(){
  goFullscreen(); show('#splash',false); show('#mSlots',false);
  // First launch: the opening cutscene, then the Fortress.
  if (!save.seenIntro) playCutscene(()=>enterHub()); else enterHub();
}
let confirmOk=null;
function askConfirm(tag,title,text,ok,run){ $('#confirmTag').textContent=tag; $('#confirmTitle').textContent=title; $('#confirmText').textContent=text; $('#btnConfirmOk').textContent=ok; confirmOk=run; show('#mConfirm',true); $('#btnConfirmBack').focus(); }
$('#btnConfirmOk').addEventListener('click', () => { show('#mConfirm',false); const r=confirmOk; confirmOk=null; r && r(); });
$('#btnConfirmBack').addEventListener('click', () => { show('#mConfirm',false); confirmOk=null; });

/* ---------- Save slots ---------- */
function fillSlots(msg){
  const list=$('#slotList'); list.innerHTML=''; $('#slotMsg').textContent=msg||'';
  for (let n=1;n<=SLOT_COUNT;n++){
    const s=readSlot(n), used=!!(s && (s.runs>0 || s.seenIntro)), act=n===activeSlot;
    const when = used && s.updated ? new Date(s.updated).toLocaleDateString(undefined,{day:'numeric',month:'short'})+' · '+new Date(s.updated).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}) : '';
    const card=document.createElement('div'); card.className='slot-card'+(act?' active':'')+(used?'':' empty');
    card.innerHTML=`<div class="slot-head"><strong>Slot ${n}</strong>${act?'<span class="slot-badge">Current</span>':''}</div>
      <p>${used?slotSummary(s):'Empty'}</p>${when?`<span class="slot-when">Last played ${when}</span>`:''}
      <div class="slot-btns"></div>`;
    const btns=card.querySelector('.slot-btns'), add=(label,cls,fn,dis)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn '+cls; b.textContent=label; b.disabled=!!dis; b.addEventListener('click',fn); btns.appendChild(b); };
    add(used?'Play':'New game','primary',()=>{ useSlot(n); refreshSplash(); startFromSplash(); });
    add('Export','',()=>exportSlot(n),!used);
    add('Import','',()=>importSlot(n));
    add('Erase','',()=>askConfirm('Slot '+n,'Erase this slot?','This permanently deletes slot '+n+': shards, upgrades, licences, styles and story progress. Export it first if you might want it back.','Erase',()=>{ try{ localStorage.removeItem('volt-save-'+n); }catch(e){} if (n===activeSlot) useSlot(n); refreshSplash(); fillSlots('Slot '+n+' erased.'); }),!used);
    list.appendChild(card);
  }
}
function exportSlot(n){
  const s=readSlot(n); if (!s) return;
  const blob=new Blob([JSON.stringify({game:'volt', format:1, slot:n, exported:new Date().toISOString(), save:s},null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`volt-slot${n}-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  fillSlots('Slot '+n+' exported. Keep the file somewhere safe; Import loads it back on any device.');
}
let importTarget=1;
function importSlot(n){ importTarget=n; const f=$('#slotFile'); f.value=''; f.click(); }
$('#slotFile').addEventListener('change', e => {
  const file=e.target.files && e.target.files[0]; if (!file) return;
  const r=new FileReader();
  r.onload=()=>{
    let data; try { data=JSON.parse(r.result); } catch(err){ fillSlots("That file isn't a Volt save."); return; }
    const s=data && data.game==='volt' ? data.save : null;
    if (!s || s.v!==1 || typeof s.runs!=='number'){ fillSlots("That file isn't a Volt save."); return; }
    const put=()=>{ try{ localStorage.setItem('volt-save-'+importTarget,JSON.stringify(s)); }catch(err){} if (importTarget===activeSlot) useSlot(importTarget); refreshSplash(); fillSlots('Imported into slot '+importTarget+'.'); };
    const cur=readSlot(importTarget);
    if (cur && (cur.runs>0 || cur.seenIntro)) askConfirm('Slot '+importTarget,'Replace this slot?','Slot '+importTarget+' already has a save. Importing replaces it.','Replace',put); else put();
  };
  r.readAsText(file);
});
$('#btnStart').addEventListener('click', startFromSplash);
$('#btnSlots').addEventListener('click', () => { fillSlots(); show('#mSlots',true); $('#btnSlotsBack').focus(); });
$('#btnSlotsBack').addEventListener('click', () => { show('#mSlots',false); $('#btnSlots').focus(); });
$('#btnHow').addEventListener('click', () => { show('#mStart',true); $('#btnHowBack').focus(); });
$('#btnHowBack').addEventListener('click', () => { show('#mStart',false); $('#btnHow').focus(); });
$('#btnSettings').addEventListener('click', openTune);
refreshSplash();
function goFullscreen(){
  if (inputMode!=='touch') return;
  try { const el=document.documentElement, r=el.requestFullscreen&&el.requestFullscreen({navigationUI:'hide'}); if (r&&r.then) r.then(()=>{ try{ screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }).catch(()=>{}); } catch(e){}
}
$('#introCard').addEventListener('pointerdown', ()=>dismissIntro());
$('#btnStyleClose').addEventListener('click', closeStyles);
$('#btnFortClose').addEventListener('click', closeFortress);
$('#btnReroll').addEventListener('click', rerollDraft);
refreshStyleButtons();
$('#btnAgain').addEventListener('click', () => enterHub());
$('#btnQuick').addEventListener('click', startGame);
$('#btnRestart').addEventListener('click', startGame);
$('#btnResume').addEventListener('click', closePause);
$('#btnPause').addEventListener('click', () => state==='play'?openPause():state==='paused'&&$('#mTune').hidden?closePause():null);
$('#btnTune').addEventListener('click', openTune);
$('#btnPauseTune').addEventListener('click', openTune);
$('#btnOverTune').addEventListener('click', openTune);
$('#btnTuneClose').addEventListener('click', closeTune);
$('#btnTuneReset').addEventListener('click', () => { Object.assign(T,DEFAULTS); saveTune(); buildTune(); });
$('#btnTuneCopy').addEventListener('click', e => {
  const txt = JSON.stringify(T,null,1), btn=e.currentTarget, out=$('#tuneOut');
  const fallback = () => { out.value=txt; out.hidden=false; out.focus(); out.select(); btn.textContent='Select and copy'; };
  try { navigator.clipboard.writeText(txt).then(()=>{ btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy values',1400); }, fallback); } catch(_){ fallback(); }
});
