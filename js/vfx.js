// Volt: Attack effects. Telegraphs (outlines and hatching) say where an attack will land; this layer draws
// what it looks like when it does: Undertow's water and ice, Kilnheart's fire, Bellwether's sound, Verdigris's
// acid and vines, Glasswake's prism light, Gravemark's stone and the Redactor's redaction bars. Everything is
// drawn in code in the game's ink style (dark outlines, bold colour, a bright core). Purely visual: no hit
// boxes, damage or timings live here.
'use strict';

const ELEMENTS = {
  water: { core:'#effcff', mid:'#58ccff', deep:'#1a5fa8', glow:'#7fd8ff' },
  ice:   { core:'#ffffff', mid:'#bfeeff', deep:'#5aa9d6', glow:'#cff4ff' },
  fire:  { core:'#fff2b8', mid:'#ff9a2e', deep:'#b8360c', glow:'#ff7a1a' },
  sound: { core:'#fffbe0', mid:'#f5c935', deep:'#8a5a00', glow:'#f5b915' },
  acid:  { core:'#f4ffb8', mid:'#b8e62e', deep:'#3f6a0e', glow:'#b8e62e' },
  glass: { core:'#ffffff', mid:'#ff8ccf', deep:'#c41f75', glow:'#ff3f9a' },
  stone: { core:'#e6dcff', mid:'#8d80ad', deep:'#3a3150', glow:'#b56cff' },
  redact:{ core:'#ffd6db', mid:'#e0283c', deep:'#120a0c', glow:'#e0283c' },
};
// Attack sources name their villain: under_jet, kiln_punch, bell_ring...
function elementOf(src){
  const p=(src||'').split('_')[0];
  return ({under:'water', kiln:'fire', bell:'sound', verd:'acid', glass:'glass', gm:'stone', redact:'redact'})[p] || null;
}
const EL = src => ELEMENTS[elementOf(src)] ? elementOf(src) : null;

