import { promises as fs } from "node:fs";
import path from "node:path";

const [version = "26.2", requestedId] = process.argv.slice(2);
if (!requestedId) {
  console.error("Usage: npm run vanilla:lookup -- <version> <minecraft id>");
  process.exit(1);
}

const id = requestedId.includes(":") ? requestedId : `minecraft:${requestedId}`;
const indexPath = path.resolve(".vanilla-reference", version, "index.json");
const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
const item = index.items[id];
const blockstate = index.blockstates[id];

if (!item && !blockstate) {
  const terms = Object.keys({ ...index.items, ...index.blockstates })
    .filter((candidate) => candidate.includes(requestedId))
    .slice(0, 20);
  console.error(`No vanilla reference found for '${id}'.`);
  if (terms.length) console.error(`Possible matches: ${terms.join(", ")}`);
  process.exit(2);
}

const modelIds = [...new Set([...(item?.models ?? []), ...(blockstate?.models ?? [])])];
const models = Object.fromEntries(
  modelIds.map((modelId) => [modelId, index.models[modelId] ?? { missing: true }]),
);

console.log(JSON.stringify({
  minecraftVersion: index.minecraftVersion,
  id,
  kind: item && blockstate ? "item+block" : item ? "item" : "block",
  item: item ?? undefined,
  blockstate: blockstate ?? undefined,
  models,
}, null, 2));
