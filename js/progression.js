'use strict';
// Save-compatible, optional late-run challenges and mechanical build variants.
const CONTRACTS=[{id:'armour',name:'Reinforced crews',desc:'+15% enemy health per rank.'},{id:'force',name:'Heavy weapons',desc:'+12% incoming damage per rank.'},{id:'fragile',name:'Lightweight suit',desc:'−8% maximum health per rank.'}];
const ASPECTS={brawler:{name:'Circuit Breaker',desc:'Your third combo hit sends out a second, wider electrical shock for 12 damage.'},caster:{name:'Split Coil',desc:'Every fourth bolt forks into three shots. The two side bolts deal 55% damage.'},titan:{name:'Faultline',desc:'Every heavy punch launches a piercing ground arc beyond its target for 12 damage.'},speedster:{name:'Afterimage',desc:'Blitz leaves a psychic afterimage that detonates after half a second for 20 damage.'},magnetar:{name:'Return Current',desc:'Returning disc hits deal 75% more damage and briefly root enemies.'}};
const HYBRIDS={sunroot:{name:'Sunroot',heroes:['halo','thorn'],desc:'Special grows a burning root field at its first target: 8 damage per second for 3 seconds and a brief root.'},mindwall:{name:'Mindwall',heroes:['bastion','echo'],desc:'Perfect parries release an 18-damage psychic counterpulse and mark nearby enemies.'},prism:{name:'Prism Current',heroes:['halo','echo'],desc:'Striking a marked enemy sends a 10-damage light arc to another enemy. Once every half second.'}};
const riskOf=c=>CONTRACTS.reduce((n,x)=>n+clamp(Math.floor(+c?.[x.id]||0),0,3),0);
const selectedContracts=()=>save.wins>0?Object.fromEntries(CONTRACTS.map(x=>[x.id,clamp(Math.floor(+save.contracts?.[x.id]||0),0,3)])):{};
const hybridsUnlocked=()=>save.wins>0&&save.runs>=5;
function hybridReady(id){return HYBRIDS[id].heroes.every(hero=>Object.keys(player.owned).some(b=>BOON_BY_ID[b]?.hero===hero));}
function hybridActive(id){return !!run.hybrids?.includes(id)&&hybridReady(id);}
function eligibleHybrids(hero){return hybridsUnlocked()?Object.keys(HYBRIDS).filter(id=>!run.hybrids?.includes(id)&&hybridReady(id)&&HYBRIDS[id].heroes.includes(hero)):[];}
function takeHybrid(id){if(!HYBRIDS[id]||!hybridReady(id)||!hybridsUnlocked())return false;run.hybrids=run.hybrids||[];if(!run.hybrids.includes(id))run.hybrids.push(id);return true;}
const oldResetProgression=reset;
reset=function(){oldResetProgression();run.contracts=selectedContracts();run.risk=riskOf(run.contracts);run.aspect=save.aspectUnlocked?.[run.style]&&save.aspects?.[run.style]?run.style:null;run.hybrid=null;run.hybrids=[];recalcRun();player.hp=player.maxHp;};
const oldRecalcProgression=recalcRun;
recalcRun=function(){oldRecalcProgression();if(run?.contracts){player.maxHp=Math.round(player.maxHp*(1-.08*(run.contracts.fragile||0)));player.hp=Math.min(player.hp,player.maxHp);}};
const oldWaveHpProgression=waveHp;
// waveHp is a const binding: use the health multiplier when constructing units and bosses instead.
const makeProgressionEnemy=makeEnemy;
makeEnemy=function(...args){const e=makeProgressionEnemy(...args),m=1+.15*(run?.contracts?.armour||0);e.hp*=m;e.maxHp*=m;return e;};
const makeProgressionBoss=makeBoss;
makeBoss=function(...args){const e=makeProgressionBoss(...args),m=1+.15*(run?.contracts?.armour||0);e.hp*=m;e.maxHp*=m;return e;};
const oldHurtProgression=hurtPlayer;
hurtPlayer=function(dmg,...args){return oldHurtProgression(dmg*(1+.12*(run?.contracts?.force||0)),...args);};
const oldGainProgression=gainShards;
gainShards=function(n,x,y){return oldGainProgression(Math.round(n*(1+.1*(run.risk||0))),x,y);};
const oldCommendProgression=commendWin;
commendWin=function(){oldCommendProgression();if(run.risk>=3)grantLicences(1,'Risk contract completed');};

