# Volt roguelite — seven-boss gameplay specification

> **Revision 2 (2026-10-14).** Changes from the original spec:
>
> - **Run structure is non-linear.** Each run picks 3 of the 5 district villains through a branching city map, then Gravemark, then The Redactor. See *Run structure*.
> - **Block and parry is Volt's core mechanic.** Every attack component is now classed as **parryable** or **super**, every boss has at least one of each, and a perfect parry is the only way to stagger a boss. See *Block and parry*.
> - **Glasswake gains Shard Lunge and Undertow gains Glacier Hook**, so every boss has a parry moment.
> - **Reference values now match the game:**
>   - Dash cooldown 0.8s, dash distance 4 units, post-hit invulnerability 0.6s.
>   - Boss HP ×1.5, because Volt's reference damage is ~65/s, not 40/s.
>   - 1 unit = 50px.
> - **The Redactor steals from the villains you beat this run**, so the final fight changes with every route.
> - **Null Field now names what it suppresses:** Power and Overload are blocked; Strike, Dash and Block stay available.

## Purpose and implementation assumptions

Implement seven original bosses for a single-player top-down action roguelite: Kilnheart, Bellwether, Verdigris, Glasswake, Undertow, Gravemark, and The Redactor. The Redactor is the main story antagonist and final boss. Gravemark is always the penultimate encounter. The other five form the district pool described under *Run structure*.

This is a proposed gameplay design derived from the approved concept art. Numbers are starting values for implementation and playtesting, not measured balance results. Use the existing game's movement, combat and damage systems if available; adapt these reference values proportionally rather than replacing working systems. Keep the timings and geometry relationships intact.

**Reference player (matches the current game):**
- 100 HP, 5.8 units/second movement, 0.32-unit ground collision radius.
- About 65 sustained single-target damage/second before upgrades (Brawler style; other styles are tuned to land within ±20%).
- Dash: travels 4 units over 0.16 seconds, invulnerable for its full duration, cooldown **0.8 seconds**. Fortress tech and boons can lower the cooldown toward 0.45s; fairness checks must assume 0.8s.
- Dash still collides with solid walls and stops at the last valid point.
- **Strike** is the repeatable basic attack, and its reach depends on combat style: about 1.6 units for melee styles, up to 11 units for Arc Caster bolts.
- **Power** and **Overload** are the special abilities. **Block** is always available; see *Block and parry*.
- No boss requires an optional upgrade to beat.

**World scale:** 1 unit = 50 world pixels in the current game (its 1500 × 1000 px rooftop is 30 × 20 units). Arena is 28 × 20 units, centered at (0,0), with player bounds inset by collision radius. Coordinates, distances and hazards use ground positions, regardless of sprite height. Roof edges are solid; knockback cannot throw the player off the roof. Central combat floor has no permanent obstacles. Edge props must leave a continuous traversable loop at least 2 units wide. Use a fixed simulation timestep and seconds for all attack timers.

**Reference difficulty:** regular bosses should take roughly 50–100 seconds at reference damage, depending on attack uptime; the final boss roughly 120–180 seconds. Test without upgrades first. This document covers boss gameplay, the run route and a debug harness. Wider progression (Fortress, licences, Threat Level) is specified elsewhere.

## Run structure (non-linear)

Each run is **five villains**: three district villains, then Gravemark, then The Redactor. The route changes every run so it never feels linear.

1. **City map choice.** After the opening rooftops, and after each district boss, Volt picks the next district from **two villain-marked gates** drawn from the unbeaten district pool (Kilnheart, Bellwether, Verdigris, Glasswake, Undertow). The player sees which villain each gate leads to, the same way Hades' doors show their rewards. Across a run, 3 of the 5 are fought, giving 60 possible ordered routes.
2. **Districts.** Each district is about 4 rooms with jump-point choices, then its villain's arena. Each district has its own rooftop dressing and enemy mix matched to its villain (foundry roofs for Kilnheart, a flooded dockside for Undertow, and so on).
3. **Fixed finale.** After the third district: Gravemark's district (about 4 rooms plus the boss), then the Redactor's tower (2 rooms plus the boss).
4. **Route-dependent story.** Villains reference who you've already beaten. The Redactor's stolen attacks come from the villains defeated this run. Skipped villains can appear later as optional "elite" rooms in later runs.
5. **Difficulty by position, not identity.** A district boss fought third gets one Threat-style modifier (for example, +15% HP) compared with one fought first. Gap sizes and warning times never shrink.

**Not fixed by this spec:** room counts per district and how often elite or story rooms appear. Tune those in playtesting.

## Shared encounter rules

### State machine and damage

Every boss uses `INTRO -> REPOSITION -> WINDUP -> ACTIVE -> RECOVERY`, with `PHASE_CHANGE` and `DEAD` overriding normal scheduling.

