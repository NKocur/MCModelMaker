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
  assert.match(html, />Animate</);
  assert.match(html, /Hinged Supply Chest/);
  assert.match(html, /Export Paper Pack/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
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
});
