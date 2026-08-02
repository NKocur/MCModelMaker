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

## Reference patterns

- Official Minecraft guidance emphasizes roof overhangs, recessed entrances, panes, material variation, and reducing flat wall areas: https://www.minecraft.net/en-us/article/make-your-houses-better
- Minecraft's glass-pane feature article highlights panes as a way to introduce useful wall depth: https://www.minecraft.net/en-us/article/taking-inventory--glass-pane
- Community roof guidance covers scale, pitch, connected roof masses, stair corners, and why large buildings need multiple roof sections: https://minecraft.wiki/w/Tutorial:Roof_construction_guidelines
- A detailed timber-frame walkthrough demonstrates stone foundations, beam rhythm, second-floor overhangs, steep roofs, and thicker gable edges: https://www.planetminecraft.com/blog/how-to-build-a-detailed-medieval-house/
