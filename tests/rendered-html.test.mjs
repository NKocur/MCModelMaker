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

test("library collections export one combined ZIP with all supported content", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /async function exportCollectionBundle\(projects:Project\[],packName:string,collectionName:string\)/);
  assert.match(source, /const usedIdentities=new Set<string>\(\),targets=projects\.map/);
  assert.match(source, /while\(usedIdentities\.has\(`\$\{ns\}:\$\{id\}`\)\)id=`\$\{baseId\}_\$\{suffix\}_\$\{attempt\+\+\}`/);
  assert.match(source, /for\(const\{project,ns,id\}of targets\)/);
  assert.match(source, /paperContentData\(project,ns,id\)/);
  assert.doesNotMatch(source, /Every model in a collection must have a unique namespace and name/);
  assert.match(source, /resource-pack\/pack\.mcmeta/);
  assert.match(source, /paper\/collections\/\$\{slug\(packName\)\}_\$\{slug\(collectionName\)\}\.json/);
  assert.match(source, /structures\/\$\{id\}\.schem/);
  assert.match(source, /models:manifest/);
  assert.match(source, /a\.download=`\$\{slug\(packName\)\}-\$\{slug\(collectionName\)\}-collection\.zip`/);
  assert.match(source, />Export collection ZIP<\/button>/);
  assert.match(source, /collectionModels=library\.filter\(model=>projectPack\(model\)===pack&&projectGroup\(model\)===collection\)/);
  assert.match(source, /exportCollectionBundle\(collectionModels,pack,collection\)/);
  assert.match(styles, /\.library-section-actions/);
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

test("Briarback Goblin Fighter is an original combat-ready humanoid rig", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Briarback Goblin Fighter"/);
  assert.match(source, /baseEntity:"minecraft:zombie",category:"Creatures",group:"Goblinoids",pack:"Wild Frontier"/);
  for (const feature of ["Oversized left ear", "Long hooked nose", "Bent scrap buckler", "Knotted club head"]) assert.match(source, new RegExp(feature));
  assert.match(source, /id:"goblin_jaw",name:"Tusking jaw",parentId:"goblin_head"/);
  assert.match(source, /id:"goblin_arm_r",name:"Club arm",parentId:"goblin_body"/);
  for (const clip of ["Idle", "Walk", "Club Attack", "Hurt", "Death"]) assert.match(source, new RegExp(`name:"${clip}"`));
  assert.match(source, /goblin_attack_arm_4[^\n]+\[-125,0,-18\]/);
  assert.match(source, /goblin_death_body_24[^\n]+\[88,0,0\]/);
  assert.match(source, /goblin_club_head[^\n]+\[12,1,5\.6\],\[15\.4,5,9\.2\]/);
  assert.match(source, /goblin_club_spike[^\n]+\[13,0,6\.5\],\[14\.4,1,8\.4\]/);
  assert.match(source, /swampWatchtower,\s+briarbackGoblin,\s+marshAlligator/);
});

test("malformed cube coordinates cannot blank the entire model viewport", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const validVec3=/);
  assert.match(source, /const validCubeGeometry=/);
  assert.match(source, /const drawableParts=useMemo\(\(\)=>viewportParts\.filter\(validCubeGeometry\)/);
  assert.match(source, /const coordinates=drawableParts\.flatMap/);
  assert.match(source, /project\.cubes\.filter\(validCubeGeometry\):drawableParts/);
  assert.match(source, /Every cube must have three finite FROM, TO, and rotation coordinates/);
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
  assert.match(source, /category:"Furniture",group:"Pirate Slot Machines",pack:"Fantasy Daily Rewards"/);
  assert.match(source, /cubes:overlapChecked\("Blackwake Skulljack",skulljackCubes\)/);
  assert.match(source, /Skull jackpot plaque/);
  assert.match(source, /Bone skull reel/);
  assert.match(source, /Gold doubloon reel/);
  assert.match(source, /Crimson parrot reel/);
  assert.match(source, /Ruby lever knob/);
  assert.match(source, /name:"Pull & Spin",lengthTicks:30,loop:false/);
  assert.match(source, /slots_lever_4[^\n]+\[0,0,-45\]/);
  assert.match(source, /slots_reel_1_28[^\n]+\[360,0,0\]/);
  assert.match(source, /deckhandLuckyBones,\s+blackwakeSkulljack,\s+dreadAdmiralKrakenJackpot,\s+blackwakePirateChest/);
});

