# Rooftop mystery and playability fixes

Rooftop exits show only Power, Upgrade, Renown shards or Unknown villain. Hero portraits, hero colours and villain portraits/names are hidden until arrival. A route is sampled once per run: three distinct random district operators, then Gravemark and Redactor. The district briefing reveals neither its scenery nor its operator, and reopening it does not reroll the destination. Reward offers are revealed on landing.

The notebook now provides metadata for Operation notes; entering it from the bunk and returning to the Fortress works, as does returning to pause. Fortress artwork has clearer painted thresholds, with small labelled entry markers positioned on the collision corridors. Existing connected-room and interaction tests still pass.

Volt uses three new transparent 2x2 stride atlases (east, south, north), with west mirrored from east. Four phases exchange leading limbs, and each cell's connected character body is isolated before rendering. Stray neighbouring fragments are discarded. Torso centres and grounded feet provide registration. The opening now frames three acts: heroes protecting civilians, Redactor’s villains seizing the city, then Volt stepping forward. Every scene has an explicit Hero/Villain badge, an action-led heading and a chapter label; three chapter openers connect the montage into a conflict. Volt remains the sole narrator, with all existing recorded wording intact. Comic scenes hold panels for several seconds, wait for completed narration plus a pause and use a slower camera. Their subtle highlights sample the actual illustrated pixels and use precisely the same crop as the art, replacing displaced particles and geometric overlays.

Villain encounter cards use the existing genuine transparent character busts instead of opaque environmental posters. These busts are 256px; hero cards retain their larger transparent illustrations. Villain attacks use flat ink regions, dark contours, facets, hatching and restrained particle shapes; bloom and gradients have been removed from the attack layer. Combat geometry and timing are unchanged.

Audio now returns cached decoded buffers correctly, preloads upcoming dialogue, warms reverb impulses, schedules sources with 60ms headroom and disconnects effect chains after use. No new speech text or recordings were needed. All 737 active spoken lines remain verified Eleven v4.

## Validation

- Expansion tests: advanced enemies, all five weapon variants, three Patch mods, hybrid prerequisites, contracts, every room reachable, motion-comic order and mobile caption bounds.
- Playability tests: 150 random route samples; concealed/same category icon for all heroes/villains; route reopen stability; fixed finale; notebook through actual bunk interaction and pause; first/cached repeat speech and audio-node disposal; real transparent villain image; production stride/effect captures. Recorded canvas animation is included in local test artifacts.
- Release tests: desktop/mobile start controls, rival memory, Safari unlock/retry/fullscreen simulation, tutorial bounds and Composure.
- Narrative tests: completed-dialogue knowledge gates, transparent hero comms, ducking, cancelled pending speech, registered four-phase strides.
- Complete speech source inventory, provenance and audio checksum coverage.

Performance data in comms-performance.json uses headless Chrome with 4x CPU throttling, desktop 1280x800 and touch 844x390 at DPR2, with eight enemies. Each stage lasts 1.6 seconds. Frozen comms/power backgrounds draw once instead of roughly 360-384 times, reducing background render CPU from 340ms to around 1-2ms. Power offer handling still costs roughly 32ms at 4x CPU; the desktop initial frame gap remains about 84ms, so this is not a claim of eliminating every entry hitch. Gameplay resumes rendering on selection, with approximately 23-26ms maximum frame gaps in these samples. This is emulation, not a physical iPhone Safari benchmark.
