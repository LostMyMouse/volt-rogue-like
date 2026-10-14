# volt-rogue-like

A top-down action roguelite about Volt, a rookie superhero trying to prove they can become the world's greatest hero. This is a vertical slice: one rooftop stage, 15 waves, and the boss Gravemark.

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
| J / left click | Strike (hold for a 3-hit combo) |
| K / right click | Power: chain lightning |
| Space / Shift | Dash (invulnerable while dashing) |
| Q | Overload, when charged |
| P / Esc | Pause |
| 1–3 | Pick a boon during comms |

Touch controls appear automatically on phones and tablets.

## What's in the slice

- **15 waves** of Rushers (melee) and Needles (ranged drones), with **Gravemark** on waves 5, 10 and 15. When its purple ring glows, find the gap.
- **Hero boons:** after each wave Halo, Bastion, Echo or Thorn calls in on comms and offers 3 boons. One boon per ability slot, levels up to 3, with Common, Rare and Epic rarities. Patch offers Fortress tech after each Gravemark wave.
- **Scarce healing:** health carries between waves. The only healing is rare health packs dropped by enemies.
- **Run results:** a heroism rank from S to D, a record of your build and what defeated you, and a comms message from a hero, or from Gravemark if you did badly.

## Debug

Add `?debug` to the URL. `]` skips to the next Gravemark wave, and `window.__volt` exposes game state for testing.

## Project layout

- `index.html`: the whole game (canvas rendering, combat, boons, UI)
- `assets/portraits/`: comms portraits (`<hero>.png`, listed in `PORTRAIT_FILES` in `index.html`)
- `assets/sprites/`, `assets/arena/`: reserved for sprite sheets and arena art
- `concept-art/`: visual reference for characters, enemies, palette and the rooftop
