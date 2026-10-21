'use strict';
// Four authored poses in four facings for each weapon. Atlas pixels are isolated
// once on load; stable floor anchors prevent neighbouring figures and foot sliding.
const WEAPON_MOTION=new Map();
function weaponMotion(id){
 if(!WEAPON_MOTION.has(id)){const a={img:new Image(),ready:false,cells:[]};WEAPON_MOTION.set(id,a);a.img.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=a.img.width;canvas.height=a.img.height;const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(a.img,0,0);
  a.cells=connectedComicCells(canvas,g.getImageData(0,0,canvas.width,canvas.height).data,canvas.width/4,canvas.height/4,4);a.reference=a.cells.map(row=>row[3].h);a.ready=true;invalidateRender();
 };a.img.src=`assets/sprites/comic/volt-${id}-attack-v1.webp`;}
 return WEAPON_MOTION.get(id);
}
function drawWeaponMotion(name,x,y,face,scale,elapsed,frame,tint){
 if(!/strike|power|special/.test(name))return false;const a=weaponMotion(weaponMotionId());if(!a.ready)return false;
 const row=['south','east','north','west'].indexOf(['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4]),clip=ANIMATION_DATA.volt[name]||ANIMATION_DATA.volt.strike1;
 const progress=clamp((frame===null?elapsed*clip.fps:frame)/clip.frames,0,.999);let phase=Math.floor(progress*4);
 if(run.style==='magnetar'&&player.motionAttack!=='power'&&player.disc){if(player.disc.state!=='held'&&(phase===0||phase===3))phase=phase===0?1:2;player.weaponDiscInPose=player.disc.state==='held'&&(phase===0||phase===3);}
 const c=a.cells[row][phase],ratio=SPRITES.volt.frame*.94*scale/a.reference[row];
 let img=c.img;if(tint){const key=tint==='white'?'white':'ghost';if(!c[key])c[key]=tintSheet(img,tint==='white'?'#fff':COL.volt);img=c[key];}
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.w,c.h,x-c.ax*ratio,y-c.ay*ratio,c.w*ratio,c.h*ratio);ctx.restore();return true;
}
const drawAuthoredWeaponPose=drawComicPose;
drawComicPose=function(id,name,x,y,face,scale,elapsed=0,frame=null,tint=null,options={}){if(id==='volt'){player.weaponDiscInPose=false;if(drawWeaponMotion(name,x,y,face,scale,elapsed,frame,tint))return true;}return drawAuthoredWeaponPose(id,name,x,y,face,scale,elapsed,frame,tint,options);};
function weaponMotionId(){return player.motionAttack==='power'&&['brawler','magnetar'].includes(run.style)?'caster':run.style==='titan'&&player.motionAttack!=='power'?'titan-strike':run.style;}
weaponMotion(save.style==='titan'?'titan-strike':save.style);
