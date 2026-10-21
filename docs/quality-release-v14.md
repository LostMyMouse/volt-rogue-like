# Quality pass — 21 October 2026

Build: `2026-10-21-quality-v14`.

## Implemented

- Post-boss continuation follows game time, pauses safely and cannot fire into a restarted operation.
- Safe rooftop checkpoints preserve weapon/build, health, route, Field Credits, offers, cleared exits, purchases and post-boss continuation. Interrupted combat restarts that roof. Victory, defeat and new operations clear the checkpoint.
- Nested save validation, strict imports, previous-good backups, automatic recovery messages and Save Slots recovery/export controls. Erasing a slot also erases its backups.
- Separate collision footprints for all seven painted boss arenas; ordinary roofs retain their shared layout. Central approaches, arrival points and exits are checked.
- Results use the operation's planned combat/boss room count instead of the obsolete 23-room denominator.
- Mobile power decisions put replacement/level information under the title, shorten the initial benefit text, provide separate expandable details and add inked weapon/hero emblems.
- Decoded audio uses a 32 MiB LRU target. Active speech, music, ambience and crossfading loops are protected; their combined size can exceed the target until playback changes. The mobile preflight retained approximately 40.9 MiB across three active buffers, versus 74.5 MiB in the earlier short audit session. These are different session samples, not a controlled percentage benchmark. Existing speech remains unchanged; all active recordings are verified.
- Ordered asset loading resolves the portable base before requesting scripts/styles, avoiding speculative wrong-path requests at clean game URLs.
- Ninety-six authored Volt attack poses across the five weapons and Titan's separate Special, plus twenty grounded hero station poses. Large-character passing, attack anticipation/contact/recovery and hit-reaction pose selection is expanded. [Asset paths and prompts](animation-assets-v14.md).
- Comic preloading is limited to approaching pages, with tighter action holds. Full action paintings and highlight canvases are released when the comic ends or is skipped. Narration completion remains the advancement gate; both team spreads remain three seconds and page turns remain intact.
- Magnetar has a 0.34-second minimum throw cycle. Point-blank catch/rethrow could otherwise bypass recovery and repeatedly trigger first-hit bonuses.
- Current README, one regression runner, a repeatable speech-inventory exporter and a [release checklist](release-checklist.md).

## Measurements and verification

The automated progression harness completes all five weapon operations, covering 35–37 combat/boss rooms in its seeded samples, five supply stops per operation, purchases, Lockjaw/Relay, in-run hybrids and final results. It deliberately defeats enemies to exercise transitions; it does not establish fair difficulty or human completion times.

A thirty-second stationary single-target lab measured base damage/second of approximately Brawler 77, Caster 59, Titan 69, Speedster 91 and Magnetar 59 after the catch-cycle fix. Magnetar previously measured 143. With four selected Rare powers it fell from approximately 464 to 217, without changing per-hit damage. These are controlled range/target measurements, with no incoming attacks or Composure bonus; movement, range and actual boss phases change practical performance.

The new tests cover paused boss transitions, restart isolation, reload recovery, stable offers/purchases, invalid data, grading length, arena arrival/exit clearance, eighty normal-weapon pose renders, twenty station pose renders, small-landscape decision metadata and bounded audio-cache behavior. The established suites continue covering comic turns, mobile boot/audio lifecycle, Composure, shops, variants, mirrors and sprite bounds. Per-release results are generated under `test-results/regression/`.

## Still open

- Physical iPhone Safari and Android Chrome sessions, Home Screen/fullscreen/audio interruption behavior, thermal/frame pacing and long-session memory checks.
- Human full-run balance and listening passes, including fresh/upgraded weapons and representative defeats.
- Fully authored alternating locomotion for the larger cast and deeper character motion within comic paintings. Generated walk candidates with repeated leading limbs were rejected, not shipped as completed animation.

Native app packaging, cloud saves and offline support remain separate optional projects.
