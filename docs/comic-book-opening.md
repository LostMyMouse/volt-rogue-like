# Consistent book opening and page size

The opening previously revealed a much larger Vanguard page behind a curl restricted to the small closed-cover rectangle. It now opens in two stages: a 0.9-second zoom into the cover, then a 1.6-second turn of a snapshot of that fully zoomed cover. The destination page is not painted during the zoom.

A fixed book frame, derived from viewport size rather than the current caption, contains the cover turn, complete team illustrations, wordmark and action pages. Team pages no longer occupy a larger viewport than the action strip. New action pages enter at their first panel's final camera scale, avoiding the previous full-atlas preview followed by a second zoom. Camera movement between action panels remains.

The City Under Siege spread now holds for six seconds instead of fourteen. Manual advance remains available. Reduced-motion mode retains its dissolve.

Validation: the new comic-book-opening test clicks the real Open Comic and Turn Page buttons, waits on the running animation, verifies zoom precedes the turn, captures successive rendered stages, checks identical book bounds through the Vanguard and Halo pages, checks the incoming camera scale remains stable and verifies the six-second villain-page gate. Covered 1280×800, 667×375, 844×390 and 390×844. Existing lettering, opening, armoury and robot checks remain; recorded narration is unchanged. Phone checks are Chromium touch emulation, not physical Safari.
