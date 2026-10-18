// Run with: node tools/tests/composure.cjs (Node built-ins only).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({COL:{amber:'#fc0',spark:'#fff',volt:'#0af'},texts:[],fx:[],hitStop:0,addShake(){},sfx(){},BLOCK:{exposed:1.5},run:{style:'brawler'},isSpecBoss:e=>!!e.isBoss,bossExposed(e,d){e.bstate='EXPOSED';e.exposedFor=d;}});
for(const name of ['parry','composure'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js',name+'.js'),'utf8'),ctx);
function run(source){return vm.runInContext(source,ctx);}
run("var e={kind:'rusher',x:0,y:0,r:17,stunT:0};initComposure(e)");
assert.equal(run('e.composure'),70);
run("damageComposure(e,2,'attack')");assert.equal(run('e.composure'),68);
run("damageComposure(e,COMPOSURE.parry,'parry')");assert.equal(run('e.composure'),33);
assert(run("damageComposure(e,COMPOSURE.parry,'parry')"));
assert.equal(run('e.composure'),0);assert.equal(run('e.composureBrokenT'),3);assert.equal(run('e.exposedT'),3);
run('damageComposure(e,999)');assert.equal(run('e.composureBreaks'),1);
run('tickComposure(e,3.1)');assert.equal(run('e.composure'),70);assert.equal(run('e.composureBrokenT'),0);
run("var boss={kind:'undertow',isBoss:true,x:0,y:0,r:50,bstate:'WINDUP',stunT:0};initComposure(boss);for(let i=0;i<4;i++)damageComposure(boss,60)");
assert.equal(run('boss.bstate'),'WINDUP');assert.equal(run('boss.composure'),60);run('damageComposure(boss,60)');
assert.equal(run('boss.bstate'),'EXPOSED');assert.equal(run('boss.exposedFor'),3);
run("var shield={isPlate:true};damageComposure(shield,999)");assert.equal(run('shield.composure'),undefined);
run("var immune={invuln:true};damageComposure(immune,999)");assert.equal(run('immune.composure'),undefined);
run('damageComposure(e,20);tickComposure(e,4)');assert.equal(run('e.composure'),50);
run('tickComposure(e,2)');assert(run('e.composure>50&&e.composure<70'));
console.log('Composure checks passed: attacks, parries, breaks, boss interruption, recovery, immunity, prop exemptions and delayed regeneration.');
