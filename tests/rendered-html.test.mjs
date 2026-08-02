import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Blocksmith model studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Blocksmith — AI Minecraft Model Studio<\/title>/i);
  assert.match(html, /CODEX MODEL WORKBENCH/);
  assert.match(html, />Library</);
  assert.match(html, />Animate</);
  assert.match(html, />Export Paper bundle</);
  assert.match(html, /href="\/favicon\.svg"/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("the studio page opts out of stale release caching", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /export const revalidate = 0/);
});

test("large structures use a GPU-accelerated merged WebGL viewport", async () => {
  const source = await readFile(new URL("../app/StructureWebGLViewport.tsx", import.meta.url), "utf8");
  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /powerPreference:"high-performance"/);
  assert.match(source, /new THREE\.BufferGeometry/);
  assert.match(source, /new THREE\.CanvasTexture/);
  assert.match(source, /THREE\.NearestFilter/);
  assert.match(source, /new THREE\.OrthographicCamera/);
  assert.match(source, /new THREE\.Raycaster/);
  assert.match(source, /new ResizeObserver/);
  assert.match(source, /alphaTest:\.1/);
  assert.match(source, /const renderClass=.*includes\("water"\).*includes\("glass"\)/);
  assert.match(source, /geometry\.addGroup/);
  assert.match(source, /transparent:true,opacity:1,depthWrite:true,side:THREE\.FrontSide/);
  assert.match(source, /transparent:true,opacity:\.72,depthWrite:false/);
  assert.match(source, /indices:\[0,3,2,1\]/);
  assert.doesNotMatch(source, /THREE\.DoubleSide/);
  assert.doesNotMatch(source, /getImageData|putImageData/);

  const modelMaker = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(modelMaker, /lazy\(\(\)=>import\("\.\/StructureWebGLViewport"\)\)/);
});

test("library supports mod packs, categories, collections, search, and accessible dismissal", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /pack:"Elemental Arsenal"/);
  assert.match(source, /pack:"Blocksmith Examples"/);
  assert.match(source, /role="dialog" aria-modal="true" aria-labelledby="library-heading"/);
  assert.match(source, /event\.key==="Escape"/);
  assert.match(source, /placeholder="Search models, packs, or collections…"/);
  assert.match(source, /MOD PACK/);
  assert.match(source, /COLLECTION/);
  assert.match(source, /function ModelThumbnail\(\{model\}/);
  assert.match(source, /<ModelThumbnail model=\{model\}\/>/);
  assert.doesNotMatch(source, /className="library-model-art procedural-art"/);
});

test("Runebank Teller Shrine is a recognizable fantasy ATM variant", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Runebank Teller Shrine"/);
  assert.match(source, /group:"Fantasy Street Props",pack:"Fantasy Daily Rewards",placementSize:\[1,2,1\]/);
  assert.match(source, /cubes:overlapChecked\("Runebank Teller Shrine",runebankAtmCubes\)/);
  for (const feature of ["Scrying crystal display", "Rune-key tablet", "Guild-sigil reader", "Protruding account scroll", "Coin-vault payout frame"]) {
    assert.match(source, new RegExp(feature));
  }
  assert.match(source, /Array\.from\(\{length:12\}[^\n]+Etched rune key/);
  assert.match(source, /runebankTellerShrine,\s+\{\.\.\.atm/);
});

test("Marsh Alligator is a complete articulated creature rig", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Marsh Alligator"/);
  assert.match(source, /category:"Creatures",group:"Reptiles",pack:"Wild Frontier"/);
  assert.match(source, /baseEntity:"minecraft:turtle"/);
  assert.match(source, /id:"gator_jaw",name:"Lower jaw",parentId:"gator_head"/);
  assert.match(source, /id:"gator_tail_3",name:"Tail tip",parentId:"gator_tail_2"/);
  for (const clip of ["Idle", "Walk", "Swim", "Bite"]) {
    assert.match(source, new RegExp(`name:"${clip}"`));
  }
  assert.match(source, /bite_jaw_4[^\n]+\[-32,0,0\]/);
});

