'use strict';
const SAVE_STYLES=['brawler','caster','titan','speedster','magnetar'];
const saveRecord=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
function freshSave(){return{v:1,shards:0,meta:{},runs:0,best:null,licences:0,unlocked:['brawler'],style:'brawler',met:{heroes:[],villains:{}},talk:{},beaten:{},last:null,story:{},killedBy:{},wins:0,comm:{}};}
function cleanSaveValue(value,depth=0){
 if(depth>12)throw Error('Save is too deeply nested');
 if(value===null||typeof value==='boolean')return value;
 if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid save number');return value;}
 if(typeof value==='string'){if(value.length>12000)throw Error('Save text is too long');return value;}
 if(Array.isArray(value)){if(value.length>1500)throw Error('Save list is too long');return value.map(v=>cleanSaveValue(v,depth+1));}
 if(!saveRecord(value))throw Error('Invalid save field');const out={};
 for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))continue;out[key]=cleanSaveValue(v,depth+1);}return out;
}
function normaliseSave(value){
 try{
  if(!saveRecord(value)||value.v!==1||typeof value.runs!=='number'||!Number.isFinite(value.runs)||value.runs<0)return null;
  for(const key of['meta','met','talk','beaten','story','killedBy','comm','contracts','aspects','aspectUnlocked'])if(key in value&&!saveRecord(value[key]))return null;
  if(value.unlocked!==undefined&&(!Array.isArray(value.unlocked)||value.unlocked.some(id=>!SAVE_STYLES.includes(id))))return null;
  if(value.met&&((value.met.heroes!==undefined&&!Array.isArray(value.met.heroes))||(value.met.villains!==undefined&&!saveRecord(value.met.villains))))return null;
  const s=Object.assign(freshSave(),cleanSaveValue(value));
  for(const key of['runs','shards','licences','wins']){if(typeof s[key]!=='number'||s[key]<0)return null;s[key]=Math.min(100000000,Math.floor(s[key]));}
  if(Object.values(s.meta).some(v=>typeof v!=='number'||v<0||v>100))return null;
  s.unlocked=[...new Set(['brawler',...s.unlocked])];if(!s.unlocked.includes(s.style))s.style='brawler';s.met={heroes:[],villains:{},...s.met};
  if(s.checkpoint&&!saveRecord(s.checkpoint))return null;return s;
 }catch{return null;}
}
