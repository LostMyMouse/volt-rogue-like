'use strict';
let practice=false,practiceDamage=0;
const ARMOURY_ART=new Image(),TRAINING_ROBOT=new Image();
ARMOURY_ART.src='assets/fortress/armoury-v1.webp';TRAINING_ROBOT.src='assets/sprites/training-robot-v1.webp';
ARMOURY_ART.onload=TRAINING_ROBOT.onload=()=>invalidateRender();
const armouryRoom=()=>practice||inTutorial();
const oldVariantStation=HUB_SPOTS.findIndex(s=>s.id==='variants');if(oldVariantStation>=0)HUB_SPOTS.splice(oldVariantStation,1);
for(const spot of HUB_SPOTS)if(['armoury','variants'].includes(spot.id)){spot.name='Armoury practice room';spot.verb='Enter';}
const hubPracticeInteract=hubInteract;
hubInteract=function(){if(state==='hub'&&['armoury','variants'].includes(hubNear?.spot?.id))return enterPracticeRoom();hubPracticeInteract();};
function practiceDummy(){const e=makeEnemy('rusher',0,{x:ARENA.w/2,y:ARENA.h/2});Object.assign(e,{tutDummy:true,isPractice:true,hp:1000000,maxHp:1000000,face:Math.PI});return e;}
function preparePractice(){
 reset();STYLE().init?.(player);roomPhase='practice';state='play';obstacles=armouryObstacles();supplyCrates=[];fieldDrops=[];shop=null;exits=[];player.x=570;player.y=450;player.aim=0;player.sig=100;enemies=[practiceDummy()];practiceDamage=0;
 cam.x=750;cam.y=395;cam.zoom=.8;keys.clear();if($('#practiceControls'))$('#practiceControls').hidden=false;
}
function enterPracticeRoom(){leaveHub();practice=true;preparePractice();
 if(!$('#practiceControls')){const bar=document.createElement('div');bar.id='practiceControls';bar.className='practice-controls';bar.innerHTML='<span>ARMOURY · PRACTICE ROOM</span><button type="button" id="practiceWeapons">Weapons</button><button type="button" id="practiceVariants">Variants</button><button type="button" id="practiceTutorial">Tutorial</button><button type="button" id="practiceReturn">Return to Fortress</button>';document.body.appendChild(bar);$('#practiceWeapons').onclick=()=>{state='hubmenu';keys.clear();$('#practiceControls').hidden=true;openStyles();};$('#practiceVariants').onclick=()=>{$('#practiceControls').hidden=true;openProgression('variants');};$('#practiceReturn').onclick=leavePracticeRoom;$('#practiceTutorial').onclick=()=>startTutorial(false);}
 $('#practiceControls').hidden=false;banner('EQUIP · TEST · REFINE');
}
function leavePracticeRoom(){practice=false;if($('#practiceControls'))$('#practiceControls').hidden=true;tut=null;show('#tut',false);document.body.classList.remove('tutorial-mode');show('#mPause',false);show('#mStyle',false);if($('#mProgression'))show('#mProgression',false);stopVoice();keys.clear();enterHub();player.x=1100;player.y=555;}
const practiceMenuClosed=hubMenuClosed;
hubMenuClosed=function(){if(practice){preparePractice();return;}practiceMenuClosed();};
const damagePractice=damageEnemy;
damageEnemy=function(e,dmg,...args){if(!e.isPractice)return damagePractice(e,dmg,...args);const before=e.hp;damagePractice(e,dmg,...args);practiceDamage+=before-e.hp;e.hp=e.maxHp;e.dead=false;e.vx=e.vy=0;e.x=750;e.y=395;};
const practiceUpdate=update;
update=function(dt){practiceUpdate(dt);if(practice){player.hp=player.maxHp;player.sig=100;for(const e of enemies){e.x=750;e.y=395;e.vx=e.vy=0;}if(player.y>700&&Math.abs(player.x-750)<85){leavePracticeRoom();return;}}};
const armouryPauseClosed=closePause;
closePause=function(){armouryPauseClosed();if(practice&&$('#practiceControls'))$('#practiceControls').hidden=false;};
const armouryProp=drawObstacle;
drawObstacle=function(b){if(armouryRoom()&&b.painted)return;armouryProp(b);};
function drawPracticeRoom(){
 if(ARMOURY_ART.complete&&ARMOURY_ART.naturalWidth){ctx.drawImage(ARMOURY_ART,0,0,ARENA.w,ARENA.h);drawArmouryLabels();return;}
 ctx.fillStyle='#172335';ctx.fillRect(0,0,ARENA.w,ARENA.h);ctx.lineWidth=3;ctx.strokeStyle='#273e52';
 for(let x=0;x<1500;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,790);ctx.stroke();}for(let y=0;y<790;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1500,y);ctx.stroke();}
 ctx.fillStyle='#101925';ctx.fillRect(35,30,1430,115);ctx.strokeStyle=COL.ink;ctx.lineWidth=12;ctx.strokeRect(35,30,1430,730);ctx.strokeStyle=COL.volt;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(750,395,190,95,0,0,PI2);ctx.stroke();
 for(let i=0;i<5;i++){const x=360+i*190;ctx.fillStyle='#243e51';ctx.fillRect(x,60,110,62);ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.strokeRect(x,60,110,62);ctx.fillStyle=COL.volt;ctx.font='700 13px sans-serif';ctx.textAlign='center';ctx.fillText(Object.values(STYLES)[i].name.toUpperCase(),x+55,96);}
 ctx.fillStyle='#effbff';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText(STYLES[run.style].name+' · '+(run.aspect?ASPECTS[run.style].name:'Standard'),750,210);ctx.font='700 16px sans-serif';ctx.fillText('Practice damage: '+Math.round(practiceDamage)+' · Unlimited health and Overload',750,245);
}
const practiceFloor=drawFloor;
drawFloor=function(){if(armouryRoom())return drawPracticeRoom();practiceFloor();};
// Pausing and opening a panel keep the practice session safe; exiting returns to the armoury.
const practiceHub=enterHub;
enterHub=function(){practice=false;if($('#practiceControls'))$('#practiceControls').hidden=true;practiceHub();};

