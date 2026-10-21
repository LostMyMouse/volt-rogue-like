# Volt

An illustrated superhero action roguelite for desktop browsers, touch screens and controllers. Volt helps the Vanguard reclaim a city occupied by the Redactor. Serve `index.html` through a static HTTP server; there is no build step or framework. The launcher hosts the game at `/games/volt`.

## Playing

WASD moves, mouse aims, left-click strikes, right-click uses Special, Space dashes, Shift blocks/parries and Q triggers Overload. E interacts. Touch and controller prompts follow the active input. Settings includes volume, screen shake and an adjustable parry window. OS reduced-motion settings reduce camera and transition effects.

Perfect parries prevent damage, reset Dash, charge Overload and deal substantial Composure damage. Breaking Composure exposes enemies for strong follow-ups. Hold Block for protection; dodge jagged super attacks.

## Current game

- Five weapons: Brawler, Arc Caster, Titan, Speedster and Magnetar, each with an unlockable variant and a 32-card power/technique pool: 160 weapon-qualified offers. Each weapon has four authored attack poses in four directions.
- Three randomly assigned district villains, then Gravemark and the Redactor. Identity stays concealed until arrival. Districts contain 5–8 combat rooftops, a supply stop and a boss. Ordinary roofs share city rooftop art; bosses have bespoke paintings and collision footprints, with a distinct final tower approach.
- Seven bosses: Kilnheart, Bellwether, Verdigris, Glasswake, Undertow, Gravemark and the Redactor. Glasswake uses a mirror hall. Lockjaw and Relay add frontal protection/flanking and squad support in later stretches.
- Hero powers modify Strike, Special, Dash, Overload or passives. Slots replace their previous power; duplicates level up to III. Three hybrid recipes are discovered during runs after a victory and five deployments, with both heroes' prerequisites.
- Patch's physical supply stops offer three random purchases. Field Credits visibly drop from some enemies and rooftop storage. Crates can contain credits, health or nothing; enemies rarely drop health. Renown is permanent; Field Credits reset with a new operation.
- The Fortress has accessible rooms, a separate armoury, a training robot/tutorial, weapon practice, upgrades, contracts, notebook and repeat-run conversations. Heroes perform grounded activities at their stations.
- The narrated motion comic opens with cover, Vanguard spread without Volt, heroes, villain spread, villains and Volt's story. Page turns, three-second spreads, Auto/manual and Skip controls remain available.
- 737 distinct active recordings use the verified Eleven v4 cast. The audio inventory covers every spoken surface and the manifest verifies provenance/hashes. Printed comic bubbles are separate from narration.

## Saves and recovery

Three browser slots use `volt-save-1` through `volt-save-3`. Continue restores an unfinished operation from a safe rooftop checkpoint: health, weapon, powers, route and Field Credits. An interrupted fight restarts that rooftop. Offers, completed roofs and sold shop inventory persist. Death, victory or a new operation clears the checkpoint.

Each slot keeps a previous-good backup. Invalid nested saves/imports are rejected or recovered with a visible message. Save Slots exports/imports progress between browsers. Erasing a slot erases recovery copies too. Cloud saves and offline caching are not implemented.

## Verification

Run `node tools/tests/run.cjs` with Playwright available. Set `VOLT_PLAYWRIGHT_PATH` if Playwright is outside Node's normal module search path. Tests use installed Chrome (`channel: 'chrome'`), isolated storage and local servers. Results/screenshots go to ignored `test-results/`.

Suites cover boot races, recovery/checkpoints, pause/restart, mobile power choices, grounded stations, weapon poses, audio coverage/cache, routes, shops, Composure, mirrors and the comic. Simulation cannot replace human balance tests or physical iPhone/Android testing. See [release checklist](docs/release-checklist.md).

After changing spoken sources, regenerate `tools/audio/lines.json` with `tools/audio/export-lines.js` in a running page and refresh its source checksums. Run audio coverage; changed speech needs a matching recording. Service keys belong outside browser code and the repository.

## Structure

Plain global scripts load in document order after resolving the portable base URL. `js/` holds simulation, rendering and UI; `js/bosses/` holds the seven bosses. `assets/` holds runtime art/audio. Reliability is in `save-data.js` and `recovery.js`; authored animation is in `weapon-motion.js` and `station-motion.js`. Decoded audio has a 32 MiB cache budget, protecting active playback. Boss footprints in `rooms.js` use painting pixel coordinates.

`docs/` and `concept-art/` include historical proposals that can describe superseded mechanics. This README and executable code describe the current build. Native iPhone/Android packaging and store submissions are separate projects.

## Debug

Use `?debug&nointro` to test without story interruptions. `?debug&boss=kilnheart` starts that boss; substitute another ID. `window.__volt` includes `bossAttack`, `bossHp` and `hitboxes`. Debug helpers are not player progression.
