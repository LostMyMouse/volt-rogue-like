// Volt: The opening cold open, staged live with the game's own renderer: animated sprites, effects and a
// moving camera, under letterbox bars with the dialogue on top. Plays the first time you enter the Fortress;
// replay it from Volt's bunk. Click, tap or press a key to continue (the first press finishes a line that
// is still typing); Skip ends it.
'use strict';

const CS_VILLAINS = [
  {id:'kilnheart', x:330, y:330, el:'fire'}, {id:'bellwether', x:540, y:310, el:'sound'}, {id:'undertow', x:750, y:300, el:'water'},
  {id:'verdigris', x:960, y:310, el:'acid'}, {id:'glasswake', x:1170, y:330, el:'glass'},
];
// The broadcast uses a dedicated head-and-shoulders cut-out when it exists, else the intro art.
const CS_REDACTOR_IMG = new Image(); CS_REDACTOR_IMG.onerror=()=>{ CS_REDACTOR_IMG.onerror=null; CS_REDACTOR_IMG.src='assets/intro/redactor.png'; }; CS_REDACTOR_IMG.src='assets/intro/redactor_broadcast.png';
const VOLT_LAND = {x:850, y:228};

// Each beat: where the camera goes, what happens as it starts, and the line spoken.
const CUTSCENE = [
  { scene:'roof', cam:{x:750,y:150,z:0.85}, go:c=>{ c.screen=1; c.glitch=0.6; addShake(4); sfx('broadcast',{vary:false}); },
    who:'redactor', expr:'pleased', tag:'Every screen in the city', text:"Good evening. Your heroes have been very brave. I have taken the liberty of making that unnecessary." },
  { cam:{x:750,y:130,z:1.05}, go:c=>{ c.glitch=1.2; c.flash=0.5; c.flashC='#e0283c'; addShake(10); sfx('redact'); },
    who:'redactor', expr:'pleased', text:"The heroes caught outside their Fortress have lost their powers. The others may remain behind their shield. I can be patient." },
  { cam:{x:750,y:300,z:0.78}, go:c=>{ CS_VILLAINS.forEach((v,i)=>c.later(0.35+i*0.45,()=>csArrive(c,v))); },
    who:'redactor', text:"My associates will attend to each district. Stay inside. If you hear someone calling for a hero, let them finish." },
  { cam:{x:750,y:470,z:1.15}, go:c=>{ c.later(0.25,()=>{ c.actors.push({id:'gravemark', x:750, y:540, anim:'intro', t0:time, drop:1}); }); c.later(0.55,()=>{ addShake(22); c.flash=0.35; c.flashC='#b56cff'; sfx('stone'); VFX_FX.push({type:'burst',el:'stone',x:750,y:540,R:150,t:0,dur:0.8,seed:rand(PI2)}); vfxBurstParticles('stone',750,540,150,2); }); },
    who:'gravemark', expr:'stern', text:"And any heroes who object can take it up with me. On the roof." },
  { cam:{x:750,y:150,z:0.9}, go:c=>{ c.glitch=0.8; },
    who:'redactor', text:"Sleep well. I know how much safer you feel when someone else is watching." },

  { scene:'fort', cam:{x:742,y:330,z:1.15}, go:c=>{ c.flash=1; c.flashC='#000000'; c.screen=0; }, focus:'bastion', card:'bastion', tagline:'Runs the Fortress. Hates surprises.',
    who:'bastion', expr:'stern', tag:'The Fortress · ten minutes later', text:"The district relays are feeding his drain. Half our roster is down. Patch, can the Fortress shield hold?" },
  { cam:{x:260,y:520,z:1.3}, focus:'patch', card:'patch', tagline:'Engineer. Comms. Coffee.', who:'patch', text:"The shield holds. Inside, your powers are safe. Outside, he can target every signature on the hero register." },
  { cam:{x:742,y:330,z:1.3}, focus:'bastion', who:'bastion', expr:'stern', text:"And a way to fight back?" },
  { cam:{x:260,y:520,z:1.35}, focus:'patch', who:'patch', expr:'pleased', text:"I am looking for a way past his scanner. The coffee will have to wait." },
  { cam:{x:1150,y:640,z:1.3}, focus:'echo', card:'echo', tagline:'Psychic. Usually right. Insufferable about it.', who:'echo', text:"Then we need someone he has not registered. Someone new." },
  { cam:{x:260,y:250,z:1.3}, focus:'thorn', card:'thorn', tagline:'Ex-villain. Still earning trust.', who:'thorn', text:"And someone willing to go. Knowing what waits outside." },
  { cam:{x:760,y:190,z:1.45}, focus:'halo', card:'halo', tagline:"The world's number one hero. For now.", who:'halo', expr:'stern', text:"We keep looking for an opening. Until then, we keep this city alive." },
  { cam:{x:742,y:420,z:0.95}, go:c=>{ c.alarm=1; sfx('alarm',{vary:false}); }, focus:'patch', who:'patch', text:"Uh. Small thing. Someone's climbing the outside of the Fortress." },
  { cam:{x:742,y:360,z:1.1}, focus:'bastion', who:'bastion', expr:'stern', text:"Nobody climbs a sixty-storey wall." },
  { cam:{x:820,y:200,z:1.5}, go:c=>{ c.alarm=0; c.volt={x:VOLT_LAND.x, t0:time}; c.later(0.7,()=>{ c.flash=0.6; c.flashC='#26bfff'; addShake(12); sfx('lightning'); sfx('land'); bolts.push({pts:[{x:VOLT_LAND.x,y:VOLT_LAND.y-160},{x:VOLT_LAND.x+20,y:VOLT_LAND.y-60},{x:VOLT_LAND.x,y:VOLT_LAND.y}],t:0,dur:0.3}); for (let i=0;i<20;i++) vfxEmit('ember',VOLT_LAND.x,VOLT_LAND.y,{vx:rand(-260,260),vy:rand(-120,120),vz:rand(60,220),g:600,life:.5,size:3,c:'#7fe0ff'}); }); },
    focus:'volt', card:'volt', tagline:'Rookie hero. Very, very new.', who:'volt', expr:'pleased', text:"Hi! Sorry. Your front door has, like, nine locks." },
  { cam:{x:800,y:230,z:1.25}, focus:'volt', who:'volt', text:"I'm Volt. I'm a hero. Well... rookie hero. I saw the broadcast, and I want to help." },
  { cam:{x:1000,y:420,z:0.9}, focus:'echo', who:'echo', expr:'pleased', text:"Oh, I like him." },
  { cam:{x:800,y:210,z:1.5}, focus:'halo', who:'halo', text:"You're bleeding." },
  { cam:{x:830,y:220,z:1.55}, focus:'volt', who:'volt', text:"The wall had opinions." },
  { cam:{x:790,y:215,z:1.4}, focus:'halo', who:'halo', text:"His lightning still works. No registered signature. Bastion, train him. Patch, fit him with an extraction beacon." },
  { cam:{x:742,y:330,z:1.25}, focus:'bastion', who:'bastion', expr:'stern', text:"Training roof, through the Deploy Gate. Learn the kit first. Then we plan a route to the drain." },
  { cam:{x:830,y:220,z:1.6}, focus:'volt', who:'volt', expr:'pleased', text:"Right now? I just climbed sixty floors." },
];