- INTRO: 1.5 seconds, boss invulnerable, no attacks or hazards. Player can move. Display name and health bar.
- REPOSITION: move to the attack's desired position at the listed move speed for at most 1.5 seconds. Clamp destinations inside the arena. Move directly on clear ground or use existing navigation. If a prop blocks the destination, choose the nearest accessible point; attack from the reached position at timeout. Facing can turn freely here.
- WINDUP: show the exact damaging footprint, play the distinct cue, and lock aim at the specified time. Boss cannot start another attack.
- Boss ground position stays fixed during WINDUP and ACTIVE unless the attack explicitly charges, teleports or otherwise moves. Facing may track only until aim lock. All attack geometry is ground-based.
- ACTIVE: spawn damaging hitboxes/projectiles. Frozen telegraphs must match damage geometry. Any expanding/rotating geometry must have a visible direction and speed cue.
- RECOVERY: the boss cannot move or attack. Player can safely punish. Recovery begins after the primary attack's last damaging emission; previously spawned projectiles and explicitly persistent hazards can remain.
- Boss takes normal damage during REPOSITION, WINDUP, ACTIVE and RECOVERY unless an explicit exception is listed. Recovery does not multiply incoming damage. The only damage multiplier is **Exposed**, which comes from a perfect parry (see *Block and parry*). Player damage never interrupts a boss attack. Only a perfect parry staggers.
- Ordinary boss body contact deals no damage. Only explicit attack hitboxes do damage. Boss bodies have solid collision, but cannot trap Volt against an edge: when overlap would pin Volt, separate the bodies toward accessible floor. Player attacks may hit the boss body normally.
- Each discrete attack component has a unique damage source ID and may hit the player only once per activation. A player has 0.6 seconds of invulnerability after taking damage. Repeated ticks use the interval stated for that hazard; global invulnerability still applies. No damage or status application during dash invulnerability.
- Projectiles disappear on player hit or solid wall hit, and expire after 4 seconds unless otherwise stated. Use swept collision for fast projectiles and dash movement.
- A successful damaging hit applies its listed status. A dash through that hit does not apply the status. Reapplying slow refreshes duration; slow magnitudes do not add together. Pull and slow are evaluated from current ground position.
- Only one primary boss attack runs at a time. Persistent hazards can coexist only where a boss explicitly allows them. No ordinary enemies spawn in these prototype encounters.

### Targeting and telegraphs

- `snapshotPlayer()` captures the player's current ground position. Predictive targeting is not used in the first implementation.
- A targeted ground footprint tracks the player for the first 60% of WINDUP, then freezes for the final 40%, with at least 0.30 seconds of frozen warning. If this minimum cannot fit, freeze earlier. Aim never changes after the warning becomes solid.
- For facing attacks, rotate toward the player until aim lock. For a dash or charge, display the complete swept path before execution.
- All telegraph durations below are WINDUP durations. ACTIVE durations and RECOVERY are separate and do not overlap unless specified.
- Dangerous floor areas have an outlined boundary and patterned interior. Safe gaps remain visibly unfilled. Use shape and animation as well as color: wedges, circles, rings, lanes and crosshatching must be distinguishable without color alone.
- Outline = warning; a brief fill pulse at activation = damaging. Hazards retain a recognizable filled pattern while dangerous. Never make harmless scenery look like an attack footprint.
- Screen shake, particles and camera effects must not obscure boundaries. No camera rotation during combat.

### Block and parry (Volt's core mechanic)

Every damaging attack component has a `parryClass`.

| Class | Typical attacks | Required readable cue | Player answers |
|---|---|---|---|
| **parryable** | Melee swings, punches, lunges, charges, single projectiles | During the final 0.25s of WINDUP (or in flight, for projectiles) a **white glint ring contracts onto the attacker or projectile** and closes exactly on the damage frame. The cue uses shape and motion, never colour alone. | Perfect parry, block, or dodge |
| **super** | Rings, sectors, disks, lanes, beams, pools, pulls, waves | The standard outlined footprint, plus a **jagged hazard border**. Never a glint. | Dodge only |

**Volt's responses to a parryable component:**
- **Perfect parry:** Block pressed within the **0.12s before** the damage frame. The accessibility setting adjusts this window from 0.08s to 0.25s. No damage and no status. Projectiles are reflected at the attacker and deal 2× their listed damage to it. A melee or charge source becomes **Exposed** for 1.5s: it takes +50% damage, and its next scheduled action is deferred by the exposed time. This doesn't stack with recovery and is the only way to stagger a boss. Each parry also adds 15% Overload charge.
- **Block held** (raised before the window): 40% of listed damage, no status, knockback halved. Three blocked hits within 2s cause a **guard break**: block is disabled for 0.6s.
- **No block (failed parry):** the full listed damage. Listed damage for parryable components is already the "hit harder" value.
- **Whiffed parry:** pressing block with nothing incoming leaves block on a 0.35s recovery. Dash is still available.

**Volt's responses to a super component:**
- **Dodge:** dash invulnerability or simply leaving the footprint.
- **Blocking a super:** **Shattered**. Volt takes full damage plus a 0.5s stun, and block can't be used for 1.0s. This teaches the rule quickly.

**Rules for designers:**
- Every boss has at least one parryable and one super component in every phase.
- Multi-hit parryable attacks (Double Punch, Double Driver and so on) are parried hit by hit. Only parrying the **final** hit makes the boss Exposed.
- A parryable component and a super component may overlap in time only when the super's safe area doesn't require standing in the parryable's path.

### Phases, interruption and cleanup

- Regular bosses: phase 1 above 60% HP, phase 2 at 60% or below, phase 3 at 30% or below. Final boss thresholds are 70% and 40%.
- Queue a phase transition when a threshold is crossed. Finish the current primary attack and its recovery, then transition. At an attack boundary, move directly to the highest reached phase; do not run multiple transitions if damage crossed several thresholds.
- PHASE_CHANGE lasts 1.2 seconds: clear boss projectiles and persistent hazards, cancel pending spawns, make boss invulnerable, display the new phase, and reset its attack sequence. Keep HP damage already dealt. The player may move and dash.
- If boss HP reaches zero, DEAD interrupts immediately, including mid-attack. Remove its hazards, projectiles, forces, temporary obstacles, decoys, slow and suppression effects, and pending timers. Disable boss collision and attacks. Trigger completion exactly once.
- Encounter reset restores all HP, phases, counters, cooldowns, temporary geometry and deterministic seed. Re-entering the arena cannot inherit old hazards.

