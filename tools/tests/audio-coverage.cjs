// Run after exporting dialogue and recording: node tools/tests/audio-coverage.cjs
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.join(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inventory=JSON.parse(read('tools/audio/lines.json')),manifest=JSON.parse(read('tools/audio/cast-v4-manifest.json'));
assert(Object.keys(inventory.sources||{}).length>=17,'Inventory must include source checksums');
for(const [p,hash] of Object.entries(inventory.sources))assert.equal(sha(read(p).toString().replace(/\r\n/g,'\n')),hash,'Dialogue inventory is stale: '+p);
const key=(who,text)=>{let h=0x811c9dc5;for(const b of Buffer.from(who+'|'+text)){h^=b;h=Math.imul(h,0x01000193)>>>0;}return who+'_'+h.toString(16).padStart(8,'0');};
const required=new Set();
for(const line of inventory.out){if(!line.text.replace(/[.\s…]/g,''))continue;const k=key(line.who,line.text);required.add(k);const m=manifest[k];assert(m,'Missing recording: '+line.who+' '+line.text);assert.equal(m.model,'eleven_v4');assert.equal(sha(read('assets/audio/voice/'+k+'.mp3')),m.sha256,'Recording checksum differs: '+k);assert.equal(m.text,line.text);}
const runtime=read('js/audio-manifest.js').toString();const active=JSON.parse(runtime.split('const VOICED = new Set(')[1].split(');')[0]);
assert.deepEqual(new Set(active),required,'Runtime voice registry must exactly match spoken inventory');
assert.deepEqual(new Set(Object.keys(manifest)),required,'Provenance must exactly match spoken inventory');
console.log('PASS complete speech coverage: '+required.size+' distinct lines, all Eleven v4, all files verified; dialogue inventory matches its sources.');
