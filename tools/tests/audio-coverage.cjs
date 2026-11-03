// Run after exporting dialogue and recording: node tools/tests/audio-coverage.cjs
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.join(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inventory=JSON.parse(read('tools/audio/lines.json')),manifest=JSON.parse(read('tools/audio/cast-v4-manifest.json'));
assert(Object.keys(inventory.sources||{}).length>=17,'Inventory must include source checksums');
// Source checksums only say *whether* code changed. When they differ, re-export the spoken lines and fail
// only if the dialogue itself changed, so ordinary code edits don't need an inventory refresh.
const jsFiles=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?jsFiles(dir+'/'+e.name):e.name.endsWith('.js')?[dir+'/'+e.name]:[]);
const current=jsFiles('js').sort(),stale=current.filter(p=>inventory.sources[p]!==sha(read(p).toString().replace(/\r\n/g,'\n'))).concat(Object.keys(inventory.sources).filter(p=>!current.includes(p)));
if(stale.length){
 const os=require('os'),{spawnSync}=require('child_process'),tmp=path.join(os.tmpdir(),'volt-lines-'+process.pid+'.json');
 const r=spawnSync(process.execPath,[path.join(root,'tools/audio/export-inventory.cjs')],{env:{...process.env,VOLT_INVENTORY_OUT:tmp},encoding:'utf8',windowsHide:true});
 assert.equal(r.status,0,'Could not re-export dialogue inventory:\n'+(r.stderr||r.stdout));
 const fresh=JSON.parse(fs.readFileSync(tmp,'utf8'));fs.rmSync(tmp,{force:true});
 const said=l=>l.who+'|'+l.text,before=new Set(inventory.out.map(said)),after=new Set(fresh.out.map(said));
 const added=[...after].filter(x=>!before.has(x)),removed=[...before].filter(x=>!after.has(x));
 assert(!added.length&&!removed.length,'Spoken lines changed; run node tools/audio/export-inventory.cjs and record any new lines.\n'+added.slice(0,10).map(x=>'+ '+x).concat(removed.slice(0,10).map(x=>'- '+x)).join('\n'));
 console.log('Note: '+stale.length+' source file(s) changed since the inventory export, but every spoken line is identical.');
}
const key=(who,text)=>{let h=0x811c9dc5;for(const b of Buffer.from(who+'|'+text)){h^=b;h=Math.imul(h,0x01000193)>>>0;}return who+'_'+h.toString(16).padStart(8,'0');};
const required=new Set();
for(const line of inventory.out){if(!line.text.replace(/[.\s…]/g,''))continue;const k=key(line.who,line.text);required.add(k);const m=manifest[k];assert(m,'Missing recording: '+line.who+' '+line.text);assert.equal(m.model,'eleven_v4');assert.equal(sha(read('assets/audio/voice/'+k+'.mp3')),m.sha256,'Recording checksum differs: '+k);assert.equal(m.text,line.text);}
const runtime=read('js/audio-manifest.js').toString();const active=JSON.parse(runtime.split('const VOICED = new Set(')[1].split(');')[0]);
assert.deepEqual(new Set(active),required,'Runtime voice registry must exactly match spoken inventory');
assert.deepEqual(new Set(Object.keys(manifest)),required,'Provenance must exactly match spoken inventory');
console.log('PASS complete speech coverage: '+required.size+' distinct lines, all Eleven v4, all files verified; dialogue inventory matches its sources.');