### Fairness constraints

- Before placing a persistent hazard, preserve an accessible clear route at least 2 units wide between player and a safe area. Never place hazards inside permanent props or beneath an occupied solid object.
- For aimed attacks, freeze the warning early enough that Volt can reach at least one safe point using current movement speed and currently available dash. For a reference walking escape, maximum distance is `currentSpeed × remainingWarningTime`; account for collision radius and obstacle path length. Do not assume dash is available when it is on cooldown.
- For attacks layered with persistent zones, evaluate the combined geometry, including slow and temporary barriers. If placement is invalid, try another valid placement. If none exists, choose the boss's single uncomplicated attack and clear expired hazards; do not execute a guaranteed-hit pattern.
- Pull never cancels player input. Forced movement is collision-resolved and cannot exceed the specified cap. Do not pair an unavoidable pull with a fully closed damage ring.
- Use boss-specific gap dimensions below as minimums. Increase them for player hitbox differences; never shrink them with difficulty scaling.

## Starting balance and suggested encounter order

| Slot | Boss | HP (×1.5) | Body radius | Move speed | Core test |
|---|---|---:|---:|---:|---|
| District pool | Kilnheart | 1,800 | 0.9 | 2.8 | Commit, dodge sideways, punish recovery, parry punches |
| District pool | Bellwether | 2,000 | 0.8 | 2.6 | Read moving gaps and dash timing |
| District pool | Verdigris | 2,200 | 0.7 | 2.4 | Preserve space against persistent hazards |
| District pool | Glasswake | 2,000 | 0.6 | 3.4 | Identify real target, avoid beam lanes, parry the lunge |
| District pool | Undertow | 2,500 | 1.0 | 2.1 | Navigate temporary barriers and slow, parry the hook |
| Penultimate | Gravemark | 2,850 | 1.0 | 2.0 | Manage pull, orbiting debris and open sectors |
| Final | The Redactor | 5,400 | 0.9 | 2.5 | Disable shields, keep moving, combine learned skills |

HP is scaled ×1.5 from the original spec to match Volt's ~65/s reference damage. The *Build order* below still uses the original sequence (Kilnheart first) because it introduces attack primitives in a sensible order.

For the first prototype, each phase uses the fixed repeating attack sequence listed below. Reset sequence to its first entry on phase change. Use deterministic seeded randomness only for valid positions and initial gap angles. Skip ineligible cooldown-limited attacks and advance to the next entry; if all are ineligible, reposition/wait 0.3 seconds and check again. Cooldowns begin when the primary attack finishes. Exposed/stagger windows defer the next scheduled action and do not stack with ordinary recovery.

Attack-specific cooldowns default to zero in this specification: warning, execution, recovery, hazard restrictions and the sequence provide the pacing. Do not add a hidden cooldown or a generic idle delay. Angles are degrees; sector angles in tables are full opening widths, centered on the locked facing. Ring thickness is the full radial width, centered on the moving radius. Display projectile-spoke previews in multi-projectile windups alongside the primary footprint.

## 1. Kilnheart — heat and pressure

**Player experience:** a close-range bruiser who chases Volt, commits to an attack, then leaves a generous punish window. Most damage comes from staying in front of her. Her silhouette and furnace glow make impending attacks easy to read.

**Positioning:** between attacks, approach until 3 units from Volt on a slightly curving path, then side-step around Volt for 0.35–0.75s before committing (still within the 1.5s REPOSITION cap). Don't chase through RECOVERY. No passive armour or damage reduction.

**Movement during wind-ups (Revision 2 playtest change):**
- Furnace Punch: she creeps toward Volt at 1.2 units/s while aim is tracking, then lunges 1 unit during ACTIVE into a 3.5-unit sector. The total forward reach is unchanged at 4.5 units, and the telegraph shows the lunge end point.
- Boiler Rush: she rears back at 0.9 units/s while aim is tracking.
- All movement stops when aim locks, so the frozen warning is always accurate.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Furnace Punch | 0.85s | 70° frontal sector, radius 4.5; damaging for 0.15s | 20 damage, 1.5-unit knockback; RECOVERY 1.1s | Move to either side after aim locks; attack her back during recovery |
| Boiler Rush | 1.1s | Warning lane width 2.0, up to 9 units long; charge at 12 units/s along frozen lane; stop on wall or after full distance | 24 damage, one hit; RECOVERY 1.4s | Sidestep instead of retreating along the lane |
| Pressure Slam | 1.0s | Fixed boss-centered disk radius 3.2; impact active 0.15s, then eight evenly spaced radial projectiles at 6 units/s, radius 0.18 | Impact 22; projectile 12; RECOVERY 1.3s | Leave the disk, then stand between projectiles or dash through one |

**Phases and sequence**

- P1: Punch → Punch → Rush.
- P2: Punch → Slam → Rush. Punch leaves its sector heated for 3 seconds, dealing 6 damage every 0.75s. Only one heated sector may exist: it expires before another Punch begins.
- P3: Punch → Rush → Slam → Double Punch. Double Punch is two separately telegraphed Punches: first WINDUP 0.85s, impact 0.15s, second WINDUP 0.75s with fresh aim lock, impact 0.15s, final RECOVERY 1.5s. Each hit deals 18. Furnace floor heat appears only after the second punch. Other timings stay unchanged.

