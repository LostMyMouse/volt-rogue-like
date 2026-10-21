# Animation assets — v14

Created with the built-in `image_gen` tool, using the existing comic sprite atlases as identity/style references. Transparency was requested and retained; accepted PNG outputs were converted to WebP at quality 90 with alpha quality 100. Runtime extraction isolates complete connected figures and anchors their feet. No generated background was substituted for alpha.

## Saved assets

All paths are relative to the game root:

- `assets/sprites/comic/volt-brawler-attack-v1.webp` — four punch phases in four facings.
- `assets/sprites/comic/volt-caster-attack-v1.webp` — gather, brace/aim, palm release, recovery in four facings. Also used for Brawler's projected lightning and Magnetar's pull.
- `assets/sprites/comic/volt-titan-strike-attack-v1.webp` — heavy haymaker in four facings.
- `assets/sprites/comic/volt-titan-attack-v1.webp` — distinct two-fist ground-pound Special in four facings.
- `assets/sprites/comic/volt-speedster-attack-v1.webp` — crouch, lunge, follow-through, braking guard in four facings.
- `assets/sprites/comic/volt-magnetar-attack-v1.webp` — disc wind-up, release, follow-through, catch in four facings. The live disc state suppresses poses that would show a second disc while it is away.
- `assets/sprites/comic/vanguard-stations-v1.webp` — twenty activity poses across Halo, Bastion, Echo, Thorn and Patch.

## Prompt set

Weapon reference: `assets/sprites/comic/volt.webp`. Its role is strict identity, helmet, suit, proportions and ink style; the requested animation is new artwork.

Common production instructions: original male hero, enclosed angular black helmet with cyan V visor, white shoulder/forearm/shin armour and black electric-blue suit, elevated three-quarter game view. Crisp detailed modern superhero comic linework, heavy black inks, crosshatched shadows and restrained blue rim light. Exact four-column/four-row equal-cell atlas. Rows face south/front, east/right, north/back, west/left. Entire bodies remain isolated inside generous transparent gutters, consistent scale and floor baseline. Genuine transparent background; no text, floor shadows, particles, effects or overlapping figures. Four distinct articulated silhouettes rather than duplicated guard poses.

Per-sheet action instructions:

- **Brawler:** backswing crouch anticipation; powerful forward punch fully extending the right arm as the opposite foot plants; follow-through torso twist with the other arm counterbalancing; retract fist into balanced guard.
- **Caster:** gather charge with both hands at chest; raise one palm while the other hand braces its wrist; fully extend the open palm with shoulder recoil; draw arms back to neutral.
- **Titan Strike:** deeply wound torso, trailing fist behind shoulder, opposite arm guarding and knees bent; wide sweeping horizontal hook at chest height using hip rotation; strong whole-body follow-through; upright balanced guard. A heavyweight haymaker, not a ground pound or overhead two-fist slam.
- **Titan Special:** planted wide stance with bent knees and joined fists above the head; lower the body bringing both fists down in an arc; deep crouch with both fists at ground contact; recover to balanced standing guard. No hammer or weapon prop.
- **Speedster:** crouched runner with bent knees and tucked fists; explosive low forward lunge throwing the leading fist; long follow-through with opposite leg extending behind and other arm pulled back; brake into upright guard. No flying or motion trails.
- **Magnetar:** compact single blue-edged metal disc tucked across the opposite hip, torso wound up; horizontal arm sweep releases the disc, absent from the hand after release; rotated follow-through past the target; open palm catches the returning disc at chest height.

Station references, in order: `halo.webp`, `bastion.webp`, `echo.webp`, `thorn.webp`, `patch.webp` from the same comic sprite directory. Their role is strict character identity and rendering style.

Station prompt: exact four-column/five-row atlas of twenty isolated whole-body grounded sprites, no furniture, floor, shadows, effects, text or labels. Four consecutive relaxed activity keyframes per row, feet planted at the same position, natural hand/head articulation without fighting stances or body bobbing. Same detailed comic inks, crosshatching, scale and transparent gutters as the reference. Halo faces north in white/gold armour with her gold halo: relax, hand to earpiece, listen/head turn, lower hand. Bastion faces south in grey/olive tactical armour: read handheld blue tablet, point to tablet, gesture toward the map, return reading. Echo faces south in black/white/purple: watch training, two fingers to temple, listen/head tilt, relax. Thorn wears his leaf cloak: examine a sprig, turn it, pinch a leaf, lower it. Patch faces north in navy/orange utility gear with headset/goggles: check tool, turn screw at waist height, attend headset, return to tool. Preserve complete heads, hair, halos, hands and feet.

## Rejected candidates and remaining acceptance

New Gravemark/Verdigris walk candidates repeated the leading leg. They were not integrated. The existing cast now uses additional passing/recovery poses, but that does not establish a completed authored gait for every large character. A future accepted locomotion sheet must visibly alternate legs and counter-swinging arms in every facing. The comic paintings retain their existing illustrated action sequence; a deeper character-rig pass remains separate production work.
