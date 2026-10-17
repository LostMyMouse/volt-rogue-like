const out=[], add=(who,text,set)=>{ if (who && text && !out.some(x=>x.who===who&&x.text===text)) out.push({who,text,set}); };
for (const p of CUTSCENE) add(p.who,p.text,'cutscene');
for (const id in STORY.first) for (const [w,t] of STORY.first[id]) add(w===''?id:w==='v'?'volt':w,t,'first');
for (const id in STORY.encounter){ const entries=id==='redactor'?STORY.encounter[id]:STORY.encounter[id].slice(0,1); for (const e of entries) for (const [w,t] of e.pages) add(w===''?id:w==='v'?'volt':w,t,id==='redactor'?e.id:'meet'); }
for (const s of TUT_STEPS) add('bastion',s.say,'tutorial');
for (const id in RIVAL_TAUNTS) for (const line of RIVAL_TAUNTS[id]) add(id,line,'memory');
for (const id in HUB_LINES){ const e=HUB_LINES[id][0]; for (const pg of e.text){ if (typeof pg==='string') add(id,pg,'hub'); else add(pg.who||id,pg.text,'hub'); } }
return {n:out.length, chars:out.reduce((a,x)=>a+x.text.length,0), out};