test("fantasy daily loot collection has three rarity tiers and a pirate chest", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  for (const name of ["Wayfarer's Daily Chest", "Runebound Daily Coffer", "Crownvault Daily Reliquary", "Blackwake Pirate Chest"]) assert.match(source, new RegExp(`name:\"${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\"`));
  assert.match(source, /group:"Daily Loot Chests",pack:"Fantasy Daily Rewards"/);
  assert.match(source, /Common daily loot chest/);
  assert.match(source, /Rare daily loot chest/);
  assert.match(source, /Legendary daily loot chest/);
  assert.match(source, /name:"Open",lengthTicks:10,loop:false/);
  assert.match(source, /frame\(`\$\{project\.id\}_open_10`,10,`\$\{project\.id\}_lid`,\[90,0,0\]\)/);
  assert.match(source, /weathered fantasy oak/);
  assert.match(source, /glowing mana crystal/);
  assert.match(source, /dragon-forged gold/);
  assert.match(source, /const cubesOverlap=/);
  assert.match(source, /const overlapChecked=/);
  assert.match(source, /if\(cubesOverlap\(cubes\[i\],cubes\[j\]\)\)throw new Error/);
  assert.match(source, /source:"codex",revision:3,kind:"furniture"/);
  assert.match(source, /common_rear_left_foot[^\n]+\[1,0,10\],\[4,1,14\]/);
  assert.match(source, /common_rear_right_foot[^\n]+\[12,0,10\],\[15,1,14\]/);
  assert.match(source, /legendary_horn_l[^\n]+\[-1,15\.5,3\],\[1\.5,18\.5,5\.5\]/);
  assert.match(source, /legendary_horn_r[^\n]+\[14\.5,15\.5,3\],\[17,18\.5,5\.5\]/);
  assert.match(source, /Blocky bone skull/);
  assert.match(source, /pirate_eye_l[^\n]+skull shadow/);
  assert.match(source, /pirate_gold_tooth[^\n]+pirate gold/);
  assert.match(source, /blackwakePirateChest,\s+crownvaultDailyReliquary,\s+runeboundDailyCoffer,\s+wayfarerDailyChest/);
});

test("Blackwake Skulljack is an overlap-checked animated pirate slot machine", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Blackwake Skulljack"/);
  assert.match(source, /category:"Furniture",group:"Pirate Props",pack:"Fantasy Daily Rewards"/);
  assert.match(source, /cubes:overlapChecked\("Blackwake Skulljack",skulljackCubes\)/);
  assert.match(source, /Skull jackpot plaque/);
  assert.match(source, /Bone skull reel/);
  assert.match(source, /Gold doubloon reel/);
  assert.match(source, /Crimson parrot reel/);
  assert.match(source, /Ruby lever knob/);
  assert.match(source, /name:"Pull & Spin",lengthTicks:30,loop:false/);
  assert.match(source, /slots_lever_4[^\n]+\[0,0,-45\]/);
  assert.match(source, /slots_reel_1_28[^\n]+\[360,0,0\]/);
  assert.match(source, /blackwakeSkulljack,\s+blackwakePirateChest/);
});

test("Emerald Fortune Roulette is a two-block animated casino table", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Emerald Fortune Roulette"/);
  assert.match(source, /group:"Casino Games",pack:"Fantasy Daily Rewards",placementSize:\[2,1,1\]/);
  assert.match(source, /cubes:overlapChecked\("Emerald Fortune Roulette",rouletteCubes\)/);
  assert.match(source, /Two-block mahogany tabletop/);
  assert.match(source, /Emerald betting felt/);
  assert.match(source, /Array\.from\(\{length:18\}/);
  assert.match(source, /Ivory roulette ball/);
  assert.match(source, /name:"Spin wheel",lengthTicks:40,loop:true/);
  assert.match(source, /roulette_spin_40[^\n]+\[0,360,0\]/);
  assert.match(source, /emeraldFortuneRoulette,\s+blackwakeGoldDoubloon,\s+blackwakeSkulljack/);
});

