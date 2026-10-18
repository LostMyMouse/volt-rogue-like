// Run in the game page with new Function(source)(). Inventory every voiced surface.
const out=[],add=(who,text,set)=>{if(who&&typeof text==='string'&&text.trim()&&!out.some(x=>x.who===who&&x.text===text))out.push({who,text,set});};
const pages=(owner,list,set)=>{for(const pg of list){if(Array.isArray(pg))add(pg[0]===''?owner:pg[0]==='v'?'volt':pg[0],pg[1],set);else if(typeof pg==='string')add(owner,pg,set);else add(pg.who||owner,pg.text,set);}};
for(const p of CUTSCENE)add(p.who,p.text,'cutscene');
for(const [id,list] of Object.entries(STORY.first))pages(id,list,'first');
for(const kind of ['encounter','comms'])for(const [id,entries] of Object.entries(STORY[kind]))for(const e of entries)pages(id,e.pages,e.id);
for(const [key,list] of Object.entries(MISSION))pages(null,list,'mission:'+key);
for(const [id,entries] of Object.entries(HUB_LINES))for(const e of entries){if(typeof e.text==='function')throw Error('Unbounded voiced template: '+e.id);pages(id,e.text,e.id);}
for(const [id,list] of Object.entries(HUB_IDLE))for(const t of list)add(id,t,'hub-idle');
for(const s of TUT_STEPS)add('bastion',s.say,'tutorial');
for(const [id,list] of Object.entries(RIVAL_TAUNTS))for(const t of list)add(id,t,'memory');
for(const [id,h] of Object.entries(HEROES)){add(id,h.first,'draft');for(const t of h.lines)add(id,t,'draft');}
add('patch',PATCH.first,'tech');for(const t of PATCH.lines)add('patch',t,'tech');
for(const [id,groups] of Object.entries(COMMS_LINES))for(const value of Object.values(groups))for(const t of Array.isArray(value)?value:[value])add(id,t,'comms-pool');
for(const id of [...Object.keys(HEROES),'patch'])add(id,'Fine. Something else, then.','reroll');
add('patch','Different crate, same rules.','reroll');
for(const [id,info] of Object.entries(CHARACTER_INTROS))add(id,info.first,'intro-fallback');
for(const [id,value] of Object.entries(VOLT_REPLIES)){if(typeof value==='string')add('volt',value,'intro-reply');else{add('volt',value.first,'intro-reply');for(const t of value.repeat)add('volt',t,'intro-reply');}}
for(const [id,b] of Object.entries(BOSSES)){
 if(b.intro){add(id,b.intro.first,'boss-fallback');for(const t of b.intro.repeat||[])add(id,t,'boss-fallback');}
 for(const t of b.quotes||[])add(id,t,'results');
 for(const list of Object.values(b.advice||{}))pages(id,list,'results-advice');
}
for(const list of Object.values(QUOTES))pages(null,list,'results');
for(const list of Object.values(BARKS))for(const t of list)add('volt',t,'bark');
return {n:out.length,chars:out.reduce((n,x)=>n+x.text.length,0),out};
