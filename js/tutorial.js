// Volt: Training roof. A short guided fight the first time you deploy (and any time from the Fortress
// training corner): move, strike, Special, dash, parry, Overload, then clear the rest. Bastion talks you
// through it. Finishing (or skipping) a first-time session goes straight into a real run.
'use strict';

const TUT_PAD = {"move": "Use the <kbd>left stick</kbd> to move around the roof.", "strike": "Press <kbd>X</kbd> to Strike the training dummy. Hold it to keep swinging.", "special": "Press <kbd>Y</kbd> for your Special. Each style has a different one.", "dash": "Press <kbd>A</kbd> to dash. You can't be hurt mid-dash.", "parry": "Tap <kbd>RB</kbd> as the white ring closes: no damage, reflected shots, Dash reset and Overload charge.", "composure":"Parry with <kbd>RB</kbd> again. Empty the gold bar for a three-second stagger and double damage. Attacks chip it; parries crush it.", "overload": "Overload is charged. Press <kbd>LB</kbd> to blast everything nearby.", "clear": "Clear the roof."};
const TUT_STEPS = [
  { id:'move',   title:'Move',     kb:'Use <kbd>WASD</kbd> to move around the roof.', touch:'Drag anywhere on the left side of the screen to move.', say:"Let's see you move. And no climbing anything." },
  { id:'strike', title:'Strike',   kb:'<kbd>Left click</kbd> to Strike the training dummy. Hold it to keep swinging.', touch:'Tap <b>Strike</b> to hit the dummy. Hold it to keep swinging.', say:"That dummy's survived forty rookies. Ruin its streak." },
  { id:'special',title:'Special',  kb:'<kbd>Right click</kbd> for your Special. Each style has a different one.', touch:'Tap <b>Special</b>. Each style has a different one.', say:"Now your Special. Every style's is different. Let's find out what yours does." },
  { id:'dash',   title:'Dash',     kb:'<kbd>Space</kbd> to dash. You can\'t be hurt mid-dash.', touch:'Tap <b>Dash</b>. You can\'t be hurt mid-dash.', say:"Dash. You're untouchable for half a second. Make the half second count." },
  { id:'parry', title:'Catch the white ring', kb:'Tap <kbd>Shift</kbd> as the white ring closes. A parry prevents damage, reflects shots, resets Dash and charges Overload.', touch:'Tap <b>Block</b> as the white ring closes. Parries stop damage, reset Dash and charge Overload.', say:"Watch the white ring. Tap Block as it closes. A parry stops damage, reflects shots, resets your dash and charges Overload. Now catch one." },
  { id:'composure', title:'Break their Composure', kb:'Parry again to empty the gold Composure bar. Strikes chip it down; parries remove a large chunk. A break staggers the enemy for three seconds and doubles your damage.', touch:'Parry again. Empty the gold <b>Composure</b> bar for a three-second stagger and <b>double damage</b>. Strikes chip it; parries crush it.', say:"That took a chunk of his Composure. Strikes chip it away. Parries crush it. Empty the gold bar and he staggers for three seconds. Your hits deal double damage." },
  { id:'overload',title:'Overload',kb:'Overload is charged. Press <kbd>Q</kbd> to blast everything nearby.', touch:'Overload is charged. Tap <b>Ovld</b> to blast everything nearby.', say:"Overload's full. Let it rip." },
  { id:'clear',  title:'Finish them', kb:'Clear the roof.', touch:'Clear the roof.', say:"Last ones. Then you're on the clock for real." },
];
let tut=null;
const inTutorial = () => !!tut;

