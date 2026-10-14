# volt-rogue-like

A top-down action roguelite about Volt, a rookie superhero trying to prove they can become the world's greatest hero. This is a vertical slice: 15 rooftops, the boss Gravemark, hero boons, five combat styles and Fortress upgrades.

## Play

Open `index.html` in a browser. The game is a single file with no build step.

To serve it locally instead:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move |
| Mouse | Aim |
| J / left click | Strike (hold to repeat) |
| K / right click | Power (hold for Arc Caster's Lance and Magnetar's Shield) |
| Space / Shift | Dash (invulnerable while dashing) |
| Q | Overload, when charged |
| L / middle click | Block. Tap it as the white ring closes to parry |
| E | Jump to the next rooftop (or stand on a jump point) |
| P / Esc | Pause |
| 1–3, R | Pick a boon, reroll |

Touch controls appear automatically on phones and tablets.

## What's in the slice

- **15 rooftops, Hades-style.** Clearing a rooftop opens 1–3 jump points, each showing the reward on the next roof: a hero's boon, Patch's Fortress tech, or rare Renown Shards. You claim it on landing, before the fight. Gravemark guards rooftops 5, 10 and 15.
- **Hero boons.** Halo, Bastion, Echo and Thorn offer 28 boons across Strike, Power, Dash, Overload and passives, with Common, Rare and Epic rarities and up to 3 levels.
- **Block and parry.** Attacks with a closing white ring can be parried: no damage, and the attacker is left Exposed. Holding Block takes reduced damage. Attacks with a jagged edge are supers: dodge them. Not blocking a parryable attack makes it hit harder.
- **Five combat styles.** Brawler, Arc Caster, Titan, Speedster and Magnetar each replace Strike and Power, with their own strengths and weaknesses. Unlock them with Hero Licences.
- **Fortress upgrades.** Renown Shards are kept when you fall and spent in Patch's workshop on permanent upgrades.
- **Scarce healing.** Health carries between rooftops. The only healing is rare health packs dropped by enemies.
- **Run results.** A heroism rank from S to D, your build, what defeated you, and a comms message from a hero, or from Gravemark if you did badly.

Progress (shards, upgrades, styles) is saved in this browser's local storage under `volt-save`.

## Design docs

- [`docs/boss-gameplay-spec.md`](docs/boss-gameplay-spec.md): the seven-boss spec (Revision 2), including the block and parry system and the non-linear five-villain run. Not yet implemented.

## Debug

Add `?debug` to the URL. `]` skips to the next Gravemark wave, and `window.__volt` exposes game state for testing.

## Project layout

- `index.html`: the whole game (canvas rendering, combat, boons, UI)
- `assets/portraits/`: comms portraits (`<hero>.png`, listed in `PORTRAIT_FILES` in `index.html`)
- `assets/sprites/`, `assets/arena/`: reserved for sprite sheets and arena art
- `concept-art/`: visual reference for characters, enemies, palette and the rooftop; `concept-art/villains/` holds the boss sheets
