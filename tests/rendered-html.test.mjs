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
  assert.match(html, />Export</);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
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
  assert.match(source, /Click cells to paint real Java block states/);
  assert.match(source, /normalizeStructureBlocks/);
  assert.match(source, /new Map\(blocks\.filter\(block=>block\.state!=="minecraft:air"\)/);
  assert.match(source, /\/vanilla-blocks\/\$\{name\}\.png/);
  assert.match(source, /texture==="oak_log"&&\(face\.faceIndex===4\|\|face\.faceIndex===5\)/);
  assert.match(source, /texture==="grass_block_side"&&face\.faceIndex===4/);
  assert.match(source, /orbitCenter=minimum\.map/);
  assert.match(source, /cameraTarget=previewMode==="studio"\?orbitCenter/);
  assert.match(source, /fitZoom\*\(view\.zoom\/18\)/);
  assert.match(source, /Math\.min\(90,v\.zoom-e\.deltaY\*\.025\)/);
  assert.match(source, /structureOccupied\?\.has/);
  assert.match(source, /const structureBlockModel=/);
  assert.match(source, /block\.state\.startsWith\("minecraft:lantern\["\)/);
  assert.match(source, /\[\[5,0,5\],\[11,7,11\],\[0,0,0\]\]/);
  assert.match(source, /block\.state\.startsWith\("minecraft:oak_stairs\["\)/);
  assert.match(source, /rotateModelBox\(from,to,xRotation,yRotation\)/);
  assert.match(source, /Hanging Lantern/);
  assert.match(source, /texture==="lantern"/);
  assert.match(source, /if\(alpha===0\)return\[0,0,0,0\]/);
  assert.match(source, /if\(rgb\[3\]===0\)continue/);
});
