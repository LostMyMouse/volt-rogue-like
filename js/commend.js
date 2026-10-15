// Volt: Commendations, the only source of Hero Licences (which unlock combat styles at the armoury).
// Like Hades' Chthonic Keys, they come from milestones spread over many runs: most are earned once,
// and winning a run always pays one more. Earned ids live in save.comm.
'use strict';

const COMMENDATIONS = [
  { id:'gravemark',  name:'Stone Breaker',   desc:'Defeat Gravemark for the first time.', lic:1 },
  { id:'redactor',   name:'Unredacted',      desc:'Defeat the Redactor for the first time.', lic:1 },
  { id:'all_five',   name:'City Patrol',     desc:'Defeat all five district villains (over any number of runs).', lic:1 },
  { id:'parry10',    name:'Perfect Guard',   desc:'Land 10 parries in a single run.', lic:1 },
  { id:'flawless',   name:'Untouchable',     desc:'Defeat a villain without taking a hit.', lic:1 },
  { id:'win_brawler',   name:'Brawler Victory',   desc:'Win a run as a Brawler.', lic:1 },
  { id:'win_caster',       name:'Arc Caster Victory', desc:'Win a run as an Arc Caster.', lic:1 },
  { id:'win_titan',     name:'Titan Victory',     desc:'Win a run as a Titan.', lic:1 },
  { id:'win_speedster', name:'Speedster Victory', desc:'Win a run as a Speedster.', lic:1 },
  { id:'win_magnetar',  name:'Magnetar Victory',  desc:'Win a run as a Magnetar.', lic:1 },
];
const WIN_LICENCE = 1; // every completed run, on top of any commendation

function grantLicences(n,label){
  if (n<=0) return;
  save.licences+=n; run.licences=(run.licences||0)+n;
  (run.commends||(run.commends=[])).push(label);
  writeSave();
  if (player) texts.push({x:player.x,y:player.y-90,v:`+${n} HERO LICENCE`,t:0,big:true,c:COL.spark});
}
function commend(id){
  const c=COMMENDATIONS.find(x=>x.id===id), done=save.comm||(save.comm={});
  if (!c || done[id]) return false;
  done[id]=1; grantLicences(c.lic,c.name);
  banner(c.name.toUpperCase());
  return true;
}
// Called when a villain falls (after save.beaten is updated).
function commendVillain(id){
  if (id==='gravemark') commend('gravemark');
  if (id==='redactor') commend('redactor');
  if (DISTRICT_POOL.every(v=>(save.beaten||{})[v])) commend('all_five');
  if (run.hitsAtBoss!==undefined && run.hits===run.hitsAtBoss) commend('flawless');
}
function commendWin(){
  grantLicences(WIN_LICENCE,'Run complete');
  commend('win_'+run.style);
}
const commendCount = () => COMMENDATIONS.filter(c=>(save.comm||{})[c.id]).length;
