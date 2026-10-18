// The operation's through-line. Facts and outcomes stay consistent across repeat runs.
'use strict';
const MISSION = {
  brief:[
    ['bastion','Three district relays feed the tower shield. Choose a route, beat their operators, and we can reach Gravemark.'],
    ['volt','Three relays. One enormous doorman. Then the Redactor.'],
    ['patch','Your suit can channel the team\'s power remotely. Choose the upgrades they offer. The link burns out when I extract you.'],
    ['halo','He has our power signatures. Outside the Fortress shield, he can drain us. Yours is still unregistered. That gives you a chance.'],
    ['volt','Finally. A useful reason for all my missing paperwork.'],
    ['bastion','If you go down, Patch pulls you out. We regroup, repair, and try another route. We do not leave you there.'],
    ['halo','Reach his control room. Shut down the drain. Bring the stolen power home.'],
  ],
  retry:[
    ['patch','Extraction worked. Your borrowed upgrades burned out, but the permanent suit repairs held.'],
    ['patch','I changed your suit signature again. His scanners will have to start over.'],
    ['bastion','His crews have reconnected the relays. We know more than we did last time. Pick our next route.'],
    ['volt','Same job. Better plan. Preferably fewer dents.'],
  ],
  return:[
    ['bastion','The main drain is down, but his backup relays are coming online. This is a new operation.'],
    ['patch','Fresh suit signature. Fresh support link. He does not get an easy lock on you.'],
    ['halo','You brought people\'s powers back. Now we keep them back.'],
    ['volt','Then let\'s find the next switch.'],
  ],
  gravemark:[
    ['patch','Three relays offline. The tower shield is open. Gravemark is the last guard between you and the control room.'],
    ['volt','Of course the last lock has fists.'],
  ],
  tower:[
    ['bastion','Gravemark is down. The Redactor is above you. Keep climbing.'],
    ['halo','Whatever he says, you are there to stop the drain. Stay on that.'],
  ],
  victory:[
    ['patch','The drain is offline. Stolen power is returning across the city.'],
    ['volt','And the Redactor?'],
    ['halo','Escaped through his backup network. You stopped this operation. We will find the rest.'],
    ['bastion','Extraction inbound. Bring our rookie home.'],
    ['volt','Our rookie. I heard that.'],
  ],
};
function missionPages(key){return MISSION[key].map(([who,text])=>({who,text}));}
function missionBrief(done){
  const complete=()=>{save.missionBriefed=1;writeSave();done();};
  const key=!save.missionBriefed?'brief':save.last?.won?'return':'retry';
  runDialogue(missionPages(key),'Operation briefing',complete);
}
function missionArrival(id,done){
  const key=id==='gravemark'?'gravemark':id==='redactor'?'tower':null;
  if(key)runDialogue(missionPages(key),'Mission update',done);else done();
}
