// Volt: The run route. Five villains per run: three randomly assigned district villains, then
// Gravemark's roof, then the Redactor's tower (once he exists). See docs/boss-gameplay-spec.md, Run structure.
'use strict';

const ROOMS_PER_DISTRICT = 4;          // ordinary rooftops before each villain
const DISTRICT_PICKS = 3;              // district villains per run (fewer while fewer are built)
const POSITION_HP = 0.15;              // a villain fought later in the run gets +15% health per position
const DISTRICTS = {
  kilnheart: { name:'Foundry Roofs',     tint:'#211d1c', blurb:'Smelter stacks and scalding vents.' },
  bellwether:{ name:'Concert District',  tint:'#1f1d2b', blurb:'Speaker towers that never stop playing.' },
  verdigris: { name:'Overgrown Block',   tint:'#1a2420', blurb:'Rusted roofs swallowed by metal vines.' },
  glasswake: { name:'Glass Towers',      tint:'#1d1d2c', blurb:'Mirrored skyscrapers. Trust nothing you see.' },
  undertow:  { name:'Flooded Docks',     tint:'#18232b', blurb:'Waterlogged cranes and frozen pipes.' },
  gravemark: { name:"Gravemark's Roof",  tint:'#1b2537', blurb:'Cracked stone and levitating debris.', rooms:ROOMS_PER_DISTRICT },
  redactor:  { name:"The Redactor's Tower", tint:'#1d1a1f', blurb:'Where the city\'s power goes to disappear.', rooms:2 },
};
const DISTRICT_POOL = ['kilnheart','bellwether','verdigris','glasswake','undertow'];
const builtPool = () => DISTRICT_POOL.filter(id=>BOSSES[id]);

// run.route = { order:[district ids so far], i: index of current district, room: room within it (1-based) }
function routeStart(){const picks=Math.min(DISTRICT_PICKS,builtPool().length),plan=shuffle(builtPool().slice()).slice(0,picks),lengths={};[...plan,...['gravemark','redactor'].filter(id=>BOSSES[id])].forEach((id,i)=>lengths[id]=5+Math.min(2,Math.floor(i/2))+Math.floor(Math.random()*2));run.route={order:[],i:-1,room:0,picks,plan,lengths,pendingDistrict:null};}
const curDistrict = () => run.route.order[run.route.i];
// Roll once on entering a district. Later stretches grow from 5–6 to 7–8 combat roofs.
const roomsIn = id => run.route.lengths?.[id] || 5;
const isBossRoom = () => run.route.room > roomsIn(curDistrict());
// What comes after this district: another city-map choice, Gravemark, the Redactor, or the end of the run.
function nextAfterDistrict(){
  const r=run.route, beaten=r.order.filter(id=>DISTRICT_POOL.includes(id)).length;
  if (curDistrict()==='redactor') return {type:'end'}; // the Redactor is always the last villain
  if (DISTRICT_POOL.includes(curDistrict()) && beaten<r.picks) return {type:'map'};
  if (curDistrict()!=='gravemark' && !r.order.includes('gravemark') && BOSSES.gravemark) return {type:'fixed', id:'gravemark'};
  if (curDistrict()!=='redactor' && BOSSES.redactor) return {type:'fixed', id:'redactor'};
  return {type:'end'};
}
const isFinalVillain = () => { const n=nextAfterDistrict(); return n.type==='end'; };
function villainHpMul(id){ return DISTRICT_POOL.includes(id) ? 1+POSITION_HP*run.route.i : 1; }

function enterDistrict(id){
  const r=run.route; r.order.push(id);r.pendingDistrict=null; r.i=r.order.length-1; r.room=1;
  r.lengths=r.lengths||{};
  if(!r.lengths[id]){const low=5+Math.min(2,Math.floor(r.i/2));r.lengths[id]=low+Math.floor(Math.random()*2);}
  run.districtsCleared = r.i;
}

/* ---- Route briefing: the run assigns districts; the player continues the route. ---- */
function openCityMap(){
 const r=run.route,index=r.order.filter(id=>DISTRICT_POOL.includes(id)).length;
 if(!r.plan)r.plan=shuffle(builtPool().filter(id=>!r.order.includes(id))).slice(0,r.picks-index);
 const id=r.pendingDistrict||r.plan.find(id=>!r.order.includes(id));
 if(!id){const next=nextAfterDistrict();if(next.id)beginDistrict(next.id);return;}
 r.pendingDistrict=id;const box=$('#cityGates');box.innerHTML='';
 $('#cityStep').textContent=`District ${index+1} of ${r.picks} · assigned route`;
 const b=document.createElement('button');b.type='button';b.className='gate';b.style.setProperty('--c',COL.volt);
 b.innerHTML='<span class="card-top"><span class="tag">Next rooftop · Power</span></span><strong>Uncharted district</strong><span class="card-desc">A power awaits on arrival. Your contact and the district villain will be revealed when you reach them.</span><span class="card-foot">Continue route →</span>';
 b.addEventListener('click',()=>chooseDistrict(id));box.appendChild(b);cityGates=[id];
 state='map';keys.clear();strikeHeld=false;mouse.left=false;stick.id=null;show('#mCity',true);b.focus();
}
let cityGates=[];
function chooseDistrict(id){
  if (state!=='map'||id!==run.route.pendingDistrict) return;
  show('#mCity',false); state='play';
  if (run.route.i<0){ beginDistrict(id); return; }   // first district: no leap, start right away
  jumpTo({x:player.x, y:-40, side:'top', reward:{type:'district', id}, hold:0, t:0});
}
// Start a district at its first rooftop. Hades-style: every new region opens with a boon.
function beginDistrict(id){
  enterDistrict(id); buildRoom();
  player.x=ARENA.w/2; player.y=ARENA.h*0.6;
  banner(DISTRICTS[id].name.toUpperCase());
  missionArrival(id,()=>openDraft('boon'));
}
// Called when a district villain falls.
function districtCleared(){
  const n=nextAfterDistrict(), id=curDistrict();
  save.beaten=save.beaten||{}; save.beaten[id]=(save.beaten[id]||0)+1; writeSave(); // the Fortress trophy shelf and dialogue read this
  commendVillain(id);
  run.districtsCleared=run.route.i+1;
  if (n.type==='end'){ winRun(); return; }
  roomPhase='done';
  run.pendingTransition={remaining:1.6,next:n};
  if(typeof captureCheckpoint==='function')captureCheckpoint('pending');
}

function advanceDistrictTransition(dt){const pending=run.pendingTransition;if(!pending||state!=='play')return;pending.remaining-=dt;if(pending.remaining>0)return;delete run.pendingTransition;const n=pending.next;if(n.type==='map')openCityMap();else if(n.id)jumpTo({x:player.x,y:-40,side:'top',reward:{type:'district',id:n.id},hold:0,t:0});}
