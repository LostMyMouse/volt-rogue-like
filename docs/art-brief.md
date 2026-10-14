# Volt — art brief

Everything the game needs from art, in the order it should be made. The game currently draws every character and prop with code (vector placeholders). Each asset below replaces one of those. Until an asset exists, the placeholder keeps working, so art can arrive in any order.

**Start small.** Generate the **Volt test batch** first (§9), send it over, and I'll build the sprite loader against it. Once one character looks right in-game, the rest follow the same recipe.

---

## 1. The look

Match the approved concept art in `concept-art/` (start with `visual-language.webp` and `palette.webp`):

- **Ink and paint:** thick black ink outlines around every silhouette, painterly texture inside, minimal small detail. Must read at small sizes.
- **Moody urban night:** subdued environments; characters and powers carry the colour.
- **Bold contrast:** a dark world, bright telegraphs and powers.

### Palette (hex)

| Use | Colour |
|---|---|
| Night void / city shadow | `#080D18` / `#141C2B` |
| Rooftop slate / obstacle edge | `#253247` / `#42516A` |
| Volt: electric blue / arc white | `#26BFFF` / `#F4FBFF` |
| Enemies: Rusher coral / Needle amber | `#FF5A45` / `#FFB647` |
| UI text / ready-heal / power-upgrade | `#DDE8F5` / `#55E6C1` / `#B56CFF` |
| Kilnheart furnace orange | `#FF7A1A` |
| Gravemark purple | `#B56CFF` |
| Heroes: Halo / Bastion / Echo / Thorn / Patch | `#FFE08A` / `#9FB0C8` / `#FF5CC8` / `#6AD46A` / `#55E6C1` |

**Colour rule for readability:** enemy attacks use their villain's colour, and Volt's boons use hero colours. A hero's glow should never be confusable with a villain's attack colour in the same fight.

---

## 2. Technical spec (all sprites)

### Camera and scale

- **View:** steep three-quarter top-down, about 60° from horizontal. This matches the "top-down" panels on the concept sheets: you see the top of the head and shoulders, plus some of the front.
- **World scale:** 1 floor tile = 50 px. Volt's body is about 32 px across at the feet.
- **Anchor:** the **centre of the feet** (ground contact point). The game positions every sprite by its feet, and collision is a circle around that point.
- **No baked ground shadow.** The game draws soft shadows itself. Light comes from the top-left.

### Frame sizes

| Category | Frame size | Who |
|---|---|---|
| Hero-sized | 96 × 96 | Volt, Rusher, hero NPCs |
| Small | 80 × 80 | Needle drone |
| Large boss | 192 × 192 | Kilnheart, Bellwether, Verdigris, Glasswake |
| Huge boss | 256 × 256 | Gravemark, Undertow, The Redactor |

Leave about 15% empty margin around the character so swings, flames and effects aren't clipped.

### Directions

- **8 directions**, one row each, in this order: **E, SE, S, SW, W, NW, N, NE**.
- **4 directions** (S, W, N, E) are acceptable for a first pass. The game picks the nearest one.
- **Mirroring is fine:** you can generate E, SE, S, N and NE, and mirror them for W, SW and NW. Avoid this for asymmetric characters (Gravemark's rock fist, Kilnheart's off-arm).
- **The Needle drone** can be a **single top-down image** that the game rotates, like a vehicle.

### Sheet layout and files

- One PNG per animation, with a transparent background.
- Rows = directions, columns = frames, left to right.
- Name files `<character>_<animation>.png`, for example `volt_run.png` or `kilnheart_punch_windup.png`.
- Put them in `assets/sprites/<character>/`.
- Frame rates are listed per animation below. Default to 12 fps.

The game reads a small manifest per character. I'll write these; you only need the sheets and frame counts. For reference:

