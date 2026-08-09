# CorporateCraft Source Reference for Crownlands

Audit date: 2026-08-09

Authoritative source root at audit time:

`J:\Projects\MinecraftPlugins\CorporateCraft`

Preserved baseline:

- Repository: `https://github.com/NKocur/CC.git`
- Commit: `daebf7d855d0914f4b5a7c19b1c8af00c33973d6`
- Tag: `corporatecraft-pre-crownlands`
- Separate GE pack repository: `https://github.com/NKocur/CorporateCraft-GE-Pack.git`
- GE pack commit referenced by the CorporateCraft baseline: `da3e5fe6c0a7afe140b64d8d703f5684dd25ceff`

The GE pack remains a separate nested repository by owner choice. At audit time its working tree also contained changes to `pack.mcmeta` and untracked `assets/grand_exchange/` files beyond the referenced commit. Those changes are not part of CorporateCraft commit `daebf7d`; preserve or commit them in the GE pack repository separately.

This reference is an inventory of the original implementation, not a declaration that every class should be copied unchanged. Use it to trace each Crownlands feature back to its working CorporateCraft source and tests.

## Preservation status

The CorporateCraft source is now preserved by the commit and tag above. Before migration work changes any related source that is not covered by that tag:

1. Create a dated, read-only archive of the complete source root, including `src`, `artifacts`, `docs`, Gradle files, wrapper files, and configuration.
2. Record a SHA-256 hash of that archive in the migration log.
3. Keep the `corporatecraft-pre-crownlands` tag immutable.
4. Never use the source archive as the working migration tree.

Do not move or recreate the baseline tag on a later commit.

## Runtime composition and configuration

