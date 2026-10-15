// Volt: The run route. Five villains per run: three district villains chosen on the city map, then
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
function routeStart(){ run.route={ order:[], i:-1, room:0, picks:Math.min(DISTRICT_PICKS,builtPool().length) }; }
const curDistrict = () => run.route.order[run.route.i];
const roomsIn = id => (DISTRICTS[id].rooms||ROOMS_PER_DISTRICT);
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
  const r=run.route; r.order.push(id); r.i=r.order.length-1; r.room=1;
  run.districtsCleared = r.i;
}

/* ---- City map: pick the next district from two villain gates ---- */
function openCityMap(){
  const r=run.route, pool=builtPool().filter(id=>!r.order.includes(id));
  const gates=shuffle(pool.slice()).slice(0,2);
  const box=$('#cityGates'); box.innerHTML='';
  $('#cityStep').textContent = `District ${r.order.filter(id=>DISTRICT_POOL.includes(id)).length+1} of ${r.picks}`;
  gates.forEach((id,i)=>{
    const d=DISTRICTS[id], sp=SPEAKERS[id]||{name:id,c:COL.boon}, pos=r.i+1;
    const b=document.createElement('button'); b.type='button'; b.className='gate'; b.style.setProperty('--c',KIND_COL[id]||sp.c);
    b.innerHTML=`<span class="gate-art"></span>
      <span class="card-top"><span class="tag">${d.name}</span><span class="card-key">${i+1}</span></span>
      <strong>${sp.name}</strong>
      <span class="gate-title">${BOSSES[id].title}</span>
      <span class="card-desc">${d.blurb}</span>
      <span class="card-foot">${(save.met&&save.met.villains&&save.met.villains[id])?'Faced before':'Unknown threat'} · ${pos>0?`+${Math.round(POSITION_HP*pos*100)}% tougher this late`:'First district'}</span>`;
    const art=b.querySelector('.gate-art');
    if (PORTRAIT_FILES.includes(id)) art.style.backgroundImage=`url(assets/portraits/${id}.png)`; else art.innerHTML=`<svg viewBox="0 0 64 64">${PORTRAIT_SVG[id]||BUST}</svg>`;
    b.addEventListener('click',()=>chooseDistrict(id));
    box.appendChild(b);
  });
  cityGates=gates;
  state='map'; keys.clear(); strikeHeld=false; mouse.left=false; stick.id=null;
  show('#mCity',true); box.firstChild && box.firstChild.focus();
}
let cityGates=[];
function chooseDistrict(id){
  if (state!=='map') return;
  show('#mCity',false); state='play';
  if (run.route.i<0){ beginDistrict(id); return; }   // first district: no leap, start right away
  jumpTo({x:player.x, y:-40, side:'top', reward:{type:'district', id}, hold:0, t:0});
}
// Start a district at its first rooftop. Hades-style: every new region opens with a boon.
function beginDistrict(id){
  enterDistrict(id); buildRoom();
  player.x=ARENA.w/2; player.y=ARENA.h*0.6;
  banner(DISTRICTS[id].name.toUpperCase());
  openDraft('boon');
}
// Called when a district villain falls.
function districtCleared(){
  const n=nextAfterDistrict(), id=curDistrict();
  save.beaten=save.beaten||{}; save.beaten[id]=(save.beaten[id]||0)+1; writeSave(); // the Fortress trophy shelf and dialogue read this
  commendVillain(id);
  run.districtsCleared=run.route.i+1;
  if (n.type==='end'){ winRun(); return; }
  roomPhase='done';
  setTimeout(()=>{
    if (state!=='play') return;
    if (n.type==='map') openCityMap();
    else jumpTo({x:player.x, y:-40, side:'top', reward:{type:'district', id:n.id}, hold:0, t:0});
  },1600);
}
