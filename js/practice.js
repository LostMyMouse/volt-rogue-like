'use strict';
let practice=false,practiceDamage=0;
for(const spot of HUB_SPOTS)if(['armoury','variants'].includes(spot.id)){spot.name='Armoury practice room';spot.verb='Enter';}
const hubPracticeInteract=hubInteract;
hubInteract=function(){if(state==='hub'&&['armoury','variants'].includes(hubNear?.spot?.id))return enterPracticeRoom();hubPracticeInteract();};
function practiceDummy(){const e=makeEnemy('rusher',0,{x:ARENA.w/2,y:ARENA.h/2});Object.assign(e,{tutDummy:true,isPractice:true,hp:1000000,maxHp:1000000,face:Math.PI});return e;}
function preparePractice(){
 reset();STYLE().init?.(player);roomPhase='practice';state='play';obstacles=[];supplyCrates=[];fieldDrops=[];shop=null;exits=[];player.x=570;player.y=450;player.aim=0;player.sig=100;enemies=[practiceDummy()];practiceDamage=0;
 cam.x=750;cam.y=395;cam.zoom=.8;keys.clear();
}
function enterPracticeRoom(){leaveHub();practice=true;preparePractice();
 if(!$('#practiceControls')){const bar=document.createElement('div');bar.id='practiceControls';bar.className='practice-controls';bar.innerHTML='<span>ARMOURY · PRACTICE ROOM</span><button type="button" id="practiceWeapons">Weapons</button><button type="button" id="practiceVariants">Variants</button><button type="button" id="practiceReturn">Return to Fortress</button>';document.body.appendChild(bar);$('#practiceWeapons').onclick=()=>{state='hubmenu';keys.clear();openStyles();};$('#practiceVariants').onclick=()=>openProgression('variants');$('#practiceReturn').onclick=leavePracticeRoom;}
 $('#practiceControls').hidden=false;banner('EQUIP · TEST · REFINE');
}
function leavePracticeRoom(){practice=false;$('#practiceControls').hidden=true;enterHub();player.x=1240;player.y=550;}
const practiceMenuClosed=hubMenuClosed;
hubMenuClosed=function(){if(practice){preparePractice();return;}practiceMenuClosed();};
const damagePractice=damageEnemy;
damageEnemy=function(e,dmg,...args){if(!e.isPractice)return damagePractice(e,dmg,...args);const before=e.hp;damagePractice(e,dmg,...args);practiceDamage+=before-e.hp;e.hp=e.maxHp;e.dead=false;e.vx=e.vy=0;e.x=750;e.y=395;};
const practiceUpdate=update;
update=function(dt){practiceUpdate(dt);if(practice){player.hp=player.maxHp;player.sig=100;for(const e of enemies){e.x=750;e.y=395;e.vx=e.vy=0;}}};
function drawPracticeRoom(){
 ctx.fillStyle='#172335';ctx.fillRect(0,0,ARENA.w,ARENA.h);ctx.lineWidth=3;ctx.strokeStyle='#273e52';
 for(let x=0;x<1500;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,790);ctx.stroke();}for(let y=0;y<790;y+=100){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1500,y);ctx.stroke();}
 ctx.fillStyle='#101925';ctx.fillRect(35,30,1430,115);ctx.strokeStyle=COL.ink;ctx.lineWidth=12;ctx.strokeRect(35,30,1430,730);ctx.strokeStyle=COL.volt;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(750,395,190,95,0,0,PI2);ctx.stroke();
 for(let i=0;i<5;i++){const x=360+i*190;ctx.fillStyle='#243e51';ctx.fillRect(x,60,110,62);ctx.strokeStyle=COL.ink;ctx.lineWidth=4;ctx.strokeRect(x,60,110,62);ctx.fillStyle=COL.volt;ctx.font='700 13px sans-serif';ctx.textAlign='center';ctx.fillText(Object.values(STYLES)[i].name.toUpperCase(),x+55,96);}
 ctx.fillStyle='#effbff';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText(STYLES[run.style].name+' · '+(run.aspect?ASPECTS[run.style].name:'Standard'),750,210);ctx.font='700 16px sans-serif';ctx.fillText('Practice damage: '+Math.round(practiceDamage)+' · Unlimited health and Overload',750,245);
}
const practiceFloor=drawFloor;
drawFloor=function(){if(practice)return drawPracticeRoom();practiceFloor();};
// Pausing and opening a panel keep the practice session safe; exiting returns to the armoury.
const practiceHub=enterHub;
enterHub=function(){practice=false;if($('#practiceControls'))$('#practiceControls').hidden=true;practiceHub();};

function drawPracticeDummy(e){ctx.save();ctx.translate(e.x,e.y);ctx.lineWidth=4;ctx.strokeStyle=COL.ink;ctx.fillStyle='#8a623e';ctx.fillRect(-7,-62,14,68);ctx.strokeRect(-7,-62,14,68);ctx.fillRect(-34,-48,68,12);ctx.strokeRect(-34,-48,68,12);ctx.fillStyle='#a0abb0';ctx.beginPath();ctx.arc(0,-75,13,0,PI2);ctx.fill();ctx.stroke();ctx.fillStyle='#e6c785';ctx.beginPath();ctx.ellipse(0,-42,24,28,0,0,PI2);ctx.fill();ctx.stroke();ctx.strokeStyle='#bf4545';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-43,14,0,PI2);ctx.stroke();ctx.fillStyle='#bf4545';ctx.beginPath();ctx.arc(0,-43,4,0,PI2);ctx.fill();ctx.restore();}
