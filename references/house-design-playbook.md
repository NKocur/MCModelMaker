# Minecraft house design playbook

Use this reference when creating houses and settlement structures for Blocksmith. The structure must remain buildable from valid Minecraft Java 26.2 block states; decorative detail never overrides placement correctness.

## Composition

- Start with two or three connected masses rather than one large rectangle. Offset wings by 2–4 blocks and give each mass its own roof hierarchy.
- Keep ordinary stories 4–5 blocks tall. On footprints larger than roughly 15×15 blocks, split the silhouette with cross-gables, dormers, towers, porches, or lower side roofs.
- Establish a clear entrance axis, then use controlled asymmetry for secondary windows, chimneys, balconies, workshops, gardens, and service doors.

## Depth

- Recess doors and glass panes one block behind structural framing when space allows.
- Project corner posts, floor bands, roof eaves, window hoods, shutters, flower boxes, and foundations outward from the wall plane.
- Avoid uninterrupted flat walls longer than five blocks. Break them with a beam, window bay, buttress, material transition, alcove, or attached volume.

## Roofs

- Match roof width to pitch. Use stairs for a 1:1 slope, slabs for shallow transitions, and block/stair patterns for steeper silhouettes.
- Extend eaves 1–2 blocks beyond walls and give gable edges visible thickness with upside-down stairs, slabs, or fascia blocks.
- Use multiple roof sections on large buildings. Add believable joins, ridges, dormers, chimneys, drainage, and roof-access spaces rather than one oversized gable.
- Let stair connection logic form inner and outer corners; do not hard-code every roof stair as `shape=straight`.
- A roof stair ascends toward its `facing` direction. Generate each slope from low eave toward high ridge, use top-half stairs under exposed eaves, back decorative slopes with blocks at roof intersections, and use bottom-half slabs for caps placed above the final stair course.
- Treat an attached roof as a structural join, not a second roof placed near a wall. Run every roof course into a continuous wall ledger or flashing row, seal the high edge, support the low eave with fascia, and close both end returns.
- At valleys and cross-gables, continue backing blocks beneath the visible stairs. No roof surface should terminate in open air beside the parent wall or leave a one-block slot between roof masses.

## Windows and glazed rooms

- Panes need a continuous solid sill and header, plus posts or wall blocks at both ends. Never use a long floating pane strip as the only support for a wall or roof.
- Recess ordinary panes inside the wall frame. For wide windows, add mullions every 2-3 blocks so the opening reads as deliberate construction and pane connections resolve predictably.
- Conservatories need corner posts, regular roof ribs, a continuous wall ledger, and a real low-eave beam. Connect the glazed room to the main building with the same care as a timber or masonry wing.
- Use full glass blocks only when a broad uninterrupted surface is intentional. Use panes for framed wall openings and derive all four pane connections from adjacent compatible blocks.

## Water and shorelines

- Render source water below the full block top so retaining blocks, banks, docks, and paths remain visible around it.
- Hold water inside a complete basin or natural bank. Avoid isolated source blocks above dry ground, exposed vertical water cubes, and shoreline gaps that would spill in game.
- Keep each still pond surface on one level. Step the basin floor underneath the surface, not the waterline, and transition shores with slabs, stairs, gravel, clay, mud, or vegetation.
- Keep water-aware decorations valid: use `waterlogged=true` only where the block is actually submerged, and never rely on the preview to hide an invalid dry/wet state.

## Materials and detail

- Choose a restrained structural palette: foundation, wall field, frame, roof, and one accent family. Create variation within those families instead of adding unrelated materials.
- Put weathering where it makes sense: moss near water and foundations, soot near chimneys, repaired blocks around work areas, and cleaner materials under eaves.
- Give decoration a function: shutters protect windows, chains suspend lights, barrels serve docks, flower boxes sit beneath windows, and paths connect actual entrances.
- Use lighting, plants, seating, storage, workstations, railings, and signs to imply how each space is used.

## Placement standards

- Doors occupy paired lower and upper blocks with identical facing, hinge, open, and powered properties.
- Panes and fences derive north/east/south/west connections from their neighbors.
- Stairs derive straight, inner-left, inner-right, outer-left, or outer-right shape from adjacent stairs with matching half.
- Preview and `.schem` export must use the same resolved states.
- Glass and water use translucent rendering and do not count as full occluders. Opaque blocks behind them must remain visible.
- Still source water previews at 14/16 block height; the exported state remains the exact Java water block state.

## Reference patterns

- Official Minecraft guidance emphasizes roof overhangs, recessed entrances, panes, material variation, and reducing flat wall areas: https://www.minecraft.net/en-us/article/make-your-houses-better
- Minecraft's glass-pane feature article highlights panes as a way to introduce useful wall depth: https://www.minecraft.net/en-us/article/taking-inventory--glass-pane
- Community roof guidance covers scale, pitch, connected roof masses, stair corners, and why large buildings need multiple roof sections: https://minecraft.wiki/w/Tutorial:Roof_construction_guidelines
- A detailed timber-frame walkthrough demonstrates stone foundations, beam rhythm, second-floor overhangs, steep roofs, and thicker gable edges: https://www.planetminecraft.com/blog/how-to-build-a-detailed-medieval-house/