**Parry classes:**
- Furnace Punch and Double Punch: parryable.
- Boiler Rush: parryable. A parry stops the charge dead and makes her Exposed.
- Pressure Slam: the impact disk is a super; the eight radial projectiles are parryable and reflect.
- Heated floor: a super zone.

**Weakness:** after Rush and Slam, the furnace vents visibly open during recovery. This is a visual punish cue; it does not create hidden damage multipliers.

**Acceptance:** Rush never tracks after locking. Double Punch must have two warnings. The heated floor never overlaps a newly warned Rush lane in a way that removes all walking exits.

## 2. Bellwether — sonic force

**Player experience:** a rhythmic arena-control fight. Volt moves toward gaps in waves instead of simply fleeing the boss. Deliberate pauses reward dash discipline.

**Positioning:** prefer the arena center. Between attacks move toward center until within 1 unit. If center is occupied by Volt, stop at least 2 units away.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Broken Ring | 1.0s | Ring starts at radius 1.5 and expands at 4 units/s to radius 14; band thickness 0.6; two opposite 50° safe gaps fixed before execution | 16 damage once per ring; RECOVERY 0.8s after ring reaches max radius | Walk into a gap; dash through band if timing is good |
| Focused Burst | 0.8s | 40° frontal cone, radius 10; active 0.2s | 20 damage, 1-unit knockback; RECOVERY 1.1s | Get outside the cone during its locked warning |
| Resonator Drop | 1.0s | Mark two ground disks radius 1.5, centered 4 units apart around a captured player position; both pulse at activation for 0.15s | 18 damage each; RECOVERY 1.0s | Leave the two marked spots; no lingering damage |

**Phases and sequence**

- P1: Ring → Burst → Ring.
- P2: Ring → Drop → Burst → Twin Ring. Twin Ring emits two rings 1.4 seconds apart. Both have the same two fixed gaps, both shown in the original warning. First and second rings each deal 14; recovery starts when the second finishes expanding.
- P3: Twin Ring → Burst → Drop → Turning Ring. Turning Ring uses a single ring whose two 60° gaps rotate together at 18°/second. Initial angles and rotation arrows are shown for 1.0s before expansion. Damage 16. No Drops or Bursts overlap a ring.

**Parry classes:**
- Focused Burst: **parryable**. A parry "sends the sound back" and makes her Exposed. Give it the glint cue on her gauntlets.
- Broken Ring, Twin Ring, Turning Ring and Resonator Drop: super.

**Weakness:** after Focused Burst, her speaker gauntlets hang open during recovery. Her body remains hittable while rings expand, giving ranged basic attacks useful uptime.

**Acceptance:** collision uses an annulus excluding the gap angles. An expanding ring cannot hit twice. At 14-unit radius, each gap remains passable with player collision margins. Turning gaps have clear arrows and constant speed.

## 3. Verdigris — living metal and toxic growth

**Player experience:** a patient zoning boss that poisons useful space. Volt wins by rotating around the arena, baiting pools away from the center and breaking dangerous growths.

**Positioning:** keep 5–7 units from Volt. Move away if closer than 5, toward Volt if farther than 7, for the shared 1.5s maximum. Clamp to reachable floor.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Corrosive Seed | 0.9s | One marked disk radius 1.6 tracks then locks; impact 0.15s, pool persists 5s | Impact 10; pool 5 damage every 0.75s; RECOVERY 0.8s | Bait it toward edges; move once marker locks |
| Metal Vine Sweep | 0.9s | Frozen 100° frontal sector radius 6, active 0.2s; no homing tendril collision | 18 damage; RECOVERY 1.1s | Stay outside reach or move behind Verdigris |
| Thorn Growth | 1.2s | Three small buds spawn on marked spots 3 units from boss; after an additional visible 1.5s growth warning each fires three projectiles at 7 units/s, angles -15°, 0°, +15° toward captured player position, then disappears | Bud HP 20; projectiles 10 damage; RECOVERY 0.9s after all buds fire or are destroyed | Destroy buds before firing or avoid the clearly aimed fan |

**Persistent rules:** max three pools, total duration 5s. When cap would be exceeded, oldest pool visibly fades for 0.4s before new pool activates. Pool overlap does not multiply ticking damage: share one `verdigris_acid` damage interval per player. Buds have no solid collision; they are damageable targets, not trapping walls.

**Phases and sequence**

- P1: Seed → Vine → Seed.
- P2: Seed → Thorns → Vine → Seed. Thorns unlock.
- P3: Twin Seed → Vine → Thorns → Seed. Twin Seed places two disks 3.8 units apart, centered around the captured player position on a seeded random axis. Both have 1.1s warning and activate simultaneously. Other values unchanged; pool cap remains three.

**Parry classes:**
- Metal Vine Sweep: parryable.
- Thorn projectiles: parryable. Reflected thorns can destroy buds.
- Corrosive Seed and its pools: super.

**Weakness:** destroying all three buds before any fire creates a 1.5s exposed pause after the attack. The pause replaces its normal 0.9s recovery. Damage to buds contributes no damage to boss HP.

**Acceptance:** basic attacks can select buds. Pool timers continue during other attacks. Thorns lock individual aim 0.4s before firing. Hazard placement never seals the central route.

## 4. Glasswake — refraction and hard-light deception

**Player experience:** an agile trickster who creates apparently identical threats. The real boss always has consistent tells; success comes from observation, not guessing.

