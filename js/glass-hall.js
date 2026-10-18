'use strict';
// Refraction is a readable identity puzzle: the real figure changes position each cast.
BOSSES.glasswake.sequences[0]=['refract','lunge','step','lanes'];
const beginHallRefraction=BOSS_PRIMS.refract.begin;
BOSS_PRIMS.refract.begin=function(e,a){
 beginHallRefraction(e,a);if(e.kind!=='glasswake')return;
 const figures=[e,...a.decoys],slots=shuffle([{x:400,y:player.y>395?240:550},{x:750,y:player.y>395?240:550},{x:1100,y:player.y>395?240:550}]);
 figures.forEach((f,i)=>{f.x=slots[i].x;f.y=slots[i].y;f.vx=f.vy=0;f.face=a.aim;});a.origin={x:e.x,y:e.y};a.hallPuzzle=true;
 if(!e.hallExplained){e.hallExplained=true;texts.push({x:e.x,y:e.y-125,v:'REAL: SOLID RING',t:0,c:'#fff',small:true});}
};
function revealGlasswake(e,duration){if(!e||e.dead||e.invuln)return;bossClearOwned(e);e.glassReveal=duration;bossExposed(e,Math.max(duration,e.composureBrokenT||0));texts.push({x:e.x,y:e.y-95,v:'FOUND YOU',t:0,c:'#fff',small:true});}
const damageHallFigure=damageEnemy;
damageEnemy=function(e,dmg,a,knock,stun,opt={}){
 const owner=e.isDecoy?e.owner:e,puzzle=owner?.kind==='glasswake'&&owner.atk?.hallPuzzle&&['WINDUP','ACTIVE'].includes(owner.bstate),alive=!e.dead;
 const result=damageHallFigure(e,dmg,a,knock,stun,opt);
 if(!puzzle||!alive||owner.dead||owner.invuln)return result;
 if(e.isDecoy&&e.dead){damageComposure(owner,15,'reflection');if(!owner.atk.decoys.some(d=>!d.dead))revealGlasswake(owner,1.1);}
 else if(e===owner&&['strike','power','overload'].includes(opt.src))revealGlasswake(owner,1.7);
 return result;
};
const tickHallBoss=bossUpdate;
bossUpdate=function(e,dt){if(e.glassReveal>0)e.glassReveal=Math.max(0,e.glassReveal-dt);tickHallBoss(e,dt);};
const drawHallEnemy=drawEnemyActor;
drawEnemyActor=function(e){drawHallEnemy(e);if(e.kind==='glasswake'&&e.glassReveal>0){ctx.save();ctx.strokeStyle='#fff3cf';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*.7,e.r*1.8,e.r*.75,0,0,PI2);ctx.stroke();ctx.restore();}};
