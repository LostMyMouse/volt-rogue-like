# Combat, art and mobile update

## Composure

Regular enemies have 70 Composure; bosses have 180. A successful parry removes 35 or 60 respectively. Direct hits chip away at 18% of damage, capped at 6 per hit for ordinary enemies or 9 for bosses. Damage over time does not drain Composure.

A break staggers the target for three seconds and changes the Exposed damage multiplier to Ã—2. Composure cannot break again during that window. It refills after the break; otherwise it begins regenerating after five seconds without pressure. Props, shield plates, ice, buds and decoys do not have Composure. Parrying a projectile affects its actual owner.

The tutorial teaches a parry, then a Composure break. Its practice enemy waits while Bastion explains the lesson and has a longer recovery between swings. Mobile training reserves space for instructions and frames both fighters underneath.

## Art and effects

The full cast uses 15 transparent comic atlases under `assets/sprites/comic/`, each containing 32 poses: four directions and eight action poses. The renderer chooses poses using existing attack clocks and key frames. It measures foot anchors and uses smooth high-quality sampling; legacy art is a loading fallback. Atlases are loaded on demand, and redundant legacy animation textures are released.

All attacks gain local inked speed strokes and halftone accents in the attacker's palette. These are cosmetic; telegraphs, hitboxes and safe gaps keep their existing geometry. Undertow's detailed hook pose replaces the old sheet with neighbouring-frame fragments.

## Safari and menus

Audio resumes from trusted touch/click gestures and retries after interruption, fullscreen or returning to the page. A rejected first resume no longer permanently latches sound off, and failed downloads can retry. The hosting launcher must call the game's `audioUnlock()` in the fullscreen gesture before awaiting fullscreen. The site's `games/volt/` copy must be updated alongside this repository.

The landscape prompt only covers active gameplay, so it no longer blocks the start menu in portrait. Start-menu buttons have a touch-up activation path with duplicate-click protection. Decorative key art cannot intercept taps.

## Character memory and portraits

Each villain has three voiced recurring taunts. Their active save slot's `killedBy` history unlocks them, even after another villain defeats Volt in a later run. A saved cursor rotates the lines, and a per-run flag avoids repeating an introduction. Existing story conversations still progress.

Comms use the transparent portrait PNGs. Missing expression art falls back to that character's real base portrait before showing a name, rather than immediately substituting a generic bust.

## Verification

`node tools/tests/composure.cjs` runs the dependency-free Composure checks. Browser checks also covered desktop, two touch landscape sizes and portrait menus, all portrait fallbacks, rival history, mobile tutorial bounds and the complete set of 15 atlases. Audio checks simulated a rejected first resume, interruption and transient fetch failure. These simulations do not replace testing Safari on a physical iPhone. The complete speaking cast now uses Eleven v4. All 157 active recordings have model/casting/checksum provenance in `tools/audio/cast-v4-manifest.json` and transcript checks in `tools/audio/cast-v4-qa.json`.
