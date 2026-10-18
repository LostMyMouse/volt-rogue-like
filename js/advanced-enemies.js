'use strict';
// Later-roof ordinary units: one attacks deliberately; the other protects its squad.
const UNIT_INTEL={
 lockjaw:[{who:'bastion',text:'Lockjaw. Frontal shield. Get behind him, or parry his swing. Two clean parries break his composure.'},{who:'volt',text:'Right. Open the tin. Avoid the lid.'}],
 relay:[{who:'echo',text:'Relay is linking that squad. Hit the operator to cut their protection. The antenna is your target.'},{who:'volt',text:'Unsubscribe. Aggressively.'}]
};
for(const id of ['lockjaw','relay']){SPRITES[id]={frame:64,scale:1.25,anchor:[32,60],ready:true};COMIC_IDS.push(id);comicAtlas(id);KIND_COL[id]=id==='lockjaw'?'#edb65e':'#caa1f3';PACK.chance[id]=.02;}
PARRY_CLASS.lockjaw_bash=PARRY_CLASS.lockjaw_sweep='parry';CAUSE.lockjaw_bash="Lockjaw's shield bash";CAUSE.lockjaw_sweep="Lockjaw's delayed baton sweep";
const baseMakeEnemy=makeEnemy;
makeEnemy=function(kind,delay,at){const e=baseMakeEnemy(kind,delay,at);if(kind!=='lockjaw'&&kind!=='relay')return e;const hp=(kind==='lockjaw'?80:42)*waveHp();Object.assign(e,{hp,maxHp:hp,r:kind==='lockjaw'?20:17,state:'approach',timer:1,drawFn:drawAdvancedEnemy});return e;};
const baseSpawnRoomWave=spawnRoomWave;
spawnRoomWave=function(){const start=enemies.length;baseSpawnRoomWave();const district=run.route?.i||0,room=run.route?.room||0;const types=[];
 if(district>=1&&room>=2)types.push('lockjaw');if(district>=3&&room>=3)types.push('lockjaw');if(district>=2&&room>=2)types.push('relay');
 for(const kind of types){let removed=0;for(let i=enemies.length-1;i>=start&&removed<2;i--)if(enemies[i].kind==='rusher'){enemies.splice(i,1);removed++;}enemies.push(makeEnemy(kind,1.2+types.indexOf(kind)*.25));}
 const unseen=types.find(id=>!save.unitIntel?.[id]);if(unseen){runDialogue(UNIT_INTEL[unseen],'Enemy intel',()=>{save.unitIntel=save.unitIntel||{};save.unitIntel[unseen]=1;writeSave();});}
};
function lockjawGuard(e,ang){return e.kind==='lockjaw'&&e.stunT<=0&&!(e.exposedT>0)&&e.state==='approach'&&Math.abs(angDiff(ang+Math.PI,e.face))<=Math.PI/3;}
function relayTargets(e){if(e.kind!=='relay'||e.dead||e.spawnT>0||e.stunT>0||e.exposedT>0||e.state!=='channel')return[];return liveEnemies().filter(t=>!t.isBoss&&t!==e&&['rusher','needle','lockjaw'].includes(t.kind)&&Math.hypot(t.x-e.x,t.y-e.y)<280&&unitSight(e,t));}
function unitSight(e,t){for(let i=1;i<8;i++)if(inObstacle(e.x+(t.x-e.x)*i/8,e.y+(t.y-e.y)*i/8,2))return false;return true;}
function squadProtection(e){return enemies.some(r=>relayTargets(r).includes(e))?.8:1;}
function interruptRelay(e){if(e.kind==='relay'&&(e.state==='signal'||e.state==='channel')){e.state='recover';e.timer=2.2;e.stunT=Math.max(e.stunT,.25);}}
function updateAdvanced(e,dt,dx,dy,d,a){
 if(e.kind==='relay'){
  e.face=a;if(e.state==='move')e.state='recover';e.timer-=dt;
  if(e.state==='approach'){const radial=d<230?-1:d>420?1:0;e.mx=dx/d*radial*110*T.enemySpeed;e.my=dy/d*radial*110*T.enemySpeed;if(e.timer<=0&&enemies.some(t=>t!==e&&!t.dead&&!t.isBoss&&t.kind!=='relay'&&Math.hypot(t.x-e.x,t.y-e.y)<280)){e.state='signal';e.timer=1.1;}}
  else if(e.state==='signal'&&e.timer<=0){e.state='channel';e.timer=2.8;}
  else if(e.state==='channel'&&e.timer<=0){e.state='recover';e.timer=2.2;}
  else if(e.state==='recover'&&e.timer<=0){e.state='approach';e.timer=.6;}return;
 }
 if(e.state==='move')e.state='recover';
 if(e.state==='approach'){e.face=a;e.mx=dx/d*105*T.enemySpeed;e.my=dy/d*105*T.enemySpeed;e.timer-=dt;
  const occupied=enemies.some(o=>o!==e&&o.kind==='lockjaw'&&!o.dead&&['windup','bash','delay','sweep'].includes(o.state));
  if(d<140&&e.timer<=0&&!occupied&&!(e.rootT>0)){e.state='windup';e.timer=e.windDur=.8;e.lungeA=a;}
 }else if(e.state==='windup'){e.timer-=dt;if(e.timer>.25)e.face=e.lungeA=a;if(e.timer<=0){e.state='bash';e.timer=.16;e.hitDone=false;comicAttack(e.x,e.y,e.lungeA,60,'threat');}}
 else if(e.state==='delay'){e.timer-=dt;if(e.timer>.25)e.face=e.lungeA=a;if(e.timer<=0){e.state='sweep';e.timer=.12;e.hitDone=false;comicAttack(e.x,e.y,e.lungeA,90,'threat');}}
 else if(e.state==='bash'||e.state==='sweep'){const before=e.state,range=before==='bash'?78:110,arc=before==='bash'?1.6:2.8;e.timer-=dt;if(before==='bash'){e.mx=Math.cos(e.lungeA)*240;e.my=Math.sin(e.lungeA)*240;}
  if(!e.hitDone&&d<range+player.r&&Math.abs(angDiff(a,e.lungeA))<arc/2){const result=hurtPlayer(before==='bash'?11:14,e.lungeA,'lockjaw_'+before,{attacker:e});if(e.state!==before)return;if(result)e.hitDone=true;}
  if(e.timer<=0){e.state=before==='bash'?'delay':'recover';e.timer=before==='bash'?.55:1.15;}
 }else{e.timer-=dt;if(e.timer<=0){e.state='approach';e.timer=.5;}}
}
function drawAdvancedEnemy(e){const name=e.stunT>0||e.exposedT>0?'exposed':['windup','delay','signal'].includes(e.state)?'windup':['bash','sweep','channel'].includes(e.state)?'attack':Math.hypot(e.mx,e.my)>5?'walk':'idle';
 if(!drawComicPose(e.kind,name,e.x,e.y+e.r*.75,e.face,1.25,time,null,e.flashT>0?'white':null)){ctx.fillStyle=KIND_COL[e.kind];ctx.fillRect(e.x-13,e.y-44,26,44);}
}
const baseTelegraphs=drawTelegraphs;
drawTelegraphs=function(){baseTelegraphs();for(const e of enemies){if(e.dead||e.spawnT>0)continue;
 if(e.kind==='lockjaw'){ctx.save();ctx.strokeStyle='#edb65e';ctx.lineWidth=4;if(e.state==='approach'&&e.stunT<=0&&!(e.exposedT>0)){ctx.beginPath();ctx.arc(e.x,e.y,29,e.face-Math.PI/3,e.face+Math.PI/3);ctx.stroke();}
 if(['windup','delay'].includes(e.state)){const sweep=e.state==='delay';wedge(e.x,e.y,sweep?110:116,e.lungeA-(sweep?1.4:.8),e.lungeA+(sweep?1.4:.8));ctx.globalAlpha=.16;ctx.fillStyle='#edb65e';ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=2;ctx.stroke();}ctx.restore();}
 if(e.kind==='relay'){ctx.save();ctx.strokeStyle='#edb65e';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.lineDashOffset=-time*35;for(const t of relayTargets(e)){ctx.beginPath();ctx.moveTo(e.x,e.y-32);ctx.lineTo(t.x,t.y-20);ctx.stroke();ctx.strokeRect(t.x-23,t.y-45,46,48);}if(['signal','channel'].includes(e.state)){ctx.beginPath();ctx.arc(e.x,e.y-52,7+3*Math.sin(time*8),0,PI2);ctx.stroke();}ctx.restore();}
 }};
const originalGlintFor=glintFor;glintFor=function(e){if(e.kind==='lockjaw'){if(['windup','delay'].includes(e.state))return e.timer;if(['bash','sweep'].includes(e.state)&&!e.hitDone)return 0;}return originalGlintFor(e);};
const originalEnemySpriteTop=enemySpriteTop;enemySpriteTop=function(e){return['lockjaw','relay'].includes(e.kind)?e.y-66:originalEnemySpriteTop(e);};
