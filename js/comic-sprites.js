// Detailed comic atlases. Each has four directions and eight distinct authored action poses.
// Legacy sheets remain loading fallbacks; combat clocks and hit frames still come from ANIMATION_DATA.
'use strict';
const COMIC_IDS=['volt','halo','bastion','echo','thorn','patch','kilnheart','bellwether','verdigris','glasswake','undertow','gravemark','redactor','rusher','needle'];
const COMIC_ART=new Map();
function comicAtlas(id){
  if (!COMIC_IDS.includes(id)) return null;
  if (!COMIC_ART.has(id)){
    const a={img:new Image(),ready:false,cells:[],reference:[]}; COMIC_ART.set(id,a);
    a.img.onload=()=>{
      a.w=a.img.width/8; a.h=a.img.height/4;
      try {
        const canvas=document.createElement('canvas');canvas.width=a.img.width;canvas.height=a.img.height;
        const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(a.img,0,0);
        const data=g.getImageData(0,0,canvas.width,canvas.height).data;
        for(let row=0;row<4;row++){
          a.cells[row]=[];
          for(let col=0;col<8;col++){
            const left=Math.ceil(col*a.w)+2,top=Math.ceil(row*a.h)+2,right=Math.floor((col+1)*a.w)-2,bottom=Math.floor((row+1)*a.h)-2;
            let x0=right,y0=bottom,x1=left,y1=top;
            for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*canvas.width+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
            if(x1<x0||y1<y0)throw Error('Empty comic pose');
            let sum=0,count=0;
            for(let y=Math.max(y0,y1-Math.ceil((y1-y0)*.08));y<=y1;y++)for(let x=x0;x<=x1;x++)if(data[(y*canvas.width+x)*4+3]>100){sum+=x;count++;}
            a.cells[row][col]={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,ax:count?sum/count:(x0+x1)/2,ay:y1};
          }
          a.reference[row]=a.cells[row][0].h;
        }
      }catch(e){
        // file:// may prohibit reading pixels. Regular atlas cells still render with fixed anchors.
        a.cells=Array.from({length:4},(_,row)=>Array.from({length:8},(_,col)=>({x:col*a.w,y:row*a.h,w:a.w,h:a.h,ax:(col+.5)*a.w,ay:(row+.92)*a.h})));
        a.reference=[a.h*.75,a.h*.75,a.h*.75,a.h*.75];
      }
      a.ready=true;
      for(const key of ANIMATION_CACHE.keys())if(key.startsWith(id+'/'))ANIMATION_CACHE.delete(key);
    };
    a.img.src=`assets/sprites/comic/${id}.webp?v=2026-10-18`;
  }
  return COMIC_ART.get(id);
}
function comicPose(name,c,elapsed,frame){
  const at=frame===null?animationFrame(c,elapsed):clamp(Math.floor(frame),0,c.frames-1);
  if(/^(run|walk|hover)$/.test(name)) return [1,0,2,0][Math.floor(elapsed*8)%4];
  if(/hurt|exposed|death/.test(name))return 6;
  if(/block|parry|recovery|vents_open/.test(name))return 5;
  if(/dash|rush|mirror_step/.test(name))return 7;
  if(/idle|talk|react|intro|phase_change/.test(name))return 0;
  return at<(c.key_frame??Math.floor(c.frames/2))?3:4;
}
function drawComicPose(id,name,x,y,face,scale,elapsed=0,frame=null,tint=null){
  const a=comicAtlas(id);if(!a?.ready)return false;
  const s=SPRITES[id],c=ANIMATION_DATA[id]?.[name]||{frames:4,fps:8,loop:true};
  const direction=['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4],row=['south','east','north','west'].indexOf(direction);
  const cell=a.cells[row][comicPose(name,c,elapsed,frame)],worldHeight=s.frame*(id==='needle'?.8:.94),ratio=worldHeight/a.reference[row]*scale;
  let sheet=a.img;
  if(tint){const key=tint==='white'?'white':'ghost';if(!a[key])a[key]=tintSheet(a.img,tint==='white'?'#ffffff':COL.volt);sheet=a[key];}
  const moving=/^(run|walk|hover)$/.test(name),bob=moving?-Math.abs(Math.sin(elapsed*8*Math.PI))*1.5*scale:name==='idle'?-Math.sin(elapsed*2.4)*.6*scale:0;
  const ax=cell.ax,ay=id==='needle'?cell.y+cell.h/2:cell.ay;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(name==='death'){const t=clamp(elapsed/(c.frames/c.fps),0,1);ctx.globalAlpha*=1-t;ctx.translate(x,y);ctx.rotate(t*.9);x=y=0;}
  ctx.drawImage(sheet,cell.x,cell.y,cell.w,cell.h,x+(cell.x-ax)*ratio,y+(cell.y-ay)*ratio+bob,cell.w*ratio,cell.h*ratio);
  ctx.restore();return true;
}
const pixelDrawAnimation=drawAnimation,pixelDrawTurn=drawTurn,pixelAnimationClip=animationClip;
drawAnimation=function(id,name,x,y,face,scale,elapsed=0,frame=null,tint=null){
  if(drawComicPose(id,name,x,y,face,scale,elapsed,frame,tint))return true;
  // The legacy hook sheet contains fragments of neighbouring bodies. Use the clean turn while loading.
  if(id==='undertow'&&name==='glacier_hook')return pixelDrawTurn(id,x,y,face,scale);
  return pixelDrawAnimation(id,name,x,y,face,scale,elapsed,frame,tint);
};
drawTurn=function(id,x,y,face,scale,sheet){const s=SPRITES[id],tint=sheet?(sheet===s.white?'white':'ghost'):null;return drawComicPose(id,'idle',x,y,face,scale||s.scale,0,null,tint)||pixelDrawTurn(id,x,y,face,scale,sheet);};
animationClip=function(id,name){const a=comicAtlas(id);return a?.ready&&ANIMATION_DATA[id]?.[name]?{...ANIMATION_DATA[id][name],ready:true}:pixelAnimationClip(id,name);};
comicAtlas('volt');