**Positioning:** maintain 4–6 units of distance. Her three back mirrors always orbit close to her body. Decoy mirrors orbit clockwise; real mirrors orbit counterclockwise. The real boss has a continuous white ground shadow/ring outline; decoys have a visibly broken magenta outline. These cues are always visible, including during attacks.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Prism Lanes | 1.0s | From boss, three straight beams at -35°, 0°, +35° relative to locked aim; length 12, width 0.65; active 0.35s | 18 damage once per beam; RECOVERY 1.0s | Stand between lanes or move behind the origin |
| Mirror Step | 1.0s | Warn a destination disk radius 2.0 at a reachable point 5–8 units from current position; teleport there at activation and pulse disk for 0.15s | 16 damage; RECOVERY 1.1s | Avoid destination marker, then punish arrival |
| Shard Lunge *(new)* | 0.7s | Locked lane width 1.2, length 4. She lunges along it at 14 units/s and slashes at the end; slash hitbox radius 1.0, active 0.15s. Glint cue on her blade arms. | 16 damage; RECOVERY 1.0s | **Parry it** to shatter her guard (Exposed 1.5s), or sidestep the lane |
| Refraction | 1.2s | Real boss stays visible; spawn two decoys 4 units away at angles ±110° from direction to player. All three warn one parallel 0.65-wide, length-10 beam each. After a separate 1.0s beam warning, fire for 0.3s, then decoys dissolve | Every beam deals 14, including decoy beams; RECOVERY 1.2s | Identify real boss for damage, but respect every warned lane |

**Decoy rules:** decoy HP 1; one successful attack destroys one. Decoy deaths never reduce boss HP. Destroying a decoy cancels its warning and beam immediately. Mark it dissolved before removing its collision to avoid a frame of invisible danger. Real boss remains vulnerable throughout. No forced target swapping or target lock onto decoys. Decoys have no body collision.

**Phases and sequence**

- P1: Lanes → Lunge → Step → Lanes.
- P2: Refraction → Lunge → Step → Lanes.
- P3: Refraction → Lunge → Lanes → Double Step. Double Step performs two complete Steps: first warning 1.0s + pulse, 0.4s pause, second warning 0.9s + pulse; final recovery 1.5s. Second destination is chosen only when its warning begins. Keep at most two decoys and three simultaneous beam lanes in Refraction.

**Parry classes:**
- Shard Lunge: parryable.
- Prism Lanes, Mirror Step arrival pulse and Refraction beams: super.
- Decoys never use Shard Lunge, so a lunging Glasswake is always the real one: a second, skill-based tell.

**Weakness:** all teleports announce their destination; her recovery starts after materialization, so Volt can dash into punish range without guessing.

**Acceptance:** real target indicators survive particle effects. Decoy beams can hurt but cannot remain after decoy death. Refraction beam arrangement leaves an accessible safe lane; if three proposed lanes trap Volt, move a decoy or use only two emitters.

## 5. Undertow — water pressure and ice

**Player experience:** a bulky controller who changes arena routes. Volt chooses between breaking ice, slipping through openings and dashing across sweeping jets.

**Positioning:** approach to 4 units, then stop. Temporary ice is neutral geometry: it blocks Volt, Undertow and projectiles. Undertow must navigate around it rather than silently pass through.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Pressure Jet | 1.0s | Straight beam length 10, width 1.0; aim freezes before firing. Beam then rotates 60° over 1.2s, with direction and full sweep sector previewed | 16 damage once; on hit slow movement by 25% for 1.5s; RECOVERY 1.0s | Move behind boss or outside sweep; dash through beam |
| Ice Divide | 1.2s | Two collinear wall segments, each length 3 and thickness 0.7, with a 3-unit gap between them. Place across captured player-facing axis, 4 units in front of boss; wall grows at activation and lasts 5s | Each segment HP 40; no spawn damage; RECOVERY 0.8s | Walk through center gap or destroy a segment |
| Glacier Hook *(new)* | 0.9s | Steps 1 unit forward, then a 90° frontal sector of radius 3.0 with his ice fist; active 0.15s. Glint cue on the fist. | 20 damage, 1.5-unit knockback; RECOVERY 1.2s | **Parry it** to crack the gauntlet (Exposed 1.5s), or get behind him |
| Depth Charge | 1.0s | Targeted disk radius 2.3; impact active 0.15s | 20 damage, 1-unit knockback, slow 25% for 1.5s; RECOVERY 1.2s | Leave locked disk; avoid waiting behind ice too long |

**Ice rules:** max two wall segments at once. Any old pair visibly melts for 0.4s before a new Ice Divide activates. Walls cannot spawn overlapping player, boss, roof props or one another. Shift placement to a valid position before displaying warning; if invalid after lock because an actor enters the warning, suppress the occupied segment rather than push or entomb them. Melted or destroyed ice ceases collision on the same simulation tick it disappears. Slow never changes dash distance or dash cooldown.

**Phases and sequence**

- P1: Jet → Hook → Charge → Jet.
- P2: Divide → Hook → Charge → Jet. Ice Divide unlocks.
- P3: Divide → Hook → Double Charge → Jet. Double Charge creates two distinct target disks sequentially: each has 1.0s warning and 0.15s impact, with 0.4s pause between them; final recovery 1.4s. Both deal 18. Jet sweep increases to 90° over 1.5s; minimum warning stays 1.0s.

**Parry classes:**
- Glacier Hook: parryable.
- Pressure Jet, Depth Charge and Double Charge: super.
- Ice Divide: no damage, so no class.

