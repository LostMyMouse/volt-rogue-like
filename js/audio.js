// Volt: Sound. Music, ambience, effects and voice lines on three volume buses (music, effects, voice: see
// the Settings sliders). Uses Web Audio when served over http(s); when opened from file://, where fetch is
// blocked, it falls back to plain <audio> elements. Nothing plays until the first click, tap, key or button,
// as browsers require.
'use strict';

const AUDIO = { ctx:null, buses:{}, buffers:{}, loading:{}, music:null, musicName:null, amb:null, ambName:null, voice:null, unlocked:false, html:location.protocol==='file:', lastSfx:{}, barkT:0 };
const VOL = () => ({music:(T.musicVol??0.35)*0.65,sfx:T.sfxVol??0.75,voice:T.voiceVol??0.9});

// FNV-1a: the same hash the generator used to name voice files.
function voiceKey(who,text){ let h=0x811c9dc5; for (const b of new TextEncoder().encode(who+'|'+text)){ h^=b; h=Math.imul(h,0x01000193)>>>0; } return who+'_'+h.toString(16).padStart(8,'0'); }

function audioUnlock(){
  const first=!AUDIO.unlocked;
  if (!AUDIO.html && (!AUDIO.ctx || AUDIO.ctx.state==='closed')){
    try {
      // Safari's playback session routes game sound through media playback, including in fullscreen.
      try { if (navigator.audioSession) navigator.audioSession.type='playback'; } catch(e){}
      const C=window.AudioContext||window.webkitAudioContext; AUDIO.ctx=new C();
      for (const b of ['music','sfx','voice']){ const g=AUDIO.ctx.createGain(); g.connect(AUDIO.ctx.destination); AUDIO.buses[b]=g; }
      audioVolumes(); voiceFxInit(AUDIO.ctx);
    } catch(e){ AUDIO.html=true; }
  }
  // iOS can suspend/interupt an already-unlocked context on fullscreen, lock or tab switches.
  // Retry synchronously in every trusted gesture, rather than permanently latching the first attempt.
  if (AUDIO.ctx && AUDIO.ctx.state!=='running'){
    try {
      const resumed=AUDIO.ctx.resume(); if (resumed && resumed.catch) resumed.catch(()=>{});
      const pulse=AUDIO.ctx.createBufferSource(); pulse.buffer=AUDIO.ctx.createBuffer(1,1,AUDIO.ctx.sampleRate);
      pulse.connect(AUDIO.ctx.destination); pulse.start(0);
    } catch(e){}
  }
  AUDIO.unlocked=true;
  if (first) for (const n of ['strike1','strike2','strike3','dash','hurt','enemyhit','ui_select','ui_move','parry','block']) loadBuf('sfx/'+n);
}
for (const ev of ['pointerdown','pointerup','touchend','keydown','click']) addEventListener(ev, audioUnlock, {capture:true, passive:true});
const audioWake=()=>{ if (AUDIO.unlocked && !document.hidden) audioUnlock(); };
document.addEventListener('visibilitychange',audioWake);
document.addEventListener('fullscreenchange',audioWake);
document.addEventListener('webkitfullscreenchange',audioWake);
addEventListener('pageshow',audioWake);
function audioVolumes(){ if (!AUDIO.ctx) return; const v=VOL(); for (const b in AUDIO.buses) AUDIO.buses[b].gain.value=v[b]; }

function loadBuf(path){
  if (AUDIO.buffers[path] || AUDIO.loading[path] || !AUDIO.ctx) return AUDIO.loading[path];
  const revision = path.startsWith('voice/') ? `?v=${VOICE_REVISION}` : '';
  AUDIO.loading[path]=fetch(`assets/audio/${path}.mp3${revision}`).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(b=>AUDIO.ctx.decodeAudioData(b)).then(buf=>{ AUDIO.buffers[path]=buf; delete AUDIO.loading[path]; return buf; }).catch(()=>{ delete AUDIO.loading[path]; return null; });
  return AUDIO.loading[path];
}
// One-shot sound. vol and rate vary slightly so repeated hits don't sound machine-gunned.
function sfx(name, o={}){
  if (!AUDIO.unlocked || !SFX_NAMES.includes(name)) return;
  const now=performance.now(), gap=o.gap??40; if (now-(AUDIO.lastSfx[name]||0)<gap) return; AUDIO.lastSfx[name]=now;
  const vol=(o.vol??1)*(0.9+Math.random()*0.15), rate=(o.rate??1)*(o.vary===false?1:(0.95+Math.random()*0.1));
  if (AUDIO.html){ const a=new Audio(`assets/audio/sfx/${name}.mp3`); a.volume=clamp(vol*VOL().sfx,0,1); a.playbackRate=rate; a.play().catch(()=>{}); return; }
  const go=buf=>{ if (!buf) return; const s=AUDIO.ctx.createBufferSource(), g=AUDIO.ctx.createGain(); s.buffer=buf; s.playbackRate.value=rate; g.gain.value=vol; s.connect(g); g.connect(AUDIO.buses.sfx);
    const len=o.max?Math.min(o.max,buf.duration):buf.duration; if (o.max){ g.gain.setValueAtTime(vol,AUDIO.ctx.currentTime+Math.max(0,len-0.06)); g.gain.linearRampToValueAtTime(0,AUDIO.ctx.currentTime+len); }
    s.start(0,0,len); };
  const b=AUDIO.buffers['sfx/'+name]; if (b) go(b); else { const p=loadBuf('sfx/'+name); p && p.then(go); }
}

