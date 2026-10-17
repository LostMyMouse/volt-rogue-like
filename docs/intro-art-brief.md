# Intro and broadcast art: brief for ChatGPT

## What's wrong now
The villain intro images (`assets/intro/*.png`) were cropped from the concept sheets, so every one is a **solid rectangle with the painted scene behind the character**. When the game puts them over its own backgrounds (intro cards, the Redactor's TV broadcast), they look pasted on. Heroes and Volt have no intro art at all.

What the game needs instead is **cut-out characters**: the figure only, on a fully transparent background, so the game can place them over anything and add its own glow, lighting and effects.

## Deliverables (14 images)
| File | What |
|---|---|
| `assets/intro/volt.png` | Volt, full body |
| `assets/intro/halo.png`, `bastion.png`, `echo.png`, `thorn.png`, `patch.png` | The five heroes, full body |
| `assets/intro/kilnheart.png`, `bellwether.png`, `verdigris.png`, `glasswake.png`, `undertow.png`, `gravemark.png`, `redactor.png` | The seven villains, full body (replacing the current ones) |
| `assets/intro/redactor_broadcast.png` | The Redactor, chest-up and facing camera, for the TV broadcast |

Zip them in that folder structure and send them over. Keep the file names exactly as above.

## Rules for every image
- **Volt is male (he/him).** Keep Volt's build youthful, masculine and athletic and the face hidden behind the visor in every image.
- **Transparent background. Nothing behind the character:** no scene, sky, floor, frame, gradient, glow box, vignette or shadow on the ground.
- **One character, the whole figure in frame.** Nothing cropped at the edges except where stated (the broadcast bust), with a small empty margin all round.
- **Portrait canvas, 1024 × 1536 px** (the broadcast bust: 1024 × 1024).
- **Same style as the portraits and concept sheets:** comic ink and paint, thick black ink outlines, painterly colour, cel-shaded lighting from the top-left, a rim light in the character's own colour. Grounded heroic proportions, not chibi.
- **Effects that belong to the character can stay** (Halo's light ring, Kilnheart's glowing vents, Gravemark's floating rocks, Undertow's ice gauntlets), as long as they sit on transparency, not on a coloured cloud.
- **No text, logos, signatures or watermarks.**

### Checking transparency
ChatGPT previews sometimes show a grey-and-white checkerboard that is actually painted into the image. Before sending, open the PNG on a dark page or in Preview with a dark background. If you see a checkerboard, grey box or dark rectangle, it isn't transparent. Ask ChatGPT: *"The background must be real alpha transparency, not a drawn checkerboard. Please regenerate as a PNG with a transparent background."*

## How to prompt
1. Start a new chat. Attach that character's **portrait** (`assets/portraits/<id>.png`) and, if there is one, their **concept sheet** (`concept-art/villains/<id>.webp`, or `concept-art/volt.webp`), so the design matches.
2. Paste the **style block**, then the **character line** from the list below.
3. Check the result against the rules above. Ask for a redo if anything is cropped or the background isn't transparent.

### Style block (paste first, every time)
> Create a single character illustration for a game intro card. Match the attached reference images exactly for the character's face, costume, colours and proportions. Style: comic-book ink and paint, thick black ink outlines, painterly cel shading, light from the top-left with a rim light in the character's signature colour, grounded heroic adult proportions (not chibi). Full body, the whole figure in frame with a small margin, dynamic intro pose. **Transparent background (real PNG alpha)**: no scene, no floor, no frame, no glow box, no ground shadow, no text. Portrait canvas 1024 × 1536.

### Character lines
**Volt**, signature colour electric blue `#26BFFF`. Volt is a young adult man (he/him): a lean, athletic masculine build, face fully hidden by the visor. Mid-leap toward the viewer, one fist crackling with blue lightning, white swept collar and fins, angular glowing visor, spiky crest. Eager, slightly reckless.

**Halo** (dawn white `#FFF1D0`): standing tall, looking back over one shoulder, a halo ring of light behind her head. Calm, composed, distant.

**Bastion** (steel `#9FB0C8`): stepping forward, one forearm raising a translucent hexagonal force-field shield, other hand pointing like he's giving an order. Gruff veteran.

**Echo** (periwinkle `#8B93FF`): mid-leap, two fingers at the temple, concentric psychic sound rings blooming outward from the head. Smirking.

**Thorn** (leaf green `#6AD46A`): green vines and thorns rising around the legs, one hand raised to stop an attack rather than strike. Guarded, quiet.

**Patch** (teal `#55E6C1`): leaning back with a coffee mug, headset on, a small helper drone floating at the shoulder holding a wrench. Deadpan. The only one who doesn't look dangerous.

**Kilnheart** (furnace orange `#FF7A1A`): heavy armoured furnace suit with glowing chest vents, slamming one fist into an open palm, steam venting, orange visor.

**Bellwether** (gold `#F5B915`): striking a pose like a rock star mid-show, gold speaker gauntlets thrumming with visible sound waves.

**Verdigris** (toxic lime `#B8E62E`): tall living-metal plant armour, rusted copper vines unfurling from the shoulders, one clawed hand reaching forward.

**Glasswake** (magenta `#FF3F9A`): mirrored visor, crystal shard wings, a faint duplicate reflection offset behind her, playful pose.

**Undertow** (ice blue `#7FD8FF`): bulky diving suit with frozen ice gauntlets, water spiralling around one arm, scowling.

**Gravemark** (stone purple `#B56CFF`): towering stone golem, one fist made of boulders, the other hand raised with purple gravity energy, chunks of rock floating around it.

**The Redactor** (crimson `#E0283C`): tall figure in a long black coat with crimson lining, white rectangular mask with a red vertical line, floating black slab plates, one hand extended toward the viewer as if revoking something.

**The Redactor, broadcast bust** (`redactor_broadcast.png`, 1024 × 1024): from the chest up, facing the camera straight on, hands steepled, calm and polite like a news anchor or a corporate announcement. Transparent background. The game adds the TV screen, scanlines and glitch effects itself, so don't draw a screen, frame or scanlines.

## When they arrive
Send the zip. I'll drop the images in, remove the old cropped ones, and set up the intro cards and cutscene to use the new cut-outs, with in-engine glow and lighting so they sit in the scene. Hero intro cards will switch from the placeholder busts to the new art automatically.
