# Fortress — PixelLab asset kit

First pixel-art pass based on the approved Fortress paintings: dark navy architecture, warm amber fixtures, blue technology, high top-down camera. All artwork was generated with PixelLab; source prompt descriptions are in generation-notes.json.

## Contents

- 73 base images: nine floor textures, walls/windows/railings, balcony, doors, command table, workshop equipment, armoury racks, greenhouse props, training equipment, commendations board, trophy shelf and seven boss trophies, bunk/locker, lights and small decorations, overlays and city background.
- 16 additional steel-to-concrete transition tiles covering all four-corner combinations.
- Five four-frame horizontal sprite sheets: hologram map, terminal screen, support drone, work lamp and rain. Animated GIF previews are in previews/.
- Static prop atlas and floor strip with JSON coordinates, plus individual transparent PNGs.
- A suggested 28 × 20 tile layout, interaction points, spawn point and approximate collider rectangles.

## Import into the game

Copy assets/fortress into your asset directory. Read manifest.json for native sizes, anchors, optional blend modes and animation frame settings. Paths in manifest.json are relative to this kit's root. Native floor tiles are 32 × 32 pixels; display at 2× with nearest-neighbour filtering, with smoothing and mipmaps disabled. Keep prop sizes at their authored scale.

fortress-layout.json uses native pixels, with the origin at the upper-left floor tile. Object position is the visible footprint anchor defined by manifest.json, not the image's top-left corner. Ground decals render first. Other props sort by position.y + sort_y_offset (default zero); the offsets let holograms, screens and shelf items render above their parent props. rotation_degrees is clockwise about the sprite centre. Anchors are approximate, especially for wall fixtures and hovering objects.

The preview is a cutaway arrangement with all stations visible. It shows the open gate and all trophies. Switch deploy_gate_open / deploy_gate_closed on the same canvas and anchor. The open gate's outer frame was preserved pixel-for-pixel from the closed gate. Use trophy unlock keys from the layout; show locked armoury racks where appropriate. NPC names identify intended station occupants; character sprites are not included.

## Floors and transitions

The nine standalone textures have identical opposite outer rows/columns to remove hard edge discontinuities when repeated. Their internal patterns may still be visibly repetitive. The dedicated transitions/ set is a separate connected steel/concrete family with its own solid base tiles. Match the NW/NE/SW/SE corner labels in steel-concrete.json. Use that family together; do not assume its textures join seamlessly to the separate decorative variants. Wall corners and raised balcony pieces need manual placement and game-side occlusion handling.

## Animation and lighting

Each *_loop.png sheet has four native-size frames in one row. Use 12 fps, or 8 fps for work_lamp, as starting values. The five returned source frames were reduced to four distinct delivered frames. Each sequence is configured to repeat, but hand cleanup may be needed for motion consistency and the loop seam. Preserve the canvas and anchor across frames. Choose either the static asset or its animated replacement.

Hologram, screen, rain and light pool support screen blending; ordinary props use alpha blending. Rain is a separate overlay intended to be clipped to window masks, and is not baked into the room preview. The lamp is a complete animated fixture; its light pool remains separate. Adjust light opacity in-engine.

## Integration status

This is an asset kit and a layout draft, not a playable level or an engine integration. Colliders, interaction distances, door blocking, balcony height, hero scale, NPC placement, wall occlusion and animation continuity still need checking in the game. Generated props retain some stylistic and perspective variation. The preview is an assembly example, not a gameplay screenshot.

validation.json records image decoding, sizes, alpha, atlas bounds, floor edges, corner coverage and layout asset references. Prompts are supplied for targeted revisions. No API key or private generation URLs are included.
