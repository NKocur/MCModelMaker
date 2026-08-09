# Crownlands Economy Migration Audit

Audit date: 2026-08-09

Repositories reviewed:

- `J:\Projects\MinecraftPlugins\CorporateCraft`
- `J:\Projects\MinecraftPlugins\Casino`
- Shared Blocksmith content and identifiers in `J:\Projects\minecraftmodelmaker`

Detailed CorporateCraft implementation references are maintained in [CorporateCraft Source Reference for Crownlands](corporatecraft-source-reference.md). That index maps every retained capability to its exact original source, configuration, schema, and regression tests. It also records excluded code that must remain in the pre-migration archive for historical reference.

Preserved source baselines:

- CorporateCraft: commit `daebf7d855d0914f4b5a7c19b1c8af00c33973d6`, tag `corporatecraft-pre-crownlands`
- Casino: commit `6e6c2d6bbe80721f0930b1a595f7c7078dd6f4fa`, tag `casino-pre-crownlands`

The CorporateCraft GE resource pack remains a separate repository at `https://github.com/NKocur/CorporateCraft-GE-Pack.git`; the CorporateCraft baseline references pack commit `da3e5fe6c0a7afe140b64d8d703f5684dd25ceff`. Any newer uncommitted pack working-tree content must be preserved in that repository independently.

## Intended Crownlands scope

The Crownlands economy should contain:

- Grand Exchange item buying and selling
- Vault-backed money movement
- Direct player-to-player item trading
- Offer escrow, matching, cancellation, collection, and transaction history
- Item prices, order-book information, and market safeguards
- Optional item-only watchlists, alerts, rankings, news, onboarding, signs, and exchange NPCs

It must not contain corporations, employment, land claims, stocks, shares, portfolios, dividends, futures, positions, collateral, corporate contracts, governance, or corporate territory protection.

Blackwake Casino remains its own plugin. Its games, physical doubloons, NPCs, cities, zones, atlas, boatman, and display rigs are not Crownlands economy modules.

## Executive finding

Do not rewrite the Grand Exchange. CorporateCraft already has a mature GE core with order escrow, price-time matching, collections, market data, safety controls, Vault integration, persistence, network coordination, signs, direct trades, and tests. Extract or isolate that core and retire the unrelated domains at the bootstrap, command, UI, API, and fresh-schema boundaries.

Casino is easier to migrate than its declared dependency suggests. It imports `CorporateCraftApi`, checks only that API version `v1` is registered, and never calls a market or corporation method. All wagers and the doubloon exchange use Vault directly. Casino can therefore stop depending on CorporateCraft after a small startup/build change.

## Reuse map

### Reuse as Crownlands core

- `order/*`: order submission, offer slots, item/currency escrow, cancellation state
- `matching/*`: price-time matching, guide prices, tax policy
- `collection/*`: delivery of filled/cancelled items and currency
- `market/MarketDataService` and item-market portions of retention features
- `item/*`: tradeable item registry, validation, enchanted-book handling
- `service/EconomyService` and `economy/VaultEconomyService`
- `trade/PlayerTradeService`
- GE portions of `persistence/repository/MarketRepository`
- `persistence/*`, database configuration, audit records, and network coordination
- `ui/GrandExchangeUi`, `UiController`, `UiComponents`, and the semantic GUI icon system
- Grand Exchange signs and broker roles `EXCHANGE`, `COLLECTION`, `OFFERS`, and `MARKETS`
- `/ge`, GE-only `/geadmin`, `/trade`, and GE/player interface settings

### Refactor before reuse

- `CorporateCraftPlugin`: currently constructs every retained and retired service in one `onEnable`
- `GrandExchangeCommand`: currently accepts corporation routes and mixed watchlist entity types
- `GrandExchangeAdminCommand`: currently requires futures and corporation administration services
- `ImmersionRetentionService` and `ImmersionUi`: keep item-market features, remove corporate/futures/contracts/jobs content
- `MarketRepository`: one very large repository contains GE, stocks, futures, and corporation queries
- `Migrations.INITIAL_SCHEMA`: its first migration creates all domains together
- `CorporateCraftApi`: replace with a market/trade-focused Crownlands API; provide a temporary compatibility bridge only if another installed plugin needs it
- `BrokerRole` and broker interaction routing: remove stock/futures/corporation roles from active configuration and menus
- Tradeable custom item definitions: GUI icons already use modern `ItemMeta#setItemModel`, but `items.yml` custom tradeables still support only `custom-model-data`; add stable `item-model` support for shared-pack items