test("Blackwake Gold Doubloon is a vanilla generated pirate coin item", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const makePirateCoinSprite=/);
  assert.match(source, /name:"Blackwake Gold Doubloon"/);
  assert.match(source, /revision:3,description:"A worn fantasy pirate coin with a bright gold rim and a simplified high-contrast skull emblem/);
  assert.match(source, /baseItem:"minecraft:gold_nugget",spriteParent:"generated"/);
  assert.match(source, /group:"Pirate Props",pack:"Fantasy Daily Rewards"/);
  assert.match(source, /sprite:makePirateCoinSprite\(\)/);
  assert.match(source, /const spriteModelParent=/);
  assert.match(source, /parent:spriteModelParent\(project\)/);
  assert.match(source, /transform_profile:kind==="item"\?spriteModelParent\(project\)/);
  assert.match(source, /FLAT INVENTORY ITEM/);
  assert.match(source, /GENERATED ITEM/);
  assert.match(source, /const simpleSkull=/);
  assert.match(source, /const eyeSockets=/);
  assert.match(source, /nose=\[\[7,8\],\[8,8\]\]/);
  assert.match(source, /jawGaps=\[\[7,10\],\[9,10\]\]/);
  assert.doesNotMatch(source, /const crossbones=/);
  assert.doesNotMatch(source, /const skullOutline=/);
});

test("Marshlight Trading Post is a detailed current-version structure showcase", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Marshlight Trading Post"/);
  assert.match(source, /category:"Structures",group:"Settlement Builds",pack:"Wild Frontier"/);
  assert.match(source, /structure:\{size:\[21,17,17\],blocks:tradingPostBlocks\}/);
  assert.match(source, /minecraft:spruce_stairs\[facing=\$\{facing\},half=bottom,shape=straight,waterlogged=false\]/);
  assert.match(source, /minecraft:iron_chain\[axis=y,waterlogged=false\]/);
  assert.match(source, /minecraft:lantern\[hanging=true,waterlogged=false\]/);
  assert.match(source, /minecraft:water_cauldron\[level=2\]/);
  assert.match(source, /minecraft:potted_blue_orchid/);
  assert.match(source, /minecraft:loom\[facing=west\]/);

  const catalog = JSON.parse(await readFile(new URL("../public/vanilla-26.2/catalog.json", import.meta.url), "utf8"));
  for (const block of ["spruce_stairs", "iron_chain", "lantern", "water_cauldron", "potted_blue_orchid", "loom"]) {
    assert.ok(catalog.blockstates[block], `${block} must exist in the bundled 26.2 references`);
  }
});

test("Gilded Briar Manor exercises elaborate connected-house construction", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Gilded Briar Manor"/);
  assert.match(source, /name:"Gilded Briar Manor"[^\n]+revision:3/);
  assert.match(source, /category:"Structures",group:"Manor Houses",pack:"Wild Frontier"/);
  assert.match(source, /structure:\{size:\[31,21,27\],blocks:briarManorBlocks\}/);
  assert.match(source, /const briarManorBlocks=resolveStructureConnections\(makeBriarManorBlocks\(\)\)/);
  assert.match(source, /white_stained_glass_pane/);
  assert.match(source, /spruce_door\[facing=north,half=\$\{half\},hinge=\$\{hinge\}/);
  assert.match(source, /dark_oak_trapdoor/);
  assert.match(source, /flowering_azalea_leaves/);
  assert.match(source, /roofStep=\(wood:string,x:number,y:number,z:number,facing:string,eave=false\)/);
  assert.match(source, /eave\?stairs\(wood,facing,"top"\)/);
  assert.match(source, /roofRidge=\(wood:string,x:number,y:number,z:number\)=>put\(x,y,z,slab\(wood,"bottom"\)\)/);
  assert.match(source, /roofStep\("dark_oak",x,10\+layer,7\+layer,"south",layer===0\)/);
  assert.match(source, /roofStep\("dark_oak",x,10\+layer,20-layer,"north",layer===0\)/);
  assert.match(source, /Tall west library tower/);
  assert.match(source, /Glazed east conservatory/);
  assert.match(source, /roofStep\("dark_oak",28-layer,7\+layer,z,"west",layer===0\)/);
  assert.match(source, /roofRidge\("dark_oak",23,12,z\)/);
  assert.match(source, /Hedges, pond, fountain, trees, and lantern-lined approach/);
  assert.match(source, /name:`\$\{merged\[i\]\.name\} \(Saved edit\)`/);
  assert.match(source, /name:`\$\{project\.name\} Custom`/);

  const catalog = JSON.parse(await readFile(new URL("../public/vanilla-26.2/catalog.json", import.meta.url), "utf8"));
  for (const block of ["white_stained_glass_pane", "spruce_door", "dark_oak_stairs", "stone_brick_stairs", "dark_oak_trapdoor", "flowering_azalea_leaves"]) {
    assert.ok(catalog.blockstates[block], `${block} must exist in the bundled 26.2 references`);
  }
});