function launchArc(x,y,a,dmg=12,pierce=1){shots.push({kind:'bolt',x,y,vx:Math.cos(a)*760,vy:Math.sin(a)*760,t:0,life:.55,dmg,heavy:false,r:7,pierce,hit:[]});bolts.push({pts:[{x,y},{x:x+Math.cos(a)*90,y:y+Math.sin(a)*90}],t:0,dur:.16});}
const originalHeavyVariant=heavyLanded;
heavyLanded=function(x,y){originalHeavyVariant(x,y);if(run.aspect==='brawler')burst(x,y,105,12,COL.volt,.15);if(run.aspect==='titan')launchArc(x,y,player.aim,12,4);};
const casterStrikeVariant=STYLES.caster.strike;
STYLES.caster.strike=function(){const n=shots.length;casterStrikeVariant();const s=shots[n];if(run.aspect==='caster'&&s?.heavy){for(const offset of [-.22,.22]){const a=Math.atan2(s.vy,s.vx)+offset;shots.push({...s,vx:Math.cos(a)*820,vy:Math.sin(a)*820,dmg:s.dmg*.55,hit:[]});}}};
const speedPowerVariant=STYLES.speedster.powerPress;
STYLES.speedster.powerPress=function(){const cd=player.powerCd;speedPowerVariant();if(run.aspect==='speedster'&&player.powerCd>cd)zones.push({kind:'echo',x:player.x,y:player.y,t:0,dur:.6,dmg:20,c:HEROES.echo.c});};
const originalStrikeVariant=strikeHit;
strikeHit=function(e,dmg,a,knock,stun,opt={}){
 if(run.aspect==='magnetar'&&player.disc?.state==='back'){dmg*=1.75;rootEnemy(e,.4);}
 const prism=hybridActive('prism')&&e.markT>0&&run.time>=(player.prismAt||0);
 originalStrikeVariant(e,dmg,a,knock,stun,opt);
 if(player.tech.arcblade&&run.time>=(player.arcbladeAt||0)){player.arcbladeAt=run.time+.7;launchArc(e.x+Math.cos(a)*(e.r+10),e.y+Math.sin(a)*(e.r+10),a,10,2);}
 if(prism){player.prismAt=run.time+.5;const t=nearestEnemy(e.x,e.y,260,[e]);if(t){damageEnemy(t,10,Math.atan2(t.y-e.y,t.x-e.x),0,.1,{src:'hybrid',c:HEROES.halo.c});bolts.push({pts:[{x:e.x,y:e.y},{x:t.x,y:t.y}],t:0,dur:.2,c:HEROES.halo.c});}}
};
const originalPowerVariant=powerHit;
powerHit=function(e,dmg,a,knock,stun,first,opt){originalPowerVariant(e,dmg,a,knock,stun,first,opt);if(first&&player.tech.staticwell)zones.push({kind:'light',x:e.x,y:e.y,t:0,dur:3,dps:9,r:105,c:COL.volt});if(first&&hybridActive('sunroot')){rootEnemy(e,.8);zones.push({kind:'light',x:e.x,y:e.y,t:0,dur:3,dps:8,r:120,c:'#e2d375'});}};
const originalParryVariant=onParry;
onParry=function(a,opt){originalParryVariant(a,opt);if(hybridActive('mindwall')){burst(player.x,player.y,125,18,HEROES.echo.c,.3);for(const e of liveEnemies())if(Math.hypot(e.x-player.x,e.y-player.y)<125)e.markT=3;}};
TECH.push({id:'arcblade',variant:true,name:'Arc Blade',desc:'Strike launches a piercing arc beyond a hit target for <b>10 damage</b>. At most once every 0.7s.'},{id:'staticwell',variant:true,name:'Static Well',desc:'Special leaves a <b>3-second electrical field</b> at its first target, dealing 9 damage per second.'},{id:'stormlance',variant:true,name:'Storm Lance',desc:'Changes Overload into a <b>long, narrow lightning blast</b>: 65 damage, 620 range. Aim before firing.'});
const originalTechVariant=takeTech;
takeTech=function(id){if(TECH.find(t=>t.id===id)?.variant&&player.tech[id])return;originalTechVariant(id);};
const originalSigVariant=doSig;
doSig=function(){const p=player;if(!p.tech.stormlance)return originalSigVariant();if(state!=='play'||p.sig<100||p.suppressed)return;p.sig=0;sfx('overload');bark('overload',.7);const a=p.aim,range=620;
 for(const e of liveEnemies())if(inCone(e,p.x,p.y,a,range,.52)){damageEnemy(e,65*(1+val('storm')/100),Math.atan2(e.y-p.y,e.x-p.x),500,has('storm')?2.4:.9,{src:'overload'});if(has('storm'))e.markT=4;if(has('overgrowth')){rootEnemy(e,val('overgrowth'));poisonEnemy(e,2);}}
 for(const b of bullets)if(Math.hypot(b.x-p.x,b.y-p.y)<range&&Math.abs(angDiff(Math.atan2(b.y-p.y,b.x-p.x),a))<.3)b.dead=true;
 if(has('daybreak'))zones.push({kind:'light',x:p.x+Math.cos(a)*180,y:p.y+Math.sin(a)*180,t:0,dur:4,dps:val('daybreak'),r:160,c:HEROES.halo.c});if(has('fortress'))p.iT=Math.max(p.iT,val('fortress'));
 bolts.push({pts:[{x:p.x,y:p.y},{x:p.x+Math.cos(a)*range,y:p.y+Math.sin(a)*range}],t:0,dur:.4,w:4});comicAttack(p.x,p.y,a,140);hitStop=Math.max(hitStop,.14);addShake(15);
};
const oldUpdateProgression=update;
update=function(dt){oldUpdateProgression(dt);if(run.style!=='caster')updateShots(dt);};
const oldOwnedProgression=ownedList;
ownedList=function(){const out=oldOwnedProgression();if(run.aspect)out.push({name:ASPECTS[run.aspect].name,c:COL.volt,slot:'aspect'});if(run.risk)out.push({name:`Risk ${run.risk} · +${run.risk*10}% Shards`,c:COL.threat,slot:'contract'});for(const id of run.hybrids||[])out.push({name:HYBRIDS[id].name+(hybridActive(id)?' · active':' · needs both heroes'),c:COL.boon,slot:'hybrid'});return out;};

