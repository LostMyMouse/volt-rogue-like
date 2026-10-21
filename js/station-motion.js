'use strict';
const STATION_ORDER=['halo','bastion','echo','thorn','patch'];
const STATION_MOTION={img:null,ready:false,cells:[]};
function warmStations(){
 if(STATION_MOTION.img)return;const a=STATION_MOTION;a.img=new Image();a.img.onload=()=>{
  const c=document.createElement('canvas');c.width=a.img.width;c.height=a.img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(a.img,0,0);
  a.cells=connectedComicCells(c,g.getImageData(0,0,c.width,c.height).data,c.width/4,c.height/5,4,5);a.ready=true;invalidateRender();
 };a.img.src='assets/sprites/comic/vanguard-stations-v1.webp';
}
function stationFrame(t){const age=((t%10)+10)%10;return age<4?0:age<5.5?1:age<7?2:3;}
function drawStation(id,x,y,phase=null){
 warmStations();const row=STATION_ORDER.indexOf(id),a=STATION_MOTION;if(row<0||!a.ready)return false;
 const at=phase??(reduceMotion?0:stationFrame(time+row*1.7)),cell=a.cells[row][at],s=SPRITES[id],ratio=s.frame*.94*s.scale/a.cells[row][0].h;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(cell.img,0,0,cell.w,cell.h,x-cell.ax*ratio,y-cell.ay*ratio,cell.w*ratio,cell.h*ratio);ctx.restore();return true;
}
const drawStationNpc=drawAnimatedNpc;
drawAnimatedNpc=function(id,x,y,face,options={}){if(options.grounded&&!options.talking&&!NPC_MOTION.get(id)?.override&&inHub()&&drawStation(id,x,y))return;drawStationNpc(id,x,y,face,options);};