function startTutorial(first){
  reset(); routeStart(); lastCaller=null; exits=[]; transit=null; powerHeld=false;
  { const so=STYLE(); so.init && so.init(player); } applyStyleHud();
  leaveHub(); for (const id of ['#mStart','#mOver','#mPause','#mDraft','#mFortress','#mCity','#mStyle']) show(id,false);
  buildRoom(); refreshSlotHud();
  R.windMul=(R.windMul||1)*2.2; // everything winds up slowly while you learn
  player.x=ARENA.w/2; player.y=ARENA.h*0.8;
  tut={ i:-1, first, moved:0, lx:player.x, ly:player.y, hits:0, dashes:0, wasDash:false, lastHp:0 };
  document.body.classList.add('tutorial-mode');
  roomPhase='tutorial'; state='play';
  if(inputMode==='touch')$('#banner').classList.remove('show');else banner('TRAINING ROOF'); show('#tut',true);
  tutNext();
}
function tutSpawn(n,opt={}){
  for (let i=0;i<n;i++){
    const at={x:ARENA.w/2+(i-(n-1)/2)*180, y:ARENA.h*0.48}, e=makeEnemy('rusher',0.8+i*0.6,at);
    if (opt.dummy){ e.tutDummy=true; e.hp=e.maxHp=99999; }
    else { e.hp=e.maxHp=opt.hp||40; e.tutWeak=true; }
    enemies.push(e);
  }
}
function tutNext(){
  tut.i++;
  const s=TUT_STEPS[tut.i]; if (!s) return;
  tut.age=0; tut.readyAt=['parry','composure'].includes(s.id)?s.say.split(/\s+/).length/2.5+1:0;
  if (s.id==='dash') tut.dashes=0;
  if (s.id==='special') tut.usedSpecial=false;
  if (s.id==='strike'){ tutSpawn(1,{dummy:true}); tut.dummy=enemies[enemies.length-1]; tut.lastHp=tut.dummy.hp; }
  if (s.id==='parry'){
    for (const e of enemies) e.dead=true; enemies=[];
    player.x=ARENA.w/2; player.y=ARENA.h*.67; player.vx=player.vy=0;
    tutSpawn(1,{hp:400}); const e=enemies[0]; e.y=player.y-195; e.timer=2.0;
    tut.parriesAtStart=run.parries||0;
  }
  if (s.id==='composure') tut.breaksAtStart=enemies.reduce((n,e)=>n+(e.composureBreaks||0),0);
  if (s.id==='overload'){ tutSpawn(3,{hp:30}); player.sig=100; }
  $('#tutStep').textContent=`Training · ${tut.i+1} of ${TUT_STEPS.length}`;
  $('#tutTitle').textContent=s.title;
  $('#tutText').innerHTML=inputMode==='touch'?s.touch:inputMode==='pad'?TUT_PAD[s.id]:s.kb;
  $('#tutSay').textContent='“'+s.say+'”'; playVoice('bastion', s.say);
  setPortrait($('#tutPortrait'),'bastion');
  const el=$('#tut'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}
// Runs every frame during training (called from update).
function updateTutorial(dt){
  if (!tut) return;
  tut.age+=dt;
  if (tut.pending>0){tut.pending-=dt;if(tut.pending<=0)tutNext();return;}
  const p=player, s=TUT_STEPS[tut.i];
  if (p.hp<40) p.hp=Math.min(p.maxHp,p.hp+60); // nobody dies on the training roof
  if (!s){ return; }
  if (s.id==='move'){ tut.moved+=Math.hypot(p.x-tut.lx,p.y-tut.ly); if (tut.moved>500) return tutDone(); }
  else if (s.id==='strike'){ if (tut.dummy.hp<tut.lastHp){ tut.hits++; tut.lastHp=tut.dummy.hp; } if (tut.hits>=4) return tutDone(); }
  else if (s.id==='special'){ if (tut.usedSpecial) return tutDone(); }
  else if (s.id==='dash'){ if (tut.dashes>=2) return tutDone(); }
  else if (s.id==='parry'){ if ((run.parries||0)>tut.parriesAtStart) return tutDone(); if (!enemies.some(e=>!e.dead && !e.tutDummy)) tutSpawn(1,{hp:400}); }
  else if (s.id==='composure'){
    if(enemies.reduce((n,e)=>n+(e.composureBreaks||0),0)>tut.breaksAtStart)return tutDone();
    if(!enemies.some(e=>!e.dead)){tutSpawn(1,{hp:400});tut.breaksAtStart=0;}
  }
  else if (s.id==='overload'){ if (p.sig<100) return tutDone(); }
  else if (s.id==='clear'){ if (!enemies.some(e=>!e.dead && !e.tutDummy)) return tutDone(); }
  tut.lx=p.x; tut.ly=p.y;
}
function tutDone(){
  const s=TUT_STEPS[tut.i];
  texts.push({x:player.x,y:player.y-60,v:'NICE',t:0,big:true,c:COL.heal});
  if (s.id==='overload'){ for (const e of enemies) if (e.tutDummy) e.dead=true; tutSpawn(3,{hp:40}); }
  if (tut.i>=TUT_STEPS.length-1){ finishTutorial(); return; }
  tut.pending=2.5;
}
function finishTutorial(skipped){
  if (!tut) return;
  const first=tut.first; tut=null; show('#tut',false); document.body.classList.remove('tutorial-mode');
  save.tutorialDone=1; writeSave();
  if (!skipped) banner('TRAINING COMPLETE');
  // First time: straight into a real run. Replays go back to the Fortress.
  setTimeout(()=>{ if (first) startGame(); else enterHub(); }, skipped?0:1400);
}
$('#tutSkip').addEventListener('click', () => finishTutorial(true));