// Dedicated room interactions; accessible floor paths follow the painted door openings.
HUB_FLOOR.push([90,220,330,275],[90,175,255,270],[70,560,440,610],[390,650,560,740],[355,700,460,925],[70,835,460,925],[970,660,1100,790],[1060,735,1420,925],[1020,450,1160,600]);
Object.assign(HUB_SPOTS.find(s=>s.id==='armoury'),{at:{x:1100,y:485},r:55,lx:1100,ly:390});
Object.assign(HUB_SPOTS.find(s=>s.id==='bunk'),{at:{x:300,y:875},r:65,lx:260,ly:770});
Object.assign(HUB_SPOTS.find(s=>s.id==='training'),{at:{x:1210,y:825},r:75,lx:1230,ly:760});
HUB_NPCS.find(n=>n.id==='echo').y=790;
HUB_SPOTS.push({id:'hybrids',name:'Resonance greenhouse',verb:'Research combinations',at:{x:115,y:252},r:50,lx:145,ly:160,c:COL.boon},{id:'contracts',name:'Risk contracts',verb:'Set challenge',at:{x:1140,y:280},r:50,lx:1150,ly:180,c:COL.threat},{id:'variants',name:'Weapon variants',verb:'Modify style',at:{x:1350,y:565},r:55,lx:1350,ly:425,c:COL.volt});
const originalHubProgression=hubInteract;
hubInteract=function(){if(state==='hub'&&['hybrids','contracts','variants'].includes(hubNear?.spot?.id))return openProgression(hubNear.spot.id);originalHubProgression();};
let progressionKind=null;
function openProgression(kind){
 progressionKind=kind;state='hubmenu';keys.clear();show('#hubPrompt',false);
 if(!$('#mProgression')){const el=document.createElement('div');el.id='mProgression';el.className='scrim';el.innerHTML='<div class="panel progression-panel" role="dialog" aria-modal="true" aria-labelledby="progressionTitle"><span class="tag">Fortress preparation</span><h2 id="progressionTitle"></h2><p class="hint" id="progressionHint"></p><div class="progression-list" id="progressionList"></div><div class="row"><button type="button" class="btn primary" id="progressionClose">Done</button></div></div>';document.body.appendChild(el);$('#progressionClose').onclick=closeProgression;el.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')closeProgression();});}
 show('#mProgression',true);fillProgression();$('#progressionClose').focus();
}
function closeProgression(){show('#mProgression',false);progressionKind=null;hubMenuClosed();}
function progressionButton(title,desc,label,disabled,action){const b=document.createElement('button');b.className='style-card';b.type='button';b.disabled=disabled;b.innerHTML=`<strong>${title}</strong><span class="style-line">${desc}</span><span class="tag">${label}</span>`;b.onclick=()=>{action();writeSave();fillProgression();};$('#progressionList').appendChild(b);}
function fillProgression(){const kind=progressionKind;$('#progressionList').innerHTML='';
 if(kind==='contracts'){$('#progressionTitle').textContent='Risk contracts';$('#progressionHint').textContent=save.wins>0?'Optional handicaps apply on your next deployment. Every risk rank adds 10% Shards; win at Risk 3 or higher for one extra Hero Licence. Settings lock for that run.':'Complete one run to unlock optional handicaps and better rewards.';
  for(const c of CONTRACTS){const rank=selectedContracts()[c.id]||0;progressionButton(c.name,c.desc,`Rank ${rank}/3 · change`,!(save.wins>0),()=>{save.contracts={...selectedContracts(),[c.id]:(rank+1)%4};});}
  progressionButton('Clear contracts','Return all handicaps to zero for your next run.','Risk '+riskOf(selectedContracts()),!(save.wins>0),()=>save.contracts={});
 }else if(kind==='variants'){$('#progressionTitle').textContent='Weapon variants';$('#progressionHint').textContent=`Each unlocked combat style has a mechanical variant. Unlock once for 2 Hero Licences, then freely switch between the standard and modified style. Available: ${save.licences} licences.`;
  for(const [id,a] of Object.entries(ASPECTS)){const bought=!!save.aspectUnlocked?.[id],equipped=!!save.aspects?.[id];progressionButton(STYLES[id].name+' · '+a.name,a.desc,!styleUnlocked(id)?'Unlock the style first':!bought?'Unlock · 2 licences':equipped?'Variant equipped · use standard':'Standard equipped · use variant',!styleUnlocked(id)||(!bought&&save.licences<2),()=>{save.aspectUnlocked=save.aspectUnlocked||{};save.aspects=save.aspects||{};if(!bought){save.licences-=2;save.aspectUnlocked[id]=1;}save.aspects[id]=!equipped;});}
 }else{$('#progressionTitle').textContent='Hybrid resonance';$('#progressionHint').textContent=hybridsUnlocked()?'Discover combinations during a run: collect powers from both named heroes, then their comms offers may include the hybrid. Choose it instead of another power. No recipe is selected here.':'After five deployments and one completed run, hybrid powers can appear in comms offers during your runs.';
  for(const h of Object.values(HYBRIDS)){const card=document.createElement('article');card.className='style-card';card.innerHTML=`<strong>${h.name} · ${h.heroes.map(x=>SPEAKERS[x].name).join(' + ')}</strong><span class="style-line">${h.desc}</span><span class="tag">Discover during runs</span>`;$('#progressionList').appendChild(card);}
 }
}