| Concern | Original source | Migration use |
| --- | --- | --- |
| Complete plugin wiring and lifecycle | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\java\com\corporatecraft\CorporateCraftPlugin.java` | Primary reference for every constructed service, scheduled task, listener, public service, command, and shutdown path. Split carefully; do not copy only the GE UI. |
| Plugin identity, commands, permissions | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\plugin.yml` | Source for current command aliases and permissions. Retain only GE/trade-facing contracts or deliberate compatibility aliases. |
| Core settings | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\config.yml` | Preserve direct-trade behavior; corporation pricing is out of scope. |
| Database settings | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\database.yml` | Preserve connection/pool semantics and current `corporatecraft.db` location for the compatibility phase. |
| Network settings | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\network.yml` | Preserve local/Redis coordinator behavior for multi-server GE matching. |
| GUI text | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\gui.yml` | Retain and rebrand GE strings. |
| Player messages | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\messages.yml` | Audit retained GE/trade errors and remove retired-domain copy. |
| Tradeable catalog | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\items.yml` | Authoritative item IDs, materials, limits, categories, metadata versions, and enabled state. |
| Optional market content | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\immersion.yml` | Keep only item-market discovery/watchlist/alert/ranking/onboarding settings. |
| Broker presentation | `J:\Projects\MinecraftPlugins\CorporateCraft\src\main\resources\brokers.yml` | Preserve GE broker appearance and retained roles. |
| Build and dependencies | `J:\Projects\MinecraftPlugins\CorporateCraft\build.gradle`, `settings.gradle`, `gradle.properties`, `gradlew.bat`, `gradle\wrapper\*` | Reference Java/Paper/dependency versions and test setup. |

## Grand Exchange capability map

| Crownlands capability | Primary CorporateCraft source | Supporting source | Regression tests to preserve or port |
| --- | --- | --- | --- |
| Buy/sell order creation | `src\main\java\com\corporatecraft\order\OrderSubmissionService.java` | `OrderSide.java`, `OrderStatus.java`, `SubmissionResult.java`, `OfferSlotService.java` | `src\test\java\com\corporatecraft\order\OrderSubmissionServiceTest.java` |
| Item and currency escrow | `src\main\java\com\corporatecraft\order\InventoryEscrowService.java` | `EscrowConservation.java`, `EscrowKind.java`, `EscrowStatus.java`; transactional repository methods in `persistence\repository\MarketRepository.java` | `OrderSubmissionServiceTest.java`, `collection\CollectionServiceTest.java`, `persistence\SqlPersistenceServiceTest.java` |
| Price-time matching | `src\main\java\com\corporatecraft\matching\PriceTimeMatchingEngine.java` | `MatchResult.java`, `TaxPolicy.java`, repository order/transaction methods | `src\test\java\com\corporatecraft\matching\PriceTimeMatchingEngineTest.java` |
| Collections and recovery delivery | `src\main\java\com\corporatecraft\collection\CollectionService.java` | `CollectionResult.java`, `PlayerNotifier.java`, `RateLimitedPlayerNotifier.java`, `NotificationJoinListener.java` | `src\test\java\com\corporatecraft\collection\CollectionServiceTest.java` |
| Vault economy boundary | `src\main\java\com\corporatecraft\economy\VaultEconomyService.java` | `service\EconomyService.java`, `UnavailableEconomyService.java` | `src\test\java\com\corporatecraft\economy\VaultEconomyServiceTest.java` |
| Tradeable item catalog and validation | `src\main\java\com\corporatecraft\item\TradeableItemRegistry.java` | `MarketItemDefinition.java`, `CustomItemIdentifier.java`, `ItemValidationResult.java`, `PurchaseLimit.java`, `ItemNames.java`, `items.yml` | `src\test\java\com\corporatecraft\item\TradeableItemRegistryTest.java`, `ItemNamesTest.java`, `compatibility\CatalogAuditTest.java`, `DefaultDataCompatibilityTest.java` |
| Exact enchanted-book listings | `src\main\java\com\corporatecraft\special\EnchantedBookListingService.java` | `EnchantedBookCodec.java`, `SpecialListingResult.java`, `item\EnchantedBookDefinition.java`; special-listing repository methods | `src\test\java\com\corporatecraft\special\EnchantedBookCodecTest.java` plus GE UI tests |
| Market snapshots and order-book depth | `src\main\java\com\corporatecraft\market\MarketDataService.java` | `GuidePriceCalculator.java`, `GuidePricePolicy.java`; repository market snapshot/history/depth methods | `src\test\java\com\corporatecraft\market\MarketDataServiceTest.java`, `GuidePriceCalculatorTest.java` |
| Market safeguards | `src\main\java\com\corporatecraft\safeguard\DefaultMarketSafetyService.java` | `MarketSafetyService.java`, market controls and audit repository methods | `src\test\java\com\corporatecraft\safeguard\SafeguardsServiceTest.java`, `command\GrandExchangeAdminCommandTest.java` |
| Multi-server coordination | `src\main\java\com\corporatecraft\network\DistributedCoordinator.java` | `InMemoryDistributedCoordinator.java`, `RedisDistributedCoordinator.java`, `NetworkOperationsService.java`, `OperationalMetrics.java`, `config\NetworkConfiguration.java`, `network.yml` | `src\test\java\com\corporatecraft\network\NetworkOperationsServiceTest.java` |
| Direct player trading | `src\main\java\com\corporatecraft\trade\PlayerTradeService.java` | `command\TradeCommand.java`, direct-trade config in `config.yml` | Add dedicated direct-trade tests during Phase 0; none were found in the existing test inventory. |
| GE market signs | `src\main\java\com\corporatecraft\listener\GrandExchangeMarketSignListener.java` | sign persistence in `MarketRepository.java`; `/ge sign` routing in `GrandExchangeCommand.java` | Preserve relevant plugin/command tests and add sign restoration coverage. |
| Player sidebar/settings | `src\main\java\com\corporatecraft\sidebar\CorporateCraftSidebar.java` | `ui\CorporateCraftSettingsUi.java`, `command\CorporateCraftCommand.java`, player preference repository methods | `CorporateCraftPluginTest.java` and UI tests; add retained-preference migration coverage. |
| Item-only retention features | `src\main\java\com\corporatecraft\market\ImmersionRetentionService.java` | `ui\ImmersionUi.java`, `immersion.yml`, watchlist/alert/news/ranking/onboarding repository methods | `src\test\java\com\corporatecraft\market\ImmersionRetentionServiceTest.java` |

Paths in the capability table are relative to `J:\Projects\MinecraftPlugins\CorporateCraft` unless shown as absolute.

## GE interface source

The operational GE interface is concentrated in:

- `src\main\java\com\corporatecraft\ui\GrandExchangeUi.java` — home, market overview, categories, search, item details, charts, buy/sell tickets, review, active offers, cancellation, collections, and history.
- `src\main\java\com\corporatecraft\command\GrandExchangeCommand.java` — `/ge` routing. This is mixed: retain search/item/price/chart/sign/markets/offers/history/collect/cancel and remove corporation routes plus non-item watchlist types.
- `src\main\java\com\corporatecraft\command\GrandExchangeAdminCommand.java` — mixed administration. Retain pause/freeze/reconcile/audit/metrics/broker operations; remove futures and corporation administration dependencies.
- `src\main\java\com\corporatecraft\ui\UiController.java` — inventory lifecycle, navigation, rendering, and sessions.
- `src\main\java\com\corporatecraft\ui\UiComponents.java` — item/button construction and modern `ItemMeta#setItemModel` application.
- `src\main\java\com\corporatecraft\ui\UiIcon.java` — semantic mappings to existing `rpgiab:*` item model IDs.
- `src\main\java\com\corporatecraft\ui\UiButton.java`, `UiAction.java`, `UiScreen.java`, `UiSession.java`, `UiView.java`, `UiViews.java`, `UiMessages.java`, `InputPrompt.java`, `Pagination.java`, `SearchQuery.java`, and `PermissionContext.java` — reusable UI framework and helpers.
- `src\main\java\com\corporatecraft\ui\GrandExchangeHomeScreen.java` — an older framework placeholder, not the operational home screen inside `GrandExchangeUi.java`; do not mistake it for the full GE.

