// Fails when docs/override-map.md no longer matches the scripts: run node tools/override-map.cjs to refresh it.
const {execFileSync}=require('child_process'),path=require('path');
execFileSync(process.execPath,[path.join(__dirname,'..','override-map.cjs'),'--check'],{stdio:'inherit'});
