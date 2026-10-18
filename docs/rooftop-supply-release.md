# Rooftop supply and Fortress practice

Patch now stands on a safe, walkable supply rooftop beside three random, visibly priced pickups. Approach a pickup and press E, controller B, or its touch claim button. Purchases require proximity; sold stock cannot be bought again. Powers still play the relevant hero's recorded comms before returning control to the rooftop. The exit proceeds to the unknown villain. Patch uses her one existing greeting.

Runs start with zero Field Credits. Each ordinary combat rooftop has 3–5 destructible credit crates, paying 8–12 credits each as visible ground pickups. Ordinary enemy deaths have a 25% chance to drop 4 credits (8 for elites, 15 for bosses). Walk near a credit drop to collect it; the HUD and floating amount confirm collection. Crates are separate from enemies and cannot delay wave completion or award kills. All five weapons can break them through their actual hit geometry and projectiles.

District lengths are rolled once and stay stable for the run: positions 1–2 have 5–6 ordinary combat rooftops, positions 3–4 have 6–7, and position 5 has 7–8. Each stretch then has its supply stop and boss. Enemy identity remains concealed on exits.

Fortress walking is 50% faster (232 → 348 px/s at default tuning). Space, controller A, and the touch Dash button dash within the existing floor collision. Heroes have subtle breathing and weight-shift motion; reduced-motion settings suppress the added transforms.

The armoury and variant station now enter a separate practice room. Equip or unlock weapons and variants, close their panel, then test immediately against a central reusable dummy. Practice grants full health and unlimited Overload, records test damage, and does not award kills or currency. Return leaves Volt at the Fortress armoury.

Volt's five weapons now sequence the existing authored attack poses differently and apply different recoil, lunge, and heavy-body movement. Attack cooldowns and hit timing are unchanged. These are distinct runtime animations assembled from the current artwork, rather than newly drawn per-weapon atlases.

Verdigris, Gravemark and Bastion use connected-body extraction so poses can extend beyond nominal sprite cells without cutting off their shoulders or hands. The extracted bodies are cached and isolated from neighbouring figures. Original artwork already clipped at the outer image edge cannot be reconstructed by extraction. Thorn roots and poison fields now use ink-outlined curved vines, leaves and thorns; restraints sit at the enemy's feet.

Validation: rooftop-supply, run-depth, expansion, boot-race, Composure and full audio coverage checks. 737 distinct spoken lines remain fully covered by existing Eleven v4 recordings. Mobile checks use Chromium touch emulation; physical Safari and native apps were not tested.
