'use strict';
// A safe supply node before each villain. Field credits are run currency;
// Renown bought here is the permanent currency already used by the Fortress.
const SHOP_GREETING=PATCH.lines[0];
let shop=null;
const resetShopRun=reset;
reset=function(){resetShopRun();run.credits=25;run.shopsVisited=[];shop=null;};
const damageShopCredits=damageEnemy;
damageEnemy=function(e,...args){const alive=!e.dead;const result=damageShopCredits(e,...args);if(alive&&e.dead&&!e.isDecoy&&!e.isIce&&!e.isPlate&&!inTutorial())run.credits=(run.credits||0)+(e.isBoss?15:e.elite?2:1);return result;};
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
function openFieldShop(){
 run.shopsVisited=run.shopsVisited||[];if(!run.shopsVisited.includes(curDistrict()))run.shopsVisited.push(curDistrict());
 shop={offers:rollShopOffers(),district:curDistrict()};roomPhase='shop';state='shop';keys.clear();strikeHeld=false;mouse.left=false;stick.id=null;
 if(!$('#mFieldShop')){const el=document.createElement('div');el.id='mFieldShop';el.className='scrim';el.innerHTML='<div class="panel shop-panel" role="dialog" aria-modal="true" aria-labelledby="shopTitle"><div class="shop-heading"><img src="assets/intro/patch.webp" alt="Patch, superhero field engineer"><div><span class="tag">Safe stop · before the villain</span><h2 id="shopTitle">Patch’s Field Supply</h2><p class="hint" id="shopGreeting"></p><b id="shopCredits"></b></div></div><div class="draft-cards" id="shopCards"></div><p class="hint" id="shopMessage">Three random offers; repeats are possible. Field credits come from defeated enemies and expire after the run. Renown shards are permanent.</p><button class="btn primary" id="shopLeave" type="button">Continue to the unknown villain →</button></div>';document.body.appendChild(el);$('#shopLeave').onclick=leaveFieldShop;el.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')leaveFieldShop();if(/^[123]$/.test(e.key))buyShopOffer(+e.key-1);});}
 $('#shopGreeting').textContent=SHOP_GREETING;fillFieldShop();show('#mFieldShop',true);$('#shopLeave').focus({preventScroll:true});$('#mFieldShop .shop-panel').scrollTop=0;playVoice('patch',SHOP_GREETING);
}
function fillFieldShop(){
 $('#shopCredits').textContent=`${run.credits||0} field credits · Health ${Math.ceil(player.hp)}/${player.maxHp}`;const cards=$('#shopCards');cards.innerHTML='';
 shop.offers.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.className='card';b.disabled=o.sold||run.credits<o.cost||(o.type==='health'&&player.hp>=player.maxHp);b.style.setProperty('--c',o.type==='boon'?HEROES[BOON_BY_ID[o.id].hero].c:o.type==='health'?COL.heal:COL.boon);
  const def=o.type==='boon'?BOON_BY_ID[o.id]:null,level=def?(player.owned[o.id]?.level||0)+1:1,base=k=>def?.[k]?Math.round(def[k][o.rarity]*(1+.4*(level-1))*100)/100:0;
  const title=def?def.name:o.type==='health'?'Emergency Repair':'Renown Cache',desc=def?def.desc(base('v'),base('v2')):o.type==='health'?`Restore <b>${o.amount} health</b>, up to your maximum.`:`Bank <b>${o.amount} Renown shards</b> for permanent upgrades.`;
  b.innerHTML=`<span class="card-top"><span class="tag">${def?SPEAKERS[def.hero].name+' · '+RARITY[o.rarity].name:o.type==='health'?'Health':'Permanent currency'}</span><span class="card-key">${i+1}</span></span><strong>${title}</strong><span class="card-foot">${o.sold?'Sold':o.cost+' field credits'}</span><span class="card-desc">${desc}</span>`;b.onclick=()=>buyShopOffer(i);cards.appendChild(b);
 });
}
function buyShopOffer(i){
 if(state!=='shop'||!shop)return;const o=shop.offers[i];if(!o||o.sold||run.credits<o.cost||(o.type==='health'&&player.hp>=player.maxHp))return;
 if(o.type==='boon'&&player.owned[o.id]?.level>=3)return;
 o.sold=true;run.credits-=o.cost;sfx('power_pick');
 if(o.type==='health')player.hp=Math.min(player.maxHp,player.hp+o.amount);
 else if(o.type==='shards')gainShards(o.amount,player.x,player.y-40);
 else{show('#mFieldShop',false);const def=BOON_BY_ID[o.id],line=commsLine(def.hero);runDialogue([{who:def.hero,text:line}],'Supply comms',()=>{takeBoon(o.id,o.rarity);state='shop';roomPhase='shop';fillFieldShop();show('#mFieldShop',true);$('#shopLeave').focus({preventScroll:true});$('#mFieldShop .shop-panel').scrollTop=0;});return;}
 fillFieldShop();
}
function leaveFieldShop(){if(state!=='shop')return;show('#mFieldShop',false);stopVoice();state='play';roomPhase='exits';arrivalT=0;exits=[{...PADS[0],reward:{type:'boss',boss:curDistrict()},hold:0,t:0}];shop=null;invalidateRender();}