```json
{
  "volt": {
    "frame": [96, 96], "anchor": [48, 82], "dirs": 8,
    "anims": {
      "idle": { "file": "volt_idle.png", "frames": 6, "fps": 8, "loop": true },
      "run":  { "file": "volt_run.png",  "frames": 8, "fps": 14, "loop": true }
    }
  }
}
```

### Timing matters

Several animations must hit a specific moment, because the game's attacks land on a timer. Under each one I list **total length** and the **key frame**, where the hit or release happens. If you can't match a length exactly, make the key frame obvious and I'll retime playback.

---

## 3. Volt (player)

Black suit, white swept collar with forearm and shin fins, two glowing blue rails down the chest, an angular visor, spiky hair, no cape. See `concept-art/volt.webp`.

### Core set (shared by every combat style)

| Animation | Frames | fps | Notes |
|---|---:|---:|---|
| idle | 6 | 8 | Loop. Rails pulse softly. |
| run | 8 | 14 | Loop. Leaning forward, with crackle off the heels. |
| dash | 4 | 24 | 0.16s burst: a streaked, stretched pose. The game adds afterimages. |
| block | 3 | 12 | Raise a guard, then hold the last frame while Block is held. |
| parry | 5 | 20 | A sharp deflect flash. Key frame 1 is the impact. |
| hurt | 3 | 16 | Flinch back. |
| stunned (Shattered) | 6 | 10 | Loop. Dazed, guard broken. |
| overload | 8 | 16 | Arms flung out, a full-body lightning burst. Key frame 3. |
| leap_out / land | 6 / 5 | 16 | Jumping off a rooftop edge, and landing on the next roof (crouch, then spark). |
| death | 10 | 12 | Collapse; the rails flicker out. |
| victory | 8 | 10 | For the run-complete screen. |

### Per combat style (Strike and Power)

| Style | Animation | Frames | fps | Key frame / notes |
|---|---|---:|---:|---|
| Brawler | strike1, strike2, strike3 | 4, 4, 6 | 20 | A jab, a cross, then a heavy finisher (bigger, longer). Hit on frame 2 / 2 / 3. |
| Brawler | power_chain | 6 | 16 | Point and release chain lightning. Release on frame 3. |
| Arc Caster | bolt | 3 | 20 | Quick casting flick, which repeats while held. Release on frame 1. |
| Arc Caster | lance_charge (loop) / lance_fire | 4 / 5 | 12 / 20 | Charge-up loop, then a big piercing fire. |
| Titan | haymaker | 8 | 14 | Big wind-up, then the punch. Hit on frame 5, with a long recovery. |
| Titan | pound | 8 | 14 | Leap, then slam the ground. Impact on frame 5. |
| Speedster | flash | 3 | 24 | A blur strike as he teleports through the target. |
| Speedster | blitz | 8 | 24 | Spinning afterimage barrage. |
| Magnetar | disc_throw / disc_catch | 4 / 3 | 20 | Throw on frame 2. |
| Magnetar | jab (empty-handed) | 3 | 18 | |
| Magnetar | pull | 6 | 16 | Magnetic yank toward the palm. |
| Magnetar | disc (prop) | 4 | 20 | 48 × 48 spinning disc, one direction only. |

---

## 4. Enemies

### Rusher (melee, coral)

Red hoodie, pipe, yellow work gloves. See `concept-art/enemies.webp`.

| Animation | Frames | fps | Notes |
|---|---:|---:|---|
| idle | 4 | 8 | |
| run | 8 | 14 | |
| windup | 6 | 12 | Pipe cocked back. **0.5s**, telegraphing a wide swing. |
| swing | 4 | 24 | **0.16s** sweep. Hit on frame 2. |
| recover | 4 | 8 | |
| stunned / exposed | 6 | 10 | Loop. Reeling. |
| hurt | 2 | 16 | |
| death | 8 | 14 | |

### Needle (ranged drone, amber)

Twin rotors and a red eye. A single top-down image that the game rotates is fine.