**Weakness:** damageable ice gives Volt a tactical choice. Destroy both segments within 2 seconds of their creation and Undertow's next primary attack is delayed by an additional 1.0s, once per wall pair. This does not interrupt an attack already active.

**Acceptance:** slow does not stack above 25%. Ice must leave a legal escape route even if Volt is slowed and dash is unavailable. Jet collision follows its displayed rotating line and stops at ice or solid props.

## 6. Gravemark — gravity manipulation

**Player experience:** a heavy controller who pulls Volt toward dangerous ground and surrounds himself with orbiting rubble. Volt must distinguish force zones from damage zones and use open sectors to escape.

**Positioning:** prefer center, approaching until within 2 units of it. Huge rocky gauntlet and split shoulder frame remain readable from above.

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Gravity Well | 1.0s | Targeted disk radius 3.5 persists 4s. Inside: inward pull capped at 1.5 units/s, strongest near center. A separate inner disk radius 1.2 visibly charges for the last 0.8s before detonation | Pull itself deals no damage; final inner disk deals 20 once; RECOVERY 0.8s after placing well | Walk against weak pull or dash out; stay outside inner disk at detonation |
| Debris Orbit | 1.1s | Five visible rubble projectiles orbit radius 3.2 around boss for 2.4s, at 90°/s. Each rubble radius 0.35. Initial positions and orbit arrows warned. Then all rubble flies radially outward at 7 units/s, expiring after 2s | Each rubble 14 damage, one source ID retained from orbit through flight; RECOVERY 1.1s after release | Stay outside orbit, read gaps, avoid outward spokes at release |
| Mass Driver | 1.0s | Gauntlet fires one large rock down a frozen lane, width 1.4, speed 9 units/s | 24 damage, 1.5-unit knockback; RECOVERY 1.2s after emission | Sidestep lane and punish gauntlet recovery |
| Collapse Ring | 1.2s | Boss-centered annulus from radius 2.0 to 7.0 warns; leave one 80° safe sector pointing toward captured player position. Entire filled annulus pulses at activation for 0.2s | 22 damage; RECOVERY 1.3s | Move into open sector or outside radius 7; boss inner radius 2 is also safe |

**Force rules:** pull magnitude = `1.5 × clamp(1 - distance/3.5, 0, 1)` units/s. Add it to intended walking velocity; collision-resolve the result. Dash ignores pull throughout its duration. Max one well. Well has no solid collision. Gravity Well may coexist with Mass Driver but never with Orbit or Collapse Ring. If next scheduled attack is Orbit or Collapse and well remains, wait until it expires before WINDUP.

**Phases and sequence**

- P1: Well → Driver → Orbit.
- P2: Well → Driver → Collapse → Orbit. Collapse unlocks. Keep the fixed 80° opening.
- P3: Well → Double Driver → Orbit → Collapse. Double Driver fires two separate rocks: first 1.0s warning, emission, 0.35s pause, second 0.85s warning with fresh snapshot, emission; final recovery 1.5s. Each deals 20. Orbit has six rocks instead of five; radius and speed unchanged. Well strength does not increase.

**Parry classes:**
- Mass Driver and Double Driver rocks: **parryable**. A reflected rock hits Gravemark for 2× damage and makes it Exposed.
- Released Debris Orbit rubble: parryable, individually.
- Gravity Well detonation and Collapse Ring: super. The pull itself is a force, not a hit.

**Weakness:** rocky gauntlet opens after Driver, and orbit discharge leaves a clear moment to dash toward Gravemark during recovery. No armor/shield meter is required.

**Acceptance:** escape by ordinary movement remains possible while pulled. Orbit damage never covers its full ring as an invisible continuous wall. The gap in Collapse is safe from the moment the attack activates. Well detonation is independently warned even while Driver runs.

## 7. The Redactor — main antagonist / final boss

**Story and player experience:** the architect of the city's power-draining network. He collects abilities from defeated villains and decides who may retain powers. His fight tests the movement and reading skills learned earlier, then turns them against a clearly signposted suppression system. His rectangular ivory mask, black floating plates and crimson effects distinguish him from the district bosses.

**Encounter structure:** three phases at 70% and 40% HP. At phase start spawn six floating plates evenly spaced on a radius-4 ring around him. During phase 1 they rotate at 20°/s; during phases 2–3 at 30°/s. Plate rotation pauses while a plate is directly involved in an attack warning. Plates have 30 HP each and do not collide with actors. Player basic attacks can hit them. Each surviving plate reduces damage received by The Redactor by 5%, multiplicatively applied as a single `1 - 0.05 × survivingPlates` factor: six plates = 30% reduction, zero plates = 0%. Plates do not respawn within the same phase.

**Shield counterplay:** destroying the final plate cancels his current primary attack and all hazards immediately, then creates a 2.0s exposed pause. The Redactor takes normal damage with no reduction, but no bonus multiplier. If a phase transition is already queued, run that transition first and omit the old phase's exposed pause. One final-plate break event per phase.

**Positioning:** use four anchors: (-6,-4), (6,-4), (6,4), (-6,4). Between attacks move toward the next anchor in clockwise order, using the shared 1.5s limit. Stay grounded; floating artwork does not bypass collision. If anchor is occupied/blocked, use nearest accessible position. Plate world positions follow boss movement.

### Native attacks

