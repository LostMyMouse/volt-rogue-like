// Detailed comic atlases. Each has four directions and eight distinct authored action poses.
// Legacy sheets remain loading fallbacks; combat clocks and hit frames still come from ANIMATION_DATA.
'use strict';
const COMIC_IDS=['volt','halo','bastion','echo','thorn','patch','kilnheart','bellwether','verdigris','glasswake','undertow','gravemark','redactor','rusher','needle'];
const COMIC_ART=new Map();
// Select complete connected bodies rather than slicing oversized shoulders/hands at grid edges.
function connectedComicCells(canvas,data,cw,ch){
 const w=canvas.width,h=canvas.height,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[null];
 for(let at=0;at<w*h;at++){if(labels[at]||data[at*4+3]<100)continue;const id=parts.length;let head=0,tail=1;queue[0]=at;labels[at]=id;const b={x:w,y:h,right:0,bottom:0};
  while(head<tail){const i=queue[head++],x=i%w,y=(i/w)|0;b.x=Math.min(b.x,x);b.y=Math.min(b.y,y);b.right=Math.max(b.right,x);b.bottom=Math.max(b.bottom,y);for(const n of[x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!labels[n]&&data[n*4+3]>=100){labels[n]=id;queue[tail++]=n;}}
  parts.push(b);
 }
 return Array.from({length:4},(_,row)=>Array.from({length:8},(_,col)=>{const counts=new Map();for(let y=Math.ceil(row*ch);y<(row+1)*ch;y++)for(let x=Math.ceil(col*cw);x<(col+1)*cw;x++){const id=labels[y*w+x];if(id)counts.set(id,(counts.get(id)||0)+1);}const id=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0];if(!id)throw Error('Empty connected pose');const b=parts[id],c=document.createElement('canvas');c.width=b.right-b.x+5;c.height=b.bottom-b.y+5;const g=c.getContext('2d'),p=g.createImageData(c.width,c.height);let sum=0,count=0;
  for(let y=b.y;y<=b.bottom;y++)for(let x=b.x;x<=b.right;x++)if(labels[y*w+x]===id){const from=(y*w+x)*4,to=((y-b.y+2)*c.width+x-b.x+2)*4;p.data.set(data.subarray(from,from+4),to);if(y>b.bottom-(b.bottom-b.y)*.08){sum+=x-b.x+2;count++;}}
  g.putImageData(p,0,0);return{img:c,x:0,y:0,w:c.width,h:c.height,ax:count?sum/count:c.width/2,cx:c.width/2,ay:c.height-2};
 }));
}
function comicAtlas(id){
  if (!COMIC_IDS.includes(id)&&id!=='volt-jog') return null;
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
            let torsoSum=0,torsoCount=0;
            for(let y=Math.floor(y0+(y1-y0)*.35);y<=y0+(y1-y0)*.6;y++)for(let x=x0;x<=x1;x++)if(data[(y*canvas.width+x)*4+3]>100){torsoSum+=x;torsoCount++;}
            a.cells[row][col]={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,ax:count?sum/count:(x0+x1)/2,cx:torsoCount?torsoSum/torsoCount:(x0+x1)/2,ay:y1+1};
          }
          a.reference[row]=a.cells[row][0].h;
        }
        if(['verdigris','gravemark','bastion'].includes(id)){
          a.cells=connectedComicCells(canvas,data,a.w,a.h);
          a.reference=a.cells.map(row=>row[0].h);
        }
      }catch(e){
        // file:// may prohibit reading pixels. Regular atlas cells still render with fixed anchors.
        a.cells=Array.from({length:4},(_,row)=>Array.from({length:8},(_,col)=>({x:col*a.w,y:row*a.h,w:a.w,h:a.h,ax:(col+.5)*a.w,ay:(row+.92)*a.h})));
        a.reference=[a.h*.75,a.h*.75,a.h*.75,a.h*.75];
      }
      a.ready=true;invalidateRender();
      for(const key of ANIMATION_CACHE.keys())if(key.startsWith(id+'/'))ANIMATION_CACHE.delete(key);
    };
    a.img.src=`assets/sprites/comic/${id}.webp?v=2026-10-18`;
  }
  return COMIC_ART.get(id);
}

