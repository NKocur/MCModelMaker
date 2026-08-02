import { promises as fs } from "node:fs";
import path from "node:path";

const version = process.argv[2] ?? "26.2";
const referenceRoot = path.resolve(process.argv[3] ?? ".vanilla-reference");
const versionRoot = path.join(referenceRoot, version);
const assetsRoot = path.join(versionRoot, "extracted", "assets", "minecraft");

const toPosix = (value) => value.split(path.sep).join("/");
const resourceId = (kind, relativePath) =>
  `minecraft:${kind}/${toPosix(relativePath).replace(/\.json$/u, "")}`;

async function walk(root, extension) {
  const files = [];
  async function visit(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(entryPath);
      else if (!extension || entry.name.endsWith(extension)) files.push(entryPath);
    }
  }
  await visit(root);
  return files;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function findModelReferences(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) findModelReferences(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key === "model" && typeof item === "string" && !item.endsWith(":model")) {
        found.add(item.includes(":") ? item : `minecraft:${item}`);
      } else {
        findModelReferences(item, found);
      }
    }
  }
  return found;
}

function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const modelRecords = {};
for (const kind of ["item", "block"]) {
  const root = path.join(assetsRoot, "models", kind);
  for (const file of await walk(root, ".json")) {
    const relative = path.relative(root, file);
    const id = resourceId(kind, relative);
    const data = await readJson(file);
    modelRecords[id] = {
      path: toPosix(path.relative(versionRoot, file)),
      kind,
      parent: data.parent ?? null,
      textures: data.textures ?? {},
      elementCount: Array.isArray(data.elements) ? data.elements.length : 0,
      display: data.display ?? {},
    };
  }
}

function parentChain(id) {
  const chain = [];
  const seen = new Set([id]);
  let parent = modelRecords[id]?.parent;
  while (parent) {
    const normalized = parent.includes(":") ? parent : `minecraft:${parent}`;
    chain.push(normalized);
    if (seen.has(normalized)) break;
    seen.add(normalized);
    parent = modelRecords[normalized]?.parent;
  }
  return chain;
}
for (const [id, record] of Object.entries(modelRecords)) record.parentChain = parentChain(id);

const items = {};
const itemsRoot = path.join(assetsRoot, "items");
for (const file of await walk(itemsRoot, ".json")) {
  const relative = path.relative(itemsRoot, file);
  const id = `minecraft:${toPosix(relative).replace(/\.json$/u, "")}`;
  const data = await readJson(file);
  items[id] = {
    path: toPosix(path.relative(versionRoot, file)),
    models: [...findModelReferences(data)].sort(),
  };
}

const blockstates = {};
const blockstatesRoot = path.join(assetsRoot, "blockstates");
for (const file of await walk(blockstatesRoot, ".json")) {
  const relative = path.relative(blockstatesRoot, file);
  const id = `minecraft:${toPosix(relative).replace(/\.json$/u, "")}`;
  const data = await readJson(file);
  blockstates[id] = {
    path: toPosix(path.relative(versionRoot, file)),
    models: [...findModelReferences(data)].sort(),
    variantCount: data.variants ? Object.keys(data.variants).length : 0,
    multipartCount: Array.isArray(data.multipart) ? data.multipart.length : 0,
  };
}

const textures = {};
for (const kind of ["item", "block"]) {
  const root = path.join(assetsRoot, "textures", kind);
  for (const file of await walk(root, ".png")) {
    const relative = path.relative(root, file);
    const id = `minecraft:${kind}/${toPosix(relative).replace(/\.png$/u, "")}`;
    textures[id] = {
      path: toPosix(path.relative(versionRoot, file)),
      ...pngSize(await fs.readFile(file)),
    };
  }
}

const index = {
  schemaVersion: 1,
  minecraftVersion: version,
  generatedAt: new Date().toISOString(),
  source: "local-official-client-jar",
  counts: {
    items: Object.keys(items).length,
    itemModels: Object.values(modelRecords).filter((model) => model.kind === "item").length,
    blockModels: Object.values(modelRecords).filter((model) => model.kind === "block").length,
    blockstates: Object.keys(blockstates).length,
    textures: Object.keys(textures).length,
  },
  items,
  models: modelRecords,
  blockstates,
  textures,
};

await fs.mkdir(versionRoot, { recursive: true });
await fs.writeFile(path.join(versionRoot, "index.json"), `${JSON.stringify(index, null, 2)}\n`);
console.log(JSON.stringify(index.counts));
