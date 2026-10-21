// Volt: Canvas, math helpers, palette, tuning sliders and the save file.
'use strict';

const $ = s => document.querySelector(s);
const cv = $('#game'), ctx = cv.getContext('2d');
let renderRevision=0;
function invalidateRender(){renderRevision++;}
let W = 0, H = 0, DPR = 1;
function resize(){ DPR = Math.min(window.devicePixelRatio || 1, 3); W = innerWidth; H = innerHeight; cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR); }
addEventListener('resize', resize); resize();
function combatViewport(){
  const training=typeof tut!=='undefined'&&tut&&typeof inputMode!=='undefined'&&inputMode==='touch';
  if(!training)return {x:0,y:0,w:W,h:H,cx:W/2,cy:H/2};
  const panel=$('#tut'),top=Math.min(H*.38,panel.getBoundingClientRect().bottom+10),bottom=20;
  return {x:0,y:top,w:W,h:H-top-bottom,cx:W*.42,cy:top+(H-top-bottom)/2};
}

const PI2 = Math.PI*2;
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const rand = (a=1,b) => b===undefined ? Math.random()*a : a+Math.random()*(b-a);
const angDiff = (a,b) => { let d=a-b; while(d>Math.PI)d-=PI2; while(d<-Math.PI)d+=PI2; return d; };
const COL = { ink:'#04070e', night:'#080d18', volt:'#26bfff', spark:'#f4fbff', threat:'#ff5a45', amber:'#ffb647', rim:'#42516a', text:'#dde8f5', heal:'#55e6c1', boon:'#b56cff', slate:'#253247', edge:'#42516a' };
const KIND_COL = { rusher:COL.threat, needle:COL.amber, gravemark:COL.boon, kilnheart:'#ff7a1a', bellwether:'#f5b915', verdigris:'#b8e62e', bud:'#b8e62e', glasswake:'#ff3f9a', decoy:'#ff3f9a', undertow:'#7fd8ff', ice:'#cff4ff', redactor:'#e0283c', plate:'#e0283c' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Tuning ---------- */
const DEFAULTS = { parryWindow:0.12, moveSpeed:290, dashSpeed:1250, dashTime:0.16, dashCooldown:0.8, strikeDamage:12, strikeRange:78, powerDamage:16, powerCooldown:1.1, hitPause:0.055, shake: reduceMotion?0.3:1, enemyHealth:1, enemySpeed:1, musicVol:0.35, sfxVol:0.75, voiceVol:0.9 };
const T = Object.assign({}, DEFAULTS);
try { const s = JSON.parse(localStorage.getItem('volt-tune') || 'null'); if (s) for (const k in DEFAULTS) if (typeof s[k]==='number') T[k]=s[k]; } catch(e){}
function saveTune(){ try{ localStorage.setItem('volt-tune', JSON.stringify(T)); }catch(e){} }
const TUNE_ROWS = [
  ['musicVol','Music volume',0,1,0.05,2],
  ['sfxVol','Effects volume',0,1,0.05,2],
  ['voiceVol','Voice volume',0,1,0.05,2],
  ['moveSpeed','Move speed',180,450,10,0],
  ['dashSpeed','Dash speed',600,1600,25,0],
  ['dashTime','Dash length (s)',0.08,0.3,0.01,2],
  ['dashCooldown','Dash cooldown (s)',0.1,1.2,0.05,2],
  ['strikeDamage','Strike damage',4,30,1,0],
  ['strikeRange','Strike reach',50,130,2,0],
  ['powerDamage','Special damage',6,40,1,0],
  ['powerCooldown','Special cooldown (s)',0.3,3,0.1,1],
  ['parryWindow','Parry window (s, accessibility)',0.08,0.25,0.01,2],
  ['hitPause','Hit pause (s)',0,0.15,0.005,3],
  ['shake','Screen shake',0,2,0.1,1],
  ['enemyHealth','Enemy health ×',0.4,2.5,0.1,1],
  ['enemySpeed','Enemy speed ×',0.5,1.8,0.05,2],
];
function buildTune(){
  const list = $('#tuneList'); list.innerHTML = '';
  for (const [k,label,min,max,step,dp] of TUNE_ROWS){
    const row = document.createElement('div'); row.className='tune-row';
    row.innerHTML = `<label for="t-${k}">${label}</label><output id="o-${k}">${T[k].toFixed(dp)}</output><input type="range" id="t-${k}" min="${min}" max="${max}" step="${step}" value="${T[k]}">`;
    row.querySelector('input').addEventListener('input', e => { T[k]=parseFloat(e.target.value); row.querySelector('output').textContent=T[k].toFixed(dp); saveTune(); });
    list.appendChild(row);
  }
}
buildTune();

/* ---------- Save (kept between runs, this browser only) ---------- */
// Three save slots (volt-save-1..3). volt-slot remembers which one Continue loads. A save from before slots
// existed moves into slot 1.
const SLOT_COUNT=3;
let activeSlot=1;
try { activeSlot=clamp(Math.floor(+localStorage.getItem('volt-slot')||1),1,SLOT_COUNT);
  const old=localStorage.getItem('volt-save'); if (old && !localStorage.getItem('volt-save-1')){ localStorage.setItem('volt-save-1',old); localStorage.removeItem('volt-save'); } } catch(e){}
let SAVE_KEY='volt-save-'+activeSlot;
let saveRecoveryNotice='';
function loadSave(){
 for(const suffix of['','-backup']){try{const raw=localStorage.getItem(SAVE_KEY+suffix);if(!raw)continue;const data=normaliseSave(JSON.parse(raw));if(data){if(suffix)saveRecoveryNotice='Recovered the previous good save. Export a backup from Save Slots.';return data;}saveRecoveryNotice='This save could not be read. A fresh slot is available; the original data has been kept for recovery.';}catch{saveRecoveryNotice='Save recovery was needed. Open Save Slots to manage backups.';}}
 return freshSave();
}
const save=loadSave();
function writeSave(){save.updated=Date.now();try{const previous=localStorage.getItem(SAVE_KEY);if(previous){let good=false;try{good=!!normaliseSave(JSON.parse(previous));}catch{}if(good)localStorage.setItem(SAVE_KEY+'-backup',previous);else if(!localStorage.getItem(SAVE_KEY+'-recovery'))localStorage.setItem(SAVE_KEY+'-recovery',previous);}localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{saveRecoveryNotice='Saving is unavailable. Export this slot before closing the game.';}}
function readSlot(n){try{return normaliseSave(JSON.parse(localStorage.getItem('volt-save-'+n)||'null'));}catch{return null;}}
function readBackup(n){try{return normaliseSave(JSON.parse(localStorage.getItem('volt-save-'+n+'-backup')||'null'));}catch{return null;}}
// Switch to slot n: the shared save object is refilled in place, so everything holding it stays valid.
function useSlot(n){
  activeSlot=n; SAVE_KEY='volt-save-'+n; try{ localStorage.setItem('volt-slot',n); }catch(e){}
  saveRecoveryNotice='';const fresh=loadSave(); for (const k of Object.keys(save)) delete save[k]; Object.assign(save,fresh);
}
function metaRank(id){ return save.meta[id]||0; }
