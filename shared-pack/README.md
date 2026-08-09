# Crownlands shared resource pack

This is the authoritative final-pack assembler for Crownlands. It replaces the old serial CorporateCraft -> BankATM -> Casino combined-pack chain while preserving those projects' individual preparation tasks and legacy combined outputs.

## Build

From the Blocksmith repository root on Windows:

```powershell
npm run pack:build
```

Output:

```text
shared-pack/build/distributions/Crownlands-Shared-Resource-Pack.zip
```

Set `CROWNLANDS_PLUGINS_ROOT` if CorporateCraft, Bank, and Casino are not located in the sibling `MinecraftPlugins` directory.

## Inputs

- The SHA-1-pinned CorporateCraft pack downloaded by BankATM's `fetchCorporateCraftPack` task.
- BankATM's prepared Runebank Teller Shrine assets, including its Minecraft 26.2 UV correction.
- All nine CorporateCraft `rpgiab` icon collections.
- Blackwake Casino's prepared Blocksmith assets, generated card variants, UV corrections, pivot-local bones, and baked derby frames.
- Optional Blocksmith exports placed in `shared-pack/imports`.

The assembler excludes older base-pack copies only when a current producer supplies the exact same path. Any collision between current producers fails the build.

## Validation

Every build:

- parses every JSON file;
- verifies item-definition model references and custom model parent/texture references;
- rejects model coordinates outside Minecraft's `-16..32` range;
- requires every runtime item-model used by CorporateCraft, BankATM, and Casino;
- checks all 52 card faces, generated Blackjack and Casino War card bones, and all twelve baked frames for all five derby horses;
- produces a stable ZIP with reproducible entry ordering and timestamps.

The machine-readable report is written to:

```text
shared-pack/build/reports/crownlands-pack-validation.json
```

Existing `corporatecraft:*`, `grand_exchange:*`, `rpgiab:*`, and `blocksmith:*` identifiers are copied without renaming.
