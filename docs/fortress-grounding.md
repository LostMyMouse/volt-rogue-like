# Grounded Fortress NPCs and shorter team spreads

Fortress NPC idle rendering applied a sinusoidal vertical translation to the entire body. Their feet therefore lifted away from the floor shadow. The always-visible coloured ground rings reinforced the appearance of hovering.

Fortress NPC drawing now passes a grounded rendering option through the existing animation pipeline. It suppresses the idle body lift while preserving subtle breathing around the planted foot anchor. Contact shadows remain on the floor; coloured rings appear only for the nearby interaction target. Combat animation defaults remain unchanged.

Both The Vanguard and The City Under Siege team spreads now hold for three seconds before their page turn. Cover zoom, page-turn durations, recorded narration and action-panel pacing are unchanged.

Validation: raster measurements across five times for every Fortress NPC show an identical floor contact row while each retains distinct breathing frames. The opening check covers both three-second gates and the real cover zoom/page-turn sequence at desktop and three phone sizes. Comic-motion regression and complete recorded-line coverage pass. Phone checks use Chromium touch emulation, not physical Safari.
