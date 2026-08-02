# Blocksmith animation coordinate system

Blocksmith animation rigs use one explicit coordinate convention. Every viewer,
example, export, and future runtime must follow this contract.

## Axes and units

- `+X` points right/east.
- `+Y` points up.
- `+Z` points toward the back/south of the model.
- The model's front faces `-Z`.
- Geometry, pivots, and authored translations use model pixels. Sixteen pixels
  equal one Minecraft block.
- Time uses Minecraft game ticks: 20 ticks equal one second.
- Authored rotations use degrees and right-handed positive rotation.
- Euler authoring order is X, then Y, then Z. The Paper runtime converts the
  result to display-entity quaternions.

## Hierarchy order

A point is transformed around its own bone pivot first. Its parent bone is then
applied, continuing up to the root. Child bones therefore inherit all parent
motion.

## Hinge direction check

The Hinged Supply Chest has its hinge at the rear (`+Z`). Its lid extends toward
the front (`-Z`). A positive X rotation must move a point on the front edge
toward `+Y`; a negative X rotation would incorrectly move it down into the
chest.

Do not copy an angle sign directly from a vanilla entity `ModelPart`. Some
vanilla entity-rendering conventions use different axis orientations from
Blocksmith's Y-up block/display space. Convert the motion into this coordinate
system and verify a representative point moves in the intended direction.

## Animation review rule

For every new mechanical animation, record:

1. the pivot;
2. the moving side of the part;
3. one representative test point;
4. the expected direction of that point at the final keyframe.

For creatures, also verify mirrored limb pairs, ground clearance, the neutral
pose, and the full loop boundary.