test("pirate slot machines have common, rare, and legendary tiers", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Deckhand's Lucky Bones".*Common-tier pirate slot machine/);
  assert.match(source, /name:"Blackwake Skulljack".*Rare-tier pirate slot machine/);
  assert.match(source, /name:"Dread Admiral's Kraken Jackpot".*Legendary-tier pirate slot machine/);
  for (const feature of ["Weathered Lucky Bones sign", "Bolted cabinet repair patch", "Dread Admiral gilded crown", "Left gilded kraken tentacle", "Cursed aqua crown jewel", "Legendary payout gold rim"]) assert.match(source, new RegExp(feature));
  assert.match(source, /group:"Pirate Slot Machines"/);
  assert.match(source, /name:"Pull & Spin — Common"/);
  assert.match(source, /name:"Dread Admiral Jackpot Spin"/);
  assert.match(source, /placementSize:\[1,2,1\]/);
});

test("Emerald Fortune Roulette is a two-block animated casino table", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Emerald Fortune Roulette"/);
  assert.match(source, /group:"Casino Games",pack:"Fantasy Daily Rewards",placementSize:\[2,1,1\]/);
  assert.match(source, /cubes:overlapChecked\("Emerald Fortune Roulette",rouletteCubes\)/);
  assert.match(source, /Two-block mahogany tabletop/);
  assert.match(source, /Emerald betting felt/);
  assert.match(source, /Array\.from\(\{length:18\}/);
  assert.match(source, /Ivory roulette ball[^\n]+boneId:"roulette_ball"/);
  assert.match(source, /id:"roulette_ball",name:"Roulette ball orbit",parentId:"roulette_table",pivot:\[8,14\.2,8\]/);
  assert.match(source, /name:"Spin wheel & ball",lengthTicks:40,loop:true/);
  assert.match(source, /roulette_spin_40[^\n]+\[0,360,0\]/);
  assert.match(source, /roulette_ball_40[^\n]+\[0,-720,0\]/);
  assert.match(source, /emeraldFortuneRoulette,\s+blackwakeBlackjackTable,\s+blackwakeCasinoWarTable,\s+\.\.\.blackwakePlayingCards,\s+blackwakeGoldDoubloon,\s+blackwakePirateGrog,\s+emptyBlackwakeGrogTankard,\s+deckhandLuckyBones,\s+blackwakeSkulljack,\s+dreadAdmiralKrakenJackpot/);
});

test("Blackwake Blackjack Table is a two-block animated pirate casino table", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Blackwake Blackjack Table"/);
  assert.match(source, /group:"Casino Games",pack:"Fantasy Daily Rewards",placementSize:\[2,1,1\]/);
  for (const feature of ["Deep emerald blackjack felt", "Blackwake card shoe", "Bone skull felt inlay", "Dealer face-down hole card", "Blackwake twenty-one nameplate"]) assert.match(source, new RegExp(feature));
  assert.match(source, /\[5,12,20,27\]\.flatMap/);
  assert.match(source, /id:"blackjack_card_p1",name:"Player ace",parentId:"blackjack_table"/);
  assert.match(source, /name:"Deal Opening Hand",lengthTicks:20,loop:false/);
  assert.match(source, /blackjack_d2_12[^\n]+\[-18\.5,\.8,4\][^\n]+blackjack_d2_16/);
  assert.match(source, /blackwakeBlackjackTable,\s+blackwakeCasinoWarTable,\s+\.\.\.blackwakePlayingCards/);
});