// Each stride direction is its own 2x2 cycle. Extract the connected body from each
// cell so flecks or pieces of neighbouring poses can never appear above the helmet.
const VOLT_STRIDES=new Map();
function isolatedStride(img,col,row){
 const w=Math.floor(img.width/2),h=Math.floor(img.height/2),c=document.createElement('canvas');c.width=w;c.height=h;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,col*w,row*h,w,h,0,0,w,h);
 const pixels=g.getImageData(0,0,w,h),d=pixels.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
 for(let at=0;at<w*h;at++){
  if(seen[at]||d[at*4+3]<100)continue;
  let head=0,tail=1;queue[0]=at;seen[at]=1;
  while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);for(const n of [x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&d[n*4+3]>=100){seen[n]=1;queue[tail++]=n;}}
  if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
 }
 const keep=new Uint8Array(w*h);let x0=w,y0=h,x1=0,y1=0;
 for(const i of largest){const x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(let yy=Math.max(0,y-2);yy<=Math.min(h-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(w-1,x+2);xx++)keep[yy*w+xx]=1;}
 if(!largest.length)throw Error('Empty stride');
 for(let i=0;i<w*h;i++)if(!keep[i])d[i*4+3]=0;
 g.putImageData(pixels,0,0);let sum=0,count=0;
 for(let y=Math.floor(y0+(y1-y0)*.32);y<y0+(y1-y0)*.58;y++)for(let x=x0;x<=x1;x++)if(d[(y*w+x)*4+3]>100){sum+=x;count++;}
 return{img:c,x:Math.max(0,x0-2),y:Math.max(0,y0-2),w:Math.min(w-1,x1+2)-Math.max(0,x0-2)+1,h:Math.min(h-1,y1+2)-Math.max(0,y0-2)+1,cx:sum/count,ay:y1+1,bodyHeight:y1-y0+1};
}
function voltStride(direction){
 const key=direction==='west'?'east':direction;
 if(!VOLT_STRIDES.has(key)){const a={img:new Image(),ready:false,cells:[]};VOLT_STRIDES.set(key,a);a.img.onload=()=>{try{a.cells=Array.from({length:4},(_,i)=>isolatedStride(a.img,i%2,Math.floor(i/2)));a.ready=true;invalidateRender();}catch(e){console.warn('Stride extraction',key,e);}};a.img.src=`assets/sprites/comic/volt-stride-${key}.webp`;}
 return VOLT_STRIDES.get(key);
}
function drawVoltStride(x,y,face,scale,elapsed,tint){
 const direction=['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4],a=voltStride(direction);if(!a.ready)return false;
 const c=a.cells[Math.floor(elapsed*8)%4],ratio=SPRITES.volt.frame*.94/c.bodyHeight*scale;
 let sheet=c.img;if(tint){const key=tint==='white'?'white':'ghost';if(!c[key])c[key]=tintSheet(c.img,tint==='white'?'#ffffff':COL.volt);sheet=c[key];}
 ctx.save();ctx.translate(x,y);if(direction==='west')ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(sheet,c.x,c.y,c.w,c.h,(c.x-c.cx)*ratio,(c.y-c.ay)*ratio,c.w*ratio,c.h*ratio);ctx.restore();return true;
}

function comicPose(name,c,elapsed,frame){
  const at=frame===null?animationFrame(c,elapsed):clamp(Math.floor(frame),0,c.frames-1);
  if(name==='hover')return 0;
  if(/^(run|walk)$/.test(name))return [1,2][Math.floor(elapsed*(name==='run'?4.8:3.6))%2];
  if(/hurt|exposed|death/.test(name))return 6;
  if(/block|parry|recovery|vents_open/.test(name))return 5;
  if(/dash|rush|mirror_step/.test(name))return 7;
  if(/idle|talk|react|intro|phase_change/.test(name))return 0;
  return at<(c.key_frame??Math.floor(c.frames/2))?3:4;
}
function drawComicPose(id,name,x,y,face,scale,elapsed=0,frame=null,tint=null){
  let a=comicAtlas(id);if(!a?.ready)return false;
  const s=SPRITES[id],c=ANIMATION_DATA[id]?.[name]||{frames:4,fps:8,loop:true};
  const moving=/^(run|walk)$/.test(name),jog=null;
  if(id==='volt'&&moving){if(drawVoltStride(x,y,face,scale,elapsed,tint))return true;name='idle';}
  if(jog?.ready)a=jog;
  const direction=['east','south','west','north'][((Math.round(face/(Math.PI/2))%4)+4)%4],row=['south','east','north','west'].indexOf(direction);
  const weaponAttack=id==='volt'&&/strike|power|special/.test(name),progress=clamp(elapsed/(c.frames/c.fps),0,.999),phase=Math.floor(progress*3);
  const weaponPoses={brawler:[3,4,0],caster:[5,4,4],titan:[3,3,4],speedster:[7,4,7],magnetar:[5,4,5]};
  const pose=weaponAttack?weaponPoses[run.style][phase]:jog?.ready?Math.floor(elapsed*12*s.scale/scale)%8:comicPose(name,c,elapsed,frame);
  const cell=a.cells[row][pose],worldHeight=s.frame*(id==='needle'?.8:.94),ratio=worldHeight/(moving?cell.h:a.reference[row])*scale;
  let sheet=cell.img||a.img;
  if(tint){const owner=cell.img?cell:a,key=tint==='white'?'white':'ghost';if(!owner[key])owner[key]=tintSheet(sheet,tint==='white'?'#ffffff':COL.volt);sheet=owner[key];}
  const bob=name==='idle'?-Math.sin(elapsed*2.4)*1.2*scale:0;
  const ax=moving?(cell.cx??cell.ax):cell.ax,ay=id==='needle'?cell.y+cell.h/2:cell.ay;
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(weaponAttack){const k=Math.sin(progress*Math.PI),travel={brawler:6,caster:-4,titan:11,speedster:19,magnetar:4}[run.style];ctx.translate(Math.cos(face)*travel*k,Math.sin(face)*travel*k);if(run.style==='titan'){ctx.translate(x,y);ctx.scale(1+k*.045,1-k*.035);ctx.translate(-x,-y);}}
  if(name==='idle'&&!reduceMotion){const breath=Math.sin(elapsed*2.2+row);ctx.translate(x,y);ctx.scale(1-breath*.008,1+breath*.015);ctx.translate(-x+Math.sin(elapsed*1.1)*.8,y*-1);}
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
for(const direction of ['east','south','north'])voltStride(direction);
