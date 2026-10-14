// Volt: Arena layout, run state and reset().
'use strict';

/* ---------- World ---------- */
const ARENA = { w:1500, h:1000 };
// Layout follows concept-art/rooftop.webp: water tower top-left, stair hut top-right, AC units bottom corners.
// x,y,w,h is the floor footprint (collision); ht is how tall it stands in the 3/4 view.
let obstacles = [
  {x:70,y:60,w:200,h:200,ht:120,kind:'tower',circle:true},
  {x:1210,y:40,w:220,h:170,ht:110,kind:'hut'},
  {x:940,y:60,w:110,h:60,ht:40,kind:'box'},
  {x:90,y:760,w:230,h:140,ht:70,kind:'ac'},
  {x:1200,y:770,w:190,h:130,ht:80,kind:'vent'},
];
for (const b of obstacles) if (b.circle){ b.cx=b.x+b.w/2; b.cy=b.y+b.h/2; b.rad=b.w/2; }
const city = [];
for (let i=0;i<520;i++){
  let x,y; do { x=rand(-1100,ARENA.w+1100); y=rand(-900,ARENA.h+900); } while (x>-60&&x<ARENA.w+60&&y>-60&&y<ARENA.h+60);
  const r = Math.random();
  city.push({x,y,w:rand(3,9),h:rand(3,6),c: r<.6?'#f2a24a':r<.85?'#3aa8e0':'#8a6cf0', a:rand(.15,.6), f:rand(PI2)});
}
const stains = Array.from({length:22},()=>({x:rand(60,ARENA.w-60),y:rand(60,ARENA.h-60),r:rand(20,70),a:rand(.04,.1)}));

const RUN_WAVES = 15, BOSS_WAVES = [5,10,15];
let shots=[], player, enemies, bullets, fx, particles, decals, texts, bolts, rocks, cracks, packs, zones, boss, run, wave, waveTimer, waveClearing, kills, R;
let state = 'start', prevState = 'start', hitStop = 0, shakeAmt = 0, flash = 0, hurtFlash = 0, time = 0;
const cam = { x:ARENA.w/2, y:ARENA.h/2, zoom:1 };

function reset(){
  player = { x:ARENA.w/2, y:ARENA.h/2, r:16, hp:100, maxHp:100, vx:0, vy:0, aim:-Math.PI/2, dashT:0, dashCd:0, dashDir:{x:1,y:0}, iT:0, combo:0, comboT:0, strikeCd:0, powerCd:0, sig:0, ghostT:0,
    slots:{strike:null,power:null,dash:null,overload:null}, passives:[], owned:{}, tech:{}, guard:0, reflectT:0,
    strikeCdMax:0.34, powerCdMax:1.1, charging:0, shield:false, shieldT:0, mom:0, disc:null,
    blockHeld:false, blockT:0, blockLock:0, blockUsed:false, blockHits:[], stunT:0, parries:0 };
  enemies=[]; bullets=[]; fx=[]; particles=[]; decals=[]; texts=[]; bolts=[]; rocks=[]; cracks=[]; packs=[]; zones=[]; boss=null;
  run={ time:0, hits:0, dmgTaken:0, bossKills:0, lastHit:null, won:false, calls:{}, shards:0, licences:0, rerolls:metaRank('reroll'), lastStands:metaRank('laststand'), style:save.unlocked.includes(save.style)?save.style:'brawler' };
  shots=[];
  recalcRun(); player.hp=player.maxHp;
  wave=0; waveTimer=0.7; waveClearing=true; kills=0; hitStop=0; shakeAmt=0; flash=0; hurtFlash=0;
}
