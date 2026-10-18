# Comic pacing and robot motion refinement

Page illustrations remain intact during transitions. A narrow ink-edged paper curl reveals the incoming page over 1.05 seconds; it no longer projects artwork into thin strips or shows a broad blank reverse page. Cover opening uses the same treatment over 1.25 seconds. Reduced-motion settings use a dissolve.

The Vanguard spread stays for eighteen seconds, establishes all five heroes, moves closer to Halo, passes across Bastion/Thorn and Echo/Patch, then returns to the full team. Villains receive fourteen seconds. Landscape spreads fill the available action width and mobile combat controls are hidden throughout the comic. Manual Next and Skip remain available; existing narration-completion gates remain on voiced scenes.

The robot now uses sixteen authored poses from a transparent sprite atlas: four idle, four walk, windup/launch/contact/recovery and flinch/stagger/kneeling shutdown/collapse. Both tutorial and practice use the same state-bound animation renderer. Attacks follow the existing hit and parry timing; actual damage triggers flinches and defeated training enemies animate shutdown. Robot corpses are visual only, clear on reset and cannot also render the old Rusher corpse. Connected-body extraction preserves heads and hands extending beyond nominal atlas cells.

Validated with comic-motion (sixteen distinct rendered poses, real damage/shutdown reactions, extended reveal timing, camera passes and page continuation), comic-armoury, rooftop-supply, mobile boot-race and full recorded-line coverage. The new atlas was made with built-in image_gen; saved asset path and exact prompt are in robot-motion-art.json. No new voice recording is needed. Mobile checks use Chromium touch emulation, not physical Safari.