function csArrive(c,v){
  c.actors.push({id:v.id, x:v.x, y:v.y, anim:'intro', t0:time});
  VFX_FX.push({type:'burst', el:v.el, x:v.x, y:v.y, R:80, t:0, dur:0.7, seed:rand(PI2)});
  vfxBurstParticles(v.el, v.x, v.y, 80, 1.2); addShake(5); sfx(v.el,{gap:0});
}
const portraitSrc = (id,expr) => expr && expr!=='neutral' ? `assets/portraits/${id}/${expr}-256.png` : `assets/portraits/${id}.png`;

let cut=null;
function playCutscene(done){
  if (window.__volt && window.__volt.noIntro){ done && done(); return; }
  cut={ i:-1, done, typing:null, scene:'roof', cam:{x:750,y:150,z:0.7}, camTo:{x:750,y:150,z:0.85}, actors:[], screen:0, glitch:0, flash:0, flashC:'#fff', alarm:0, volt:null, focus:null, timers:[],
    later(t,fn){ this.timers.push({at:time+t, fn}); }, rain:Array.from({length:110},()=>({x:Math.random(),y:Math.random(),s:rand(0.6,1.2)})) };
  VFX_P=[]; VFX_FX=[]; bolts=[];
  state='cutscene'; keys.clear(); stick.id=null;
  show('#splash',false); show('#cutscene',true); document.body.classList.add('in-cut'); nextCutPanel();
}
function nextCutPanel(){
  if (!cut) return;
  if (cut.typing){ clearInterval(cut.typing); cut.typing=null; $('#csText').textContent=CUTSCENE[cut.i].text; return; } // first tap finishes the line
  if (++cut.i>=CUTSCENE.length){ endCutscene(); return; }
  const p=CUTSCENE[cut.i];
  // A new location drops anything still pending from the last one (e.g. villain arrivals if you clicked fast).
  if (p.scene && p.scene!==cut.scene){ cut.scene=p.scene; cut.actors=[]; cut.timers=[]; VFX_P=[]; VFX_FX=[]; bolts=[]; cut.cam=Object.assign({},p.cam,{z:p.cam.z*0.85}); }
  if (p.cam) cut.camTo=p.cam;
  cut.focus=p.focus||null;
  p.go && p.go(cut);
  // A name card the first time each character speaks.
  const card=$('#csCard');
  if (p.card){ const sp=SPEAKERS[p.card]; card.style.setProperty('--c',sp.c); card.innerHTML=`<img src="${portraitSrc(p.card,p.expr)}" alt=""><div><span>${p.card==='volt'?'Introducing':'Meet'}</span><b>${sp.name}</b><i>${p.tagline}</i></div>`; card.hidden=false; card.classList.remove('in'); void card.offsetWidth; card.classList.add('in'); }
  else card.hidden=true;
  const sp=p.who && SPEAKERS[p.who], cap=$('#csCaption');
  cap.style.setProperty('--c', sp ? sp.c : COL.volt);
  $('#csWho').textContent = sp ? sp.name : ''; $('#csWho').hidden=!sp;
  $('#csTag').textContent = p.tag||''; $('#csTag').hidden=!p.tag;
  const pt=$('#csPortrait'); if (sp){ pt.src=portraitSrc(p.who,p.expr); pt.hidden=false; } else pt.hidden=true;
  $('#cutscene').classList.toggle('villain', !!sp && sp.role==='Villain');
  playVoice(p.who, p.text);
  const t=$('#csText'); t.textContent=''; let n=0;
  cut.typing=setInterval(()=>{ n+=2; t.textContent=p.text.slice(0,n); if (n>=p.text.length){ clearInterval(cut.typing); cut.typing=null; } }, 26);
  $('#csCount').textContent=`${cut.i+1} / ${CUTSCENE.length}`;
}
function endCutscene(){
  if (!cut) return;
  clearInterval(cut.typing); stopVoice(); const done=cut.done; cut=null; VFX_P=[]; VFX_FX=[]; bolts=[]; shakeAmt=0;
  show('#cutscene',false); document.body.classList.remove('in-cut'); save.seenIntro=1; writeSave();
  done && done();
}