function drawPracticeDummy(e){
 if(!TRAINING_ROBOT.complete||!TRAINING_ROBOT.naturalWidth)return;
 const h=125,w=h*TRAINING_ROBOT.naturalWidth/TRAINING_ROBOT.naturalHeight,feet=e.y+e.r*.65;
 ctx.save();ctx.translate(e.x,feet);if(Math.cos(e.face||0)<0)ctx.scale(-1,1);
 const attacking=e.state==='swing',wind=e.state==='windup',lean=attacking?.12:wind?-.06:0;
 ctx.transform(1,0,lean,1,0,0);ctx.translate(attacking?12:0,Math.sin(time*2.4)*.7);ctx.drawImage(TRAINING_ROBOT,-w/2,-h,w,h);
 ctx.restore();
}
const robotSpriteTop=enemySpriteTop;
enemySpriteTop=function(e){return e.isPractice||e.tutDummy||e.tutWeak?e.y+e.r*.65-125:robotSpriteTop(e);};
function armouryObstacles(){return[{x:0,y:0,w:1500,h:235,kind:'box',painted:true},{x:0,y:235,w:200,h:555,kind:'box',painted:true},{x:1300,y:235,w:200,h:555,kind:'box',painted:true},{x:200,y:670,w:440,h:120,kind:'box',painted:true},{x:860,y:670,w:440,h:120,kind:'box',painted:true}];}
function drawArmouryLabels(){
 ctx.save();ctx.textAlign='center';ctx.strokeStyle=COL.ink;ctx.lineWidth=5;ctx.fillStyle='#f5e8bd';ctx.font='700 19px sans-serif';ctx.strokeText('FORTRESS ARMOURY',750,265);ctx.fillText('FORTRESS ARMOURY',750,265);
 if(practice){ctx.font='700 15px sans-serif';const text=STYLES[run.style].name+' · '+(run.aspect?ASPECTS[run.style].name:'Standard')+' · Damage '+Math.round(practiceDamage);ctx.strokeText(text,750,292);ctx.fillText(text,750,292);ctx.fillStyle=COL.volt;ctx.strokeText('EXIT TO FORTRESS ↓',750,700);ctx.fillText('EXIT TO FORTRESS ↓',750,700);}ctx.restore();
}