test("animation authoring follows the Paper display-rig contract", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /ticks_per_second:20/);
  assert.match(source, /one_item_display_per_bone:true/);
  assert.match(source, /runtime_translation:"blocks \(pixels \/ 16\)"/);
  assert.match(source, /rotation_order:"XYZ authoring; runtime converts to quaternion"/);
  assert.match(source, /interpolation_duration_ticks:1/);
  assert.match(source, /Vanilla Java elements may rotate on only one axis/);
  assert.match(source, /Static Java element angles must be -45, -22\.5, 0, 22\.5, or 45 degrees/);
  assert.match(source, /rotation_convention:"right-handed positive rotations"/);
  assert.match(source, /open_10[^\n]+rotation:\[90,0,0\]/);
  assert.match(source, /const animationExportData=/);
  assert.match(source, /blocksmith\/animations\/\$\{ns\}\/\$\{id\}\.animation\.json/);
  assert.match(source, /Per-bone item models are included under assets\/\$\{ns\}\/models\/item\/\$\{id\}\/bone/);
  assert.match(source, /Vanilla ignores this developer data; your mod or Paper plugin can read it directly/);
  assert.match(source, /Export Paper bundle/);
  assert.match(source, /Download test bundle/);
  assert.match(source, /const ITEM_DISPLAY_SPACE_CONTRACT=/);
  assert.match(source, /geometry_space:"pivot_local"/);
  assert.match(source, /local_model_center_pixels:\[8,8,8\]/);
  assert.match(source, /model_anchor_in_block:\[\.5,\.5,\.5\]/);
  assert.match(source, /json_model_front:"-Z"/);
  assert.match(source, /paper_entity_yaw_zero:"\+Z"/);
  assert.match(source, /child_pivot_rotation_degrees:"180 - entity_yaw"/);
  assert.match(source, /worldPivot = blockOrigin \+ modelAnchor \+ rotateY\(180 - entityYaw\) \* \(\(pivotPixels - \[8,8,8\]\) \/ 16\)/);
  assert.match(source, /rotation:"parentRotation \* localAnimationRotation"/);
  assert.match(source, /rotation_values:"absolute_local"/);
  assert.match(source, /schema:2,\.\.\.ITEM_DISPLAY_SPACE_CONTRACT/);
  assert.match(source, /minecraftJson\(project,parts,bone\.pivot\)/);
  assert.match(source, /modelShift=\(bonePivot\?bonePivot\.map\(value=>8-value\):\[0,0,0\]\)/);

  // Rear hinge at Z=14, front test point at Z=1. Positive X must lift it in Y.
  const pivot = [8, 10, 14];
  const front = [8, 10, 1];
  const radians = Math.PI / 2;
  const relativeY = front[1] - pivot[1];
  const relativeZ = front[2] - pivot[2];
  const rotatedY = relativeY * Math.cos(radians) - relativeZ * Math.sin(radians);
  assert.ok(pivot[1] + rotatedY > front[1], "the lid's front edge must move upward");
});

