# The Fortress and its heroes: art brief

For generating the hero NPCs and the Fortress hub with **ChatGPT** (concept sheets, portraits, intro art) and **PixelLab** (in-game sprites and tiles). It matches everything already made: the Volt and villain concept sheets in `concept-art/`, the palette, and `docs/art-brief.md`.

> **Decided 2026-10-15: painted rooms, not pixel tiles.** The Fortress painting (`concept-art/fortress/00-fortress-overview.jpg`) is now the hub's background in the game (`assets/fortress/hub.jpg`), Hades-style. Walkable floor and colliders are traced in `js/hub.js`. A first PixelLab tile kit was made and set aside (`concept-art/fortress/pixellab-kit/`) because it mixed isometric and top-down views, had inconsistent prop scale and lost the painting's mood. Characters still need their own style decision: test one hero sprite on the painted room before generating a full set. The PixelLab sections below are kept for that test.

**How to use it:**
1. Paste the **style preamble** (§1) first in every ChatGPT conversation.
2. Generate each hero's **concept sheet** (§3) and the **Fortress concept** (§5).
3. Use those sheets as reference images in PixelLab, with the **PixelLab settings** (§2) and the per-asset prompts (§4, §6).

**Keep every hero's Identity line word for word in every prompt.** Changing age, gender or skin tone between prompts is the most common cause of inconsistent results.

**Not chibi.** Everyone has adult (or late-teen) **heroic proportions**: the head is about 1/7 of their height, with long limbs and a grounded stance. No big heads, no big eyes, nothing cute. The tone is a grounded comic book, closer to *Hades* or *Batman: The Animated Series* than to anime chibi.

---

## 1. Style preamble (paste first, every time)

> Concept art for "Volt", a top-down action roguelite about a rookie superhero in a moody night city. Match this exact style: comic-book **ink and paint**, thick black ink outlines around every silhouette, painterly texture inside the shapes, bold readable shapes with minimal small detail. Night setting: **subdued, dark navy and slate environment** (`#080D18`, `#141C2B`, `#253247`), warm orange window lights in the city, cool blue rim light. **Characters carry the colour**: each has one signature glow colour used for trims, energy and lighting. Lighting from the top-left. Dramatic but clean, never cluttered. No text, logos or watermarks in the artwork itself unless asked for a labelled sheet. **Realistic heroic proportions (head about 1/7 of body height), mature grounded tone: not chibi, not cute, no oversized heads or eyes.**