Relevant interface tests:

- `src\test\java\com\corporatecraft\ui\GrandExchangeUiTest.java`
- `src\test\java\com\corporatecraft\ui\UiControllerTest.java`
- `src\test\java\com\corporatecraft\ui\UiIconTest.java`
- `src\test\java\com\corporatecraft\ui\UiVisualizationComponentsTest.java`
- `src\test\java\com\corporatecraft\CorporateCraftPluginTest.java`

## Persistence source and retained tables

Core persistence implementation:

- `src\main\java\com\corporatecraft\persistence\SqlPersistenceService.java`
- `src\main\java\com\corporatecraft\persistence\MigrationRunner.java`
- `src\main\java\com\corporatecraft\persistence\Migration.java`
- `src\main\java\com\corporatecraft\persistence\Migrations.java`
- `src\main\java\com\corporatecraft\persistence\DatabaseSettings.java`
- `src\main\java\com\corporatecraft\persistence\repository\MarketRepository.java`
- `src\main\java\com\corporatecraft\service\PersistenceService.java`

`Migrations.java` and `MarketRepository.java` are mixed-domain files. Preserve untouched copies throughout migration. The clean Crownlands implementation must trace retained tables and queries back to these originals.

Retained GE tables created by the CorporateCraft migrations include:

- `tradeable_items`
- `exchange_orders`
- `escrow_entries`
- `exchange_transactions`
- `collection_entries`
- `price_history`
- `purchase_limits`
- `audit_records`
- `market_controls`
- `special_item_listings`
- `grand_exchange_market_signs`
- retained portions of `player_settings`, `player_notifications`, `player_watchlists_v2`, `player_alert_preferences_v2`, `player_alert_delivery_settings`, `market_news`, `market_rankings`, `onboarding_progress`, `discovery_links`, and `player_interface_preferences`
- `corporatecraft_brokers`, filtered to retained GE broker roles

Repository methods for those tables remain interleaved with excluded item-equity, futures, corporation, and land methods in `MarketRepository.java`. Split by capability and compare SQL plus record mappings method-by-method; do not reconstruct the schema from memory.

Persistence tests and fixtures to retain:

- `src\test\java\com\corporatecraft\persistence\SqlPersistenceServiceTest.java`
- `src\test\java\com\corporatecraft\persistence\repository\BrokerRepositoryTest.java`
- all order, matching, collection, market-data, safety, and compatibility tests listed above

## Broker source

Broker persistence and display behavior is in:

- `src\main\java\com\corporatecraft\broker\BrokerRole.java`
- `BrokerRecord.java`, `BrokerStatus.java`, `BrokerService.java`
- `BrokerOperations.java`, `BrokerCompletionCache.java`
- `BrokerLifecycleListener.java`, `BrokerProtectionListener.java`, `BrokerInteractionListener.java`
- `BrokerPresentation.java`, `BrokerPresentationService.java`, `BrokerNameplateAdapter.java`, `BrokerSoundPlayer.java`, `BrokerGazeService.java`
- `src\main\java\com\corporatecraft\persistence\repository\BrokerRepository.java`
- `src\main\java\com\corporatecraft\ui\BrokerStaffUi.java`
- `src\main\resources\brokers.yml`

Retain behavior for roles `EXCHANGE`, `COLLECTION`, `OFFERS`, and `MARKETS`. Preserve the original enum and stored values during data migration even though `STOCKS`, `FUTURES`, and `CORPORATIONS` will not be active in Crownlands.

Broker tests:

- `src\test\java\com\corporatecraft\broker\BrokerExchangeEntryTest.java`
- `BrokerPresentationServiceTest.java`, `BrokerRecordTest.java`, `BrokerServiceTest.java`
- `src\test\java\com\corporatecraft\persistence\repository\BrokerRepositoryTest.java`
- `src\test\java\com\corporatecraft\ui\BrokerStaffUiTest.java`

## Public API source

Original API files are under:

`J:\Projects\MinecraftPlugins\CorporateCraft\src\main\java\com\corporatecraft\api`

Market contracts worth referencing are `CorporateCraftApi.java`, `CorporateCraftApiProvider.java`, `MarketView.java`, `MarketApiEvent.java`, and `ApiSubscription.java`. The same interface currently also exposes `CorporationView`, `ClaimView`, `EquityView`, corporation events, and alert contracts. Crownlands should create a smaller market API rather than silently retaining those domains.

Protect the old API shape with:

- `src\test\java\com\corporatecraft\CorporateCraftApiTest.java`
- `src\test\java\com\corporatecraft\CorporateCraftPluginTest.java`

Casino's only use of this API is documented separately in the migration audit; it checks `API_VERSION` during startup and calls no market/corporation API method.

## Shared resource-pack source

CorporateCraft's local pack fragment is:

`J:\Projects\MinecraftPlugins\CorporateCraft\artifacts\resource-pack\CorporateCraft-GE-Pack`

It contains:

- `pack.mcmeta` and `pack.png`
- `assets\corporatecraft\font\gui.json`
- `assets\corporatecraft\textures\font\ge_home.png`
- `assets\grand_exchange\font\gui.json`
- `assets\grand_exchange\textures\font\exchange_menu.png`

The current semantic GUI item models are not stored in that small fragment. `UiIcon.java` references the shared `rpgiab:*` namespace, and those assets originate from the shared Blocksmith/resource-pack pipeline. Preserve both the `corporatecraft`/`grand_exchange` font paths and the `rpgiab:*` item IDs during migration.

## Excluded code retained for historical reference

Do not move these systems into Crownlands, but keep them in the pre-migration source archive so no implementation is lost:

- `src\main\java\com\corporatecraft\corporation\*`
- `src\main\java\com\corporatecraft\market\FuturesMarketService.java`
- `src\main\java\com\corporatecraft\market\ItemEquityMarketService.java`
- `src\main\java\com\corporatecraft\market\ItemEquityExchangeService.java`
- `src\main\java\com\corporatecraft\command\CorporationCommand.java`
- `FuturesCommand.java`, `StockCommand.java`
- `src\main\java\com\corporatecraft\ui\CorporationUi.java`
- `CorporationOperationsUi.java`, `CorporateEquityUi.java`, `FuturesMarketUi.java`, `StockMarketUi.java`
- `src\main\java\com\corporatecraft\listener\LandProtectionListener.java`
- `TerritoryTransitionListener.java`
- excluded schema and repository sections for corporations, claims, shares/equity, futures, contracts, employment, governance, and land permissions
- their corresponding tests under `src\test\java\com\corporatecraft\corporation` and the futures/item-equity test classes

## Migration traceability rule

Every Crownlands migration pull request should include a source trace table with:

| Crownlands file or schema object | CorporateCraft source path | Original test path | Behavior intentionally changed | New Crownlands test |
| --- | --- | --- | --- | --- |

A retained capability is not complete until its source path, original behavior, data mapping, and regression coverage are recorded. If a CorporateCraft implementation is deliberately not reused, record why rather than omitting the reference.