/* ---------- Per-frame staging ---------- */
function updateCinematic(dt){
  if (!cut) return;
  const c=cut, k=Math.min(1,2.2*dt);
  for (const key of ['x','y','z']) c.cam[key]+=(c.camTo[key]-c.cam[key])*k;
  c.glitch=Math.max(0,c.glitch-dt); c.flash=Math.max(0,c.flash-dt*1.8);
  for (const tm of c.timers) if (time>=tm.at && !tm.done){ tm.done=true; tm.fn(); }
  c.timers=c.timers.filter(t=>!t.done);
  vfxUpdate(dt);
  for (const b of bolts) b.t+=dt; bolts=bolts.filter(b=>b.t<b.dur);
  shakeAmt-=shakeAmt*Math.min(1,8*dt);
  if (c.scene==='roof' && c.screen && Math.random()<dt*0.6) c.glitch=Math.max(c.glitch,0.15); // the signal stutters now and then
}
function renderCinematic(){
  const c=cut; if (!c) return;
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.fillStyle='#04070e'; ctx.fillRect(0,0,W,H);
  const base = c.scene==='roof' ? Math.min(W/1250,H/700) : Math.min(W/1000,H/720);
  const z=base*c.cam.z, sx=(Math.random()*2-1)*shakeAmt, sy=(Math.random()*2-1)*shakeAmt;
  ctx.save(); ctx.translate(W/2+sx,H/2+sy); ctx.scale(z,z); ctx.translate(-c.cam.x,-c.cam.y);
  if (c.scene==='roof'){
    drawCity(); if (roofPainted()) drawPaintedRoof();
    if (c.screen) drawBroadcast(c);
    vfxDrawGround();
    const list=c.actors.map(a=>({y:a.y,f:()=>{
      let y=a.y; if (a.drop){ const t=time-a.t0; y=a.y-Math.max(0,1-t/0.3)*600; }
      drawShadow(a.x,a.y,26);
      const name = time-a.t0 < 1.4 && ANIMATION_DATA[a.id] && ANIMATION_DATA[a.id][a.anim] ? a.anim : 'idle';
      if (!drawAnimation(a.id,name,a.x,y+14,Math.PI/2,SPRITES[a.id]?SPRITES[a.id].scale:1.4,time-a.t0)) drawTurn(a.id,a.x,y+14,Math.PI/2);
    }}));
    list.sort((p,q)=>p.y-q.y); for (const it of list) it.f();
  } else {
    if (hubImg.complete) ctx.drawImage(hubImg,0,0,HUB.w,HUB.h);
    // The heroes at their stations; whoever is speaking gestures, and once Volt lands they all look at the rookie.
    const list=HUB_NPCS.map(n=>({y:n.y,f:()=>{
      const talking=c.focus===n.id && CUTSCENE[c.i] && CUTSCENE[c.i].who===n.id;
      const face = c.volt && time-c.volt.t0>0.8 ? Math.atan2(VOLT_LAND.y-n.y,VOLT_LAND.x-n.x) : n.face;
      ctx.globalAlpha=0.5; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(n.x,n.y,20,7,0,0,PI2); ctx.fill(); ctx.globalAlpha=1;
      if (!drawAnimation(n.id,talking?'talk':'idle',n.x,n.y,stickyFace('cs_'+n.id,face),SPRITES[n.id].scale,time)) drawTurn(n.id,n.x,n.y,face);
    }}));
    if (c.volt){ const v=c.volt, t=time-v.t0, rise=Math.min(1,t/0.7), y=VOLT_LAND.y+260*(1-rise)*(1-rise) - Math.sin(rise*Math.PI)*40;
      list.push({y:VOLT_LAND.y,f:()=>{
        if (t<0.7) for (let i=0;i<2;i++) vfxEmit('ember',v.x+rand(-12,12),y+rand(-10,20),{vz:rand(10,60),g:-20,life:.35,size:2,c:'#7fe0ff'});
        ctx.globalAlpha=0.5; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(v.x,VOLT_LAND.y,18,6,0,0,PI2); ctx.fill(); ctx.globalAlpha=1;
        if (!drawAnimation('volt',t<0.7?'dash':'idle',v.x,y,stickyFace('cs_volt',t<0.7?-Math.PI/2:Math.PI/2),1.5,t)) drawTurn('volt',v.x,y,Math.PI/2,1.5);
      }}); }
    list.sort((p,q)=>p.y-q.y); for (const it of list) it.f();
  }
  vfxDraw(); drawFx();
  ctx.restore();
  // Screen-space weather and lighting.
  if (c.scene==='roof'){
    ctx.save(); ctx.strokeStyle='rgba(180,210,255,.28)'; ctx.lineWidth=1.2;
    for (const r of c.rain){ const x=((r.x*W+time*90*r.s)%W+W)%W, y=((r.y*H+time*900*r.s)%H+H)%H; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-4*r.s,y-16*r.s); ctx.stroke(); }
    ctx.restore();
  }
  if (c.alarm){ ctx.fillStyle=`rgba(224,40,60,${0.18+0.14*Math.sin(time*9)})`; ctx.fillRect(0,0,W,H); }
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  if (c.flash>0){ ctx.globalAlpha=Math.min(1,c.flash); ctx.fillStyle=c.flashC; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }
}
// The broadcast: a whole studio feed composed off-screen (crimson set, emblem, header, name strip, ticker,
// the Redactor as a cut-out in front), then put on the hologram screen with scanlines and torn-signal slices
// applied to the entire picture, so it reads as one hijacked transmission.
const BC = { w:560, h:340, cv:null, ticker:"ALL HERO POWERS UNDER REVIEW  ·  DISTRICTS NOW UNDER NEW MANAGEMENT  ·  PLEASE DIRECT COMPLAINTS TO NO ONE  ·  REMAIN INDOORS  ·  HAVE A QUIET NIGHT  ·  " };
function composeBroadcast(){
  if (!BC.cv){ BC.cv=document.createElement('canvas'); BC.cv.width=BC.w; BC.cv.height=BC.h; }
  const g=BC.cv.getContext('2d'), W2=BC.w, H2=BC.h, im=CS_REDACTOR_IMG;
  // studio set
  const bg=g.createLinearGradient(0,0,0,H2); bg.addColorStop(0,'#2a0509'); bg.addColorStop(0.6,'#12030a'); bg.addColorStop(1,'#050207'); g.fillStyle=bg; g.fillRect(0,0,W2,H2);
  g.strokeStyle='rgba(224,40,60,.12)'; g.lineWidth=1; for (let x=-H2;x<W2;x+=28){ g.beginPath(); g.moveTo(x,H2); g.lineTo(x+H2*0.6,0); g.stroke(); }
  // the emblem behind him: stacked redaction bars with a red seam
  g.save(); g.translate(W2/2,H2*0.44); g.globalAlpha=0.55;
  for (let k=0;k<5;k++){ const ww=220-k*18, y=-90+k*38; g.fillStyle='#000'; g.fillRect(-ww/2,y,ww,26); g.fillStyle='#e0283c'; g.fillRect(-ww/2,y+24,ww,2); }
  g.globalAlpha=0.9; g.fillStyle='#e0283c'; g.fillRect(-3,-104,6,200); g.restore();
  const glow=g.createRadialGradient(W2/2,H2*0.5,10,W2/2,H2*0.5,W2*0.5); glow.addColorStop(0,'rgba(224,40,60,.28)'); glow.addColorStop(1,'rgba(224,40,60,0)'); g.fillStyle=glow; g.fillRect(0,0,W2,H2);
  // the anchor himself, a transparent cut-out
  if (im.complete && im.naturalWidth){ const ih=H2*0.98, iw=ih*im.naturalWidth/im.naturalHeight; g.drawImage(im,W2/2-iw/2,H2-ih,iw,ih); }
  // header bar
  g.fillStyle='rgba(5,2,7,.85)'; g.fillRect(0,0,W2,30); g.fillStyle='#e0283c'; g.fillRect(0,30,W2,2);
  g.fillStyle='#e0283c'; g.beginPath(); g.arc(18,15,6,0,PI2); g.globalAlpha=0.5+0.5*Math.sin(time*6); g.fill(); g.globalAlpha=1;
  g.font='700 13px "Chakra Petch", sans-serif'; g.textBaseline='middle'; g.fillStyle='#fff'; g.fillText('LIVE',30,15);
  g.fillStyle='#ffd6db'; g.fillText('CITYWIDE NOTICE  ·  ALL CHANNELS',78,15);
  g.textAlign='right'; g.fillStyle='#e0283c'; g.fillText('CH ▮▮',W2-12,15); g.textAlign='left';
  // name strip (lower third)
  const ly=H2-78; g.fillStyle='#e0283c'; g.fillRect(16,ly,8,40); g.fillStyle='rgba(5,2,7,.9)'; g.fillRect(24,ly,300,40);
  g.font='900 22px "Big Shoulders Display", Impact, sans-serif'; g.fillStyle='#fff'; g.fillText('THE REDACTOR',34,ly+15);
  g.font='700 11px "Chakra Petch", sans-serif'; g.fillStyle='#ff9aa6'; g.fillText('ARCHITECT OF THE DRAIN  ·  POWER REVIEW BOARD',34,ly+31);
  // ticker
  g.fillStyle='#e0283c'; g.fillRect(0,H2-28,W2,28); g.fillStyle='#000'; g.fillRect(0,H2-28,86,28);
  g.font='700 12px "Chakra Petch", sans-serif'; g.fillStyle='#fff'; g.fillText('BULLETIN',12,H2-14);
  g.save(); g.beginPath(); g.rect(86,H2-28,W2-86,28); g.clip(); g.fillStyle='#160306';
  const tw=g.measureText(BC.ticker).width, off=(time*70)%tw; for (let x=86-off;x<W2;x+=tw) g.fillText(BC.ticker,x+8,H2-14); g.restore();
  // whole-picture scanlines
  g.fillStyle='rgba(0,0,0,.22)'; for (let y=0;y<H2;y+=3) g.fillRect(0,y,W2,1);
  return BC.cv;
}
function drawBroadcast(c){
  const w=BC.w, h=BC.h, x=750-w/2, y=-160, pic=composeBroadcast();
  ctx.save();
  ctx.shadowColor='#e0283c'; ctx.shadowBlur=46; ctx.fillStyle='#050207'; ctx.fillRect(x-6,y-6,w+12,h+12); ctx.shadowBlur=0;
  // torn-signal slices shift the whole broadcast sideways while the feed glitches
  const slices=c.glitch>0?14:1;
  for (let i=0;i<slices;i++){ const sy=i/slices, off=c.glitch>0?(Math.random()-0.5)*70*c.glitch:0;
    ctx.drawImage(pic,0,sy*h,w,h/slices,x+off,y+sy*h,w,h/slices); }
  if (c.glitch>0.4){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.25; ctx.drawImage(pic,x+6,y); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; } // colour split
  // bezel and the screen glare
  ctx.strokeStyle='#e0283c'; ctx.lineWidth=3; ctx.strokeRect(x-6,y-6,w+12,h+12);
  const gl=ctx.createLinearGradient(x,y,x+w,y+h); gl.addColorStop(0,'rgba(255,255,255,.07)'); gl.addColorStop(0.4,'rgba(255,255,255,0)'); ctx.fillStyle=gl; ctx.fillRect(x,y,w,h);
  ctx.restore();
}
$('#cutscene').addEventListener('pointerdown', e => { if (e.target.id==='csSkip') return; nextCutPanel(); });
$('#csSkip').addEventListener('click', endCutscene);
