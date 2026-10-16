// Volt: Voice effects. Each character's lines run through a small Web Audio chain that suits them: Verdigris
// is pitched down with a monstrous sub-voice and a ghostly reverb, Gravemark is a deep stone cavern, the
// Redactor carries a sinister undertone (and sounds like a TV broadcast in the cold open), Undertow is inside
// a diving helmet, Glasswake is a chorus of reflections, and heroes calling in during a run sound like radio.
// The pitch shifter is a small AudioWorklet (two crossfading delay taps), so pitch changes without slowing
// the line down. Without Web Audio (file://), lines play dry.
'use strict';

const VOICE_FX = {
  verdigris: { pitch:0.86, layers:[{pitch:0.55, gain:0.7, lp:1600}, {pitch:1.5, gain:0.12, delay:0.03, hp:2500}], reverb:{t:3.4, wet:0.5}, lowshelf:{f:200, g:4} },
  gravemark: { pitch:0.74, rate:0.93, layers:[{pitch:0.5, gain:0.35, lp:900}], reverb:{t:2.8, wet:0.38}, lowshelf:{f:160, g:7} },
  redactor:  { pitch:0.96, layers:[{pitch:0.66, gain:0.3, lp:2200}], reverb:{t:1.3, wet:0.18} },
  undertow:  { comb:{d:0.011, fb:0.42}, peak:{f:950, q:1.3, g:5}, reverb:{t:0.7, wet:0.14} },
  kilnheart: { comb:{d:0.006, fb:0.28}, drive:0.18 },
  glasswake: { layers:[{pitch:1.04, gain:0.4, delay:0.028}, {pitch:0.96, gain:0.4, delay:0.05}], highshelf:{f:4500, g:4}, reverb:{t:1.5, wet:0.22} },
  bellwether:{ layers:[{pitch:1, gain:0.28, delay:0.02}], reverb:{t:2.2, wet:0.28} },
  echo:      { echo:{d:0.17, fb:0.28, wet:0.28}, reverb:{t:1.6, wet:0.18} },
};
const RADIO = { bp:[380,3100], drive:0.35, gain:1.3 };      // heroes on comms mid-run
const BROADCAST = { bp:[300,3400], drive:0.5, gain:1.25 };  // the Redactor's hijacked screens
const HERO_IDS = ['halo','bastion','echo','thorn','patch'];