| Attack | WINDUP | Execution / ACTIVE | Damage and recovery | Counterplay |
|---|---:|---|---|---|
| Redaction Lanes | 1.1s | Three crimson-white beams at angles 0°, 120°, 240° from locked base aim; length 14, width 0.8; active 0.35s | 20 each; RECOVERY 1.1s | Move into wide sectors between lanes; attack during pause |
| Null Field | 1.2s | Fixed disk radius 4.5 centered on captured player position persists 4s. Boundary is broken crimson with crosshatched interior; on enter display SUPPRESSED | No damage. Inside, **Power and Overload** can't be activated. Strike, Block, walking and dash still work. Entering mid-charge (Arc Caster's Lance) cancels the charge without starting its cooldown. A Magnetar disc already in flight finishes its path. RECOVERY 0.9s after placement | Leave field to regain specials; keep fighting with basic attack and dash |
| Final Verdict | 1.5s | Around boss, warn an annulus radius 2–10 with two opposite 65° safe sectors; at activation filled annulus pulses for 0.2s. After 0.5s, fire one Redaction Lanes attack with its own full 1.1s warning | Ring 24; beams 20; RECOVERY 1.6s after beams | Reach a sector or inner safe disk, then respond to the second distinct warning |

**Suppression rules:** field does not drain resources, cancel an active dash, cancel an ability already running, change cooldown progression, reduce basic attack damage, disable healing pickups, or disable movement. On leaving the field, restore special activation immediately. Max one field. Null Field may coexist only with Redaction Lanes; clear it before starting any stolen attack or Final Verdict. No shield plate is required to sustain the field. Avoid placing the field across every reachable safe sector of an upcoming beam pattern.

### Stolen attacks

Only unlocked in phase 2. **He uses only the abilities of villains Volt defeated this run** (the three district villains plus Gravemark), so the final fight changes with every route. Stolen attacks keep their original `parryClass`. Reuse shared attack components, recolored with a crimson outer edge while retaining the original power's recognizable inner hue. Name the incoming ability briefly above the health bar. Each has its own complete warning and recovery; do not merge telegraphs or inherit persistent hazards from a previous copied attack.

| Stolen ability | Exact reusable behavior |
|---|---|
| Borrowed Furnace | Kilnheart's single Furnace Punch: 0.85s warning, 70°, range 4.5, 20 damage, 1.1s recovery. No floor heat. |
| Borrowed Resonance | Bellwether's single Broken Ring: 1.0s warning, radius 1.5→14 at 4 units/s, two opposite 50° gaps, 16 damage, 0.8s recovery after completion. |
| Borrowed Growth | Verdigris's single Corrosive Seed: 0.9s warning, radius 1.6, impact 10, ticking 5 every 0.75s, shortened pool duration 3s, 0.8s recovery. Wait for pool expiry before another stolen attack. |
| Borrowed Refraction | Glasswake's Prism Lanes: 1.0s warning, three beams at ±35° and 0°, length 12, width 0.65, 0.35s active, 18 damage, 1.0s recovery. No decoys. |
| Borrowed Tide | Undertow's single Depth Charge: 1.0s warning, radius 2.3, 20 damage, slow 25% for 1.5s, 1.2s recovery. No ice walls. |
| Borrowed Gravity | Gravemark's single Mass Driver: 1.0s warning, width 1.4, speed 9 units/s, 24 damage, 1.2s recovery. No gravity well. |

**Phases and sequence**

- P1: Lanes → Field → Lanes. Teach native beam sectors and suppression. Plates are the visible shield objective.
- P2: Stolen A → Lanes → Stolen B → Field → Lanes. Advance through a repeating stolen-ability list built from this run's defeated villains, in the order Volt beat them, then Gravity. Maintain a global index within this phase, so A and B are successive entries. Wait for copied pool expiry where required. Plates respawn only on entering the phase.
- P3: Verdict → Stolen A → Lanes → Stolen B → Field → Lanes. Reset the stolen index to Gravity, then continue through this run's list. All original warning times remain intact. Final Verdict unlocks; damage does not silently increase.

**Plate interactions:** plate damage is separate from boss HP and never triggers boss phase thresholds. Plate hits stop ordinary non-piercing projectiles; optional piercing attacks can pass through according to existing weapon rules. Area attacks may damage each plate and the boss once per source activation. The combined shield reduction is recalculated immediately on plate death. Destroyed plates disappear from every view and cannot produce invisible collision.

When Null Field must be cleared before another pattern, fade its warning fill for 0.3s without starting the next WINDUP; then remove suppression and continue. A copied acid pool must expire naturally before another stolen attack, as specified above. Final Verdict clears any residual copied pool before its warning begins. Plates pause their rotation for Redaction Lanes and Final Verdict windups and execution; resume during recovery. Their orbit otherwise remains cosmetic shield-target movement, not a damaging hazard.

**Parry classes:**
- Redaction Lanes and Final Verdict: super.
- Stolen attacks: as in their source boss. Borrowed Furnace and Borrowed Gravity are parryable, and a parried Borrowed Gravity rock can break a plate in one hit.
- The Redactor has no native parryable attack. Parry moments come only from stolen powers, so the final fight tests what this run taught you.

**Victory:** stop encounter systems immediately at zero HP; drop the energy core, remove suppression, and fire one final-boss completion event. A brief story beat can show the city's neon power returning. Keep the actual narrative/cutscene implementation separate from combat.

**Acceptance:** suppression never disables basic combat or dash. Breaking the last plate always produces the specified interrupt/phase behavior. Copied attacks retain their known shapes and full warning times. Final Verdict has two separate readable warnings. No phase uses simultaneous stolen primary attacks.

## Shared implementation contract

Implement within the current engine and project architecture. Do not choose a new engine or rewrite the player controller merely to fit this spec. Keep design data editable separately from AI scheduling and attack geometry. Useful conceptual components:

