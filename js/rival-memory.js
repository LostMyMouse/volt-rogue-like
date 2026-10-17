// Villains remember every defeat in the active save slot, even after another villain ends a later run.
'use strict';
const RIVAL_TAUNTS={
 kilnheart:["Back already? I only just scraped your confidence off the furnace.","Same jacket? Brave choice. It was medium-well when you left.","I remember you. The rookie with the excellent smoke alarm impression."],
 bellwether:["My favourite returning audience. You spent the last encore on the floor.","You came back! The reviews said my last performance was absolutely flattening.","No need to bow this time, darling. Last time you never got back up."],
 verdigris:["Oh, you survived the compost heap. Most things come back as tomatoes.","Your little dent in the moss is still here. I kept it watered.","Welcome back. The vines have been asking about their favourite chew toy."],
 glasswake:["I remember that face. So do all my reflections. We had a lovely laugh.","Back for another look? Last time the floor got most of your attention.","Do try hitting the right one. Watching you lose to my reflection was embarrassing for both of us."],
 undertow:["Back again? I've had driftwood put up more of a fight.","You left a lovely Volt-shaped dent on my dock. Mind stepping in it again?",
 "I remember you. All that lightning, and you still went out like a wet match."],
 gravemark:["I remember you. The roof remembers you. The dent is still there.","Your name is already carved. This saves time.","You return. The stone remains unimpressed."],
 redactor:["Volt. You remember the floor, I trust. You were so reluctant to leave it.","I wondered whether you would return. Recovery can do such unkind things to a person's judgment.","You have rehearsed what you will say to me. How touching. Last time, you became very quiet."],
};
function rivalMemory(id){
 if(!(save.killedBy?.[id]>0)||!RIVAL_TAUNTS[id])return null;
 const told=run.rivalTaunts||(run.rivalTaunts={});if(told[id])return null;
 const cursors=save.tauntCursor||(save.tauntCursor={}),index=cursors[id]||0;
 cursors[id]=index+1;told[id]=true;
 return {who:id,text:RIVAL_TAUNTS[id][index%RIVAL_TAUNTS[id].length],expression:'pleased'};
}
