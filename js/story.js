// Volt: Story conversations that unfold across runs, Hades-style. Each villain encounter plays the
// highest-priority conversation you haven't heard whose condition holds; heroes do the same on comms
// before a boon offer. When a character runs out, they fall back to short repeat lines.
// Pages are [who, text]: '' is the conversation's owner, 'v' is Volt, anything else is that speaker
// (heroes cut in on comms during villain fights). Seen ids are saved in save.story.
'use strict';

const STORY = {
  // A hero's first call, the one time they get an intro card.
  first:{
    halo:[['',"Halo on comms. I have your feed. I can channel a little light through your suit. Choose how to use it."],['v',"Actual Halo backup. In my actual suit. Be cool, Volt. Be cool.",'pleased'],['',"You're narrating.",'pleased'],['v',"...Yep."]],
    bastion:[['',"Bastion on comms. Your suit has a shield channel. Take an upgrade and keep that relay in sight."],['v',"Right. Shield first. Heroic pose later."],['',"Just hold still and take the gear.",'stern']],
    echo:[['',"Echo here. Your suit can carry a psychic signal. Mine. Try not to make this weird."],['v',"You are literally in my head. I think weird has arrived.",'pleased'],['',"...Mostly.",'pleased']],
    thorn:[['',"Thorn on comms. I know these relay crews. My roots can help you keep them off your back."],['v',"Glad you are on this side of the call.",'pleased'],['',"Some days, so am I."]],
    patch:[['',"Patch here. A supply locker is waiting on this roof. Choose one piece of kit."],['v',"I'll try to break it less."],['',"You won't. But I appreciate the lie.",'pleased']],
  },
  encounter:{
    kilnheart:[
      {id:'kh_meet', when:c=>c.met===0, pages:[['',"Whoa, whoa. Hold up. You're the new kid? They sent the new kid?"],['v',"I prefer 'rookie'. Sounds more official."],['',"Kid, I've been running furnaces since before you had teeth. You know what happens to things that get too close to the fire?"],['v',"They... get warm?"],['',"They get warm.",'pleased']]},
      {id:'kh_killed', when:c=>c.lastKiller, pages:[['',"There they are. Feeling better? You were a little crispy last time.",'pleased'],['v',"I'm fine. Totally fine. Thanks for asking."],['',"I wasn't asking. I was gloating. There's a difference.",'pleased']]},
      {id:'kh_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"You came back. Huh. Gotta be honest, I had money on you quitting."],['v',"Who were you betting with?"],['',"Myself. I lost. I'm taking it out on you.",'stern']]},
      {id:'kh_beat1', when:c=>c.beat>=1, pages:[['',"Okay. Last time. That was a fluke, right? Tell me that was a fluke.",'stern'],['v',"A hundred percent skill.",'pleased'],['',"Great. Love that. Really great for my reputation.",'stern']]},
      {id:'kh_patch', when:c=>c.met>=2, pages:[['patch',"Volt, quick note. Kilnheart's suit runs at nine hundred degrees."],['v',"Is that a lot?"],['patch',"Don't hug it.",'stern'],['',"Is that the engineer? Hey! Nice work on the kid's suit. Real shame what's inside it.",'pleased'],['patch',"...Okay, that one was a little bit funny.",'pleased'],['v',"Patch.",'stern']]},
      {id:'kh_why', when:c=>c.beat>=2, pages:[['v',"Can I ask you something? Why him? Why work for the Redactor?"],['',"Twenty years I kept this city warm. Foundry shifts. Double shifts. Then they shut it down, and you know whose lights went out first?",'stern'],['v',"...Yours."],['',"Ours. He's the first guy who ever handed something back.",'stern'],['v',"He didn't hand it back. He's renting it to you.",'stern'],['',"...Yeah. Well. Rent's due tonight.",'stern']]},
      {id:'kh_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"So the rumour's true. The kid walked out of the tower."],['v',"Walked. Limped. Same thing.",'pleased'],['',"And yet here we are. Same roof. Same furnace."],['v',"You could just... not?"],['',"Ever tried switching off a furnace halfway through a melt? Doesn't end well for anybody. Let's go.",'stern']]},
    ],
    bellwether:[
      {id:'bw_meet', when:c=>c.met===0, pages:[['',"Oh, finally. An audience.",'pleased'],['v',"I'm here to stop you.",'stern'],['',"Everyone says that before the first song. Nobody says it after the encore."],['v',"Is it a long set?"],['',"Darling, it's a residency.",'pleased']]},
      {id:'bw_killed', when:c=>c.lastKiller, pages:[['',"Back for night two? The reviews from night one were... mixed.",'pleased'],['v',"I went down on, like, the third song."],['',"Fourth. You missed the bridge. It's the best part.",'pleased']]},
      {id:'bw_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"You know, most people who come to my shows buy a ticket."],['v',"Most people don't get a choice about hearing them."],['',"Ooh. A critic. I've eaten critics, sweetheart. Metaphorically. Mostly.",'pleased']]},
      {id:'bw_beat1', when:c=>c.beat>=1, pages:[['',"Last time. You found the gaps between the waves."],['v',"They were pretty big gaps."],['',"They were RESTS. They're called RESTS. They're a musical—",'stern'],['v',"They were gaps.",'pleased']]},
      {id:'bw_echo', when:c=>c.met>=2, pages:[['echo',"Volt, I'm in Bellwether's head. It's... really loud in here."],['',"Who is that? Get out of my headspace, there's no backstage access!",'stern'],['echo',"Go left when the bass drops. Also, they hum their own songs. Constantly.",'pleased'],['',"It's called PRACTICE.",'stern']]},
      {id:'bw_why', when:c=>c.beat>=2, pages:[['v',"Why the speakers? Why make the whole city listen?"],['',"You know how many empty rooms I sang to? Ten years of open mics. Bartenders talking over me. Phones out.",'stern'],['',"Now nobody talks over me."],['v',"That's not the same as somebody listening.",'stern'],['',"...Wow. You really know how to kill a vibe.",'stern']]},
      {id:'bw_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"The night you went into the tower, the whole city went quiet. Did you hear it?"],['v',"I was a little busy."],['',"I've never heard anything like it. It was horrible. It was... kind of beautiful."],['',"Ugh. Forget I said that. From the top!",'pleased']]},
    ],
    verdigris:[
      {id:'vg_meet', when:c=>c.met===0, pages:[['',"Mind the vines. They bite. Well. They don't bite. They just never let go.",'pleased'],['v',"That's somehow worse."],['',"Everything on this roof is slowly becoming mine. The pipes. The rails. You, if you stand still long enough."],['v',"Noted. Moving a lot. Got it."]]},
      {id:'vg_thorn', when:c=>c.met>=1, pages:[['thorn',"Volt. Don't. Let me talk to them.",'stern'],['',"Thorn? Thorn, is that you? On a hero frequency?"],['',"Oh, I need a minute. This is the best thing that's happened to me all year.",'pleased'],['thorn',"The Redactor's using you. Same way he used me.",'stern'],['',"And the heroes keep you in a glass box with a watering can. I've seen it, Thorn.",'pleased'],['thorn',"...Volt. Hit them hard.",'stern']]},
      {id:'vg_killed', when:c=>c.lastKiller, pages:[['',"Welcome back. There's still a little rust on your left shoulder. From last time.",'pleased'],['v',"That's not rust. It's... character.",'pleased'],['',"That's what everyone says right before they're compost.",'pleased']]},
      {id:'vg_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"You keep coming back here like a weed."],['v',"Isn't that your whole thing?"],['',"...Huh. I'll allow it.",'pleased']]},
      {id:'vg_beat1', when:c=>c.beat>=1, pages:[['',"You cut me back last time.",'stern'],['v',"You had it coming."],['',"Oh, no, I'm grateful. Plants grow back stronger when you prune them. You really should've read the manual.",'pleased']]},
      {id:'vg_thorn2', when:c=>c.beat>=1 && c.seen('vg_thorn'), pages:[['',"Can I ask you something? Does Thorn still have the little green one? In the blue pot?"],['v',"...How do you know about that?"],['',"Because I gave it to them. Back when we still grew things that were alive."],['v',"It's doing okay. It's actually doing really well.",'pleased'],['',"...Good. That's good. Now get off my roof.",'stern']]},
      {id:'vg_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"Something's changed since you went into the tower. The rust is slower. The vines are tired."],['v',"Sounds like you're losing."],['',"Sounds like the garden's changing. That's not the same thing."],['v',"Isn't it?"],['',"Ask me next season.",'pleased']]},
    ],
    glasswake:[
      {id:'gw_meet', when:c=>c.met===0, pages:[['',"Hi. Over here. No, over here. No, you know what? Pick one. I'll wait.",'pleased'],['v',"How about I just hit all of you?",'pleased'],['',"Ooh. Bold. Wrong, but bold.",'pleased']]},
      {id:'gw_echo', when:c=>c.met>=1, pages:[['echo',"Volt. The real one's the only one actually thinking. The copies are empty."],['',"Is that a mind reader? In my mirror maze? That's cheating.",'stern'],['echo',"You're thinking about your hair right now.",'pleased'],['',"I am NOT—",'stern'],['echo',"You are. A lot.",'pleased'],['v',"I'm going to hit the one thinking about its hair.",'pleased']]},
      {id:'gw_killed', when:c=>c.lastKiller, pages:[['',"Eleven. You hit my reflections eleven times last time. I counted.",'pleased'],['v',"You counted?"],['',"I had a lot of free time. You were lying down.",'pleased']]},
      {id:'gw_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"You're back! And still looking at the wrong me. Honestly, it's kind of sweet.",'pleased'],['v',"I'm working on it."],['',"Take your time. I've got plenty of me.",'pleased']]},
      {id:'gw_beat1', when:c=>c.beat>=1, pages:[['',"So. You broke me.",'stern'],['v',"Into a lot of pieces."],['',"Do you know how long it takes to find all the pieces? I'm still missing an elbow.",'stern']]},
      {id:'gw_why', when:c=>c.beat>=2, pages:[['v',"What happens when the mirrors are gone? Who's left?"],['',"Nobody you'd look at twice. I know. I checked. For years, nobody looked twice.",'stern'],['',"Now they can't stop looking."],['v',"I'm looking. Just at you, though.",'pleased'],['',"...Okay, that's annoying. Stop being sincere at me. It's very off-putting.",'stern']]},
      {id:'gw_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"So the Redactor's gone. Or a reflection of him is. Are you sure which one you hit?"],['v',"Pretty sure."],['',"'Pretty sure.' Adorable. That's how I get everybody.",'pleased']]},
    ],
    undertow:[
      {id:'ut_meet', when:c=>c.met===0, pages:[['',"Picked a bad night to go swimming, rookie.",'stern'],['v',"I didn't really pick it. I kind of just... landed here."],['',"Story of this whole district. Nobody chooses the docks. The docks choose you.",'stern']]},
      {id:'ut_bastion', when:c=>c.met>=1, pages:[['bastion',"Undertow.",'stern'],['',"Well, well. The old man's on comms. Still hiding up in your tower, Bastion?",'pleased'],['bastion',"I held these docks for six years.",'stern'],['',"And then you didn't. Funny how the water remembers that and you don't.",'stern'],['bastion',"Volt. Put this one on ice.",'stern'],['v',"Like, literally, or—"],['bastion',"Literally.",'stern']]},
      {id:'ut_killed', when:c=>c.lastKiller, pages:[['',"Nine seconds. That's how long you held your breath last time.",'pleased'],['v',"You were timing me?"],['',"Not a lot else to do down here."]]},
      {id:'ut_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"Back in the water. Brave, or stupid?"],['v',"Can I pick both?"],['',"Most people do. Usually right before the stupid part wins.",'pleased']]},
      {id:'ut_beat1', when:c=>c.beat>=1, pages:[['',"Last time you pulled me out of the water. Nobody's done that in a long time."],['v',"Maybe you needed it."],['',"Don't. Don't do the hopeful thing. The current hasn't changed.",'stern']]},
      {id:'ut_why', when:c=>c.beat>=2 && c.seen('ut_bastion'), pages:[['v',"Bastion said he used to guard this place. What happened?"],['',"The city decided the docks weren't worth the budget. Pulled the heroes. Then the flood came, and nobody answered the call.",'stern'],['',"The Redactor answered. Wasn't pretty. But he picked up.",'stern'],['v',"...I'm picking up now.",'stern'],['',"Yeah? Then prove it, rookie. Out here, sorry doesn't float.",'stern']]},
      {id:'ut_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"Tide's turning. Feel that? The Redactor's grip is slipping."],['v',"So let go."],['',"Not yet. Somebody's got to show me the water's safe first."],['v',"Okay. I'll show you.",'stern'],['',"...Yeah. We'll see."]]},
    ],
    gravemark:[
      {id:'gm_meet', when:c=>c.met===0, pages:[['',"Another one.",'stern'],['v',"Another... what?"],['',"Another small, loud hero on my roof. I have carved forty-one names. Yours will be forty-two.",'stern'],['v',"Can you at least spell it right? It's V-O-L-T.",'pleased'],['',"...I will consider it."]]},
      {id:'gm_halo', when:c=>c.met>=1, pages:[['halo',"Gravemark.",'stern'],['',"Halo. It has been a long time. You send children now?",'stern'],['halo',"I sent someone better than me."],['v',"Wait. Did you just—",'pleased'],['halo',"Focus.",'stern'],['v',"She totally did, though.",'pleased']]},
      {id:'gm_killed', when:c=>c.lastKiller, pages:[['',"Your name is half carved. V. O. L.",'pleased'],['v',"Please don't finish that.",'stern'],['',"The chisel is patient."]]},
      {id:'gm_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"The stone remembers you."],['v',"Good. Tell the stone I said hi.",'pleased'],['',"...The stone does not say hi.",'stern']]},
      {id:'gm_beat1', when:c=>c.beat>=1, pages:[['',"You broke me.",'stern'],['v',"Sorry? Actually, no. Not sorry.",'pleased'],['',"Do not apologise. A stone that is never broken never learns its shape."],['v',"Was that... encouragement?"],['',"It was geology.",'stern']]},
      {id:'gm_names', when:c=>c.beat>=2, pages:[['v',"The forty-one names. Who were they?"],['',"Heroes who climbed this roof before you. The city forgot them. I did not."],['v',"So you're kind of... a memorial?"],['',"Do not make it sound kind. I am still going to crush you.",'stern'],['v',"Sure. Sure. But it's a little bit kind.",'pleased']]},
      {id:'gm_won', when:c=>c.wins>=1 && c.met>=2, pages:[['',"You climbed past me. Into the tower. I felt it when the Redactor fell. The whole roof felt it."],['v',"Is that why you're being quiet?"],['',"Even stone listens, little spark. Now. Again."]]},
    ],
    redactor:[
      {id:'rd_meet', when:c=>c.met===0, pages:[['',"Ah, Volt. Such a promising file. And one complaint I would like to discuss in person.",'pleased'],['v',"Complaint? From who?"],['',"Mine. You have mistaken my patience for permission to enter.",'pleased'],['',"You think the lightning makes you brave. I shall remove it, and we can meet the person underneath."],['v',"Yeah, I'm going to have to decline.",'pleased'],['',"Of course you are. They all ask to keep something.",'stern']]},
      {id:'rd_halo1', when:c=>c.met>=1, pages:[['',"A small question, Volt. Before we begin. Indulge me."],['v',"...Sure?"],['',"Does Halo still stand on that balcony every night? Watching the city. Never looking down.",'pleased'],['v',"How do you know about the balcony?",'stern'],['',"Ask her who stood beside her. Watch her face when you do.",'pleased']]},
      {id:'rd_killed', when:c=>c.lastKiller, pages:[['',"You are breathing rather well, considering how we left things. Someone has been taking care of you.",'pleased'],['v',"Yeah, I get that a lot.",'pleased'],['',"I shall remember that. Someone ought to.",'pleased']]},
      {id:'rd_again', when:c=>c.met>=1 && c.beat===0, pages:[['',"Persistence is not a power, Volt. It is simply fear that has not recognised itself yet.",'stern'],['v',"It's kind of working, though.",'pleased'],['',"For the moment. I prefer to let a habit establish itself before I correct it.",'pleased']]},
      {id:'rd_beat1', when:c=>c.beat>=1, pages:[['',"I flagged your little victory. I have spent the interval learning exactly where you break.",'stern'],['v',"Flag this one too.",'pleased'],['',"With pleasure. This time, I shall be thorough.",'pleased']]},
      {id:'rd_halo2', when:c=>c.beat>=1 && c.seen('rd_halo1'), pages:[['',"She has not told you. How considerate. She always did know what people could bear.",'pleased'],['v',"Tell me what?",'stern'],['',"Halo and I were partners. Then the tower fell. There was time to make one choice. She made it while I was still calling her name.",'stern'],['',"The city was saved. I was left beneath it. She found the distinction quite manageable.",'stern'],['v',"...What was your name?"],['',"Redacted. There are things even she does not get to keep.",'stern']]},
      {id:'rd_why', when:c=>c.beat>=2, pages:[['v',"Why do this? Why take everyone's powers?"],['',"Because power lets a person decide who is worth saving. I have been on the other side of that decision.",'stern'],['',"Take it away, and the choosing stops. Every life is equally fragile. Even hers."],['v',"Everyone's helpless.",'stern'],['',"Yes. You understand me perfectly.",'pleased']]},
      {id:'rd_halo3', when:c=>c.beat>=2 && c.seen('h_partner2'), pages:[['halo',"That's enough.",'stern'],['',"Halo. I wondered how long you could bear to listen.",'pleased'],['halo',"I'm not here for you. I'm here for him.",'stern'],['',"Of course. There is always someone else to save while I am speaking.",'pleased'],['v',"Hey. Hi. Sorry. Can we save the reunion for after I punch him?",'pleased']]},
      {id:'rd_won', when:c=>c.wins>=2 && c.met>=2, pages:[['',"Twice you have left this room alive. You are beginning to mistake a pattern for a promise.",'stern'],['v',"You keep rebuilding it."],['',"Some rooms must be kept exactly as they were. She understands why.",'stern']]},
    ],
  },
  // Played on comms before a boon offer, at most once per hero per run.
  comms:{
    halo:[
      {id:'hc_feed', when:c=>c.runs>=1, pages:[['',"Halo here."],['v',"Halo? Hi! I mean, hey. Hi. Volt here.",'pleased'],['',"I know. I'm watching your feed."],['v',"Cool. Cool cool cool. No pressure."],['',"All pressure. Take the power.",'stern']]},
      {id:'hc_prove', when:c=>c.beatenAny, pages:[['',"You fight like you've got something to prove."],['v',"Don't I?"],['',"Not to me. To them. The ones watching from the windows."]]},
      {id:'hc_redactor', when:c=>c.seen('rd_halo1') && !c.seen('h_partner2'), pages:[['',"Whatever he told you about me. Finish the fight first.",'stern'],['v',"And then you'll tell me?"],['',"...Then I'll tell you."]]},
    ],
    bastion:[
      {id:'bc_over', when:c=>c.runs>=1, pages:[['',"Bastion. You're overextending.",'stern'],['v',"I'm being aggressive!",'pleased'],['',"You're being aggressive in the wrong direction. Here.",'stern']]},
      {id:'bc_twice', when:c=>c.runs>=3, pages:[['',"I've sent a lot of rookies out that gate."],['v',"Is this a pep talk?"],['',"You keep bringing the gear back. Most rookies only bring excuses. Don't make it weird.",'stern'],['v',"Too late. It's weird.",'pleased']]},
    ],
    echo:[
      {id:'ec_ask', when:c=>c.runs>=1, pages:[['',"Before you ask: no.",'pleased'],['v',"I wasn't going to ask anything."],['',"You were going to ask if I'm reading your mind."],['v',"...Are you?"],['',"Pick a power.",'pleased']]},
      {id:'ec_quiet', when:c=>c.runs>=4, pages:[['',"Can I tell you something weird?"],['v',"Always."],['',"Out there, your head goes really quiet. Focused. It's... nice.",'pleased'],['v',"Was that a compliment?"],['',"Absolutely not. Pick something.",'pleased']]},
    ],
    thorn:[
      {id:'tc_talk', when:c=>c.runs>=1, pages:[['',"Thorn. On comms."],['v',"Wow. You never call.",'pleased'],['',"I don't. I'm calling."],['v',"...Thanks, Thorn.",'pleased']]},
      {id:'tc_verd', when:c=>(c.metV.verdigris||0)>=1, pages:[['',"If you see Verdigris tonight—"],['v',"Go easy?"],['',"No. Don't. They'd never forgive you if you did.",'stern']]},
    ],
    patch:[
      {id:'pc_tape', when:c=>c.runs>=1, pages:[['',"Patch here. Your suit is currently held together by tape and optimism."],['v',"Mostly optimism?"],['',"Mostly tape.",'pleased']]},
      {id:'pc_41', when:c=>c.runs>=3, pages:[['',"Fun fact. I've started naming your suit repairs."],['v',"What's this one called?"],['',"Repair forty-one. 'Again.'",'pleased']]},
    ],
  },
};

// Which villain an attack id belongs to (bosses list their attacks in `cause`).
function villainOf(src){ for (const id in BOSSES) if (BOSSES[id].cause && BOSSES[id].cause[src]) return id; return null; }
function storyContext(owner){
  const met=(save.met&&save.met.villains)||{}, beaten=save.beaten||{}, last=save.last, killedBy=save.killedBy||{};
  const inRun = state!=='hub' && state!=='hubtalk' && state!=='hubmenu' && state!=='start';
  return {
    met:met[owner]||0, beat:beaten[owner]||0, killed:killedBy[owner]||0,
    lastKiller: !!(last && !last.won && villainOf(last.cause)===owner),
    runs: inRun ? Math.max(0,save.runs-1) : save.runs, wins:save.wins||0,
    beaten, beatenAny:Object.keys(beaten).length>0, metV:met,
    seen: id => !!((save.story&&save.story[id]) || (save.talk&&save.talk[id])),
  };
}
// The next conversation for `owner` in `kind`, marked as heard; null when there's nothing new.
function nextStory(kind,owner){
  const list=STORY[kind][owner]; if (!list) return null;
  const c=storyContext(owner), e=list.find(x=>!c.seen(x.id) && x.when(c));
  if (!e) return null;
  const pages=storyPages(owner,e.pages);pages.storyId=e.id;return pages;
}
function markStoryHeard(id){if(id){(save.story||(save.story={}))[id]=1;writeSave();}}
// An optional third entry picks the portrait: 'pleased' or 'stern' (neutral otherwise).
const storyPages = (owner,pages) => pages.map(([w,text,expression])=>({who: w==='' ? owner : w==='v' ? 'volt' : w, text, expression}));