### Retire from Crownlands

- `corporation/*`
- `stock/*`, item-share/equity services, portfolios, dividends, and related UI
- `futures/*`, futures settlement jobs, positions, collateral, and related UI
- corporation land listeners, territory transitions, and upkeep jobs
- `/corp`, `/portfolio`, `/stocks`, `/stock`, and `/futures`
- corporate/futures branches in `/ge`, `/geadmin`, news, rankings, discovery, alerts, and onboarding
- broker roles `STOCKS`, `FUTURES`, and `CORPORATIONS`
- corporation, item equity/share, and futures contracts in the public API

Do not immediately delete legacy database tables. First stop writing to them and verify the retained GE balances, escrow, orders, and collections. Destructive cleanup can be a later, separately backed-up operation.

## Casino boundary

Keep Casino behavior and storage intact:

- Preserve plugin name `BlackwakeCasino` during the first migration so its plugin-owned persistent-data keys continue to resolve.
- Preserve every existing `blocksmith:*` model identifier. Renaming these would break placed display rigs, generated pack files, and item-model lookups.
- Preserve `casino.db`, `npcs.db`, `cities.yml`, and `zones.yml` independently of the GE database.
- Keep the Blackwake Exchange Clerk as a casino cashier: it converts genuine physical doubloons to Vault currency and is not a GE order-book feature.
- Remove the compile-time CorporateCraft JAR dependency and startup API-version check once Crownlands/Vault readiness is established.
- Change `depend: [CorporateCraft]` to the final dependency policy. The preferred end state is no hard GE dependency, because Casino only needs Vault; Crownlands can be an optional integration.
- Leave city protection, atlas, NPC, travel, and casino game modules in Casino rather than moving them into Crownlands.

If the Casino plugin itself is renamed later, add legacy readers for all current persistent-data keys before changing `plugin.yml`; otherwise already-created machine items will no longer be recognized.

## Shared resource-pack policy

There should still be one server resource pack.

- Retain existing `rpgiab:*` GUI icon IDs. CorporateCraft's `UiIcon` enum already points at these assets through modern item models.
- Retain existing `blocksmith:*` Casino, card, character, coin, and furniture IDs.
- Retain the current `corporatecraft` and `grand_exchange` font providers as compatibility aliases while Crownlands screens are migrated.
- Use `crownlands:*` only for genuinely new Crownlands-specific assets; do not duplicate or rename working icons.
- Move final pack assembly to one neutral shared-pack task/project. The current chain is CorporateCraft pack -> Bank combined pack -> Casino combined pack, so Casino's build is coupled to two sibling build outputs and contains extensive model-rewrite logic.
- Preserve the Casino pack validation and coordinate checks when relocating assembly. They protect pivot-local rigs, generated playing-card variants, and the Minecraft `-16..32` model coordinate limit.
- Add a collision report that fails the build if two sources provide different bytes for the same asset path.
- Generate a manifest mapping every runtime `item_model` ID to its source bundle and verify that all Java-referenced IDs exist in the assembled pack.

## Data migration strategy

Use a side-by-side, non-destructive migration rather than renaming or pruning the production database in place.

1. Back up `plugins/CorporateCraft/corporatecraft.db` and record row counts plus currency/item escrow totals.
2. Introduce a Crownlands GE-only schema with migrations dedicated to retained tables.
3. Import retained data: tradeable items, exchange orders, escrow entries, exchange transactions, collections, price history, purchase limits, audit records, relevant player settings/notifications, item-only watchlists/alerts/news/rankings/onboarding, market controls, special item listings, GE signs, and retained broker roles.
4. Exclude corporation, land, item-equity/share, and futures tables from the Crownlands database.
5. Preserve UUIDs, item IDs, order IDs, timestamps, statuses, version columns, and price-tick precision exactly.
6. Reconcile before cutover: open-order escrow conservation, completed transaction totals, pending collections, and Vault refund/deposit obligations.
7. Keep the old database read-only for rollback until the new plugin has completed a live soak period.

