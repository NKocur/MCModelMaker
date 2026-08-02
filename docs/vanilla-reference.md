# Vanilla reference vault

Blocksmith keeps Minecraft's original client assets in a local-only reference
vault. The vault helps Codex compare custom items and blocks with the exact
vanilla model hierarchy, proportions, display transforms, blockstates, and
texture layout for a chosen Minecraft version.

The vault is deliberately excluded from Git and Sites deployments. Do not copy
its original textures or model files into Blocksmith exports. Use them as a
reference for original models and textures.

## Import a version

From PowerShell at the project root:

```powershell
npm run vanilla:import -- 26.2
```

The importer reuses `.vanilla-reference/26.2/client.jar` when present. For the
older local layout it also recognizes `.vanilla-reference/26.2-client.jar`. If
neither exists, it downloads the matching official client from Mojang and
verifies the published SHA-1 hash.

You can instead supply a client JAR explicitly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/import-vanilla-reference.ps1 26.2 "C:\path\to\client.jar"
```

Each import creates this local structure:

```text
.vanilla-reference/
  26.2/
    client.jar
    extracted/assets/minecraft/
      items/
      models/item/
      models/block/
      blockstates/
      textures/item/
      textures/block/
    index.json
```

`index.json` is the fast lookup catalog. It records item-to-model links, model
parent chains, texture references and dimensions, element counts, display
transforms, and the models selected by every blockstate.

## Rebuild only the index

```powershell
npm run vanilla:index -- 26.2
```

## Look up an item or block

```powershell
npm run vanilla:lookup -- 26.2 netherite_pickaxe
npm run vanilla:lookup -- 26.2 oak_fence
```

The lookup reports the definition, direct models, inherited parent chain,
textures, display transforms, and blockstate composition without having to
search thousands of source files manually.

When asking Codex to make something, name the reference explicitly when useful:
"Use the vanilla 26.2 diamond axe model and display transforms as the structural
reference, but create an original silhouette and texture."
