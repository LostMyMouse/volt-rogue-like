# Locomotion cleanup

The old comic cycle interleaved standing frames between both stride poses and applied an extra whole-body bounce. Sprite registration used the lowest visible foot, which moved the entire body sideways as foot positions changed.

Locomotion now uses dedicated movement poses without the inserted standing frames or artificial bounce. Torso registration keeps the body centred, and movement frames retain a consistent displayed height. Volt has a separate eight-frame, four-direction comic jog atlas; Fortress playback is slower to suit the larger sprite. Needle hover uses its stable drone pose.

The new atlas was generated using built-in Imagegen, with the existing Volt atlas as the identity reference. The exact prompt is stored in `docs/volt-jog-prompt.json`. This changes presentation only; movement speed, collision and combat timing are unchanged.