For the quickest safe first release, CorporateCraft can initially run in a GE-only compatibility mode against its existing database, with retired services and routes disabled. The clean Crownlands schema/importer should follow before the permanent plugin rename.

## Phased implementation plan

### Phase 0 - Freeze contracts and establish baselines

- Create the immutable CorporateCraft/Casino source snapshots required by the detailed source reference, and record their archive hashes or Git tags.
- Capture current plugin versions, config files, database backups, active commands, permissions, broker records, and assembled resource-pack hash.
- Run the existing CorporateCraft and Casino test suites without modifying their source.
- Add integration fixtures representing an open buy, open sell, partial fill, cancelled remainder, pending item collection, pending currency collection, direct trade, Casino wager, and doubloon cash-out.
- Decide the final plugin/JAR name and whether `/corporatecraft` remains a temporary command alias.

Exit condition: rollback inputs and invariant totals are documented.

### Phase 1 - Create a GE-only runtime boundary

- Break CorporateCraft bootstrap into explicit modules: exchange, direct trade, optional immersion, brokers, and retired corporate markets.
- Add a GE-only feature profile and make it the Crownlands target.
- Stop constructing corporation, equity, stock, futures, land, and upkeep services.
- Remove their scheduled tasks and listeners from the GE-only profile.
- Keep the existing database unchanged during this phase.

Exit condition: the server starts with only GE/trade features, and existing orders/collections still work.

Implementation status (2026-08-09): complete in the CorporateCraft working tree. The new `runtime-profile: crownlands` path skips construction of corporation, land, item-equity/stock, and futures services while retaining GE, money, direct trade, brokers, and the `CorporateCraftApi v1` registration used by Casino. Legacy mode remains the compatibility default for this first seam. See `J:\Projects\MinecraftPlugins\CorporateCraft\docs\crownlands-runtime-profile.md` for activation, traceability, and verification details.

### Phase 2 - Clean commands, UI, permissions, and API

- Reduce `plugin.yml` to `/ge`, GE-only `/geadmin`, `/trade`, and chosen settings aliases.
- Remove corporation routes from `GrandExchangeCommand` and futures/corporation dependencies from `GrandExchangeAdminCommand`.
- Make market tools item-only; remove corporate/futures/contracts/jobs copy and entity types.
- Reduce broker roles and broker menus to retained GE roles.
- Introduce a small Crownlands API for readiness, market snapshots, and market events.
- Remove Casino's hard CorporateCraft API check and compile-time JAR dependency; make Vault its required economy boundary.

Implementation status (2026-08-09): complete. CorporateCraft now registers a focused `CrownlandsApi v1`, limits Crownlands retention menus and commands to item markets, and restricts broker staff role cycling to retained GE roles. Legacy command declarations and `CorporateCraftApi v1` remain as an explicit compatibility bridge. Casino no longer imports, discovers, or depends on CorporateCraft at runtime or compile time; Vault is its required economy boundary. The focused migration tests pass, Casino passes all 76 tests, and the CorporateCraft full suite retains its previously documented asynchronous GE UI failure (plus one Windows temporary-directory cleanup race that passes in isolation). The existing shared pack build chain remains unchanged for Phase 3.

Exit condition: no retired feature is discoverable through commands, permissions, GUI, scheduled jobs, listeners, or public API.

### Phase 3 - Normalize shared-pack integration

- Add `item-model` to Crownlands tradeable item definitions while retaining legacy `custom-model-data` compatibility where needed.
- Centralize pack assembly and import the existing CorporateCraft/Bank/Casino/Blocksmith sources unchanged.
- Add asset-collision and missing-runtime-ID verification.
- Keep compatibility aliases for old font/model IDs.

Implementation status (2026-08-09): complete. `shared-pack/` is now the authoritative neutral assembler and `npm run pack:build` produces `Crownlands-Shared-Resource-Pack.zip`. It consumes the pinned CorporateCraft base, BankATM's prepared model, all nine GE icon collections, Casino's prepared/generated Blocksmith assets, and optional Blocksmith exports without renaming IDs. The build fails on current-producer collisions, invalid JSON, missing custom model/texture/parent references, coordinates outside `-16..32`, or any missing runtime item-model. Its runtime inventory currently verifies 634 exact IDs across 2,971 source files. The first successful reproducible ZIP contained 3,084 entries. Legacy combined tasks remain available temporarily, but are no longer the recommended server-pack path.

