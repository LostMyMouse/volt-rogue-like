// Weapon-bound hero channels. Qualified boon ids retain the established combat hooks,
// while each weapon adds a distinct physical delivery pattern to its active powers.
'use strict';
const WEAPON_CHANNELS={
 brawler:{noun:'Combo',strike:'The combo finisher adds an 85-range close impact for 10 damage.',power:'The first lightning target releases an 85-range close impact for 14 damage.',dash:'The dash leaves a short-range impact for 5 damage.',overload:'A second close impact deals 24 damage around you.'},
 caster:{noun:'Arc',strike:'Every fourth bolt forks to up to two other targets within 230 range for 10 damage each.',power:'Your lance sends two parallel piercing splinters, dealing 14 damage each.',dash:'The dash fires a short piercing splinter for 5 damage.',overload:'Overload adds two long parallel piercing splinters for 24 damage.'},
 titan:{noun:'Fault',strike:'Heavy hits send three delayed ground fractures forward for 10 damage each.',power:'The ground pound sends three delayed ground fractures forward for 14 damage each.',dash:'The dash starts a short ground fracture for 5 damage.',overload:'Overload sends a long three-stage ground fracture for 24 damage each.'},
 speedster:{noun:'Flash',strike:'Every fifth Flash leaves an afterimage that hits again after 0.28s for 10 damage.',power:'Blitz leaves three delayed afterimage hits for 14 damage each.',dash:'The dash leaves a delayed afterimage hit for 5 damage.',overload:'Overload leaves three delayed afterimages for 24 damage each.'},
 magnetar:{noun:'Orbit',strike:'Returning-disc hits leave an 80-range wake for 10 damage (at most once per 0.4s).',power:'Magnet Pull adds three 135-range orbit pulses for 14 damage each.',dash:'The dash leaves a circular disc wake for 5 damage.',overload:'Overload adds three 180-range orbit pulses for 24 damage each.'},
};
const CHANNEL_FLAVOUR={halo:'Solar',bastion:'Bulwark',echo:'Psychic',thorn:'Bramble'};
const CHANNEL_PAYLOAD={halo:'Channel hits also briefly blind enemies.',bastion:'Channel hits knock enemies back and give 20% Guard.',echo:'Channel hits mark enemies for 3s.',thorn:'Channel hits root for 0.35s and apply poison.'};
const BASE_BOONS=BOONS.slice();
for(const [weapon,channel]of Object.entries(WEAPON_CHANNELS))for(const base of BASE_BOONS){
 const extra=channel[base.slot],def={...base,id:weapon+'__'+base.id,baseId:base.id,weapon,name:base.slot==='passive'?channel.noun+' · '+base.name:CHANNEL_FLAVOUR[base.hero]+' '+({strike:channel.noun+' Strike',power:STYLES[weapon].powerLabel,dash:channel.noun+' Step',overload:channel.noun+' Overload'}[base.slot]),desc:(...args)=>base.desc(...args)+(extra?`<br><b>${extra}</b> ${CHANNEL_PAYLOAD[base.hero]}`:'')};
 BOONS.push(def);BOON_BY_ID[def.id]=def;
}
const baseHasChannel=has,baseValChannel=val;
has=function(id){return baseHasChannel(id)||baseHasChannel((run.style||'brawler')+'__'+id);};
val=function(id,key='v'){const actual=baseHasChannel(id)?id:(run.style||'brawler')+'__'+id;return baseHasChannel(actual)?baseValChannel(actual,key):0;};
let WEAPON_JOBS=[],WEAPON_FLASHES=[];
const resetWeaponChannels=reset;
reset=function(){WEAPON_JOBS=[];WEAPON_FLASHES=[];resetWeaponChannels();};
function weaponChannel(slot){const id=player.slots[slot]?.id;return id&&BOON_BY_ID[id]?.weapon?BOON_BY_ID[id]:null;}
function weaponInk(x,y,a,hero,weapon,size=95){WEAPON_FLASHES.push({x,y,a,hero,weapon,size,t:0,dur:.27});if(WEAPON_FLASHES.length>30)WEAPON_FLASHES.shift();}
function channelPayload(e,damage,a,hero){
 if(e.dead)return;damageEnemy(e,damage,a,hero==='bastion'?420:90,hero==='halo'?.25:0,{src:'weapon-channel',c:HEROES[hero].c});
 if(hero==='bastion')player.guard=Math.max(player.guard||0,20);
 if(hero==='echo')e.markT=Math.max(e.markT||0,3);
 if(hero==='thorn'&&!e.dead){rootEnemy(e,.35);poisonEnemy(e,1);}
}
function channelJob(delay,x,y,a,hero,damage,r,shape='circle',length=0,exclude=null){WEAPON_JOBS.push({delay,x,y,a,hero,damage,r,shape,length,exclude});}
function deliverWeaponChannel(mode,target,hero,damage){
 const p=player,weapon=run.style,a=p.aim,x=target?.x??p.x,y=target?.y??p.y;
 const gate=mode==='strike'?.4:mode==='dash'?.3:.9,key='channelAt_'+mode;
 if(run.time<(p[key]??-1))return;p[key]=run.time+gate;
 weaponInk(mode==='strike'?x:p.x,mode==='strike'?y:p.y,a,hero,weapon,mode==='overload'?200:100);
 if(weapon==='brawler')channelJob(0,x,y,a,hero,damage,mode==='overload'?160:85);
 else if(weapon==='caster'){
  if(mode==='strike'){for(const e of liveEnemies().filter(e=>e!==target&&Math.hypot(e.x-x,e.y-y)<230).sort((u,v)=>Math.hypot(u.x-x,u.y-y)-Math.hypot(v.x-x,v.y-y)).slice(0,2)){channelJob(.07,e.x,e.y,a,hero,damage,25);weaponInk(e.x,e.y,a,hero,weapon,65);}}
  else for(const offset of mode==='dash'?[0]:[-24,24])channelJob(.04,p.x-Math.sin(a)*offset,p.y+Math.cos(a)*offset,a,hero,damage,14,'line',mode==='overload'?700:420);
 }else if(weapon==='titan')for(let i=0;i<(mode==='dash'?1:3);i++)channelJob(.1+i*.12,p.x+Math.cos(a)*(70+i*100),p.y+Math.sin(a)*(70+i*100),a,hero,damage,65);
 else if(weapon==='speedster')for(let i=0;i<(['strike','dash'].includes(mode)?1:3);i++){const at=target||nearestEnemy(p.x,p.y,300);channelJob(.28+i*.14,at?.x??x,at?.y??y,a,hero,damage,55);}
 else if(weapon==='magnetar')for(let i=0;i<(['strike','dash'].includes(mode)?1:3);i++)channelJob(i*.28,mode==='strike'?x:p.x,mode==='strike'?y:p.y,a,hero,damage,mode==='strike'?80:mode==='overload'?180:135);
}
const channelStrikeHit=strikeHit;
strikeHit=function(e,...args){channelStrikeHit(e,...args);const c=weaponChannel('strike');if(!c)return;const p=player,w=run.style,ready=w==='brawler'?p.combo===2:w==='caster'?(p.shotN||0)%4===0:w==='speedster'?(p.hitN||0)%5===0:w==='magnetar'?p.disc?.state==='back':true;if(ready)deliverWeaponChannel('strike',e,c.hero,10);};
const channelPowerHit=powerHit;
powerHit=function(e,dmg,a,knock,stun,first,opt){channelPowerHit(e,dmg,a,knock,stun,first,opt);const c=weaponChannel('power');if(c&&first)deliverWeaponChannel('power',e,c.hero,14);};
const channelDash=doDash;
doDash=function(){const cd=player.dashCd;channelDash();const c=weaponChannel('dash');if(c&&player.dashCd>cd)deliverWeaponChannel('dash',null,c.hero,5);};
const channelSig=doSig;
doSig=function(){const before=player.sig;channelSig();const c=weaponChannel('overload');if(c&&before>=100&&player.sig<100)deliverWeaponChannel('overload',null,c.hero,24);};
const updateWeaponChannels=update;
update=function(dt){updateWeaponChannels(dt);for(const j of WEAPON_JOBS){j.delay-=dt;if(j.delay>0)continue;j.done=true;weaponInk(j.x,j.y,j.a,j.hero,run.style,j.shape==='line'?130:j.r*1.6);for(const e of liveEnemies()){if(e===j.exclude)continue;const dx=e.x-j.x,dy=e.y-j.y,along=dx*Math.cos(j.a)+dy*Math.sin(j.a),across=Math.abs(-dx*Math.sin(j.a)+dy*Math.cos(j.a));if(j.shape==='line'?along>=0&&along<=j.length&&across<=j.r+e.r:Math.hypot(dx,dy)<j.r+e.r)channelPayload(e,j.damage,j.a,j.hero);}}WEAPON_JOBS=WEAPON_JOBS.filter(j=>!j.done);};
const updateWeaponInk=updateFx;
updateFx=function(dt){updateWeaponInk(dt);for(const f of WEAPON_FLASHES)f.t+=dt;WEAPON_FLASHES=WEAPON_FLASHES.filter(f=>f.t<f.dur);};
const WEAPON_INK=new Image();WEAPON_INK.src='assets/effects/weapon-channels.webp';
const drawWeaponInk=drawFx;
drawFx=function(){drawWeaponInk();if(!WEAPON_INK.complete||!WEAPON_INK.naturalWidth)return;const cw=WEAPON_INK.naturalWidth/5,ch=WEAPON_INK.naturalHeight/4;for(const f of WEAPON_FLASHES){const col=['brawler','caster','titan','speedster','magnetar'].indexOf(f.weapon),row=['halo','bastion','echo','thorn'].indexOf(f.hero),k=f.t/f.dur;if(col<0||row<0)continue;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.globalAlpha=Math.min(1,(1-k)*2);const size=f.size*(.85+.2*k);ctx.drawImage(WEAPON_INK,col*cw+5,row*ch+5,cw-10,ch-10,-size/2,-size/2,size,size);ctx.restore();}};
// Twenty additional weapon techniques widen the pool beyond the slot channels.
const WEAPON_TECHNIQUES=[
 ['brawler','halo','sunfist','Sunfist',8,12,16,'Combo finishers burst for {v} light damage around their target.'],
 ['brawler','bastion','counterweight','Counterweight',12,18,24,'A perfect parry adds a {v}-damage close counterpunch.'],
 ['brawler','echo','doubletake','Double Take',8,12,16,'Combo finishers repeat after 0.3s for {v} psychic damage.'],
 ['brawler','thorn','knuckleroot','Knuckle Root',1,1.4,1.8,'Every combo finisher roots its target for {v}s.'],
 ['caster','halo','flarebolt','Flare Bolt',6,9,12,'Every fourth bolt detonates for {v} light damage in an 80-range area.'],
 ['caster','bastion','coverfire','Cover Fire',.08,.12,.16,'Bolt hits reduce your lance cooldown by {v}s, at most every 0.2s.'],
 ['caster','echo','seekingthought','Seeking Thought',2,3,4,'Bolts gently steer toward marked enemies within 260 range, at {v} radians per second.'],
 ['caster','thorn','seedround','Seed Round',4,6,8,'Every fourth bolt plants a 2s poison field dealing {v} damage per second.'],
 ['titan','halo','sunwake','Sunwake',6,9,12,'Heavy impacts leave a 2s light field dealing {v} damage per second.'],
 ['titan','bastion','anchored','Anchored',20,25,30,'Take {v}% less damage while recovering from a heavy Strike.'],
 ['titan','echo','afterfault','Afterfault',10,15,20,'Heavy impacts repeat as a 120-range aftershock after 0.4s for {v} damage.'],
 ['titan','thorn','rootfault','Root Fault',1,1.4,1.8,'Heavy impacts root enemies within 95 range for {v}s.'],
 ['speedster','halo','dazzlingpace','Dazzling Pace',.3,.45,.6,'Every fifth Flash blinds enemies within 110 range for {v}s.'],
 ['speedster','bastion','slipguard','Slipguard',.12,.18,.24,'Every fifth Flash grants {v}s of invulnerability.'],
 ['speedster','echo','pursuit','Pursuit Echo',6,9,12,'Every fifth Flash sends an echo to another nearby target for {v} damage.'],
 ['speedster','thorn','tripwire','Living Tripwire',4,6,8,'Every fifth Flash leaves a 2s thorn field dealing {v} damage per second.'],
 ['magnetar','halo','suncatch','Suncatch',10,15,20,'Catching your returning disc releases a 100-range light burst for {v} damage.'],
 ['magnetar','bastion','retrievalguard','Retrieval Guard',15,20,25,'Returning disc hits give {v}% Guard.'],
 ['magnetar','echo','resonantreturn','Resonant Return',6,9,12,'Returning disc hits deal {v} extra damage to marked targets.'],
 ['magnetar','thorn','barbedreturn','Barbed Return',.4,.6,.8,'Returning disc hits root their target for {v}s and poison it.'],
];
for(const [weapon,hero,key,name,...rest]of WEAPON_TECHNIQUES){const[v0,v1,v2,description]=rest,def={id:weapon+'__'+key,weapon,hero,slot:'passive',name,v:[v0,v1,v2],technique:true,desc:v=>description.replace('{v}',`<b>${v}</b>`)};BOONS.push(def);BOON_BY_ID[def.id]=def;}
function technique(key){return val((run.style||'brawler')+'__'+key);}
const strikeTechniques=strikeHit;
strikeHit=function(e,...args){strikeTechniques(e,...args);const p=player,w=run.style,a=p.aim,now=run.time;
 if(w==='brawler'&&p.combo===2&&now>=(p.techniqueAt||0)){p.techniqueAt=now+.35;if(technique('sunfist'))channelJob(0,e.x,e.y,a,'halo',technique('sunfist'),85);if(technique('doubletake'))channelJob(.3,e.x,e.y,a,'echo',technique('doubletake'),55);if(technique('knuckleroot')&&!e.dead)rootEnemy(e,technique('knuckleroot'));}
 if(w==='caster'){if(technique('coverfire')&&now>=(p.coverAt||0)){p.coverAt=now+.2;p.powerCd=Math.max(0,p.powerCd-technique('coverfire'));}if((p.shotN||0)%4===0&&now>=(p.techniqueAt||0)){p.techniqueAt=now+.4;if(technique('flarebolt'))channelJob(0,e.x,e.y,a,'halo',technique('flarebolt'),80);if(technique('seedround'))zones.push({kind:'thorns',x:e.x,y:e.y,t:0,dur:2,dps:technique('seedround'),r:65,c:HEROES.thorn.c});}}
 if(w==='titan'&&now>=(p.techniqueAt||0)){p.techniqueAt=now+.5;if(technique('sunwake'))zones.push({kind:'light',x:e.x,y:e.y,t:0,dur:2,dps:technique('sunwake'),r:85,c:HEROES.halo.c});if(technique('afterfault'))channelJob(.4,e.x,e.y,a,'echo',technique('afterfault'),120);if(technique('rootfault'))for(const t of liveEnemies())if(Math.hypot(t.x-e.x,t.y-e.y)<95)rootEnemy(t,technique('rootfault'));}
 if(w==='speedster'&&(p.hitN||0)%5===0&&now>=(p.techniqueAt||0)){p.techniqueAt=now+.35;if(technique('dazzlingpace'))for(const t of liveEnemies())if(Math.hypot(t.x-e.x,t.y-e.y)<110)t.stunT=Math.max(t.stunT,technique('dazzlingpace'));if(technique('slipguard'))p.iT=Math.max(p.iT,technique('slipguard'));if(technique('pursuit')){const next=nearestEnemy(e.x,e.y,220,[e]);if(next)channelJob(.2,next.x,next.y,a,'echo',technique('pursuit'),30);}if(technique('tripwire'))zones.push({kind:'thorns',x:e.x,y:e.y,t:0,dur:2,dps:technique('tripwire'),r:75,c:HEROES.thorn.c});}
 if(w==='magnetar'&&p.disc?.state==='back'){if(technique('retrievalguard'))p.guard=Math.max(p.guard||0,technique('retrievalguard'));if(technique('resonantreturn')&&e.markT>0&&!e.dead)damageEnemy(e,technique('resonantreturn'),a,0,0,{src:'return-channel'});if(technique('barbedreturn')&&!e.dead){rootEnemy(e,technique('barbedreturn'));poisonEnemy(e,1);}}
};
const parryTechniques=onParry;
onParry=function(...args){parryTechniques(...args);if(technique('counterweight'))channelJob(0,player.x,player.y,player.aim,'bastion',technique('counterweight'),110);};
const hurtTechniques=hurtPlayer;
hurtPlayer=function(damage,...args){return hurtTechniques(damage*(player.strikeCd>0?1-technique('anchored')/100:1),...args);};
const updateTechniques=update;
update=function(dt){const prev=player.disc?.state;if(run.style==='caster'&&technique('seekingthought'))for(const s of shots){const target=liveEnemies().filter(e=>e.markT>0&&Math.hypot(e.x-s.x,e.y-s.y)<260).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];if(target){const a=Math.atan2(s.vy,s.vx),desired=Math.atan2(target.y-s.y,target.x-s.x),turn=clamp(angDiff(desired,a),-technique('seekingthought')*dt,technique('seekingthought')*dt),speed=Math.hypot(s.vx,s.vy);s.vx=Math.cos(a+turn)*speed;s.vy=Math.sin(a+turn)*speed;}}
 updateTechniques(dt);if(run.style==='magnetar'&&prev==='back'&&player.disc?.state==='held'&&technique('suncatch'))channelJob(0,player.x,player.y,player.aim,'halo',technique('suncatch'),100);
};