| Animation | Frames | fps | Notes |
|---|---:|---:|---|
| hover | 4 | 16 | Loop with spinning rotors. |
| charge | 6 | 10 | **0.65s**. The eye glows from red to amber. |
| fire | 3 | 20 | Recoil. |
| hurt | 2 | 16 | |
| death | 8 | 14 | Sparks, then falls and shatters. |

---

## 5. Villains (bosses)

Timings are from `docs/boss-gameplay-spec.md`. Every boss needs this **shared set**:

| Animation | Notes |
|---|---|
| intro | A 1.5s menacing reveal pose, played behind the intro card. |
| idle, walk | Loops. |
| recovery | The punish window. Show it clearly: vents open, guard down, panting. |
| exposed | Staggered after you parry them. 1.5s, looping. |
| phase_change | 1.2s power-up. Their look should escalate slightly each phase if possible. |
| hurt | Brief flash pose. |
| death | 2–3s, dramatic. |

### Kilnheart (192 × 192): heat and pressure

| Attack animation | Length | Key frame / notes |
|---|---|---|
| punch_windup → punch | 0.85s → 0.15s | Creeps forward, then lunges into the punch. Fist lands at the start of `punch`. |
| rush_windup → rush (loop) → rush_crash | 1.1s → loop → 0.4s | Rears back, then charges like a train. Add a crash pose for hitting walls. |
| slam_windup → slam | 1.0s → 0.15s | Heaves upward, then slams. Embers burst outward. |
| vents_open | overlay | Chest and forearm vents flare during recovery. Can be a separate glow layer. |

### Gravemark (256 × 256): stone and gravity

| Attack animation | Length | Key frame / notes |
|---|---|---|
| well_cast | 1.0s | Telekinetic hand raised and aimed at the ground. |
| driver_windup → driver_fire | 1.0s → 0.2s | Rock fist opens like a cannon. The gauntlet stays open during recovery (the punish cue). |
| orbit_summon (loop) | 1.1s + 2.4s | Rubble rises and circles. **Rubble pieces are separate sprites** (§7). |
| collapse_windup → collapse | 1.2s → 0.2s | Both fists raised, then a ground slam. |

**Floating shards:** if possible, supply the small orbiting rock shards as separate sprites (§7) rather than baked into Gravemark, so the game can animate them.

### Later villains (for the five-district phase)

Same shared set, plus their attacks from the spec:

| Villain | Size | Attack animations |
|---|---|---|
| Bellwether | 192 | ring_emit (speakers pulse), focused_burst, resonator_drop |
| Verdigris | 192 | seed_throw, vine_sweep, thorn_growth. Buds are separate sprites with grow, fire and destroyed states. |
| Glasswake | 192 | prism_lanes, mirror_step (vanish and appear), shard_lunge, refraction. **Decoy variant:** same sheets with a broken magenta outline. |
| Undertow | 256 | pressure_jet (sweeping), ice_divide (punch the ground), depth_charge, glacier_hook. **Ice wall** segments are separate: grow, idle, crack and melt. |
| The Redactor | 192 | redaction_lanes, null_field, final_verdict, plus stolen-power poses. **Six floating shield plates** are separate sprites with intact, cracked and breaking states. |

---

## 6. Dialogue imagery

### Comms portraits (boon drafts, results screen, jump-point medallions)

- **256 × 256**, head and shoulders, facing slightly toward camera.
- **Transparent background.** The game frames them in a slanted coloured panel.
- **Expressions:**
  - **neutral** (required)
  - **pleased** (good runs and rare boons)
  - **stern** (bad runs and warnings)
  - Villains: **taunting** in place of pleased.
- **Names:** `assets/portraits/<id>.png` (neutral), `<id>_pleased.png`, `<id>_stern.png`.
- **Needed:** halo, bastion, echo, thorn, patch, kilnheart, gravemark. Later: bellwether, verdigris, glasswake, undertow, redactor.

