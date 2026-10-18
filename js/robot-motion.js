'use strict';
// Authored joint poses, not transforms of a single standing cutout.
const ROBOT_MOTION={img:new Image(),ready:false,cells:[],reference:300};
const ROBOT_CORPSES=[];
const resetRobotMotion=reset;
reset=function(){ROBOT_CORPSES.length=0;resetRobotMotion();};
ROBOT_MOTION.img.onload=()=>{const im=ROBOT_MOTION.img,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data,cw=c.width/4,ch=c.height/4;
 ROBOT_MOTION.cells=connectedComicCells(c,d,cw,ch,4).flat();
 ROBOT_MOTION.reference=ROBOT_MOTION.cells[0].h;ROBOT_MOTION.ready=true;invalidateRender();
};
ROBOT_MOTION.img.src='assets/sprites/training-robot-motion-v2.webp';
function robotAnimationFrame(e){
 if(e.robotDeath)return time-e.robotDeath<.24?14:15;
 if(time-(e.robotHitAt??-100)<.24)return e.stunT>.35?13:12;
 if(e.state==='windup')return e.timer>(e.windDur||1)*.18?8:9;
 if(e.state==='swing')return e.timer>RUSH.swingT*.5?9:10;
 if(e.state==='recover')return 11;
 if(Math.hypot(e.mx||0,e.my||0,e.vx||0,e.vy||0)>20)return 4+Math.floor(time*8)%4;
 return Math.floor(time*5)%4;
}
const singlePoseRobot=drawPracticeDummy;
drawPracticeDummy=function(e){if(!ROBOT_MOTION.ready)return singlePoseRobot(e);const frame=robotAnimationFrame(e),cell=ROBOT_MOTION.cells[frame],ratio=125/ROBOT_MOTION.reference,feet=e.y+e.r*.65;ctx.save();ctx.translate(e.x,feet);if(Math.cos(e.face||0)<0)ctx.scale(-1,1);if(e.robotDeath)ctx.globalAlpha=clamp((1.3-(time-e.robotDeath))/.35,0,1);ctx.drawImage(cell.img,cell.x,cell.y,cell.w,cell.h,(cell.x-cell.ax)*ratio,(cell.y-cell.ay)*ratio,cell.w*ratio,cell.h*ratio);ctx.restore();e.robotFrame=frame;};
const damageRobotMotion=damageEnemy;
damageEnemy=function(e,...args){if((e.isPractice||e.tutDummy||e.tutWeak)&&!e.dead&&args[0]>0)e.robotHitAt=time;return damageRobotMotion(e,...args);};
const killRobotMotion=killEnemy;
killEnemy=function(e,...args){const robot=!e.dead&&(e.isPractice||e.tutDummy||e.tutWeak);const result=killRobotMotion(e,...args);if(robot&&e.dead)ROBOT_CORPSES.push({x:e.x,y:e.y,r:e.r,face:e.face,robotDeath:time});return result;};
const previousDeathActors=animationDeathActors;
animationDeathActors=function(){const list=previousDeathActors();if(!armouryRoom()){ROBOT_CORPSES.length=0;return list;}for(let i=ROBOT_CORPSES.length-1;i>=0;i--){const e=ROBOT_CORPSES[i];if(time-e.robotDeath>1.3){ROBOT_CORPSES.splice(i,1);continue;}list.push({y:e.y,f:()=>drawPracticeDummy(e)});}return list;};