/* ---------- Particles ---------- */
// z is height above the floor (drawn upward), so splashes arc and fall back down.
let VFX_P=[], VFX_FX=[];
function vfxEmit(kind,x,y,o={}){
  if (VFX_P.length>700) VFX_P.splice(0,VFX_P.length-650);
  VFX_P.push(Object.assign({kind,x,y,z:0,vx:0,vy:0,vz:0,g:0,life:0.6,max:0.6,size:4,rot:rand(PI2),vr:rand(-8,8),c:'#ffffff'},o,{max:o.life||0.6}));
}
function vfxBurstParticles(el,x,y,R,n=1){
  const E=ELEMENTS[el];
  for (let i=0;i<Math.round(14*n);i++){
    const a=rand(PI2), s=rand(80,260)*(R/80+0.4);
    if (el==='water'){ vfxEmit('drop',x+Math.cos(a)*R*0.3,y+Math.sin(a)*R*0.3,{vx:Math.cos(a)*s,vy:Math.sin(a)*s*0.6,vz:rand(160,420),g:900,life:rand(.5,.9),size:rand(3,6),c:E.mid}); if (i%3===0) vfxEmit('shard',x,y,{vx:Math.cos(a)*s*0.8,vy:Math.sin(a)*s*0.5,vz:rand(120,300),g:800,life:rand(.5,.8),size:rand(5,9),c:ELEMENTS.ice.mid}); }
    else if (el==='fire'){ vfxEmit('ember',x+Math.cos(a)*R*0.5,y+Math.sin(a)*R*0.5,{vx:Math.cos(a)*s*0.6,vy:Math.sin(a)*s*0.4,vz:rand(40,200),g:-60,life:rand(.4,.9),size:rand(2,4),c:i%2?E.mid:E.core}); if (i%3===0) vfxEmit('smoke',x+Math.cos(a)*R*0.4,y+Math.sin(a)*R*0.4,{vz:rand(30,70),life:rand(.7,1.1),size:rand(10,18)}); }
    else if (el==='acid'){ vfxEmit('drop',x,y,{vx:Math.cos(a)*s*0.7,vy:Math.sin(a)*s*0.45,vz:rand(120,320),g:900,life:rand(.4,.8),size:rand(3,6),c:E.mid}); }
    else if (el==='stone'){ vfxEmit('chunk',x+Math.cos(a)*R*0.4,y+Math.sin(a)*R*0.4,{vx:Math.cos(a)*s*0.7,vy:Math.sin(a)*s*0.45,vz:rand(150,360),g:1000,life:rand(.5,.9),size:rand(4,9),c:E.mid}); if (i%3===0) vfxEmit('smoke',x+Math.cos(a)*R*0.6,y+Math.sin(a)*R*0.6,{vz:rand(10,40),life:rand(.6,1),size:rand(12,20),c:'rgba(120,110,140,'}); }
    else if (el==='glass'){ vfxEmit('shard',x,y,{vx:Math.cos(a)*s,vy:Math.sin(a)*s*0.6,vz:rand(60,240),g:700,life:rand(.4,.8),size:rand(5,10),c:E.mid}); }
    else if (el==='sound'){ if (i<3) vfxEmit('ring',x,y,{life:.45+i*.12,size:R*(0.4+i*0.25),c:E.mid}); }
    else if (el==='redact'){ if (i%2===0) vfxEmit('bar',x+rand(-R,R),y+rand(-R*0.6,R*0.6),{vz:rand(10,60),life:rand(.3,.6),size:rand(14,34),c:E.mid}); }
  }
}
function vfxUpdate(dt){
  for (const q of VFX_P){ q.life-=dt; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vz-=q.g*dt; q.z+=q.vz*dt; q.rot+=q.vr*dt;
    if (q.z<0 && q.g>0){ q.z=0; q.vz*=-0.25; q.vx*=0.5; q.vy*=0.5; if (q.kind==='drop' && Math.random()<0.5) q.life=Math.min(q.life,0.12); }
    q.vx*=Math.pow(0.4,dt); q.vy*=Math.pow(0.4,dt); }
  VFX_P=VFX_P.filter(q=>q.life>0);
  for (const f of VFX_FX) f.t+=dt; VFX_FX=VFX_FX.filter(f=>f.t<f.dur);
  // Continuous emitters: live jets spray at the tip, rushes leave a wake, floor hazards bubble and smoulder.
  for (const e of (typeof enemies!=='undefined'?enemies:[])){
    const a=e.atk; if (!e.isBoss || !a || !a.step || e.bstate!=='ACTIVE') continue;
    const s=a.step, el=EL(s.src);
    if (s.prim==='jet' && el){ const L=a.beamLen||s.length*U, ang=a.beamAng||a.aim, tx=a.origin.x+Math.cos(ang)*L, ty=a.origin.y+Math.sin(ang)*L;
      for (let i=0;i<3;i++){ const sa=ang+Math.PI+rand(-1.2,1.2); vfxEmit('drop',tx,ty,{vx:Math.cos(sa)*rand(60,220),vy:Math.sin(sa)*rand(40,160),vz:rand(80,260),g:900,life:rand(.35,.6),size:rand(3,5),c:ELEMENTS.water.mid}); }
      vfxEmit('foam',tx+rand(-10,10),ty+rand(-10,10),{life:.35,size:rand(6,12)});
      const d=rand(30,L); vfxEmit('drop',a.origin.x+Math.cos(ang)*d,a.origin.y+Math.sin(ang)*d,{vx:Math.cos(ang+PI2/4*(Math.random()<.5?1:-1))*rand(40,120),vy:Math.sin(ang+PI2/4)*rand(20,60),vz:rand(60,160),g:900,life:.4,size:3,c:ELEMENTS.water.core}); }
    if (s.prim==='charge' && el && Math.random()<0.8){
      if (el==='fire'){ vfxEmit('ember',e.x+rand(-e.r,e.r),e.y+rand(-e.r*0.5,e.r*0.5),{vz:rand(30,120),g:-80,life:rand(.4,.7),size:rand(2,4),c:ELEMENTS.fire.mid}); vfxEmit('smoke',e.x,e.y,{vz:30,life:.8,size:rand(14,22)}); }
      else if (el==='glass') vfxEmit('shard',e.x+rand(-e.r,e.r),e.y,{vx:rand(-60,60),vy:rand(-40,40),vz:rand(40,120),g:600,life:.5,size:rand(4,8),c:ELEMENTS.glass.mid});
      else if (el==='water') vfxEmit('drop',e.x,e.y,{vx:rand(-90,90),vy:rand(-60,60),vz:rand(80,200),g:900,life:.5,size:4,c:ELEMENTS.water.mid});
    }
  }
  for (const h of (typeof bossHazards!=='undefined'?bossHazards:[])){
    if (h.src!=='verd_acid' && h.src!=='kiln_heat') continue;
    if (Math.random()>dt*14) continue;
    let x,y; for (let k=0;k<6;k++){ const r=Math.sqrt(Math.random())*h.radius, an=h.shape==='sector'?h.aim+rand(-h.arc/2,h.arc/2):rand(PI2); x=h.x+Math.cos(an)*r; y=h.y+Math.sin(an)*r; break; }
    if (h.src==='verd_acid') vfxEmit('bubble',x,y,{life:rand(.4,.8),size:rand(3,7),c:ELEMENTS.acid.mid});
    else vfxEmit('ember',x,y,{vz:rand(20,90),g:-40,life:rand(.5,.9),size:rand(2,3),c:ELEMENTS.fire.mid});
  }
}
// Ground effects (splashes, scorch, swipes) draw under the characters; particles draw over them.
function vfxDrawGround(){ for (const f of VFX_FX) drawFxEffect(f); }
function vfxDraw(){
  for (const q of VFX_P){
    const k=clamp(q.life/q.max,0,1), x=q.x, y=q.y-q.z;
    ctx.save(); ctx.globalAlpha=Math.min(1,k*1.6);
    if (q.kind==='drop'){
      const sp=Math.hypot(q.vx,q.vy-q.vz)||1, ang=Math.atan2(q.vy-q.vz,q.vx);
      ctx.translate(x,y); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0,0,q.size*Math.min(2.2,1+sp/300),q.size*0.75,0,0,PI2);
      ctx.fillStyle=q.c; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(q.size*0.3,-q.size*0.25,q.size*0.3,0,PI2); ctx.fill();
    } else if (q.kind==='foam'){ ctx.globalAlpha=k*0.9; ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(x,y,q.size*(0.5+0.5*k),0,PI2); ctx.fill(); }
    else if (q.kind==='shard'){
      ctx.translate(x,y); ctx.rotate(q.rot); ctx.beginPath(); ctx.moveTo(0,-q.size); ctx.lineTo(q.size*0.45,q.size*0.5); ctx.lineTo(-q.size*0.4,q.size*0.35); ctx.closePath();
      ctx.fillStyle=q.c; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,-q.size*0.7); ctx.lineTo(0,q.size*0.3); ctx.stroke();
    } else if (q.kind==='ember'){ ctx.shadowColor=q.c; ctx.shadowBlur=8; ctx.fillStyle=q.c; ctx.beginPath(); ctx.arc(x,y,q.size*(0.6+0.4*k),0,PI2); ctx.fill(); }
    else if (q.kind==='smoke'){ ctx.globalAlpha=k*0.35; ctx.fillStyle=(q.c||'rgba(30,24,28,')+'1)'; ctx.beginPath(); ctx.arc(x,y,q.size*(1.6-k*0.6),0,PI2); ctx.fill(); }
    else if (q.kind==='chunk'){
      ctx.translate(x,y); ctx.rotate(q.rot); ctx.beginPath(); for (let i=0;i<5;i++){ const a=i/5*PI2, r=q.size*(i%2?0.7:1); i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath();
      ctx.fillStyle='#4a4558'; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.stroke(); ctx.strokeStyle=q.c; ctx.globalAlpha*=0.6; ctx.lineWidth=1; ctx.stroke();
    } else if (q.kind==='ring'){ ctx.globalAlpha=k*0.9; ctx.strokeStyle=q.c; ctx.shadowColor=q.c; ctx.shadowBlur=12; ctx.lineWidth=2+3*k; ctx.beginPath(); ctx.ellipse(x,y,q.size*(1.9-k),q.size*(1.9-k)*0.85,0,0,PI2); ctx.stroke(); }
    else if (q.kind==='bar'){ ctx.fillStyle='#0a0607'; ctx.fillRect(x-q.size/2,y-4,q.size,8); ctx.fillStyle=q.c; ctx.fillRect(x-q.size/2,y+3,q.size,2); }
    else if (q.kind==='bubble'){ ctx.globalAlpha=Math.sin(k*Math.PI)*0.9; ctx.strokeStyle=q.c; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,q.size*(1.3-k*0.5),0,PI2); ctx.stroke(); ctx.fillStyle='rgba(244,255,184,.5)'; ctx.beginPath(); ctx.arc(x-q.size*0.3,y-q.size*0.3,q.size*0.25,0,PI2); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------- Timed effects (bursts, swipes, geysers) ---------- */
function drawFxEffect(f){
  const E=ELEMENTS[f.el], k=f.t/f.dur, inv=1-k;
  ctx.save();
  if (f.type==='burst'){
    const R=f.R*(0.55+0.45*Math.pow(k,0.4));
    if (f.el==='water'){
      // splash ring on the floor, then a geyser column with a foam crown
      ctx.globalAlpha=inv*0.7; ctx.fillStyle=E.deep; ctx.beginPath(); ctx.ellipse(f.x,f.y,R,R*0.8,0,0,PI2); ctx.fill();
      ctx.globalAlpha=inv; ctx.strokeStyle='#ffffff'; ctx.lineWidth=6*inv+2; ctx.beginPath(); ctx.ellipse(f.x,f.y,R*1.05,R*0.84,0,0,PI2); ctx.stroke();
      const H=f.R*1.6*Math.sin(Math.min(1,k*1.6)*Math.PI*0.9), w=f.R*0.45*(1-k*0.5);
      if (H>2){ const g=ctx.createLinearGradient(f.x-w,0,f.x+w,0); g.addColorStop(0,E.deep); g.addColorStop(0.35,E.mid); g.addColorStop(0.5,E.core); g.addColorStop(0.65,E.mid); g.addColorStop(1,E.deep);
        ctx.globalAlpha=Math.min(1,inv*1.5); ctx.beginPath(); ctx.moveTo(f.x-w,f.y);
        for (let i=0;i<=8;i++){ const yy=f.y-H*i/8; ctx.lineTo(f.x-w*(1-i/14)+Math.sin(i*1.7+f.t*30)*4,yy); }
        for (let i=8;i>=0;i--){ const yy=f.y-H*i/8; ctx.lineTo(f.x+w*(1-i/14)+Math.sin(i*1.3+f.t*28)*4,yy); }
        ctx.closePath(); ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
        ctx.fillStyle='#ffffff'; for (let i=0;i<6;i++){ const a=i/6*PI2+f.t*4; ctx.beginPath(); ctx.arc(f.x+Math.cos(a)*w*0.9,f.y-H+Math.sin(a)*w*0.35,w*0.32,0,PI2); ctx.fill(); } }
    } else if (f.el==='fire'){
      const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,R); g.addColorStop(0,E.core); g.addColorStop(0.45,E.mid); g.addColorStop(1,'rgba(184,54,12,0)');
      ctx.globalAlpha=inv; ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(f.x,f.y,R,R*0.85,0,0,PI2); ctx.fill();
      ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.globalAlpha=inv*0.8; ctx.beginPath(); for (let i=0;i<=24;i++){ const a=i/24*PI2, r=R*(0.85+0.15*Math.sin(i*3+f.t*40)); ctx.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*0.85); } ctx.closePath(); ctx.stroke();
      ctx.globalAlpha=inv*0.5; ctx.fillStyle='#2a1208'; ctx.beginPath(); ctx.ellipse(f.x,f.y,f.R*0.7,f.R*0.55,0,0,PI2); ctx.fill(); // scorch
      // flame tongues licking up from the burst
      const tongues=14, H=f.R*0.75*Math.sin(Math.min(1,k*2.2)*Math.PI*0.85);
      for (let i=0;i<tongues;i++){ const a=i/tongues*PI2+f.seed, bx=f.x+Math.cos(a)*R*0.75, by=f.y+Math.sin(a)*R*0.62, h=H*(0.55+0.45*Math.sin(i*2.3+f.t*30)), w=R*0.16;
        if (h<3) continue; const fg=ctx.createLinearGradient(0,by,0,by-h); fg.addColorStop(0,E.mid); fg.addColorStop(0.6,E.core); fg.addColorStop(1,'rgba(255,242,184,0)');
        ctx.globalAlpha=inv; ctx.fillStyle=fg; ctx.beginPath(); ctx.moveTo(bx-w,by); ctx.quadraticCurveTo(bx-w*0.6,by-h*0.6,bx+Math.sin(f.t*20+i)*w*0.5,by-h); ctx.quadraticCurveTo(bx+w*0.6,by-h*0.6,bx+w,by); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.globalAlpha=inv*0.7; ctx.stroke(); }
    } else if (f.el==='acid'){
      ctx.globalAlpha=inv*0.8; ctx.fillStyle=E.deep;
      for (let i=0;i<9;i++){ const a=i/9*PI2+f.seed, r=R*(0.55+0.35*((i*37)%10)/10); ctx.beginPath(); ctx.ellipse(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*0.8,R*0.22,R*0.16,a,0,PI2); ctx.fill(); }
      ctx.fillStyle=E.mid; ctx.beginPath(); ctx.ellipse(f.x,f.y,R*0.6,R*0.48,0,0,PI2); ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
      ctx.fillStyle=E.core; ctx.globalAlpha=inv*0.7; ctx.beginPath(); ctx.ellipse(f.x-R*0.15,f.y-R*0.12,R*0.18,R*0.1,0,0,PI2); ctx.fill();
    } else if (f.el==='stone'){
      ctx.globalAlpha=inv*0.6; ctx.fillStyle='#2c2638'; ctx.beginPath(); ctx.ellipse(f.x,f.y,R,R*0.8,0,0,PI2); ctx.fill();
      ctx.globalAlpha=inv; ctx.strokeStyle=E.glow; ctx.shadowColor=E.glow; ctx.shadowBlur=14; ctx.lineWidth=3;
      for (let i=0;i<7;i++){ const a=i/7*PI2+f.seed; ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.lineTo(f.x+Math.cos(a)*R*0.5,f.y+Math.sin(a)*R*0.4+6); ctx.lineTo(f.x+Math.cos(a+0.2)*R,f.y+Math.sin(a+0.2)*R*0.8); ctx.stroke(); }
    } else if (f.el==='glass'){
      ctx.globalAlpha=inv; ctx.translate(f.x,f.y);
      for (let i=0;i<8;i++){ const a=i/8*PI2+f.seed, r=R*(0.6+0.4*(i%2)); ctx.beginPath(); ctx.moveTo(Math.cos(a-0.12)*R*0.2,Math.sin(a-0.12)*R*0.2); ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*0.8); ctx.lineTo(Math.cos(a+0.12)*R*0.2,Math.sin(a+0.12)*R*0.2); ctx.closePath();
        ctx.fillStyle=i%2?E.mid:E.core; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5; ctx.stroke(); }
    } else if (f.el==='sound'){
      ctx.strokeStyle=E.mid; ctx.shadowColor=E.glow; ctx.shadowBlur=14;
      for (let i=0;i<3;i++){ const kk=clamp(k*1.3-i*0.15,0,1); if (kk<=0) continue; ctx.globalAlpha=(1-kk)*0.9; ctx.lineWidth=5*(1-kk)+1; ctx.beginPath(); ctx.ellipse(f.x,f.y,f.R*(0.3+kk),f.R*(0.3+kk)*0.85,0,0,PI2); ctx.stroke(); }
    } else if (f.el==='redact'){
      ctx.globalAlpha=inv; for (let i=0;i<6;i++){ const yy=f.y-R*0.6+i*R*0.24, ww=R*(1.6-((i*0.37+f.seed)%1)*0.7)*(0.6+0.4*Math.min(1,k*3)); ctx.fillStyle='#0a0607'; ctx.fillRect(f.x-ww/2+(i%2?6:-6),yy,ww,R*0.16); ctx.fillStyle=E.mid; ctx.fillRect(f.x-ww/2+(i%2?6:-6),yy+R*0.16-2,ww,2); }
    }
  } else if (f.type==='band'){
    const r0=f.r0, r1=f.r0+(f.r1-f.r0)*Math.min(1,k*2.5), n=f.gaps||1, g=f.gap||0;
    for (let i=0;i<n;i++){ const a0=f.aim+i*PI2/n+g, a1=f.aim+(i+1)*PI2/n-g;
      ctx.beginPath(); ctx.arc(f.x,f.y,r1,a0,a1); ctx.arc(f.x,f.y,r0,a1,a0,true); ctx.closePath();
      ctx.globalAlpha=inv*0.85; ctx.fillStyle=f.el==='redact'?'#0a0607':f.el==='stone'?'#2c2638':E.mid; ctx.fill();
      ctx.globalAlpha=inv; ctx.strokeStyle=E.glow; ctx.shadowColor=E.glow; ctx.shadowBlur=16; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(f.x,f.y,r1,a0,a1); ctx.stroke(); ctx.shadowBlur=0;
      if (f.el==='stone'){ ctx.strokeStyle=E.glow; ctx.lineWidth=2; for (let a=a0;a<a1;a+=0.25){ ctx.beginPath(); ctx.moveTo(f.x+Math.cos(a)*r0,f.y+Math.sin(a)*r0); ctx.lineTo(f.x+Math.cos(a+0.08)*(r0+r1)/2,f.y+Math.sin(a+0.08)*(r0+r1)/2); ctx.lineTo(f.x+Math.cos(a)*r1,f.y+Math.sin(a)*r1); ctx.stroke(); } }
      if (f.el==='redact'){ ctx.fillStyle=E.mid; for (let a=a0;a<a1;a+=0.18){ const rr=r0+(r1-r0)*(((a*97)%1+1)%1); ctx.fillRect(f.x+Math.cos(a)*rr-8,f.y+Math.sin(a)*rr-2,16,3); } }
    }
  } else if (f.type==='swipe'){
    drawSwipe(f.x,f.y,f.aim,f.half,f.R,Math.min(1,k*2.2),inv,f.el);
  }
  ctx.restore();
}
// A melee sweep: a crescent that travels across the attack's arc, themed per element.
function drawSwipe(x,y,aim,half,R,prog,alpha,el){
  const E=ELEMENTS[el], a0=aim-half, a1=a0+half*2*prog, r0=R*0.35;
  ctx.save(); ctx.globalAlpha=alpha;
  if (el==='acid'){
    // A thorned vine lashes across the arc.
    ctx.lineCap='round'; ctx.strokeStyle=COL.ink; ctx.lineWidth=24; ctx.beginPath(); ctx.arc(x,y,R*0.78,a0,a1); ctx.stroke();
    ctx.strokeStyle='#3f7a16'; ctx.lineWidth=17; ctx.stroke(); ctx.strokeStyle=E.mid; ctx.lineWidth=6; ctx.stroke();
    ctx.fillStyle=E.core; ctx.strokeStyle=COL.ink; ctx.lineWidth=1.5;
    for (let a=a0+0.12;a<a1;a+=0.16){ const px=x+Math.cos(a)*R*0.78, py=y+Math.sin(a)*R*0.78, o=(Math.round(a*10)%2)?1:-1;
      ctx.beginPath(); ctx.moveTo(px+Math.cos(a)*o*4,py+Math.sin(a)*o*4); ctx.lineTo(px+Math.cos(a)*o*24,py+Math.sin(a)*o*24); ctx.lineTo(px+Math.cos(a+0.06)*o*4,py+Math.sin(a+0.06)*o*4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore(); return;
  }
  const g=ctx.createRadialGradient(x,y,r0,x,y,R); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.55,E.mid); g.addColorStop(0.85,E.core); g.addColorStop(1,E.mid);
  ctx.beginPath(); ctx.arc(x,y,R,a0,a1); ctx.arc(x,y,r0,a1,a0,true); ctx.closePath();
  ctx.shadowColor=E.glow; ctx.shadowBlur=18; ctx.fillStyle=g; ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
  // speed lines off the leading edge
  ctx.strokeStyle=E.core; ctx.lineWidth=2;
  for (let i=0;i<5;i++){ const a=a1-i*0.09, r1=R*(0.6+i*0.08); ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1); ctx.lineTo(x+Math.cos(a)*(R+10+i*4),y+Math.sin(a)*(R+10+i*4)); ctx.stroke(); }
  if (el==='water'){ ctx.fillStyle='#ffffff'; for (let i=0;i<8;i++){ const a=a0+(a1-a0)*i/8; ctx.beginPath(); ctx.arc(x+Math.cos(a)*R*0.95,y+Math.sin(a)*R*0.95,3,0,PI2); ctx.fill(); } }
  ctx.restore();
}
// A straight beam or stream from (x,y) along ang, themed per element.
function drawStream(x,y,ang,L,w,el,live=1){
  const E=ELEMENTS[el], t=time;
  ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.globalAlpha=live;
  const edge=(side,ph,amp)=>{ for (let px=0;px<=L;px+=14){ const taper=Math.min(1,px/40+0.35); ctx.lineTo(px, side*(w/2)*taper*(1+amp*Math.sin(px*0.06-t*24+ph))); } };
  if (el==='water'||el==='fire'){
    const g=ctx.createLinearGradient(0,-w/2,0,w/2); g.addColorStop(0,E.deep); g.addColorStop(0.3,E.mid); g.addColorStop(0.5,E.core); g.addColorStop(0.7,E.mid); g.addColorStop(1,E.deep);
    ctx.beginPath(); ctx.moveTo(0,0); edge(-1,0,el==='fire'?0.22:0.12); ctx.lineTo(L,0); for (let px=L;px>=0;px-=14){ const taper=Math.min(1,px/40+0.35); ctx.lineTo(px,(w/2)*taper*(1+(el==='fire'?0.22:0.12)*Math.sin(px*0.07-t*22+2))); } ctx.closePath();
    ctx.shadowColor=E.glow; ctx.shadowBlur=20; ctx.fillStyle=g; ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle=COL.ink; ctx.lineWidth=3; ctx.stroke();
    // streaks rushing along the stream
    ctx.strokeStyle=E.core; ctx.lineWidth=3; ctx.setLineDash([26,22]); ctx.lineDashOffset=-t*900;
    for (const yy of [-w*0.18,w*0.12]){ ctx.beginPath(); ctx.moveTo(10,yy); ctx.lineTo(L,yy); ctx.stroke(); }
    ctx.setLineDash([]);
    if (el==='water'){ ctx.fillStyle='#ffffff'; for (let i=0;i<L/26;i++){ const px=(i*53+t*700)%L, py=Math.sin(i*7.3)*w*0.32; ctx.beginPath(); ctx.arc(px,py,2+(i%3),0,PI2); ctx.fill(); } }
  } else if (el==='glass'){
    ctx.shadowColor=E.glow; ctx.shadowBlur=24; ctx.fillStyle=E.mid; ctx.globalAlpha=live*0.55; ctx.fillRect(0,-w/2,L,w);
    ctx.globalAlpha=live; ctx.fillStyle=E.core; ctx.fillRect(0,-w*0.17,L,w*0.34); ctx.shadowBlur=0;
    ctx.globalAlpha=live*0.8; ctx.fillStyle='#7ff5ff'; ctx.fillRect(0,-w*0.17-3,L,2); ctx.fillStyle='#ffd447'; ctx.fillRect(0,w*0.17+1,L,2); // chromatic fringe
    ctx.globalAlpha=live; ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.strokeRect(0,-w/2,L,w);
    ctx.fillStyle='#ffffff'; for (let i=0;i<L/40;i++){ const px=(i*97+t*300)%L, py=Math.sin(i*5.1+t*6)*w*0.4, s=3+2*Math.sin(t*20+i); ctx.beginPath(); ctx.moveTo(px-s,py); ctx.lineTo(px,py-s*0.4); ctx.lineTo(px+s,py); ctx.lineTo(px,py+s*0.4); ctx.closePath(); ctx.fill(); }
  } else if (el==='redact'){
    ctx.fillStyle='#0a0607'; ctx.fillRect(0,-w/2,L,w);
    const seed=Math.floor(t*14);
    for (let px=0;px<L;px+=34){ const r=((px*13+seed*71)%100)/100; if (r<0.3){ ctx.fillStyle='#0a0607'; ctx.fillRect(px,-w/2+(r-0.15)*w,26,w); } }
    ctx.fillStyle=E.mid; ctx.shadowColor=E.glow; ctx.shadowBlur=12; ctx.fillRect(0,-w/2-3,L,3); ctx.fillRect(0,w/2,L,3); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(224,40,60,.55)'; for (let px=(t*500)%60;px<L;px+=60) ctx.fillRect(px,-2,22,4);
  } else if (el==='sound'){
    ctx.strokeStyle=E.mid; ctx.shadowColor=E.glow; ctx.shadowBlur=12; ctx.lineWidth=4;
    for (let px=(t*400)%40;px<L;px+=40){ ctx.beginPath(); ctx.arc(px-w*0.6,0,w*0.7,-0.6,0.6); ctx.stroke(); }
  } else {
    ctx.fillStyle=E.mid; ctx.fillRect(0,-w/2,L,w);
  }
  ctx.restore();
}