test("structure mode exports current Java Sponge v3 schematics", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /type ModelKind = [^;]+"structure"/);
  assert.match(source, /name:"Swamp Watchtower"/);
  assert.match(source, /category:"Structures",group:"Swamp Builds",pack:"Wild Frontier"/);
  assert.match(source, /nbtNamed\(3,"Version",nbtInt\(3\)\)/);
  assert.match(source, /nbtNamed\(3,"DataVersion",nbtInt\(4903\)\)/);
  assert.match(source, /pipeThrough\(new CompressionStream\("gzip"\)\)/);
  assert.match(source, /a\.download=`\$\{slug\(project\.name\)\}\.schem`/);
  assert.match(source, /for\(let y=0;y<height;y\+\+\)for\(let z=0;z<length;z\+\+\)for\(let x=0;x<width;x\+\+\)/);
  assert.match(source, /New structure/);
  assert.match(source, /Paint any Minecraft 26\.2 Java block state/);
  assert.match(source, /placeholder="minecraft:potted_blue_orchid"/);
  assert.match(source, /normalizeStructureBlocks/);
  assert.match(source, /const resolveStructureConnections=/);
  assert.match(source, /state\.id\.endsWith\("_pane"\)\|\|state\.id\.endsWith\("_fence"\)/);
  assert.match(source, /shape="outer_left"/);
  assert.match(source, /shape="outer_right"/);
  assert.match(source, /shape="inner_left"/);
  assert.match(source, /shape="inner_right"/);
  assert.match(source, /Spruce Door \(paired\)/);
  assert.match(source, /_door_lower/);
  assert.match(source, /_door_upper/);
  assert.match(source, /resolved=resolveStructureConnections\(structure\.blocks\)/);
  assert.match(source, /Doors pair automatically; panes, fences, and stair corners connect to neighbors/);
  assert.match(source, /new Map\(blocks\.filter\(block=>block\.state!=="minecraft:air"\)/);
  assert.match(source, /\/vanilla-26\.2\/textures\/\$\{name\}\.png/);
  assert.match(source, /texture==="oak_log"&&\(face\.faceIndex===4\|\|face\.faceIndex===5\)/);
  assert.match(source, /texture==="grass_block_side"&&face\.faceIndex===4/);
  assert.match(source, /orbitCenter=minimum\.map/);
  assert.match(source, /cameraTarget=previewMode==="studio"\?orbitCenter/);
  assert.match(source, /fitZoom\*\(view\.zoom\/18\)/);
  assert.match(source, /Math\.min\(90,v\.zoom-e\.deltaY\*\.025\)/);
  assert.match(source, /structureOccupied\?\.has/);
  assert.match(source, /const structureBlockModel=/);
  assert.match(source, /StructureWebGLViewport/);
  assert.match(source, /block\.state\.startsWith\("minecraft:water\["\)/);
  assert.match(source, /\[16,14,16\],"#3575b9","vanilla:water_still"/);
  assert.match(source, /block\.state\.startsWith\("minecraft:lantern\["\)/);
  assert.match(source, /\[\[5,0,5\],\[11,7,11\],\[0,0,0\]\]/);
  assert.match(source, /block\.state\.startsWith\("minecraft:oak_stairs\["\)/);
  assert.match(source, /rotateModelBox\(from,to,xRotation,yRotation\)/);
  assert.match(source, /Hanging Lantern/);
  assert.match(source, /if\(alpha===0\)return\[0,0,0,0\]/);
  assert.match(source, /if\(rgb\[3\]===0\)continue/);
  assert.match(source, /const isFullOccluder=/);
  assert.match(source, /solid\.filter\(block=>isFullOccluder\(block\.state\)\)/);
  assert.match(source, /catalogBlockIsFullOccluder/);
  assert.match(source, /fetch\("\/vanilla-26\.2\/catalog\.json"\)/);
  assert.match(source, /const modelApplications=/);
  assert.match(source, /const inheritedModel=/);
  assert.match(source, /const inheritedModelCaches=new WeakMap/);
  assert.match(source, /const catalogBlockModel=/);
  assert.match(source, /const connectedPaneModel=/);
  assert.match(source, /if\(west\|\|east\)parts\.push\(\[\[west\?0:7,0,7\],\[east\?16:9,16,9\],"horizontal"\]\)/);
  assert.match(source, /if\(parsed\.id\.endsWith\("_pane"\)\)return connectedPaneModel\(block,parsed\)/);
  assert.match(source, /const textureSprite=/);
  assert.match(source, /typeof \(value as \{sprite\?:unknown\}\)\.sprite==="string"/);
  assert.match(source, /getContext\("2d",\{willReadFrequently:true\}\)/);
  assert.match(source, /pixelBudget=interacting\?/);
  assert.doesNotMatch(source, /Math\.min\(view\.zoom,fitZoom\)\)\*quality/);
  assert.match(source, /interacting&&project\.structure\?project\.cubes:viewportParts/);
  assert.match(source, /setTimeout\(\(\)=>setInteracting\(false\),140\)/);
  assert.match(source, /faceDefinition=part\.faceData\?\.\[faceIndex\]/);
  const catalog = JSON.parse(await readFile(new URL("../public/vanilla-26.2/catalog.json", import.meta.url), "utf8"));
  assert.equal(catalog.version, "26.2");
  assert.equal(catalog.dataVersion, 4903);
  assert.ok(catalog.blockstates.lantern);
  assert.ok(catalog.blockstates.potted_dandelion);
  assert.ok(catalog.blockstates.spruce_door.variants["facing=north,half=lower,hinge=left,open=false"]);
  assert.ok(catalog.blockstates.spruce_door.variants["facing=north,half=upper,hinge=right,open=false"]);
  assert.ok(catalog.blockstates.glass_pane.multipart.some(part => part.when?.north === "true"));
  assert.ok(catalog.blockstates.spruce_stairs.variants["facing=north,half=bottom,shape=inner_left"]);
  assert.ok(catalog.blockstates.spruce_stairs.variants["facing=north,half=bottom,shape=outer_right"]);
  assert.ok(catalog.blockstates.dark_oak_stairs.variants["facing=south,half=top,shape=straight"]);
  assert.ok(catalog.blockstates.dark_oak_slab.variants["type=bottom"]);
  assert.ok(catalog.models.template_lantern?.elements?.length >= 4);
  assert.ok(catalog.models.flower_pot?.elements?.length || catalog.models.flower_pot?.parent);
  assert.equal(catalog.models.glass_pane_post.textures.pane.sprite, "minecraft:block/glass");
});

