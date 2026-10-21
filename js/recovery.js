'use strict';
let restoringCheckpoint=false;
const checkpointCopy=value=>JSON.parse(JSON.stringify(value));
function clearCheckpoint(){if(!save.checkpoint)return;delete save.checkpoint;writeSave();}
function captureCheckpoint(mode){
 if(restoringCheckpoint||practice||inTutorial()||inHub()||state==='over'||run.won)return;
 if(!['fight','draft','shop','map','pending','arrival','exits'].includes(mode))return;
 const keep={};for(const key of['hp','sig','owned','tech','x','y'])keep[key]=checkpointCopy(player[key]);
 save.checkpoint={format:1,mode,run:checkpointCopy(run),player:keep,wave,kills,lastCaller,arrivalT,
  draft:mode==='draft'?{kind:draftKind,hero:draftHero,line:$('#draftLine').textContent,cards:checkpointCopy(draftCards)}:null,
  shop:mode==='shop'?checkpointCopy(shop):null,exits:mode==='exits'?checkpointCopy(exits):null};
 writeSave();
}
function validCheckpoint(c){
 try{
 if(!saveRecord(c)||c.format!==1||!['fight','draft','shop','map','pending','arrival','exits'].includes(c.mode)||!saveRecord(c.run)||!saveRecord(c.player)||!saveRecord(c.run.route)||!SAVE_STYLES.includes(c.run.style))return false;
 const r=c.run.route;if(!Array.isArray(r.order)||r.order.some(id=>!BOSSES[id])||!Number.isInteger(r.i)||r.i< -1||r.i>=r.order.length||!Number.isInteger(r.room)||r.room<0||r.room>15)return false;
 if(!Number.isInteger(r.picks)||r.picks<0||r.picks>3||!Array.isArray(r.plan)||r.plan.some(id=>!DISTRICT_POOL.includes(id))||new Set(r.plan).size!==r.plan.length||!saveRecord(r.lengths)||Object.entries(r.lengths).some(([id,n])=>!BOSSES[id]||!Number.isInteger(n)||n<5||n>8))return false;
 for(const key of['credits','time','hits','dmgTaken','bossKills','roomsCleared','rerolls','lastStands','shards'])if(!Number.isFinite(c.run[key])||c.run[key]<0||c.run[key]>1e8)return false;
 if(!saveRecord(c.run.calls)||!Array.isArray(c.run.hybrids)||c.run.hybrids.some(id=>!HYBRIDS[id])||!Number.isFinite(c.player.x)||!Number.isFinite(c.player.y)||!Number.isInteger(c.wave)||c.wave<0||c.wave>10000||!Number.isInteger(c.kills)||c.kills<0||!Number.isFinite(c.player.sig)||c.player.sig<0||c.player.sig>100)return false;
 if(!Number.isFinite(c.player.hp)||c.player.hp<=0||!saveRecord(c.player.owned)||!saveRecord(c.player.tech))return false;
 for(const [id,o]of Object.entries(c.player.owned))if(!BOON_BY_ID[id]||!saveRecord(o)||o.id!==id||!Number.isInteger(o.level)||o.level<1||o.level>3||!Number.isInteger(o.rarity)||o.rarity<0||o.rarity>2)return false;
 for(const [id,n]of Object.entries(c.player.tech))if(!TECH.some(t=>t.id===id)||!Number.isInteger(n)||n<0||n>100)return false;
 if(c.mode==='draft'&&(!c.draft||!['boon','tech'].includes(c.draft.kind)||typeof c.draft.line!=='string'||!Array.isArray(c.draft.cards)||c.draft.cards.length!==3||!SPEAKERS[c.draft.hero]||c.draft.cards.some(d=>!saveRecord(d)||(d.kind==='boon'?(!BOON_BY_ID[d.id]||!Number.isInteger(d.rarity)||d.rarity<0||d.rarity>2):d.kind==='tech'?!TECH.some(t=>t.id===d.id):d.kind==='hybrid'?!HYBRIDS[d.id]:true))))return false;
 if(c.mode==='shop'&&(!c.shop||!Array.isArray(c.shop.offers)||c.shop.offers.length!==3||c.shop.offers.some(o=>!saveRecord(o)||!['boon','health','shards'].includes(o.type)||(o.type==='boon'&&(!BOON_BY_ID[o.id]||!Number.isInteger(o.rarity)||o.rarity<0||o.rarity>2))||(o.type!=='boon'&&(!Number.isFinite(o.amount)||o.amount<0||o.amount>1000))||!Number.isFinite(o.cost)||o.cost<0)))return false;
 if(c.mode==='pending'&&(!Number.isFinite(c.run.pendingTransition?.remaining)||!['map','fixed'].includes(c.run.pendingTransition.next?.type)||(c.run.pendingTransition.next.type==='fixed'&&!BOSSES[c.run.pendingTransition.next.id])))return false;
 if(c.mode==='exits'&&(!Array.isArray(c.exits)||c.exits.length<1||c.exits.length>3||c.exits.some(e=>!PADS.some(p=>p.side===e.side)||!['boon','tech','shards','boss','shop'].includes(e.reward?.type)||(e.reward.type==='boon'&&!HEROES[e.reward.hero]))))return false;
 return true;
 }catch{return false;}
}
function restoreCheckpoint(){
 const c=save.checkpoint;if(!c)return false;if(!validCheckpoint(c)){clearCheckpoint();saveRecoveryNotice='The unfinished operation could not be recovered. Your Fortress progress is safe.';return false;}
 restoringCheckpoint=true;
 try{
  stopVoice();practice=false;tut=null;leaveHub();reset();Object.assign(run,checkpointCopy(c.run));Object.assign(player,checkpointCopy(c.player));
  player.slots={strike:null,power:null,dash:null,overload:null};player.passives=[];
  for(const o of Object.values(player.owned)){const def=BOON_BY_ID[o.id];if(def.slot==='passive')player.passives.push(o);else player.slots[def.slot]=o;}
  STYLE().init?.(player);recalcRun();player.hp=Math.min(c.player.hp,player.maxHp);player.sig=clamp(c.player.sig||0,0,100);wave=c.wave||0;kills=c.kills||0;lastCaller=c.lastCaller||null;
  for(const id of['#splash','#mStart','#mOver','#mPause','#mDraft','#mFortress','#mCity','#mStyle','#hubTalk'])show(id,false);
  state='play';keys.clear();stick.id=null;transit=null;buildRoom();player.x=ARENA.w/2;player.y=ARENA.h*.6;cam.x=player.x;cam.y=player.y;
  if(c.mode==='map')openCityMap();
  else if(c.mode==='draft')openDraftNow(c.draft.kind,c.draft.hero,true,c.draft);
  else if(c.mode==='shop'){openFieldShop();shop=checkpointCopy(c.shop);player.x=clamp(c.player.x,50,ARENA.w-50);player.y=clamp(c.player.y,50,ARENA.h-50);fillFieldShop();}
  else if(c.mode==='pending'){enemies=[];boss=null;roomPhase='done';}
  else if(c.mode==='exits'){enemies=[];boss=null;exits=checkpointCopy(c.exits);for(const e of exits)e.hold=0;roomPhase='exits';}
  else if(c.mode==='arrival'){roomPhase='reward';arrivalT=Math.max(.1,c.arrivalT||.6);}
  else{wave=Math.max(0,wave-1);startWave();}
  applyStyleHud();refreshSlotHud();invalidateRender();if(c.mode!=='draft')banner('CHECKPOINT RESTORED');return true;
 }catch(error){delete save.checkpoint;saveRecoveryNotice='This rooftop could not be restored. Your Fortress progress is safe.';writeSave();state='start';return false;}finally{restoringCheckpoint=false;}
}
const checkpointStartWave=startWave;
startWave=function(){checkpointStartWave();captureCheckpoint('fight');};
const checkpointDraft=openDraftNow;
openDraftNow=function(...args){checkpointDraft(...args);captureCheckpoint('draft');};
const checkpointMap=openCityMap;
openCityMap=function(){checkpointMap();captureCheckpoint('map');};
const checkpointShop=openFieldShop;
openFieldShop=function(){checkpointShop();captureCheckpoint('shop');};
const checkpointArrival=arrive;
arrive=function(...args){checkpointArrival(...args);if(state==='play'&&roomPhase==='reward')captureCheckpoint('arrival');};
const checkpointExits=openExits;
openExits=function(){checkpointExits();captureCheckpoint('exits');};
const checkpointHub=enterHub;
enterHub=function(){clearCheckpoint();checkpointHub();};
const updateDistrictContinuation=update;
update=function(dt){updateDistrictContinuation(dt);advanceDistrictTransition(dt);};