- `BossController`: HP, phase thresholds, state machine, encounter lifecycle, movement intent, sequence index and queued phase transition.
- `AttackDefinition`: stable ID, warning duration, active duration, recovery duration, damage, **parryClass per component**, target mode, aim-lock time, geometry parameters, status effects and persistence policy.
- `AttackInstance`: captured origin/aim, warning footprint, elapsed time, unique damage source IDs, spawned objects, cleanup ownership. Tracking origin follows boss only while explicitly allowed; frozen ground footprints stay world-fixed.
- `EncounterContext`: boss, player, arena bounds, props, seed, active hazards and owned temporary actors.
- `TelegraphRenderer`: reads the same geometry data used by hit detection; no independent hand-authored damaging footprint.
- `HazardManager`: persistence, caps, expiry, per-player damage ticks and phase/death cleanup.
- `SpawnValidator`: bounds, static/dynamic collision, gap width and reachable escape checks.
- `DamageableTarget`: shared interface for bosses, buds, ice, decoys and plates, with explicit target type and owner.

Recommended controller loop:

```text
each simulation tick:
    if health <= 0: enter DEAD once; clear encounter-owned objects; return
    record highest phase reached by current health
    if already in PHASE_CHANGE or exposed pause: update that state; return
    update current attack and owned objects using dt
    at end of attack + recovery:
        if higher phase queued: transition; clear owned hazards; reset sequence
        else choose next eligible attack from phase sequence
             validate geometry against current arena and player state
             reposition if needed
             run warning -> activation -> recovery
```

Projectile and hazard simulation continues independently while the boss is recovering. Death, last-plate interrupt and phase cleanup invalidate every delayed callback for that encounter. Use encounter-generation IDs or cancellable handles so a stale timer cannot spawn a projectile after restart.

### Minimal required helpers

1. Circle/annulus/sector/line-segment hit tests with player-radius expansion.
2. Swept moving-circle collision for charges, debris and fast projectiles.
3. Angle wrapping and ring-sector exclusions, including rotating safe gaps.
4. Temporary solid rectangle creation/destruction and navigation updates for ice.
5. Player effect API for slow, additive pull and special-activation suppression.
6. Owner-scoped cleanup of attack instances, hazards and temporary targets.
7. Boss debug screen: select any boss, skip intro, set HP/phase, toggle invulnerability, freeze time, show hitboxes and force a named attack.

## Build order and verification

**Build order:** shared controller and debug arena → Kilnheart → Bellwether → Verdigris → Glasswake → Undertow → Gravemark → Redactor. This creates each attack primitive before the final boss reuses it. Keep generated sprite sheets as appearance assets; the existing assets are static facing poses, so combat functionality should work before bespoke attack animation is added. Change facing to match frozen aim. Telegraphs and effects can carry prototype animation.

**Required acceptance checks**

- Every damaging footprint matches its warning at activation, including collision-radius expansion and safe gap handling.
- Attacks behave consistently at 30, 60 and 120 render frames/second with a fixed simulation timestep.
- A dash through a hazard is safe only during actual invulnerable dash time; crossing a wall stops at collision.
- Each regular phase transition fires once at the correct attack boundary. Damage crossing two thresholds picks the highest phase. Death cancels immediately.
- Complete each boss at baseline stats without optional upgrades. Repeat representative patterns with dash unavailable to verify the specified walking escape paths.
- Test player standing at center, against each edge, beside each prop, inside a pool, slowed by Undertow, and affected by Gravemark's pull.
- Pools, ice, decoys, buds, plates and suppression respect their caps, lifetime and cleanup behavior.
- Reset/death/phase change leaves no hidden damage source, collision wall, player modifier or pending spawn callback.
- Redactor's reduction is 30% with six plates, 15% with three and 0% with none. Last-plate destruction correctly resolves a queued phase transition.
- Seeded encounters reproduce attack placement and decoy arrangement. No attack requires recognizing color alone.
- **Parry:**
  - Every boss shows at least one parryable and one super component in every phase.
  - The glint closes exactly on the damage frame at 30, 60 and 120 fps.
  - A perfect parry within the window takes 0 damage, Exposed defers the next action, and blocking a super Shatters.
  - Three blocks within 2s guard-break.
  - The accessibility window widens only the perfect window.
- **Route:**
  - A run always offers two unbeaten villains at each city-map choice and never repeats a villain.
  - The Redactor's stolen list contains only this run's defeated villains plus Gravity.

**First tuning pass:** record encounter duration, damage taken per attack, deaths per phase, dash use and damage dealt during recovery. Fix unavoidable geometry or unclear warnings before altering HP. If fights are too long, lower HP before shortening telegraphs. If too easy, improve sequencing and positional pressure before reducing escape gaps.

## Paste-ready coding instruction

Implement the seven boss encounters defined in this document inside the existing game. Inspect the project's engine, player controller, damage model, sprite assets and scene architecture first. Preserve working systems and adapt reference units/stat values where necessary. Build the shared boss state machine, telegraph geometry and encounter cleanup before individual bosses. Follow the deterministic phase sequences, exact aim-lock behavior, hit rules, hazard caps and counterplay. Use existing static directional sprites with generated/procedural attack effects initially. Add a debug boss selector and attack-forcing controls so all listed acceptance checks can be exercised. Keep balance values in editable data. Finish one testable boss at a time, reuse its primitives for later bosses, and implement The Redactor last. Report which checks pass and any engine-specific adaptations or missing systems. Do not substitute generic enemies for the specified mechanics.