Kilnheart's and Gravemark's neutral portraits currently exist as crops from their concept sheets. Proper ones would be cleaner.

### Intro card art (the Smash-style splash)

- **About 600 × 800**, full-body hero pose, three-quarter front view, dynamic and characterful. This is the money shot.
- **Transparent background preferred.** The game adds the brush band, colour glow and name.
- **Names:** `assets/intro/<id>.png`.
- **Needed now:** halo, bastion, echo, thorn, patch. They currently show drawn silhouettes.
- **Replace the placeholders:** kilnheart and gravemark are cropped from concept sheets with backgrounds.
- **Later:** the other villains, plus **Volt** for the victory and run-complete screen.

### Story art (optional, later)

- The run-ending title card for "Rooftop secured".
- **Results-screen rank art:** a Volt pose per rank. S is triumphant; D is slumped on a rooftop edge.

---

## 7. Projectiles, pickups and boss parts

All are single small sprites, one direction, which the game rotates as needed.

| Asset | Size | Notes |
|---|---|---|
| needle_shot | 32 | Amber bolt with a trail. |
| kiln_ember | 32 | Glowing coal. Animated: 4 frames of flicker. |
| gm_rock (Mass Driver) | 80 | Big hurled stone with a purple glow. Also needs a blue-glow "reflected" version. |
| gm_rubble | 40 | Orbiting rubble. 3 variants. |
| gm_shard | 24 | Gravemark's decorative floating shards. 4 variants. |
| volt_bolt | 32 | Arc Caster bolt, normal and heavy. |
| health_pack | 40 | Teal medical canister. Bob animation, 4 frames. |
| renown_shard | 40 | Purple gem, matching the medallion icon. Spin, 6 frames. |

---

## 8. Environment and buildings

### Rooftop kit (the current slice)

See `concept-art/rooftop.webp`. Every prop has a **floor footprint**, which is what collides, and a **height**. Draw it standing on its footprint in the three-quarter view, with the anchor at the front-centre of the footprint.

| Prop | Footprint (px) | Height (px) | Notes |
|---|---|---|---|
| Water tower | 200 × 200 (round) | ~320 | Legs, a banded tank, a conical roof and a small lamp. |
| Stair hut | 220 × 170 | ~180 | Door with a warm lit lamp above it, plus a railing. |
| AC unit, large | 230 × 140 | ~110 | Two fans on top. **Fan blades are a separate sprite** so they can spin. |
| AC unit, small | 160 × 100 | ~90 | One fan. |
| Vent box | 190 × 130 | ~120 | Grille on top and front. |
| Utility box | 110 × 60 | ~60 | |
| Crate / box | 90 × 90 | ~70 | |
| Extras (pick any) | ~60–150 | | Satellite dish, antenna mast, skylight, chimney stack, pipe runs, cable spools, a neon sign facing the street. |

**Floor:**
- **Base tile:** a 125 × 125 seamless rooftop slate panel with seams at the edges.
- **Decals**, each with transparency: cracks, puddles with sheen, oil stains, a drain grate, scorch marks, and moss creeping in from the edges.

**Parapet (roof edge wall):**
- Straight segment (250 long), corner, post cap.
- Front facade strip (the building face below the front wall) with windows that are lit or dark.

**City backdrop:**
- Two or three parallax layers of night skyline. Far towers, mid buildings, a near rooftop silhouette.
- About 3000 × 2000, with lit windows in warm orange, cool cyan and a few purple.
- **Keep it dark and low contrast** so the fight reads on top.

### District kits (five-district phase, later)

Each district reuses the rooftop props, reskinned, plus a few signature props:

