// Mirrors the playable game into the launcher repo, which Vercel serves at /games/volt.
// Usage: node tools/deploy-launcher.cjs [--check] [--launcher <path>]
//   --check   report drift and exit 1 if the launcher copy is out of date; changes nothing
// Line endings are ignored when comparing, so Git's CRLF conversion never shows up as drift.
const fs=require('fs'),path=require('path');
const args=process.argv.slice(2),check=args.includes('--check');
const li=args.indexOf('--launcher');
const root=path.join(__dirname,'..');
const launcher=li>=0?path.resolve(args[li+1]):path.join(root,'..','james-lost-his-mouse');
const dest=path.join(launcher,'games','volt');
const SHIPPED=['index.html','css','js','assets'];
const TEXT=/\.(html|css|js|json|txt|svg|md)$/i;
if(!fs.existsSync(dest)){console.error('Launcher copy not found: '+dest);process.exit(2);}
const walk=(base,rel)=>{const full=path.join(base,rel);if(!fs.existsSync(full))return[];if(fs.statSync(full).isFile())return[rel];
 return fs.readdirSync(full).flatMap(n=>walk(base,path.join(rel,n)));};
const same=(a,b)=>{if(!fs.existsSync(b))return false;const x=fs.readFileSync(a),y=fs.readFileSync(b);
 if(!TEXT.test(a))return x.equals(y);const s=t=>t.toString('utf8').replace(/\r\n/g,'\n');return s(x)===s(y);};
const source=new Set(SHIPPED.flatMap(p=>walk(root,p)));
const target=new Set(SHIPPED.flatMap(p=>walk(dest,p)));
const added=[],changed=[],removed=[];
for(const f of source){const t=path.join(dest,f);if(!fs.existsSync(t))added.push(f);else if(!same(path.join(root,f),t))changed.push(f);}
for(const f of target)if(!source.has(f))removed.push(f);
const report=(label,list)=>list.forEach(f=>console.log(label+' '+f.replace(/\\/g,'/')));
report('+',added);report('~',changed);report('-',removed);
const total=added.length+changed.length+removed.length;
if(!total){console.log('Launcher copy is up to date ('+source.size+' files).');process.exit(0);}
if(check){console.log(total+' file(s) out of date. Run without --check to sync.');process.exit(1);}
for(const f of[...added,...changed]){const t=path.join(dest,f);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(path.join(root,f),t);}
for(const f of removed)fs.rmSync(path.join(dest,f));
console.log('Synced '+total+' file(s) into '+dest+'. Commit and push the launcher repo to deploy.');
