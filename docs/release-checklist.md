# Browser release checks

Record build tag, game and launcher commit IDs, regression results and live verification. Preserve unrelated games when updating the launcher.

## Automated gate

- All suites in `node tools/tests/run.cjs` pass against the release candidate.
- Spoken inventory matches source checksums and all active recordings match cast provenance.
- Checkpoints cover combat, offers, purchases, exits and boss continuation. Exercise all styles, damaged slots, import rejection, backup recovery and erasure.
- Boss colliders agree with paintings. Landing points, exits and central approaches remain traversable. Check movement, dash, projectile clipping and Mirror Hall identity puzzles.
- Inspect small landscape power choices, overlays, loading, grounded feet and reduced-motion mode.
- Verify production build tag and changed runtime file hashes after deployment, then exercise production Continue and a paused boss transition.

## Physical devices — requires someone with the devices

Record device, OS and browser versions. Emulation cannot mark these complete.

- iPhone Safari and Android Chrome: landscape, rotation, fullscreen exit, page scroll lock, safe areas and Home Screen launch. Safari browser chrome behavior needs separate observation.
- First tap starts audio; voices begin cleanly. Speakers/headphones, volume changes, background/foreground, lock/unlock and audio interruptions.
- Thirty-minute sessions spanning comic, Fortress, practice, powers and bosses: heat, frame pacing, input latency, reload recovery and memory pressure.
- Reachable touch controls, simultaneous movement/parry/dash, visible telegraphs, readable text and color-independent hazard shapes.
- Keyboard/controller accessibility: focus order, remapping needs, reduced motion, expanded power details and readable captions.

## Human balance and story

Complete a fresh and an upgraded operation per weapon. Record elapsed/boss time, deaths/hits, parries, healing, credits earned/spent, choices, advanced enemies and hybrid availability. Include losing runs. An invulnerable automation bot cannot establish difficulty or human completion time.

Confirm coherent first deployment, extraction, retry, first win and later victories. Check Redactor/Halo and Thorn/Verdigris revelations unlock in order and repeat encounters remain consistent with extraction and renewed relays. Listen to dialogue rather than relying solely on coverage.

## Art acceptance

Reject repeated leading limbs, changed helmets, clipped crowns/capes and detached effects. Inspect gameplay size, every facing and transitions. Large-character locomotion and deeper character animation within the motion-comic paintings remain production work until visually accepted; generated candidates alone do not close those items.
