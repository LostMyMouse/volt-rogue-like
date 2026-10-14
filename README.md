# volt-rogue-like

A top-down action roguelite about Volt, a rookie superhero trying to prove they can become the world's greatest hero. This is a vertical slice: 15 rooftops, the boss Gravemark, hero boons, five combat styles and Fortress upgrades.

## Play

Open `index.html` in a browser. There's no build step.

To serve it locally instead:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Aim |
| Left click | Strike (hold to repeat) |
| Right click | Power (hold to charge Arc Caster's Lance) |
| Space | Dash (invulnerable while dashing) |
| Q | Overload, when charged |
| Shift | Block. Tap it as the white ring closes to parry |
| E | Jump to the next rooftop (or stand on a jump point) |
| Esc | Pause |
| 1–3, R | Pick a boon, reroll |

Touch controls appear automatically on phones and tablets.

## What's in the slice

- **15 rooftops, Hades-style.** Clearing a rooftop opens 1–3 jump points, each showing the reward on the next roof: a hero's boon, Patch's Fortress tech, or rare Renown Shards. You claim it on landing, before the fight. Kilnheart guards rooftop 5 and Gravemark guards rooftops 10 and 15.
- **Villains.** Kilnheart (rooftop 5) and Gravemark (rooftops 10 and 15) run on the spec's shared boss framework: three phases, frozen-aim telegraphs, and a mix of parryable attacks and supers. Kilnheart punches, charges and slams; Gravemark pulls with gravity wells, orbits rubble, fires a rock cannon you can parry back at it, and collapses a ring with one safe gap. Rooftop 10's Gravemark is a lighter (80% health) first meeting. Every boss fight opens with an intro card; each hero gets one the first time they call in.
- **Hero boons.** Halo, Bastion, Echo and Thorn offer 28 boons across Strike, Power, Dash, Overload and passives, with Common, Rare and Epic rarities and up to 3 levels.
- **Block and parry.** Attacks with a closing white ring can be parried: no damage, and the attacker is left Exposed. Holding Block takes reduced damage. Attacks with a jagged edge are supers: dodge them. Not blocking a parryable attack makes it hit harder.
- **Five combat styles.** Brawler, Arc Caster, Titan, Speedster and Magnetar each replace Strike and Power, with their own strengths and weaknesses. Unlock them with Hero Licences.
- **Fortress upgrades.** Renown Shards are kept when you fall and spent in Patch's workshop on permanent upgrades.
- **Scarce healing.** Health carries between rooftops. The only healing is rare health packs dropped by enemies.
- **Run results.** A heroism rank from S to D, your build, what defeated you, and a comms message from a hero, or from Gravemark if you did badly.

Progress (shards, upgrades, styles) is saved in this browser's local storage under `volt-save`.

## Design docs

- [`docs/boss-gameplay-spec.md`](docs/boss-gameplay-spec.md): the seven-boss spec (Revision 2), including the block and parry system and the non-linear five-villain run. Kilnheart and Gravemark are built; the rest come with the five-district phase.
- [`docs/art-brief.md`](docs/art-brief.md): everything the game needs from art: sprite specs, animation lists with timings, portraits and intro art, environment kits, icons, effects, and priority order.

## Debug

Add `?debug` to the URL. `]` skips to the next boss rooftop, and `window.__volt` exposes game state for testing.

- `?debug&boss=kilnheart` drops straight into a boss fight.
- `?debug&nointro` skips intro cards (used by automated tests).
- `__volt.bossAttack('rush')`, `__volt.bossHp(0.5)` and `__volt.hitboxes()` force attacks, set health and show hit shapes.

## Project layout

No build step: plain HTML, CSS and JavaScript. Scripts are loaded in order by `index.html` and share one global scope.

- `index.html`: markup for the HUD and menus, plus the ordered script list
- `css/volt.css`: all styles
- `js/core.js`: canvas, math helpers, palette, tuning sliders, save file
- `js/world.js`: arena layout, run state, `reset()`
- `js/input.js`: keyboard, mouse and touch
- `js/combat.js`: damage, dash, Overload, taking hits
- `js/update.js`: wave spawning and the per-frame simulation
- `js/bosses/`: `framework.js` (shared boss state machine, attack primitives, telegraphs) plus one file per boss
- `js/intro.js`: villain and hero intro cards
- `assets/intro/`: intro card art cropped from the concept sheets
- `js/boons.js`: hero boons, Fortress tech, status effects
- `js/parry.js`: block and parry
- `js/styles.js`: the five combat styles
- `js/rooms.js`: rooftop layouts, jump points, Renown Shards, Fortress upgrades
- `js/draft.js`: the comms boon draft
- `js/render.js`: all canvas drawing
- `js/ui.js`: HUD, menus, run results
- `js/debug.js`: `?debug` helpers
- `js/main.js`: boot and frame loop
- `assets/portraits/`: comms portraits (`<hero>.png`, listed in `PORTRAIT_FILES`)
- `assets/sprites/`, `assets/arena/`: reserved for sprite sheets and arena art
- `concept-art/`: visual reference; `concept-art/villains/` holds the boss sheets
- `docs/`: design specs