test("Blackwake Casino War Table is a two-block animated head-to-head game", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /name:"Blackwake Casino War Table"/);
  assert.match(source, /group:"Casino Games",pack:"Fantasy Daily Rewards",placementSize:\[2,1,1\]/);
  for (const feature of ["WAR wager lane", "TIE wager lane", "Left crossed-cutlass inlay", "Blackwake battle card shoe", "Dealer doubloon tray", "Blackwake Casino War nameplate"]) assert.match(source, new RegExp(feature));
  assert.match(source, /\[6,16,26\]\.flatMap/);
  assert.match(source, /id:"war_player_card",name:"Player battle card",parentId:"war_table"/);
  assert.match(source, /name:"Deal Opening Battle",lengthTicks:12,loop:false/);
  assert.match(source, /name:"Deal Tie-Break War",lengthTicks:16,loop:false/);
  assert.match(source, /blackwakeBlackjackTable,\s+blackwakeCasinoWarTable,\s+\.\.\.blackwakePlayingCards/);
});

test("Blackwake playing cards contain a complete readable 52-card generated deck", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const CARD_RANKS=\["A","2","3","4","5","6","7","8","9","10","J","Q","K"\]/);
  assert.match(source, /CARD_SUITS=\["spades","hearts","clubs","diamonds"\]/);
  assert.match(source, /const CARD_GLYPHS:Record<string,string\[]>/);
  assert.match(source, /const CARD_SUIT_MASKS:Record<CardSuit,string\[]>/);
  assert.match(source, /spades:\["\.\.\.#\.\.\."/);
  assert.match(source, /hearts:\["\.##\.##\."/);
  assert.match(source, /clubs:\["\.\.###\.\."/);
  assert.match(source, /diamonds:\["\.\.\.#\.\.\."/);
  assert.match(source, /const makePlayingCardSprite=\(rank:CardRank,suit:CardSuit\)/);
  assert.match(source, /const blackwakePlayingCards:Project\[]=CARD_SUITS\.flatMap\(suit=>CARD_RANKS\.map/);
  assert.match(source, /id:`blackwake_\$\{rank\.toLowerCase\(\)\}_of_\$\{suit\}`/);
  assert.match(source, /baseItem:"minecraft:paper",spriteParent:"generated",sprite:makePlayingCardSprite\(rank,suit\)/);
  assert.match(source, /group:"Blackwake Playing Cards",pack:"Fantasy Daily Rewards"/);
});

test("Blackwake pirate weapons form a five-item handheld collection", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const blackwakePirateWeapons:Project\[]=\[/);
  for (const name of ["Blackwake Buccaneer Cutlass", "Blackwake Boarding Axe", "Blackwake Flintlock", "Blackwake Marlinspike Dagger", "Blackwake Captain's Saber"]) assert.match(source, new RegExp(`name:"${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}"`));
  for (const sprite of ["cutlass", "axe", "flintlock", "dagger", "saber"]) assert.match(source, new RegExp(`sprite:PIRATE_WEAPON_SPRITES\\.${sprite}`));
  assert.match(source, /edgeTone=\(x:number,y:number\)=>/);
  for (const edge of ["#465256", "#4d351f", "#512a2d", "#805a2a"]) assert.match(source, new RegExp(edge));
  assert.doesNotMatch(source, /PIRATE_WEAPON_COLORS[^\n]+#171a1c/);
  assert.match(source, /spriteParent:"handheld" as const/);
  assert.match(source, /category:"Tools & Weapons",group:"Blackwake Pirate Weapons",pack:"Fantasy Daily Rewards"/);
  assert.match(source, /\.\.\.blackwakePirateWeapons/);
});

test("core GUI icons export as a reusable Minecraft item collection", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /"Tools & Weapons","GUI Items","Blocks"/);
  assert.match(source, /const CORE_GUI_ICONS=\[/);
  for (const id of ["confirm", "cancel", "previous_page", "next_page", "locked", "unlocked", "information", "warning", "settings", "refresh", "search", "shop", "wallet", "rewards", "home", "profile", "filter", "menu"]) assert.match(source, new RegExp(`id:"${id}"`));
  assert.match(source, /const coreGuiItems:Project\[]=CORE_GUI_ICONS\.map/);
  assert.match(source, /baseItem:"minecraft:paper",spriteParent:"generated"/);
  assert.match(source, /category:"GUI Items",group:"Core GUI Items",pack:"Blocksmith GUI Kit"/);
  assert.match(source, /\.\.\.coreGuiItems/);
  assert.match(source, /makeGuiItemSprite\(icon\.mask,icon\.tone\)/);
  assert.match(source, /const GUI_ICON_TONES=\{green:\["#27623b","#56b85d","#a7e889"\]/);
  assert.match(source, /\[\[-1,0\],\[1,0\],\[0,-1\],\[0,1\]\] as const/);
  assert.match(source, /highlighted=y<4&&!solid\(x,y-1\),shaded=y>4&&!solid\(x,y\+1\)/);
  assert.doesNotMatch(source, /set\(x\+5,y\+5,"#30383a"\)/);
  assert.doesNotMatch(source, /const makeGuiItemSprite[^\n]+tile=/);
  assert.match(source, /const OBJECT_GUI_ICON_ROWS:Record<string,readonly string\[]>/);
  for (const id of ["locked", "unlocked", "warning", "settings", "refresh", "shop", "wallet", "rewards", "profile", "menu"]) assert.match(source, new RegExp(`${id}:\\[`));
  assert.match(source, /OBJECT_GUI_ICON_ROWS\[icon\.id\]\?makeObjectGuiItemSprite\(OBJECT_GUI_ICON_ROWS\[icon\.id\]\):makeGuiItemSprite/);
  assert.match(source, /const SYMMETRIC_OBJECT_GUI_ICONS=\["locked","warning","settings","shop","rewards","profile"\] as const/);
  assert.match(source, /row!==\[\.\.\.row\]\.reverse\(\)\.join\(""\)/);
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
  assert.match(source, /merged\[i\]\.source!=="local"/);
  assert.doesNotMatch(source, /\(Saved edit\)/);

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
  assert.match(source, /interacting&&project\.structure\?project\.cubes\.filter\(validCubeGeometry\):drawableParts/);
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
  assert.match(source, /schema:6/);
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

test("flat items include an editable 16 by 16 pixel canvas", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /function SpriteEditor/);
  assert.match(source, /type="color"/);
  assert.match(source, />Pencil</);
  assert.match(source, />Eraser</);
  assert.match(source, /right-click to erase/);
  assert.match(source, /if\(mirror\)next\[y\*16\+\(15-x\)\]=value/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onContextMenu=/);
  assert.match(source, /Create 16×16 sprite/);
  assert.match(source, /sprite:Array\(256\)\.fill\(null\)/);
  assert.match(source, /const centerSpritePixels=/);
  assert.match(source, /sprite:centerSpritePixels/);
  assert.match(source, />Center</);
  assert.match(styles, /\.pixel-grid\{display:grid;grid-template-columns:repeat\(16,1fr\)/);
  assert.match(styles, /grid-template-columns:repeat\(16,15px\)/);
  assert.match(styles, /\.pixel-grid:before,\.pixel-grid:after/);
  assert.match(styles, /background:#ef3f3f/);
  assert.match(source, /red guides mark the exact center between pixels 8 and 9/);
  assert.match(source, />Import PNG</);
  assert.match(source, /accept="\.png,image\/png"/);
  assert.match(source, /image\.naturalWidth!==16\|\|image\.naturalHeight!==16/);
  assert.match(source, /getContext\("2d",\{willReadFrequently:true\}\)/);
  assert.match(source, /rgba\[offset\+3\]===0/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
  assert.match(styles, /image-rendering:pixelated/);
});

test("saving overwrites the current library model and models can be permanently deleted", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /const saved=\{\.\.\.clone\(project\),source:"local" as const/);
  assert.doesNotMatch(source, /id:uid\("saved_builtin"\)/);
  assert.match(source, /blocksmith-deleted-models-v1/);
  assert.match(source, /setDeletedIds\(ids=>ids\.includes\(project\.id\)/);
  assert.match(source, /confirm\(`Delete “\$\{project\.name\}” from your library\?/);
  assert.match(source, /className="top-delete-model"/);
  assert.match(styles, /\.top-delete-model\{/);
});

test("the complete licensed RPGIAB pack and a curated CorporateCraft GUI set are available", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const data = await readFile(new URL("../app/rpgiabIconData.ts", import.meta.url), "utf8");
  const icons = [...data.matchAll(/^  \["([^"]+)","([0-9a-f]+)"\],$/gm)];
  assert.equal(icons.length, 400);
  assert.ok(icons.every(([, , encoded]) => encoded.length === 512));
  assert.match(data, /Justin Arnold/);
  assert.match(data, /CC BY 4\.0/);
  assert.match(source, /\.\.\.rpgiabIconItems/);
  assert.match(source, /\.\.\.corporateCraftGuiItems/);
  assert.match(source, /pack:"RPGIAB Complete Icon Pack"/);
  assert.match(source, /group:"Grand Exchange & Plugin GUI",pack:"CorporateCraft"/);
  assert.match(source, /\["ge_home","Grand Exchange Home","main_menu"\]/);
  assert.match(source, /\["buy_offer","Create Buy Offer","arrow_in"\]/);
  assert.match(source, /\["price_chart","Price Chart","progress_bar"\]/);
  assert.match(source, /if\(project\.attribution\)add\("CREDITS\.txt"/);
  assert.match(source, /const attributions=\[\.\.\.new Set/);
});

test("RuneSmith provides complete Minecraft-style families for classic and RS3 ores", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const oreTable = source.slice(source.indexOf("const RUNESMITH_ORES=["), source.indexOf("] as const;", source.indexOf("const RUNESMITH_ORES=[")));
  assert.equal([...oreTable.matchAll(/\{id:"[^"]+",name:"[^"]+",era:"(?:Classic|RS3)"/g)].length, 13);
  for (const ore of ["tin", "silver", "mithril", "adamantite", "runite", "luminite", "orichalcite", "drakolith", "necrite", "phasmatite", "banite", "light_animica", "dark_animica"]) {
    assert.match(oreTable, new RegExp(`id:"${ore}"`));
  }
  assert.match(oreTable, /id:"mithril",name:"Mithril",era:"Classic",colors:\{dark:"#39466f",base:"#6575ae",light:"#a9b4dd"\}/);
  assert.match(oreTable, /id:"runite",name:"Runite",era:"Classic",colors:\{dark:"#245966",base:"#3f93a3",light:"#86d3d8"\}/);
  assert.match(source, /RUNESMITH_ORES\.flatMap\(ore=>\[oreBlockProject\(ore,"ore"\),oreBlockProject\(ore,"deepslate_ore"\),oreItemProject\(ore,"raw"\),oreBlockProject\(ore,"raw_block"\),oreItemProject\(ore,"ingot"\),oreBlockProject\(ore,"metal_block"\),oreItemProject\(ore,"nugget"\)\]\)/);
  assert.match(source, /pack:"RuneSmith Ore Families"/);
  assert.equal([...source.matchAll(/source:"codex",revision:3,kind:/g)].length >= 2, true);
  assert.match(source, /const VANILLA_INGOT_ROWS=\["\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\."/);
  assert.match(source, /if\(form==="ingot"\)return makeVanillaIngotSprite\(colors\)/);
  assert.match(source, /shadow=mix\("#080a10",colors\.dark,\.72\),highlight=mix\(colors\.light,"#ffffff",\.62\)/);
  assert.match(source, /revision:ore\.id==="runite"\?6:3/);
  assert.match(source, /revision:ore\.id==="runite"\?6:form==="ingot"\?5:3/);
  assert.match(source, /material\.match\(\/\^ore:/);
  assert.match(source, /oreCenters=\[\[3,3\],\[11,2\],\[7,7\],\[13,9\],\[3,12\],\[10,14\]\]/);
  assert.match(source, /stonePalette=ore\?\.\[1\]===\"deepslate\"\?\[\"#303136\",\"#393a3f\",\"#46474b\"\]:\[\"#6e6e69\",\"#7c7c78\",\"#898984\"\]/);
  assert.match(source, /base=orePixel\?rgb\(ore!\[2\]\):ore\?rgb\(stoneTone\):rgb\(color\)/);
  assert.match(source, /form==="raw_block"\?"vanilla-recolor:raw_iron_block":"vanilla-recolor:iron_block"/);
  assert.match(source, /return ore\?`\$\{ore\[1\]===\"deepslate\"\?\"deepslate_\":\"\"\}diamond_ore`/);
  assert.match(source, /recoloredVanillaPixel\(part\.material,part\.color,sourcePixels,sourceAt\)/);
  assert.match(source, /recoloredVanillaPixel\(face\.material,face\.color,pixels,at\)/);
  assert.match(source, /\.\.\.runeSmithOreFamilies/);
});

test("Blackwake Pirate Grog is a native frothing tankard item", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /const makePirateGrogSprite=/);
  assert.match(source, /id:"blackwake_pirate_grog"/);
  assert.match(source, /name:"Blackwake Pirate Grog"/);
  assert.match(source, /baseItem:"minecraft:honey_bottle"/);
  assert.match(source, /sprite:makePirateGrogSprite\(\)/);
  assert.match(source, /blackwakePirateGrog,/);
  assert.match(source, /const makeEmptyPirateGrogSprite=/);
  assert.match(source, /id:"empty_blackwake_grog_tankard"/);
  assert.match(source, /name:"Empty Blackwake Grog Tankard"/);
  assert.match(source, /baseItem:"minecraft:glass_bottle"/);
  assert.match(source, /sprite:makeEmptyPirateGrogSprite\(\)/);
  assert.match(source, /blackwakePirateGrog,\s+emptyBlackwakeGrogTankard,/);
});

test("Blackwake Wall Derby is a flat 17 by 7 side-view race game", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  assert.match(source, /DERBY_GROUP="Blackwake Wall Derby"/);
  assert.match(source, /DERBY_INSTALLATION:Vec3=\[17,7,1\]/);
  assert.match(source, /mounting:"wall"/);
  assert.match(source, /model_plane:"XY",normal_axis:"Z",front:"-Z"/);
  assert.match(source, /travel_axis:"\+X",travel_blocks:14/);
  assert.match(source, /flat side-profile body/);
  assert.match(source, /name:"Side-View Run",lengthTicks:12,loop:true/);
  assert.match(source, /blackwake_wall_derby_lane/);
  assert.match(source, /blackwake_wall_derby_lane_end/);
  assert.match(source, /blackwake_wall_derby_marquee/);
  assert.match(source, /blackwake_wall_derby_controls/);
  assert.match(source, /blackwake_wall_derby_start/);
  assert.match(source, /blackwake_wall_derby_finish/);
  for (const horse of ["crimson_corsair", "golden_doubloon", "cursed_kraken", "pale_marauder", "emerald_privateer"]) assert.match(source, new RegExp(`id:"${horse}"`));
  assert.match(source, /BLACKWAKE_WALL_DERBY_INTEGRATION\.md/);
  assert.match(source, /17-block-wide by 7-block-high wall cabinet/);
  assert.match(source, /translate only the body root along \+X for 14 blocks/);
  assert.match(source, /do not animate Z/);
  assert.match(source, /overlapChecked\(project\.name,project\.cubes\)/);
  assert.match(source, /cubes:overlapChecked\(theme\.name,parts\)/);
  assert.match(source, /const bakedHorseParts=/);
  assert.match(source, /Array\.from\(\{length:12\},\(_,tick\)=>bakedHorseParts\(project,tick\)\)/);
  assert.match(source, /runtime:"single_item_display_model_swap"/);
  assert.match(source, /parent_transforms_required:false,bone_rotations_required:false/);
  assert.match(source, /idle_item_model:`\$\{ns\}:\$\{id\}\/idle`/);
  assert.match(source, /frame_item_models:Array\.from\(\{length:12\}/);
  assert.match(source, /models\/item\/\$\{id\}\/\$\{name\}\.json/);
  assert.match(source, /items\/\$\{id\}\/\$\{name\}\.json/);
  assert.match(source, /frame_\$\{String\(index\)\.padStart\(2,"0"\)\}/);
  assert.match(source, /contact-sheets\/\$\{id\}-baked-frames\.png/);
  assert.match(source, /-Z FRONT     \+X RIGHT/);
  assert.match(source, /Use exactly one ItemDisplay for this horse/);
  assert.match(source, /display\.itemModel = frames\[frame\]/);
  assert.match(source, /display\.position = startPosition \+ wallLocalRight \* raceDistance/);
  assert.match(source, /await addBakedHorseFiles\(project,ns,id,add\)/);
  assert.match(source, /Wall derby element outside Java -16\.\.32 range/);
  assert.match(source, /\.\.\.blackwakeWallDerby/);
});

test("character designer uses the standard Minecraft 64 by 64 skin workflow", async () => {
  const source = await readFile(new URL("../app/ModelMaker.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /skin\?: \(string\|null\)\[\]/);
  assert.match(source, /skinModel\?:"classic"\|"slim"/);
  assert.match(source, /const characterCubes=/);
  assert.match(source, /const defaultSkin=/);
  assert.match(source, /Array\(4096\)\.fill\(null\)/);
  assert.match(source, /function CharacterDesigner/);
  assert.match(source, /64 by 64 Minecraft skin editor/);
  assert.match(source, /Classic \/ Steve/);
  assert.match(source, /Slim \/ Alex/);
  assert.match(source, /Import skin PNG/);
  assert.match(source, /Minecraft skins must be exactly 64×64 pixels/);
  assert.match(source, /outer-layer pixels/);
  assert.match(source, /Character3DViewport/);
  const characterViewport = await readFile(new URL("../app/Character3DViewport.tsx", import.meta.url), "utf8");
  assert.match(characterViewport, /Interactive 3D Minecraft character preview/);
  assert.match(characterViewport, /new THREE\.WebGLRenderer/);
  assert.match(characterViewport, /DRAG TO ORBIT · SCROLL TO ZOOM/);
  assert.match(characterViewport, /standardFaces\(model,true\)/);
  assert.match(characterViewport, /\[\[u0,v1\],\[u1,v1\],\[u0,v0\],\[u1,v0\]\]/);
  assert.match(source, /const newCharacter=/);
  assert.match(source, /onClick=\{newCharacter\}>New character/);
  assert.match(source, /async function skinPng/);
  assert.match(source, /async function downloadCharacterSkin/);
  assert.match(source, /async function exportCharacterBundle/);
  assert.match(source, /Download skin PNG/);
  assert.match(source, /Export character ZIP/);
  assert.match(source, /character\.json/);
  assert.match(source, /textures\/entity\/\$\{id\}\.png/);
  assert.match(source, /type:"minecraft_player_skin"/);
  assert.match(source, /standard_uv_layout:true,outer_layer:true/);
  assert.match(source, /const pirateBarkeeperSkin=/);
  assert.match(source, /id:"blackwake_pirate_barkeeper"/);
  assert.match(source, /pirateBarkeeper,/);
  assert.match(styles, /\.character-designer\{/);
  assert.match(styles, /image-rendering:pixelated/);
});
