'use strict';
// A safe supply node before each villain. Field credits are run currency;
// Renown bought here is the permanent currency already used by the Fortress.
const SHOP_GREETING=PATCH.lines[0];
let shop=null;
const resetShopRun=reset;
reset=function(){resetShopRun();run.credits=0;run.shopsVisited=[];shop=null;supplyCrates=[];fieldDrops=[];if($('#fieldClaim'))$('#fieldClaim').hidden=true;};
const damageShopCredits=damageEnemy;
damageEnemy=function(e,...args){if(e.isSupply){if(!e.dead){e.dead=true;if(e.loot==='health')packs.push({x:e.x,y:e.y,t:0});else if(e.loot==='credits'||(!e.loot&&e.amount>0))dropFieldCredits(e.x,e.y,e.amount);sparks(e.x,e.y,0,14,'#a88d68',280,Math.PI);sfx('enemyhit');}return;}const alive=!e.dead;const result=damageShopCredits(e,...args);if(alive&&e.dead&&!e.isDecoy&&!e.isIce&&!e.isPlate&&!e.isBud&&!inTutorial()&&Math.random()<.25)dropFieldCredits(e.x,e.y,e.isBoss?15:e.elite?8:4);return result;};
function rollShopOffers(){
 const offers=[],used=new Set(),pool=BOONS.filter(b=>b.weapon===run.style&&!(player.owned[b.id]?.level>=3));
 for(let i=0;i<3;i++){
  const type=weighted([['boon',48],['health',32],['shards',20]]);
  if(type==='boon'&&pool.some(b=>!used.has(b.id))){const b=pick(pool.filter(b=>!used.has(b.id)));used.add(b.id);offers.push({type,id:b.id,rarity:player.owned[b.id]?.rarity??rollRarity(),cost:75});}
  else if(type==='health')offers.push({type,cost:45,amount:35});
  else offers.push({type:'shards',cost:60,amount:12});
 }
 if(player.hp>=player.maxHp&&offers.every(o=>o.type==='health'))offers[2]={type:'shards',cost:60,amount:12};
 return offers;
}
// The supply stop is a live, safe rooftop. Purchases require standing beside a pedestal.
const PATCH_ROOF={id:'patch',x:555,y:370,face:0};
function drawRoofPatch(){drawHubNpc(PATCH_ROOF);ctx.save();ctx.textAlign='center';ctx.font='bold 16px sans-serif';ctx.lineWidth=5;ctx.strokeStyle=COL.ink;ctx.strokeText('PATCH - FIELD SUPPLY',PATCH_ROOF.x,PATCH_ROOF.y-112);ctx.fillStyle=COL.heal;ctx.fillText('PATCH - FIELD SUPPLY',PATCH_ROOF.x,PATCH_ROOF.y-112);ctx.restore();}
const SHOP_SPOTS=[{x:720,y:405},{x:920,y:405},{x:1120,y:405}];
function openFieldShop(){
 run.shopsVisited=run.shopsVisited||[];if(!run.shopsVisited.includes(curDistrict()))run.shopsVisited.push(curDistrict());
 shop={offers:rollShopOffers(),district:curDistrict()};roomPhase='shop';state='play';keys.clear();strikeHeld=false;mouse.left=false;stick.id=null;
 enemies=[];bullets=[];packs=[];supplyCrates=[];fieldDrops=[];boss=null;
 exits=[{...PADS[0],reward:{type:'boss',boss:curDistrict()},hold:0,t:0}];
 if(!$('#fieldClaim')){const b=document.createElement('button');b.id='fieldClaim';b.className='field-claim';b.hidden=true;document.body.appendChild(b);b.onclick=claimNearbySupply;}
 banner('PATCH · FIELD SUPPLY');playVoice('patch',SHOP_GREETING);fillFieldShop();
}
function shopNear(){return shop?SHOP_SPOTS.findIndex(s=>Math.hypot(player.x-s.x,player.y-s.y)<95):-1;}
function shopTitle(o){return o.type==='boon'?BOON_BY_ID[o.id].name:o.type==='health'?'Emergency Repair':'Renown Cache';}
function fillFieldShop(){
 const button=$('#fieldClaim');if(!button)return;const i=shopNear(),o=shop?.offers[i];button.hidden=state!=='play'||roomPhase!=='shop'||!o;
 if(button.hidden)return;
 const def=o.type==='boon'?BOON_BY_ID[o.id]:null,level=def?(player.owned[o.id]?.level||0)+1:1,base=k=>def?.[k]?Math.round(def[k][o.rarity]*(1+.4*(level-1))*100)/100:0;
 const desc=def?def.desc(base('v'),base('v2')).replace(/<[^>]*>/g,''):o.type==='health'?`Restore ${o.amount} health.`:`Bank ${o.amount} permanent Renown.`;
 const blocked=o.sold?'Sold':run.credits<o.cost?'Not enough credits':o.type==='health'&&player.hp>=player.maxHp?'Health full':def&&level>3?'Maximum level':null;
 button.disabled=!!blocked;button.textContent=`${shopTitle(o)} · ${o.cost} CR — ${desc} · ${blocked||'Claim [E / B / tap]'}`;
}
function claimNearbySupply(){const i=shopNear();if(i>=0)buyShopOffer(i);}
function buyShopOffer(i){
 if(state!=='play'||roomPhase!=='shop'||!shop||i!==shopNear())return;const o=shop.offers[i];if(!o||o.sold||run.credits<o.cost||(o.type==='health'&&player.hp>=player.maxHp))return;
 if(o.type==='boon'&&player.owned[o.id]?.level>=3)return;
 o.sold=true;run.credits-=o.cost;sfx('power_pick');
 if(o.type==='health')player.hp=Math.min(player.maxHp,player.hp+o.amount);
 else if(o.type==='shards')gainShards(o.amount,player.x,player.y-40);
 else{fillFieldShop();$('#fieldClaim').hidden=true;const def=BOON_BY_ID[o.id],line=commsLine(def.hero);runDialogue([{who:def.hero,text:line}],'Supply comms',()=>{takeBoon(o.id,o.rarity);state='play';roomPhase='shop';keys.clear();fillFieldShop();captureCheckpoint('shop');});return;}
 fillFieldShop();captureCheckpoint('shop');
}
function leaveFieldShop(){if(!shop)return;stopVoice();if($('#fieldClaim'))$('#fieldClaim').hidden=true;shop=null;roomPhase='exits';invalidateRender();}
const jumpFromSupply=jumpTo;
jumpTo=function(exit){if(state==='play'&&roomPhase==='shop')leaveFieldShop();jumpFromSupply(exit);};
addEventListener('keydown',e=>{if(state==='play'&&roomPhase==='shop'&&e.key.toLowerCase()==='e'){e.preventDefault();claimNearbySupply();}});
const updateSupply=update;
update=function(dt){updateSupply(dt);if(state!=='play')return;updateFieldDrops(dt);if(roomPhase==='shop'){fillFieldShop();updateExits(dt);}};
function drawShopPickup(i){
 const o=shop.offers[i],s=SHOP_SPOTS[i],near=shopNear()===i,c=o.type==='boon'?HEROES[BOON_BY_ID[o.id].hero].c:o.type==='health'?COL.heal:COL.boon;
 ctx.save();ctx.translate(s.x,s.y);ctx.globalAlpha=o.sold?.35:1;ctx.lineWidth=4;ctx.strokeStyle=COL.ink;ctx.fillStyle='#121e30';ctx.beginPath();ctx.ellipse(0,0,44,18,0,0,PI2);ctx.fill();ctx.stroke();
 const img=rewardIcon(o.type==='boon'?{type:'boon',hero:BOON_BY_ID[o.id].hero}:o.type==='health'?{type:'shop'}:{type:'shards'});
 ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-48,near?32:28,0,PI2);ctx.fill();ctx.stroke();if(img.complete&&img.naturalWidth)ctx.drawImage(img,-23,-71,46,46);
 ctx.textAlign='center';ctx.font='700 14px "Chakra Petch",sans-serif';ctx.lineWidth=5;ctx.strokeText(shopTitle(o),0,-99);ctx.fillStyle='#fff';ctx.fillText(shopTitle(o),0,-99);
 ctx.strokeText(o.sold?'SOLD':o.cost+' CR',0,-7);ctx.fillStyle=c;ctx.fillText(o.sold?'SOLD':o.cost+' CR',0,-7);ctx.restore();
}