**Consistency anchors to mention when useful:**
- Volt (the player) wears a black suit with a white swept collar and white forearm and shin fins, two glowing **electric-blue** (`#26BFFF`) rails down the chest, and an angular visor.
- **Villains** are coral, amber, orange, gold, lime, pink, ice blue, purple and crimson. **Heroes never use those exact hues** (see each hero's palette below).

---

## 2. PixelLab settings (in-game art)

| Setting | Use | Why |
|---|---|---|
| View / camera | **High top-down** | Matches the steep three-quarter view of the concept sheets' "top-down" panels |
| Outline | **Single-colour black outline** | The ink-outline look |
| Shading | **Medium** | Painterly shapes without noisy detail |
| Detail | **Medium** | Must read when small |
| Proportions | **Heroic or realistic. Never chibi.** | Small canvases drift toward big heads. If a result looks cute, regenerate. Also add "realistic adult proportions, small head, not chibi" to the description |
| Directions | **8**, or 4 for a first pass | The game picks the nearest direction |
| Background | **Transparent** | |

**Canvas sizes.** These replace the painted-sprite sizes in `art-brief.md` for anything made in PixelLab:

| What | PixelLab canvas | Shown in game at |
|---|---|---|
| Heroes and Volt | 64 × 64 | 2× (128 px) |
| Floor tiles | 32 × 32 | 2× (64 px) |
| Props | Multiples of 32 | 2× |
| Large set pieces (Deploy Gate, armoury rack) | Up to 128 × 128 | 2× |

The game scales pixel art up by whole numbers with crisp (nearest-neighbour) scaling, so keep every asset at its native size and let the engine enlarge it.

**Feed PixelLab the concept sheet** from §3 as the reference image for each hero. That's what keeps the sprite looking like the painted art.

---

## 3. The heroes

Each hero needs three things:
1. A **concept sheet** made in ChatGPT, in the same layout as the villain sheets: title "NAME / HERO", a **front** view, a **top-down** view and an **expression strip** of neutral, pleased and stern. This becomes the reference for everything else.
2. **Painted dialogue art**: a comms portrait (256 × 256, head and shoulders, transparent background, three expressions) and an intro-card pose (about 600 × 800, full body, dynamic, transparent background).
3. **PixelLab sprites** for the Fortress (64 × 64, 8 directions): **idle** (loop), **talk** (a gesture loop while speaking), **react_pleased**, **react_stern** and **walk** (Bastion and Patch only, who move around the hub).

### Halo: the world's number-one hero
- **Role in the story:** the hero everyone measures themselves against. Distant, composed, and slow to approve of Volt; approval is earned across many runs. The emotional heart of the story.
- **Signature colour:** **dawn white `#FFF1D0`**, a warm radiant white (not gold). Secondary: pearl `#E8E4DA`, deep midnight `#1B2236`.
- **Silhouette:** tall, upright, still. A **floating ring of light** hovers behind the head, the one feature readable at any size.
- **Costume:**
  - Ivory and pearl armoured suit with smooth, minimal plates.
  - A short, stiff mantle over the shoulders.
  - Thin dawn-white light lines along the seams.
  - No visor: an open, calm, older face. Experienced, not young.
- **Identity:** woman, late 40s, dark brown skin, close-cropped silver-white hair, high cheekbones.
- **Body language:** arms folded or hands clasped behind the back. Never fidgets.
- **Hub spot:** the **observation balcony**, looking out over the city, back half-turned to the room.
- **Intro-card pose:** turning to look over one shoulder, the light ring blazing, the city below.
- **Avoid:** gold or yellow (that's Bellwether), angelic wings and religious iconography. The ring is light tech, not a literal halo.

### Bastion: the Fortress commander
- **Role in the story:** a gruff veteran who runs the Fortress and thinks rookies get people killed. Tough-love mentor.
- **Signature colour:** **steel `#9FB0C8`**. Secondary: gunmetal `#3A4252`, worn olive webbing `#4D5240`. Force fields glow a pale steel-white.
- **Silhouette:** the widest hero, a square block. Heavy shoulders, planted feet.
- **Costume:**
  - Battered steel plate armour over a padded undersuit.
  - Hexagonal **force-field emitters** on both forearms that project translucent hex shields.
  - A commander's sash or insignia; the armour is visibly repaired and dented.
  - Short grey hair, a scar, an unimpressed face.
- **Identity:** man, late 50s, pale weathered skin, grey buzz cut, a scar through one eyebrow, heavy jaw.
- **Body language:** leaning on the command table with both fists, or arms crossed.
- **Hub spot:** the **command table** at the centre of the hall: the mission map of the city's districts.
- **Intro-card pose:** stepping forward with a hex shield projected, the other hand pointing at the viewer like an order.
- **Avoid:** bright chrome or a knight look. This is practical, used military kit.

### Echo: the rival
- **Role in the story:** a sharp-tongued psychic close to Volt's age. Part rival, part friend.
- **Signature colour:** **periwinkle `#8B93FF`**. Secondary: charcoal `#24232E`, pale lilac-grey `#C9CBE6`.
- **Silhouette:** lean and quick. **Asymmetric**: a high collar or hood on one side, and **concentric sound-ring arcs** floating near one ear.
- **Costume:**
  - Fitted charcoal suit with a cropped jacket.
  - Periwinkle wave patterns that ripple along the sleeves.
  - A slim headset or diadem that glows when using powers.
  - Young, expressive, confident face; a smirk is the default.
- **Identity:** non-binary, about 20, East Asian, black undercut hair with one periwinkle streak, sharp features.
- **Body language:** sitting on things that aren't chairs, spinning something in one hand, never quite facing you.
- **Hub spot:** the **training corner**: battered dummies, a sound-dampening wall, Echo perched on a crate.
- **Intro-card pose:** mid-leap with two fingers at the temple, sound rings blooming outward.
- **Avoid:** pink and magenta (that's Glasswake), and anything purple-heavy (Gravemark and upgrade UI).

### Thorn: the reformed villain
- **Role in the story:** a quiet former villain still earning the Fortress's trust, just like Volt. A kindred outsider.
- **Signature colour:** **leaf green `#6AD46A`**. Secondary: bark brown `#4A3628`, moss `#2F4A32`. Small white or pale flowers as accents.
- **Silhouette:** hunched slightly, guarded. A **crown of living thorns** or spiky leaf-hair makes the head instantly recognisable.
- **Costume:**
  - Their old villain armour, dark and angular, **repurposed**: the old villain emblem is scratched out.
  - **Living plants** wrap the arms: green vines, thorns, a few small flowers.
  - Calm, tired eyes.
- **Identity:** man, mid-30s, olive-tan skin, shoulder-length dark hair tangled into the thorn crown, short beard.
- **Body language:** standing apart from the others, tending a plant, glancing over.
- **Hub spot:** the **greenhouse nook**: a cramped glass corner full of potted plants, away from everyone.
- **Intro-card pose:** vines erupting from the ground around them, one hand raised to stop an attack, not to make one.
- **Avoid:** rust, copper, corroded metal or acid lime. That's Verdigris. **Thorn is living wood and leaf; Verdigris is dead metal and poison.**

### Patch: the Fortress engineer
- **Role in the story:** doesn't fight. Runs comms and the tech workshop, where Renown Shards buy upgrades. Deadpan humour.
- **Signature colour:** **teal `#55E6C1`** (this is also the game's heal and ready colour, which fits a support character). Secondary: work-orange stitching `#C9772F`, navy `#1E2A3D`.
- **Silhouette:** compact, with a **big over-ear headset** and a **tool rig or small drone** hovering at one shoulder.
- **Costume:** navy utility overalls rolled at the sleeves, a tool belt, safety goggles pushed up on the head, a tablet always in hand.
- **Identity:** woman, late 20s, South Asian, thick dark curly hair tied up under the headset.
- **Body language:** typing without looking up, one eyebrow raised.
- **Hub spot:** **Patch's workshop**: the upgrade terminal and a bench of half-built gadgets.
- **Intro-card pose:** leaning back on a workbench, sipping from a mug, the drone holding a wrench.
- **Avoid:** any combat pose. Patch is the only character who never looks dangerous.

### Volt in the Fortress
Volt walks around the hub. Use the same sprite set as in combat (see `art-brief.md`), plus two optional extras: **idle_relaxed** (arms loose, visor up) and **interact** (a small nod or reach).

---

## 4. Paste-ready prompts: heroes

### ChatGPT concept sheet (one per hero)

> [Style preamble from §1]
>
> Create a character concept sheet for **[NAME], a hero** in this game, laid out like a game studio reference sheet on a dark night-city background. Title at the top-left: "[NAME] / HERO" with a small subtitle "[ROLE]". Three panels: (1) **FRONT** full-body view, standing; (2) **TOP-DOWN** view from a steep three-quarter overhead camera, as it would appear in the game; (3) an **expression strip** of three head-and-shoulder portraits labelled NEUTRAL, PLEASED and STERN.
>
> Character: [paste that hero's Identity, Silhouette, Costume and Body language bullets]. Heroic adult proportions, not chibi. Signature glow colour [HEX], secondary colours [HEXES]. [paste the Avoid line].

### ChatGPT comms portrait and intro art (after the sheet is approved)

> [Style preamble] Using the attached concept sheet as the exact character reference, paint **[NAME]**: (a) a 256 × 256 head-and-shoulders portrait, slight three-quarter turn toward the viewer, **transparent background**, expression **[neutral / pleased / stern]**; (b) a full-body dynamic pose for a game intro splash card, about 600 × 800, **transparent background**: [paste the Intro-card pose].

### PixelLab character (one per hero)

> **Description:** [NAME], [two-line costume summary], signature colour [HEX]. Top-down action game character, night city superhero.
>
> **Settings:**
> - High top-down view, 8 directions, 64 × 64 canvas.
> - Single-colour black outline, medium shading, medium detail.
> - Transparent background.
> - Reference image: the concept sheet's top-down panel.
>
> **Animations:**
> - idle (6 frames, loop)
> - talk (6 frames, loop)
> - react_pleased (5 frames)
> - react_stern (5 frames)
> - walk (8 frames, Bastion and Patch only)

---

## 5. The Fortress

### What it is
The heroes' headquarters: a fortified hall built into the **crown of an old skyscraper**, high above the districts the Redactor's villains hold. Every run starts here and every run ends here. It should feel like **home base during a siege**: warm and lived-in inside, with the dangerous city glowing through the windows.

### Look and feel
- **Materials:** dark navy steel, poured concrete, riveted beams, worn rubber floor mats, a few old wooden pieces brought in by the heroes.
- **Lighting:** mostly **warm amber work lamps** (pools of light) against cool shadow. **Electric-blue** accents on hero tech, terminals and the Deploy Gate. Each hero's station carries a little of their own colour.
- **The city is always visible** through a huge arched window wall along the top edge of the room: night skyline, warm window lights, a faint glow over the villains' districts.
- **Mood:** busy but calm. A refuge, not a showroom. Clutter is fine; mess that hides walkways isn't.

### Layout (the hub floor plan)

The room is one large hall, about 28 × 20 game tiles: the same size as a rooftop arena, seen with the same camera. Volt walks between stations, like the House of Hades.

| Area | Where | What's there |
|---|---|---|
| Deploy Gate | Bottom-centre (the exit) | A reinforced blast door or launch hatch with a blue status light and a ramp. Opens onto the rooftops. |
| Command table | Centre | Bastion's spot. A large table with a glowing holographic **city map** showing the districts, with villain markers. |
| Observation balcony | Top-centre, at the window wall | Halo's spot. A railed platform in front of the arched windows. |
| Patch's workshop | Left wall | The **upgrade terminal** (where Renown Shards are spent), a workbench, gadget shelves, cables and a charging drone dock. |
| Armoury | Right wall | Five display racks, one per **combat style**: Brawler wraps, Arc Caster coils, Titan gauntlets, Speedster boots, Magnetar disc. Locked racks have a shutter. |
| Training corner | Bottom-right | Echo's spot. Battered dummies, a cracked sparring mat, a stack of crates to sit on. |
| Greenhouse nook | Top-left corner | Thorn's spot. A glass-walled corner crowded with plants, a watering can and a single stool. |
| Commendations wall | Upper-left wall | A notice board of **Hero Licences and commendations**, with pinned photos and medals. |
| Trophy shelf | Upper-right wall | Grows as villains are beaten: Kilnheart's cracked visor, a Bellwether speaker cone, a Verdigris leaf blade, a Glasswake mirror shard, an Undertow ice chunk, a Gravemark stone, the Redactor's mask fragment. |
| Volt's locker and bunk | Bottom-left | A small personal space: a locker, a rookie's poster of Halo on the wall, a cot. |

### Tile and prop list for PixelLab

All at **32 px per tile**, high top-down, single-colour black outline, transparent background where they aren't floor.

**Floors** (32 × 32, seamless):
- Riveted steel plate
- Steel plate with wear
- Concrete
- Concrete with cracks
- Grated walkway (dark gaps)
- Rubber mat, plain and with stripe
- Worn wooden floorboards (greenhouse and bunk)
- Hazard-stripe edge
- Transition pieces between steel and concrete

**Walls** (seen from above with the inner face showing, like the rooftop parapet):
- Straight segment, inner corner, outer corner, wall with a pipe run, wall with a vent.
- The **arched window** segment (city view behind glass), 64–96 px wide.

**Doors:**
- The Deploy Gate (128 × 96, closed and open states, blue light).
- A small side door (64 × 64).

**Props per station:**

| Station | Props |
|---|---|
| Command table | Table (96 × 64) with a separate hologram overlay (animated, 4 frames); a chair |
| Upgrade terminal | Terminal (64 × 64), animated screen (4 frames); workbench (96 × 32); gadget shelf (64 × 64); drone dock |
| Armoury | Rack (32 × 64) × 5 variants, one per style item; shutter-closed variant |
| Training corner | Dummy (32 × 64, intact and battered); sparring mat (96 × 64); crate stack |
| Greenhouse | Glass wall pieces; potted plants × 4 variants; hanging plant; watering can; stool |
| Commendations and trophies | Notice board (64 × 64); trophy shelf (96 × 32) with **seven trophy items as separate 16–32 px sprites** so they can appear one at a time |
| Bunk | Locker (32 × 64); cot (64 × 32); Halo poster (decal) |
| General | Amber work lamp (with a separate light-pool overlay), pipes, cable bundles, toolbox, coffee mugs, crates, fire extinguisher, a "DEPLOY" floor arrow decal (no other text) |

**Animated details** (small loops, 4–6 frames): blinking terminal lights, the hologram map, the drone hovering, a flickering lamp, rain streaks on the window glass.

---

## 6. Paste-ready prompts: Fortress

### ChatGPT Fortress concept (generate this before any tiles)

> [Style preamble from §1]
>
> Concept painting of **the Fortress**, the heroes' headquarters in the game "Volt": a fortified hall built into the crown of an old skyscraper at night. Show it from the game's **steep three-quarter top-down camera**, the whole room in one view.
>
> Along the top edge, a **wall of huge arched windows** shows the night city below, warm orange window lights and a faint glow over distant districts. Materials: dark navy steel, riveted beams, concrete, worn rubber mats. Mostly **warm amber work lamps** with cool shadows and **electric-blue** tech accents.
>
> Stations around the room:
> - centre: a command table with a glowing holographic city map;
> - top-centre: an observation balcony at the windows;
> - left: an engineer's workshop with an upgrade terminal, workbench and drone dock;
> - right: an armoury with five equipment display racks;
> - bottom-right: a training corner with battered dummies;
> - top-left: a small glass greenhouse nook full of plants;
> - bottom-left: a rookie's locker and cot;
> - bottom-centre: a heavy blast door, the **Deploy Gate**, with a blue status light.
>
> Leave clear walkways between stations. Lived-in, busy but calm: home base during a siege. No characters, no text.

Then ask for **close-up concept panels of each station** (same style) to use as PixelLab references.

### PixelLab tiles and props

> **Description:** [item from the §5 list, e.g. "riveted dark navy steel floor plate, worn, slight rust at the rivets"], interior of a superhero headquarters at night, warm amber lamp lighting from the top-left, electric-blue tech accents.
>
> **Settings:**
> - High top-down view.
> - 32 × 32 tile, or the prop size listed.
> - Single-colour black outline, medium shading, medium detail.
> - Seamless for floors; transparent background for props.
> - Reference image: the Fortress concept painting.

---

## 7. Consistency checklist (before sending assets over)

- [ ] Nobody looks chibi or cute: heroic proportions, small heads.
- [ ] Same camera as the concept sheets' top-down panels (high top-down), across every hero and prop.
- [ ] Black outlines on everything. Same outline weight at the same canvas size.
- [ ] Each hero uses only their signature colour for glow; none of the villain colours.
- [ ] Characters stay the same between sheet, portrait, intro art and sprite: hair, face, proportions, signature feature (Halo's ring, Bastion's hex emitters, Echo's sound rings, Thorn's thorn crown, Patch's headset and drone).
- [ ] No text baked into art (except labelled concept sheets).
- [ ] Transparent backgrounds on everything except floor tiles and the concept paintings.
- [ ] File names follow `art-brief.md`: `assets/sprites/<id>/<id>_<animation>.png`, `assets/portraits/<id>.png` (plus `_pleased` and `_stern`), `assets/intro/<id>.png`, and `assets/fortress/` for tiles and props.

**Suggested order:**
1. The Fortress concept painting.
2. Halo's and Bastion's sheets. They're the two most important relationships.
3. Echo, Thorn and Patch.
4. Portraits and intro art.
5. PixelLab sprites.
6. Fortress tiles and props.