/* ---------- Music and ambience: crossfading loops ---------- */
function makeLoop(path, bus, vol){
  if (AUDIO.html){ const a=new Audio(`assets/audio/${path}.mp3`); a.loop=true; a.volume=0; a.play().catch(()=>{}); return {html:a, target:vol, level:0}; }
  const g=AUDIO.ctx.createGain(); g.gain.value=0; g.connect(AUDIO.buses[bus]);
  const loop={g, target:vol, level:0, src:null};
  const p=loadBuf(path); p && p.then(buf=>{ if (!buf || loop.dead) return; const s=AUDIO.ctx.createBufferSource(); s.buffer=buf; s.loop=true; s.connect(g); s.start(); loop.src=s; });
  return loop;
}
function stopLoop(l){ if (!l) return; l.target=0; l.dying=true; }
function fadeLoop(l,dt,busVol){
  if (!l) return false;
  l.level += (l.target-l.level)*Math.min(1,dt*(l.target<l.level?12:1.6));
  if (l.html) l.html.volume=clamp(l.level*busVol,0,1); else l.g.gain.value=l.level;
  if (l.dying && l.level<0.01){ l.dead=true; if (l.html) l.html.pause(); else if (l.src) try{ l.src.stop(); }catch(e){} return false; }
  return true;
}
let OLD_LOOPS=[];
function setMusic(name, vol=1){
  if (AUDIO.musicName===name) { if (AUDIO.music) AUDIO.music.target=vol; return; }
  if (AUDIO.music) { stopLoop(AUDIO.music); OLD_LOOPS.push(AUDIO.music); }
  AUDIO.musicName=name; AUDIO.music = name ? makeLoop('music/'+name,'music',vol) : null;
}
function setAmbience(name, vol=0.5){
  if (AUDIO.ambName===name) return;
  if (AUDIO.amb) { stopLoop(AUDIO.amb); OLD_LOOPS.push(AUDIO.amb); }
  AUDIO.ambName=name; AUDIO.amb = name ? makeLoop('sfx/'+name,'sfx',vol) : null;
}
// Called every frame: picks the music for where you are and runs the fades.
function audioTick(dt){
  if (!AUDIO.unlocked) return;
  audioVolumes();
  const inRunState = ['play','transit','draft','map','intro','dialogue','paused'].includes(state);
  let m=null, amb=null, mv=1;
  if (state==='start') m='title';
  else if (state==='cutscene'){ m='cutscene'; amb = cut && cut.scene==='roof' ? 'rain_loop' : 'fortress_loop'; }
  else if (inHub && inHub()){ m='fortress-siege'; amb='fortress_loop'; mv=0.72; }
  else if (state==='over'){ m=AUDIO.musicName; mv=0.35; }
  else if (inRunState){ m = boss && !boss.dead ? 'boss' : 'combat'; amb='rain_loop'; if (state==='paused'||state==='draft'||state==='map') mv=0.55; if (state==='dialogue'||state==='intro') mv=0.45; }
  setMusic(m, mv); setAmbience(amb, 0.35);
  // Apply ducking before the fade; applying it afterwards was overwritten by setMusic next frame.
  if(AUDIO.music&&AUDIO.voice?.playing)AUDIO.music.target=Math.min(AUDIO.music.target,0.16);
  const v=VOL();
  fadeLoop(AUDIO.music,dt,v.music); fadeLoop(AUDIO.amb,dt,v.sfx);
  OLD_LOOPS=OLD_LOOPS.filter(l=>fadeLoop(l,dt,v.music));
}

/* ---------- Voice ---------- */
// Plays a voiced line if one exists for this exact speaker and text; stops whatever was speaking.
function playVoice(who, text){
  stopVoice();
  if (!AUDIO.unlocked || !who || !text) return false;
  const key=voiceKey(who,text); if (!VOICED.has(key)) return false;
  const rate = 1; // Size comes from casting and pitch layers, never from dragging out the delivery.
  const v={playing:true}; AUDIO.voice=v;
  if (AUDIO.html){ const a=new Audio(`assets/audio/voice/${key}.mp3?v=${VOICE_REVISION}`); a.volume=clamp(VOL().voice,0,1); a.preservesPitch=false; a.playbackRate=rate; a.onended=()=>v.playing=false; a.play().catch(()=>{}); v.stop=()=>{ a.pause(); v.playing=false; }; return true; }
  const p=loadBuf('voice/'+key); p && p.then(buf=>{ if (!buf || AUDIO.voice!==v) return; const s=AUDIO.ctx.createBufferSource(); s.buffer=buf; voiceChain(AUDIO.ctx, s, who, AUDIO.buses.voice); s.onended=()=>v.playing=false; s.start(); v.stop=()=>{ try{ s.stop(); }catch(e){} v.playing=false; }; });
  return true;
}
function stopVoice(){if(AUDIO.voice?.stop)AUDIO.voice.stop();if(AUDIO.voice)AUDIO.voice.playing=false;AUDIO.voice=null;}
// Short combat lines from Volt. Never talks over a conversation; has a cooldown and a chance to stay quiet.
const BARKS = { parry:["Nice!","Got it!","Not today!"], hurt:["Ow.","Okay, ow!","That's gonna bruise."], low:["I'm fine. I'm fine!"], overload:["Overload!","Light 'em up!"],
  bossdown:["Yes! Did everyone see that?"], district:["One district back!"], death:["Not... yet..."], start:["Here we go!","Let's do this."] };
function bark(kind, chance=0.5){
  if (!AUDIO.unlocked || (AUDIO.voice && AUDIO.voice.playing) || time<AUDIO.barkT || Math.random()>chance) return;
  AUDIO.barkT=time+4; playVoice('volt', pick(BARKS[kind]));
}

// Menu clicks.
document.addEventListener('click', e => { const b=e.target.closest && e.target.closest('button'); if (b && !b.disabled) sfx('ui_select',{vol:0.6,gap:60}); }, true);