const PITCH_WORKLET = `
class PitchShift extends AudioWorkletProcessor {
  static get parameterDescriptors(){ return [{ name:'ratio', defaultValue:1, minValue:0.25, maxValue:4 }]; }
  constructor(){ super(); this.size=16384; this.buf=new Float32Array(this.size); this.w=0; this.phase=0; this.win=1400; }
  read(d){ let p=this.w-d; while (p<0) p+=this.size; const i=Math.floor(p), f=p-i, a=this.buf[i%this.size], b=this.buf[(i+1)%this.size]; return a+(b-a)*f; }
  process(inputs, outputs, params){
    const inp=inputs[0][0], out=outputs[0][0]; if (!out) return true;
    const r=params.ratio[0], step=(1-r)/this.win;
    for (let n=0;n<out.length;n++){
      this.buf[this.w]=inp?inp[n]:0;
      this.phase+=step; if (this.phase>=1) this.phase-=1; if (this.phase<0) this.phase+=1;
      const q=(this.phase+0.5)%1, g1=1-Math.abs(2*this.phase-1), g2=1-Math.abs(2*q-1);
      out[n]=this.read(this.phase*this.win+2)*g1+this.read(q*this.win+2)*g2;
      this.w=(this.w+1)%this.size;
    }
    return true;
  }
}
registerProcessor('pitch-shift', PitchShift);`;
let pitchReady=false;
function voiceFxInit(ctx){
  if (!ctx || !ctx.audioWorklet) return;
  const url=URL.createObjectURL(new Blob([PITCH_WORKLET],{type:'application/javascript'}));
  ctx.audioWorklet.addModule(url).then(()=>{ pitchReady=true; }).catch(()=>{});
}
const IR_CACHE={};
function reverbIR(ctx,t){
  const key=t.toFixed(1); if (IR_CACHE[key]) return IR_CACHE[key];
  const len=Math.floor(ctx.sampleRate*t), b=ctx.createBuffer(2,len,ctx.sampleRate);
  for (let c=0;c<2;c++){ const d=b.getChannelData(c); for (let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3); }
  return IR_CACHE[key]=b;
}
function driveCurve(k){ const n=1024, c=new Float32Array(n); for (let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(x*(1+k*12))/Math.tanh(1+k*12); } return c; }
function pitchNode(ctx,ratio){
  if (!pitchReady || Math.abs(ratio-1)<0.005) return ctx.createGain();
  const n=new AudioWorkletNode(ctx,'pitch-shift',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]}); n.parameters.get('ratio').value=ratio; return n;
}
// Which effect a line gets right now.
function voicePreset(who){
  let p=VOICE_FX[who] ? {...VOICE_FX[who]} : {};
  if (who==='redactor' && state==='cutscene' && typeof cut!=='undefined' && cut && cut.scene==='roof') p={...p, radio:BROADCAST};
  const inRun = ['dialogue','intro','play','draft','map'].includes(state);
  if (HERO_IDS.includes(who) && inRun) p={...p, radio:RADIO};
  return p;
}
// Builds the chain for one line: src -> [pitch] -> dry + layers -> tone -> [comb/echo] -> [radio] -> out, plus reverb.
function voiceChain(ctx, src, who, dest){
  const p=voicePreset(who);
  if (p.rate) src.playbackRate.value=p.rate;
  const mix=ctx.createGain();
  const dry=pitchNode(ctx,p.pitch||1); src.connect(dry); dry.connect(mix);
  for (const L of (p.layers||[])){
    let n=pitchNode(ctx,L.pitch||1); src.connect(n);
    if (L.delay){ const d=ctx.createDelay(1); d.delayTime.value=L.delay; n.connect(d); n=d; }
    if (L.lp){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=L.lp; n.connect(f); n=f; }
    if (L.hp){ const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=L.hp; n.connect(f); n=f; }
    const g=ctx.createGain(); g.gain.value=L.gain; n.connect(g); g.connect(mix);
  }
  let node=mix;
  const filt=(type,f,gain,q)=>{ const b=ctx.createBiquadFilter(); b.type=type; b.frequency.value=f; if (gain!==undefined) b.gain.value=gain; if (q) b.Q.value=q; node.connect(b); node=b; };
  if (p.lowshelf) filt('lowshelf',p.lowshelf.f,p.lowshelf.g);
  if (p.highshelf) filt('highshelf',p.highshelf.f,p.highshelf.g);
  if (p.peak) filt('peaking',p.peak.f,p.peak.g,p.peak.q);
  if (p.comb){ // a short feedback delay: metal helmets and suits
    const d=ctx.createDelay(0.1), fb=ctx.createGain(), out=ctx.createGain(); d.delayTime.value=p.comb.d; fb.gain.value=p.comb.fb;
    node.connect(out); node.connect(d); d.connect(fb); fb.connect(d); d.connect(out); node=out;
  }
  if (p.echo){
    const d=ctx.createDelay(1), fb=ctx.createGain(), wet=ctx.createGain(), out=ctx.createGain(); d.delayTime.value=p.echo.d; fb.gain.value=p.echo.fb; wet.gain.value=p.echo.wet;
    node.connect(out); node.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(out); node=out;
  }
  if (p.drive){ const s=ctx.createWaveShaper(); s.curve=driveCurve(p.drive); node.connect(s); node=s; }
  if (p.radio){
    filt('highpass',p.radio.bp[0]); filt('lowpass',p.radio.bp[1]);
    const s=ctx.createWaveShaper(); s.curve=driveCurve(p.radio.drive); node.connect(s); node=s;
    const g=ctx.createGain(); g.gain.value=p.radio.gain; node.connect(g); node=g;
  }
  node.connect(dest);
  if (p.reverb){ const cv=ctx.createConvolver(), wet=ctx.createGain(); cv.buffer=reverbIR(ctx,p.reverb.t); wet.gain.value=p.reverb.wet; node.connect(cv); cv.connect(wet); wet.connect(dest); }
}