| District | Villain | Signature props |
|---|---|---|
| Foundry roofs | Kilnheart | Smelter chimneys, heat vents, pressure tanks, glowing slag channels |
| Concert district | Bellwether | Speaker stacks, cable runs, stage truss, broken billboards |
| Overgrown block | Verdigris | Rusted machinery wrapped in metal vines, toxic puddles |
| Glass towers | Glasswake | Glass panels, mirror sculptures, neon signage |
| Flooded docks | Undertow | Waterlogged containers, cranes, frozen pipes |
| Gravemark's roof | Gravemark | Cracked stone, grave markers, levitating debris |
| The Redactor's tower | The Redactor | Clean corporate roof: ivory panels, crimson data screens, black monoliths |

### Fortress hub (later)

When we build the walkable Fortress:
- interior floor, walls and doors;
- stations for each hero NPC;
- Patch's workshop terminal;
- the armoury rack (combat styles);
- the Deploy door.

Hero NPCs then need walk, idle and talk loops at 96 × 96.

---

## 9. UI, icons and effects

### Icons (64 × 64, transparent)

- **28 boon icons**, one per boon. Use the hero's colour and the slot's shape language: Strike is a fist, Power a bolt, Dash a chevron, Overload a starburst, passives a gem. The full list is in `js/boons.js`.
- **7 Fortress tech icons:** Reinforced Suit, Arc Capacitor, Servo Boots, Coil Booster, Long Arc, Relay Node, Overclock.
- **6 Fortress upgrade icons:** Hero Conditioning, Combat Drills, Last Stand, Rapport, Second Opinion, Scavenger.
- **5 combat style emblems:** Brawler, Arc Caster, Titan, Speedster, Magnetar.
- **Ability bar icons** (48 × 48): Strike and Power per style, plus Dash, Overload and Block.
- **Rank letters** S, A, B, C and D as painted badges (optional; the game draws them today).

### Effects (sprite sheets, single direction)

| Effect | Frames | Notes |
|---|---:|---|
| hit_spark | 5 | White and blue burst. |
| slash_arc (per style) | 4 | Swept arc trails for each style's strikes. |
| parry_flash | 6 | Bright white starburst. This is the most satisfying moment in the game, so make it pop. |
| shatter | 6 | Volt's guard breaking: blue shards. |
| death_burst (per enemy colour) | 8 | |
| heat_shimmer / ember_spray | 6 | Kilnheart. |
| gravity_swirl | 8 | Loop. Gravemark's well; force only, so no harsh edges. |

### Stays code-drawn: don't paint these

**Telegraphs stay as code:** the attack footprints, the jagged super edges, the white parry glint, the ring gaps and the boss health bar. They must match the hitboxes exactly and stay readable. Art can sit behind them, but not replace them.

---

## 10. Priority order

1. **Volt test batch** (validates the pipeline):
   - 8-direction **idle** and **run**;
   - Brawler **strike1–3**;
   - **dash**, **block** and **parry**.
2. **Volt full set** (core plus all five styles), then **Rusher**, then **Needle**.
3. **Kilnheart** and **Gravemark** sheets, plus their props (§7).
4. **Hero portraits and intro art:** Halo, Bastion, Echo, Thorn, Patch.
5. **Rooftop kit:** props, floor, parapet, backdrop.
6. **Icons and effects.**
7. **Later villains, district kits, Fortress hub.**

---

## 11. Tips for AI-generated sprites

- **Lock the camera first:** generate one reference turnaround per character at the game's three-quarter angle, then generate every animation against it. Mismatched angles are the most common thing that breaks a sprite set.
- **Silhouette test:** shrink a frame to 96 px tall. If you can't tell which way Volt is facing or what he's doing, simplify it.
- **Same light, same outline weight** across everything: top-left light, and an ink outline about 3 px at final size.
- **Keep effects off the character sheets** where possible (sparks, trails, glows). The game layers its own effects, and baked-in ones double up.
- **Transparent backgrounds** throughout. If a tool only outputs solid backgrounds, a flat magenta (`#FF00FF`) background is the next best thing, and I can key it out.