Implementation status (2026-08-09): complete. `shared-pack/` is now the authoritative neutral assembler and `npm run pack:build` produces `Crownlands-Shared-Resource-Pack.zip`. It consumes the pinned CorporateCraft base, BankATM's prepared model, all nine GE icon collections, Casino's prepared/generated Blocksmith assets, and optional Blocksmith exports without renaming IDs. The build fails on current-producer collisions, invalid JSON, missing custom model/texture/parent references, coordinates outside `-16..32`, or any missing runtime item-model. Its runtime inventory currently verifies 634 exact IDs across 2,971 source files. The first successful reproducible ZIP contained 3,084 entries. Legacy combined tasks remain available temporarily, but are no longer the recommended server-pack path.

Exit condition: one pack builds reproducibly and every Crownlands/Casino runtime model ID resolves.

### Phase 4 - Build and verify the clean Crownlands database

- Split GE persistence from retired repository methods.
- Create the GE-only schema and one-time importer.
- Run importer rehearsals against copies of production data.
- Produce conservation reports for orders, item escrow, currency escrow, fills, and collections.
- Test rollback by returning to CorporateCraft with the untouched original database.

Implementation status (2026-08-09): code and automated rehearsal complete; production-copy rehearsal pending. CorporateCraft now selects a fresh GE-only schema for the Crownlands runtime while legacy mode retains the original migration chain. The offline importer opens a quiesced source backup read-only, creates a separate target, filters retired retention/broker rows, verifies row counts and financial digests, enforces escrow/order/collection/foreign-key invariants, records the source SHA-256, and supports exact-source idempotent replay. Automated tests prove partial-fill conservation, source byte preservation, clean-schema repository reads, failed-import rollback, and replay without duplicate rows. No production database copy was available in the project workspace, so the Phase 4 exit condition remains open until an administrator runs the documented rehearsal and reviews its report.

Exit condition: imported totals and per-order states match, with no destructive changes to the source database.

### Phase 5 - Cutover and compatibility window

- Stop new GE submissions on the old runtime, allow matching/collection to quiesce as chosen, take a final backup, and run the final import.
- Start Crownlands, verify Vault, pack delivery, commands, brokers, signs, order submission/matching/cancellation, and collections.
- Start Casino and verify all games, persisted machines, physical doubloons, cashier deposits, NPCs, cities, atlas, and display animations.
- Retain command aliases, font aliases, and API compatibility for one release where they materially reduce breakage.

Exit condition: live invariants remain stable through the soak period and rollback is no longer required.

### Phase 6 - Delayed cleanup

- Remove compatibility code only after logs show no consumers.
- Archive rather than drop the CorporateCraft database.
- Remove retired Java packages and tests from the Crownlands codebase after the GE-only runtime and importer are proven.
- Update pack artifact names and operator documentation last.

## Validation gates

- Currency escrow equals outstanding buy obligations.
- Item escrow equals outstanding sell quantities, including metadata-sensitive items.
- Filled plus remaining quantity never exceeds the original order quantity.
- Every cancelled/filled entitlement has exactly one collection path.
- Replaying startup or migration is idempotent.
- Direct trades preserve complete Bukkit item metadata.
- Every Java `setItemModel` identifier exists in the final shared pack.
- Existing Casino PDC-tagged items and placed rigs remain recognizable.
- Casino wagers and cashier deposits remain atomic across disconnect/restart failures.
- No Crownlands UI, command, permission, API, listener, or task exposes a retired domain.

## First implementation slice

The safest first code change is Phase 1 only: introduce a GE-only bootstrap/profile inside CorporateCraft, keep the plugin name and database unchanged, and add regression tests proving that GE, direct trade, Casino startup, and existing pack identifiers continue to work while the retired services are not constructed. This creates the seam needed for the later Crownlands rename and clean data import without combining all migration risks at once.

Each implementation change must include the traceability row defined in the detailed CorporateCraft source reference. This prevents a class, SQL query, configuration rule, or existing regression test from disappearing merely because its original file also contained excluded features.