// Breakables stay out of the enemy list, so they never hold up a wave or award kills.
let supplyCrates=[],fieldDrops=[];
const STORAGE_CRATES=new Image();STORAGE_CRATES.src='assets/arena/storage-crates-v1.webp';STORAGE_CRATES.onload=()=>invalidateRender();
function rollCrateLoot(){const r=Math.random();return r<.08?'health':r<.5?'credits':'empty';}
const buildSupplyRoom=buildRoom;
buildRoom=function(){buildSupplyRoom();fieldDrops=[];supplyCrates=[];if(inTutorial()||!curDistrict()||isBossRoom())return;
 // Stored beside the water tower, access hut, parapets and HVAC; leave landings and exits clear.
 const candidates=shuffle([{x:315,y:150},{x:1180,y:135},{x:1280,y:180},{x:275,y:655},{x:1250,y:655},{x:85,y:205},{x:1390,y:200}]).filter(p=>!inObstacle(p.x,p.y,32)&&[...PADS,...Object.values(LANDING)].every(e=>Math.hypot(e.x-p.x,e.y-p.y)>130));
 supplyCrates=candidates.slice(0,3+Math.floor(Math.random()*3)).map((p,i)=>{const loot=rollCrateLoot();return{...p,r:25,isSupply:true,spawnT:0,dead:false,skin:i%4,loot,amount:loot==='credits'?12+Math.floor(Math.random()*9):0};});
};
function dropFieldCredits(x,y,amount){fieldDrops.push({x,y,amount,t:0});}
function updateFieldDrops(dt){for(const d of fieldDrops){d.t+=dt;const dx=player.x-d.x,dy=player.y-d.y,r=Math.hypot(dx,dy);if(d.t>.2&&r<100){const k=Math.min(1,dt*12);d.x+=dx*k;d.y+=dy*k;}if(d.t>.2&&r<30){d.dead=true;run.credits=(run.credits||0)+d.amount;sfx('power_pick',{vol:.35});texts.push({x:player.x,y:player.y-35,v:'+'+d.amount+' CR',t:0,c:COL.amber});}}fieldDrops=fieldDrops.filter(d=>!d.dead);}
function drawSupplyCrate(c){if(!STORAGE_CRATES.complete||!STORAGE_CRATES.naturalWidth)return;const i=c.skin||0,w=STORAGE_CRATES.naturalWidth/2,h=STORAGE_CRATES.naturalHeight/2;ctx.drawImage(STORAGE_CRATES,(i%2)*w,Math.floor(i/2)*h,w,h,c.x-45,c.y-57,90,60);}
function drawFieldDrop(d){ctx.save();ctx.translate(d.x,d.y-9+Math.sin(time*4)*2);ctx.fillStyle=COL.amber;ctx.strokeStyle=COL.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(13,0);ctx.lineTo(0,12);ctx.lineTo(-13,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