/* ---------- Hooks used by the boss framework ---------- */
// Which primitives this layer draws when active (their flat telegraph fill is skipped).
const VFX_ACTIVE_PRIMS = new Set(['jet','beams','refract','disks','selfDisk','sector','step','annulus']);
const vfxOwnsActive = s => !!(s && VFX_ACTIVE_PRIMS.has(s.prim) && EL(s.src));
// Called the moment an attack goes live.
function vfxOnActivate(e,a){
  const s=a.step, el=EL(s.src); if (!el) return;
  sfx(s.prim==='jet'||s.prim==='beams'?(el==='water'?'water':'beam'):s.prim==='iceWall'?'ice':el,{vol:0.85,gap:80});
  const add=(o)=>VFX_FX.push(Object.assign({t:0,el,seed:rand(PI2)},o));
  if (s.prim==='disks'){ for (const sp of diskSpots(a)){ add({type:'burst',x:sp.x,y:sp.y,R:s.radius*U,dur:el==='water'?0.75:0.55}); vfxBurstParticles(el,sp.x,sp.y,s.radius*U); } }
  else if (s.prim==='selfDisk'){ add({type:'burst',x:a.origin.x,y:a.origin.y,R:s.radius*U,dur:0.6}); vfxBurstParticles(el,a.origin.x,a.origin.y,s.radius*U,1.6); }
  else if (s.prim==='step' && a.dest){ add({type:'burst',x:a.dest.x,y:a.dest.y,R:(s.radius||2)*U,dur:0.5}); vfxBurstParticles(el,a.dest.x,a.dest.y,(s.radius||2)*U); }
  else if (s.prim==='sector'){ const ap=sectorApex(a); add({type:'swipe',x:ap.x,y:ap.y,aim:a.aim,half:s.arc*DEG/2,R:s.radius*U,dur:0.32});
    for (let i=0;i<8;i++){ const an=a.aim+rand(-s.arc*DEG/2,s.arc*DEG/2), r=s.radius*U*rand(0.6,1); vfxBurstParticles(el,ap.x+Math.cos(an)*r,ap.y+Math.sin(an)*r,20,0.12); } }
  else if (s.prim==='annulus'){ const n=s.gaps||1; add({type:'band',x:a.origin.x,y:a.origin.y,r0:s.rIn*U,r1:s.rOut*U,aim:a.aim,gaps:n,gap:s.gap*DEG/2,dur:0.5});
    for (let i=0;i<24;i++){ const an=a.aim+rand(PI2), r=rand(s.rIn*U,s.rOut*U); vfxBurstParticles(el,a.origin.x+Math.cos(an)*r,a.origin.y+Math.sin(an)*r,30,0.15); } }
  else if (s.prim==='lane'){ const x=a.origin.x+Math.cos(a.aim)*e.r, y=a.origin.y+Math.sin(a.aim)*e.r; vfxBurstParticles(el,x,y,30,0.5); }
}
// Drawn over the telegraph while an attack is live.
function vfxDrawActive(e,a,s){
  const el=EL(s.src); if (!el) return;
  if (s.prim==='jet'){ drawStream(a.origin.x,a.origin.y,a.beamAng||a.aim,a.beamLen||s.length*U,s.width*U,el); }
  else if (s.prim==='beams'){ const live=clamp(1-a.activeT/(s.active||0.35)*0.6,0.3,1); for (const da of s.angles){ const ang=a.aim+da*DEG; drawStream(a.origin.x,a.origin.y,ang,beamReach(a.origin.x,a.origin.y,ang,s.length*U),s.width*U,el,live); } }
  else if (s.prim==='ring'){
    const E=ELEMENTS[el], rot=(s.rotate||0)*DEG, base=a.gapA+rot*a.activeT, g=s.gap*DEG/2, th=s.thick*U;
    ctx.save(); ctx.strokeStyle=E.core; ctx.shadowColor=E.glow; ctx.shadowBlur=14;
    for (const rg of (a.rings||[])){ if (rg.R>=s.rMax*U) continue;
      for (let i=0;i<s.gaps;i++){ const a0=base+i*PI2/s.gaps+g, a1=base+(i+1)*PI2/s.gaps-g;
        for (let j=-1;j<=1;j++){ ctx.lineWidth=j?2:4; ctx.globalAlpha=j?0.7:1; ctx.beginPath();
          for (let a2=a0;a2<=a1;a2+=0.05){ const rr=rg.R+j*th*0.32+Math.sin(a2*18+time*40+j)*3; a2===a0?ctx.moveTo(a.origin.x+Math.cos(a2)*rr,a.origin.y+Math.sin(a2)*rr):ctx.lineTo(a.origin.x+Math.cos(a2)*rr,a.origin.y+Math.sin(a2)*rr); }
          ctx.stroke(); } } }
    ctx.restore();
  }
  else if (s.prim==='refract' && a.firing){ const emit=[{x:e.x,y:e.y}].concat((a.decoys||[]).filter(d=>!d.dead)); for (const em of emit) drawStream(em.x,em.y,a.aim,s.length*U,s.width*U,el); }
}
// Themed projectiles. Returns true when drawn.
function vfxBullet(b){
  const el=EL(b.src); if (!el || b.kind==='rock' || b.kind==='rubble' || b.friendly) return false;
  const E=ELEMENTS[el], ang=Math.atan2(b.vy,b.vx);
  ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(ang);
  if (el==='fire'){
    const g=ctx.createLinearGradient(-b.r*4,0,b.r,0); g.addColorStop(0,'rgba(184,54,12,0)'); g.addColorStop(0.6,E.mid); g.addColorStop(1,E.core);
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(b.r*1.1,0); ctx.quadraticCurveTo(0,-b.r*1.2,-b.r*4,0); ctx.quadraticCurveTo(0,b.r*1.2,b.r*1.1,0); ctx.fill();
    ctx.shadowColor=E.glow; ctx.shadowBlur=14; ctx.fillStyle=E.core; ctx.beginPath(); ctx.arc(0,0,b.r*0.8,0,PI2); ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle=COL.ink; ctx.lineWidth=2; ctx.stroke();
    if (Math.random()<0.3) vfxEmit('ember',b.x,b.y,{vz:rand(20,60),g:-40,life:.35,size:2,c:E.mid});
  } else if (el==='acid'){
    // a thorn needle
    ctx.beginPath(); ctx.moveTo(b.r*2.2,0); ctx.lineTo(-b.r*1.4,-b.r*0.7); ctx.lineTo(-b.r,0); ctx.lineTo(-b.r*1.4,b.r*0.7); ctx.closePath();
    ctx.fillStyle='#4f8a1e'; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2; ctx.stroke(); ctx.strokeStyle=E.mid; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(b.r*1.8,0); ctx.lineTo(-b.r,0); ctx.stroke();
  } else if (el==='glass'){
    ctx.beginPath(); ctx.moveTo(b.r*2,0); ctx.lineTo(0,-b.r*0.8); ctx.lineTo(-b.r*1.6,0); ctx.lineTo(0,b.r*0.8); ctx.closePath();
    ctx.shadowColor=E.glow; ctx.shadowBlur=12; ctx.fillStyle=E.mid; ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle=COL.ink; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#ffffff'; ctx.fillRect(-b.r*0.4,-1,b.r*1.6,2);
  } else if (el==='water'){
    ctx.beginPath(); ctx.ellipse(0,0,b.r*1.6,b.r,0,0,PI2); ctx.fillStyle=E.mid; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(b.r*0.5,-b.r*0.3,b.r*0.35,0,PI2); ctx.fill();
  } else if (el==='sound'){
    ctx.strokeStyle=E.mid; ctx.shadowColor=E.glow; ctx.shadowBlur=12; ctx.lineWidth=3; for (let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-i*6,0,b.r*(1+i*0.4),-0.9,0.9); ctx.stroke(); }
  } else if (el==='redact'){
    ctx.fillStyle='#0a0607'; ctx.fillRect(-b.r*1.5,-b.r*0.6,b.r*3,b.r*1.2); ctx.fillStyle=E.mid; ctx.fillRect(-b.r*1.5,b.r*0.6-2,b.r*3,2);
  } else { ctx.restore(); return false; }
  ctx.restore(); return true;
}
// Ice walls: a ridge of crystal spikes rather than a block. Spikes are placed along the wall's line but
// always stand upright on screen (the camera looks down at a steep angle, so "up" is up the screen).
function drawIceCrystals(w){
  const g=w.seg, len=3*U, th=0.7*U, age=run.time-w.born, fade=Math.min(1,(w.dur-age)/0.4), grow=Math.min(1,age/0.18), hurt=1-w.hp/w.maxHp, E=ELEMENTS.ice;
  const ca=Math.cos(g.ang), sa=Math.sin(g.ang);
  ctx.save(); ctx.globalAlpha=Math.max(0,fade);
  ctx.save(); ctx.translate(g.x,g.y); ctx.rotate(g.ang); ctx.fillStyle='rgba(207,244,255,.28)'; ctx.beginPath(); ctx.ellipse(0,0,len*0.62,th*0.8,0,0,PI2); ctx.fill(); ctx.restore(); // frost
  const n=7, seed=Math.abs(Math.round(g.x*7+g.y*3)), spikes=[];
  for (let i=0;i<n;i++){ const r=((seed*(i+3)*37)%100)/100, along=-len/2+len*(i+0.5)/n+(r-0.5)*10, across=(r-0.5)*th*0.5;
    spikes.push({x:g.x+ca*along-sa*across, y:g.y+sa*along+ca*across, r}); }
  spikes.sort((a,b)=>a.y-b.y);
  for (const k of spikes){
    const hw=11+k.r*8, hgt=(30+k.r*34)*grow, lean=(k.r-0.5)*0.4, bx=k.x, by=k.y+6;
    ctx.beginPath(); ctx.moveTo(bx-hw,by); ctx.lineTo(bx-hw*0.55+lean*hgt*0.3,by-hgt*0.68); ctx.lineTo(bx+lean*hgt,by-hgt); ctx.lineTo(bx+hw*0.6+lean*hgt*0.3,by-hgt*0.62); ctx.lineTo(bx+hw,by); ctx.closePath();
    const gr=ctx.createLinearGradient(bx-hw,0,bx+hw,0); gr.addColorStop(0,E.deep); gr.addColorStop(0.45,E.mid); gr.addColorStop(0.55,E.core); gr.addColorStop(1,E.mid);
    ctx.fillStyle=w.flashT>0?'#ffffff':gr; ctx.fill(); ctx.strokeStyle=COL.ink; ctx.lineWidth=2.5; ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(bx+lean*hgt,by-hgt); ctx.lineTo(bx,by-3); ctx.stroke();
    if (hurt>0.3){ ctx.strokeStyle='rgba(4,7,14,.75)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(bx-hw*0.4,by-hgt*0.5); ctx.lineTo(bx+2,by-hgt*0.3); ctx.lineTo(bx-3,by-6); ctx.stroke(); }
  }
  ctx.restore();
  if (Math.random()<0.05) vfxEmit('foam',g.x+ca*rand(-len/2,len/2),g.y+sa*rand(-len/2,len/2),{life:.5,size:3});
}