test("custom furniture exposes and exports multi-block placement footprints", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /placementSize\?:Vec3/);
  assert.match(source, /placementSize:\[1,2,1\]/);
  assert.match(source, /const placementFootprint=/);
  assert.match(source, /const placementCells=/);
  assert.match(source, /"multiblock_solid":"multiblock_display"/);
  assert.match(source, /occupied_cells:cells/);
  assert.match(source, /hitboxes:cells\.map/);
  assert.match(source, /break_behavior:"remove_entire_object"/);
  assert.match(source, /rotate_offsets_with_facing:true/);
  assert.match(source, /schema:5/);
  assert.match(source, /PLACEMENT FOOTPRINT/);
  assert.match(source, /"WIDTH X","HEIGHT Y","DEPTH Z"/);
  assert.match(source, /FOOTPRINT \{placementFootprint\(project\)\.join/);
  assert.match(source, /className="library-footprint"/);
  assert.match(styles, /\.placement-size/);
  assert.match(styles, /\.footprint-chip/);
  assert.match(styles, /\.library-footprint/);
});

test("preview and exported models share explicit non-stretching UVs", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const proceduralPixel=/);
  assert.match(source, /proceduralPixel\(part\.id,part\.material,part\.color,x,y\)/);
  assert.match(source, /const faceUvForBox=/);
  assert.match(source, /faceIndex<2\?\[dx,dy\]:faceIndex<4\?\[dz,dy\]:\[dx,dz\]/);
  assert.match(source, /const splitPartForExport=/);
  assert.match(source, /start\+=16/);
  assert.match(source, /parts\.flatMap\(part=>/);
  assert.match(source, /uv:faceUvForBox\(segment\.from,segment\.to,faceIndex\)/);
  assert.match(source, /unsplitParts\.flatMap\(part=>splitPartForExport/);
  assert.match(source, /textureUv:faceDefinition\?\.uv\|\|faceUvForBox\(part\.from,part\.to,faceIndex\)/);
  assert.match(source, /proceduralPixel\(face\.id,face\.material,face\.color,sampleX,sampleY\)/);
  assert.match(source, /texture_mapping:UV_SPACE_CONTRACT/);
  assert.match(source, /oversized_elements:"split_into_max_16_pixel_segments"/);
});
