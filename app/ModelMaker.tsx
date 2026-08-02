"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Vec3 = [number, number, number];
type Cube = { id: string; name: string; from: Vec3; to: Vec3; rotation: Vec3; color: string; material?: string };
type ModelKind = "item" | "block" | "furniture" | "mob";
type PreviewMode = "studio" | "gui" | "firstperson" | "thirdperson" | "ground";
type Project = { id: string; name: string; description: string; cubes: Cube[]; source: "codex" | "local"; revision: number; kind?: ModelKind; namespace?: string; baseItem?: string; baseEntity?: string; sprite?: (string|null)[] };

const COLORS = ["#78c84f", "#293239", "#2bc8d3", "#949da1", "#d5a642", "#bd5a4d", "#725392"];
const cube = (id: string, name: string, from: Vec3, to: Vec3, color: string, material = "painted metal"): Cube => ({ id, name, from, to, rotation: [0,0,0], color, material });
const makeSwordSprite=(colors:{blade:string;edge:string;grip:string;guard:string;glow:string})=>{const pixels:(string|null)[]=Array(256).fill(null),set=(x:number,y:number,color:string)=>{if(x>=0&&x<16&&y>=0&&y<16)pixels[y*16+x]=color};set(0,15,colors.guard);set(1,14,colors.guard);set(2,14,colors.grip);set(2,13,colors.grip);set(3,13,colors.grip);set(3,12,colors.grip);[[3,10],[4,10],[4,11],[5,11],[5,12],[6,12]].forEach(([x,y])=>set(x,y,colors.guard));for(let i=0;i<8;i++){const x=5+i,y=10-i;set(x,y,colors.edge);set(x+1,y,colors.blade);set(x+1,y-1,i%3===0?colors.glow:colors.blade)}set(13,1,colors.edge);set(14,1,colors.edge);set(14,2,colors.blade);set(5,10,colors.glow);return pixels};

const atm: Project = {
  id: "codex_atm_01", name: "Weathered ATM", source: "codex", revision: 2,
  description: "A detailed street ATM with screen, keypad, card reader, receipt and cash slots.",
  kind: "furniture", namespace: "blocksmith", baseItem: "minecraft:paper",
  cubes: [
    cube("atm_body","Main cabinet",[3,0,5],[13,16,12],"#293239"),
    cube("atm_rear","Rear housing",[4,1,11.5],[12,15,13],"#20272c"),
    cube("atm_top","Top cap",[2.7,15.5,4.7],[13.3,16.3,12.3],"#596267"),
    cube("atm_header","Header panel",[4,14,4.3],[12,15.4,5.2],"#3a4449"),
    cube("atm_status","Status light",[7.25,14.35,4.05],[8.75,14.75,4.4],"#78c84f","emissive light"),
    cube("atm_bezel","Screen bezel",[4,9.3,4.25],[12,13.9,5.25],"#11181c"),
    cube("atm_screen","Display",[4.75,10,3.95],[11.25,13.2,4.45],"#159aa6","glowing glass"),
    cube("atm_console","Sloped console",[3.7,5.1,4.15],[12.3,9.4,6.3],"#4d575c"),
    cube("atm_keybed","Keypad bed",[4.4,5.7,3.85],[8.65,8.65,4.5],"#171d21"),
    ...Array.from({length:12},(_,i)=>cube(`key_${i+1}`,`Key ${i+1}`,[4.75+(i%3)*1.15,6.05+Math.floor(i/3)*.62,3.55],[5.55+(i%3)*1.15,6.46+Math.floor(i/3)*.62,3.92],i===11?"#78c84f":i===9?"#bd5a4d":"#b1b7b8","keycap")),
    cube("card_bezel","Card reader",[9.25,7.15,3.72],[11.8,8.4,4.5],"#171d21"),
    cube("card_slot","Card slot",[9.65,7.67,3.45],[11.42,7.96,3.78],"#78c84f","status light"),
    cube("receipt","Receipt slot",[9.45,5.9,3.65],[11.65,6.42,4.2],"#111518"),
    cube("cash_bezel","Cash tray bezel",[4.15,2.4,4.2],[11.85,4.65,5.3],"#141a1e"),
    cube("cash_slot","Cash opening",[5,3.05,3.92],[11,3.85,4.45],"#070a0c"),
    cube("cash_lip","Cash tray lip",[4.75,2.65,3.7],[11.25,3.05,4.35],"#606a6e"),
    cube("kick","Kick plate",[4,.25,4.55],[12,1.75,5.2],"#1c2327"),
    cube("left_trim","Left armor trim",[2.75,.3,4.65],[3.35,15.3,5.35],"#737c7d"),
    cube("right_trim","Right armor trim",[12.65,.3,4.65],[13.25,15.3,5.35],"#737c7d"),
  ],
};

const totem: Project = {
  id:"codex_totem_01", name:"Mossy Totem", source:"codex", revision:1,
  description:"The original small block model, kept as a second library example.",
  kind:"block", namespace:"blocksmith", baseItem:"minecraft:paper",
  cubes:[
    cube("base","Stone base",[3,0,3],[13,4,13],"#7e8b82","stone"),
    cube("body","Totem body",[5,4,5],[11,15,11],"#a36c3f","wood"),
    cube("cap","Moss cap",[3,15,3],[13,18,13],"#79c34a","moss"),
  ],
};

const emberGreatsword:Project={id:"codex_emberglass_greatsword_01",name:"Emberglass Greatsword",source:"codex",revision:2,description:"A vanilla-style volcanic sword sprite with a blackened hilt and molten glass blade.",kind:"item",namespace:"blocksmith",baseItem:"minecraft:netherite_sword",sprite:makeSwordSprite({blade:"#d65732",edge:"#ffd06a",grip:"#593421",guard:"#293239",glow:"#fff08a"}),cubes:[
  cube("pommel","Coal pommel",[6.7,.1,6.7],[9.3,1.6,9.3],"#20272c","black metal"),cube("ember_pommel","Pommel ember",[7.3,-.4,7.3],[8.7,.5,8.7],"#e56534","emissive ember"),cube("grip","Charred grip",[7,1.4,7],[9,5.2,9],"#593421","charred wood"),cube("wrap_low","Lower copper wrap",[6.7,2,6.7],[9.3,2.65,9.3],"#bd5a4d","hammered copper"),cube("wrap_high","Upper copper wrap",[6.7,3.7,6.7],[9.3,4.35,9.3],"#bd5a4d","hammered copper"),cube("guard_core","Guard core",[6.1,4.8,6.2],[9.9,6.2,9.8],"#293239","black metal"),cube("guard_left","Left flame guard",[3.5,4.35,6.6],[6.3,5.75,9.4],"#7a3429","scorched metal"),cube("guard_left_tip","Left guard tip",[2.6,3.9,7.05],[4.1,5,8.95],"#d65732","hot metal"),cube("guard_right","Right flame guard",[9.7,4.35,6.6],[12.5,5.75,9.4],"#7a3429","scorched metal"),cube("guard_right_tip","Right guard tip",[11.9,3.9,7.05],[13.4,5,8.95],"#d65732","hot metal"),cube("blade_frame","Blade frame",[6.15,5.7,6.55],[9.85,15.1,9.45],"#293239","black metal"),cube("blade_glass","Molten blade core",[6.75,6.1,6.05],[9.25,14.8,6.7],"#ec6a32","emissive emberglass"),cube("edge_left","Left bright edge",[5.75,6.2,6.9],[6.45,14.45,9.1],"#d5a642","hot sharpened metal"),cube("edge_right","Right bright edge",[9.55,6.2,6.9],[10.25,14.45,9.1],"#d5a642","hot sharpened metal"),cube("tip","Forked blade tip",[6.85,14.8,7],[9.15,16.35,9],"#e9a34d","emissive emberglass"),cube("rune","Forge rune",[7.4,8.1,5.7],[8.6,10.2,6.2],"#ffe06b","emissive rune") ]};

const moonsteelSword:Project={id:"codex_moonsteel_longsword_01",name:"Moonsteel Longsword",source:"codex",revision:2,description:"A vanilla-style knightly sword sprite forged from pale moonsteel with a blue starstone inset.",kind:"item",namespace:"blocksmith",baseItem:"minecraft:diamond_sword",sprite:makeSwordSprite({blade:"#a9c8d4",edge:"#e8f4f2",grip:"#26354b",guard:"#6d8996",glow:"#2bc8d3"}),cubes:[
  cube("pommel","Moonstone pommel",[7,.1,7],[9,1.7,9],"#a9c8d4","polished moonsteel"),cube("pommel_gem","Starstone",[7.45,-.35,7.45],[8.55,.55,8.55],"#2bc8d3","emissive starstone"),cube("grip","Midnight leather grip",[7.1,1.4,7.1],[8.9,5.1,8.9],"#26354b","blue leather"),cube("grip_ring_1","Lower silver ring",[6.85,2,6.85],[9.15,2.5,9.15],"#949da1","moonsteel"),cube("grip_ring_2","Upper silver ring",[6.85,4,6.85],[9.15,4.5,9.15],"#949da1","moonsteel"),cube("guard","Straight crossguard",[3.3,4.75,6.75],[12.7,5.8,9.25],"#8eabb5","moonsteel"),cube("guard_left_cap","Left guard cap",[2.65,4.45,7.05],[3.75,6.15,8.95],"#c6d7da","polished moonsteel"),cube("guard_right_cap","Right guard cap",[12.25,4.45,7.05],[13.35,6.15,8.95],"#c6d7da","polished moonsteel"),cube("rain_guard","Rain guard",[6.45,5.5,6.5],[9.55,6.8,9.5],"#46677b","engraved moonsteel"),cube("blade","Moonsteel blade",[6.65,6.2,6.75],[9.35,15.1,9.25],"#a9c8d4","polished moonsteel"),cube("fuller","Blue central fuller",[7.45,6.5,6.35],[8.55,14.6,6.85],"#477f9d","blue steel"),cube("left_edge","Left silver edge",[6.2,6.5,7.05],[6.8,14.65,8.95],"#dce9e8","sharpened moonsteel"),cube("right_edge","Right silver edge",[9.2,6.5,7.05],[9.8,14.65,8.95],"#dce9e8","sharpened moonsteel"),cube("point","Longsword point",[7.1,14.75,7.1],[8.9,16.25,8.9],"#dce9e8","sharpened moonsteel") ]};

const verdantSword:Project={id:"codex_verdant_sentinel_01",name:"Verdant Sentinel",source:"codex",revision:2,description:"A vanilla-style guardian sword sprite grown around a jade blade with living vine details.",kind:"item",namespace:"blocksmith",baseItem:"minecraft:diamond_sword",sprite:makeSwordSprite({blade:"#58b96c",edge:"#b6d89a",grip:"#70472d",guard:"#4d913c",glow:"#b8ee59"}),cubes:[
  cube("seed_pommel","Seed pommel",[6.8,0,6.8],[9.2,1.8,9.2],"#78c84f","living moss"),cube("grip","Rootwood grip",[7,1.3,7],[9,5.2,9],"#70472d","root wood"),cube("vine_low","Lower vine wrap",[6.65,2,6.65],[9.35,2.65,9.35],"#4d913c","vine"),cube("vine_high","Upper vine wrap",[6.65,3.8,6.65],[9.35,4.45,9.35],"#4d913c","vine"),cube("guard_knot","Guard knot",[6.1,4.65,6.2],[9.9,6.2,9.8],"#8a6a3a","root wood"),cube("branch_left","Left branch guard",[3.3,4.8,6.7],[6.3,5.8,9.3],"#70472d","root wood"),cube("leaf_left","Left guard leaf",[2.4,5.1,7],[4,6.4,9],"#78c84f","leaf"),cube("branch_right","Right branch guard",[9.7,4.8,6.7],[12.7,5.8,9.3],"#70472d","root wood"),cube("leaf_right","Right guard leaf",[12,5.1,7],[13.6,6.4,9],"#78c84f","leaf"),cube("blade","Jade blade",[6.45,5.8,6.7],[9.55,15.1,9.3],"#58b96c","polished jade"),cube("blade_core","Luminous sap channel",[7.35,6.25,6.25],[8.65,14.5,6.8],"#b8ee59","emissive sap"),cube("left_edge","Left pale edge",[6,6.2,7],[6.65,14.55,9],"#b6d89a","sharpened jade"),cube("right_edge","Right pale edge",[9.35,6.2,7],[10,14.55,9],"#b6d89a","sharpened jade"),cube("tip","Leaf point",[7,14.7,7.05],[9,16.2,8.95],"#91d47a","polished jade"),cube("blade_leaf","Blade leaf charm",[9.55,9.2,6.2],[10.65,11,7.1],"#78c84f","leaf") ]};

const tideglassCutlass:Project={id:"codex_tideglass_cutlass_01",name:"Tideglass Cutlass",source:"codex",revision:2,description:"A vanilla-style sailor's sword sprite made from bright tideglass and weathered brass.",kind:"item",namespace:"blocksmith",baseItem:"minecraft:diamond_sword",sprite:makeSwordSprite({blade:"#39b9c7",edge:"#c4f4ed",grip:"#245b62",guard:"#d5a642",glow:"#e0f2e9"}),cubes:[
  cube("pommel","Brass pommel",[6.8,.2,6.8],[9.2,1.6,9.2],"#d5a642","weathered brass"),cube("grip","Sea leather grip",[7,1.3,7],[9,5.1,9],"#245b62","sea leather"),cube("grip_band_1","Lower brass band",[6.7,2,6.7],[9.3,2.55,9.3],"#d5a642","weathered brass"),cube("grip_band_2","Upper brass band",[6.7,4,6.7],[9.3,4.55,9.3],"#d5a642","weathered brass"),cube("guard","Shell guard",[4.7,4.65,6.35],[10.2,6.05,9.65],"#c3943d","weathered brass"),cube("knuckle_low","Knuckle bow lower",[9.7,3.1,6.6],[11,5.2,9.4],"#c3943d","weathered brass"),cube("knuckle_high","Knuckle bow upper",[10.5,4.7,6.6],[11.7,7.3,9.4],"#c3943d","weathered brass"),cube("blade_base","Tideglass blade base",[6.3,5.7,6.65],[9.7,9.5,9.35],"#2bc8d3","tide glass"),cube("blade_mid","Curved blade middle",[6.7,9.1,6.65],[10.1,12.8,9.35],"#39b9c7","tide glass"),cube("blade_upper","Curved blade upper",[7.2,12.4,6.65],[10.6,14.8,9.35],"#62d4d5","tide glass"),cube("blade_tip","Hooked point",[8,14.35,7],[10.7,15.9,9],"#9ce9e5","tide glass"),cube("edge_low","Lower foam edge",[5.85,6,7],[6.5,9.6,9],"#c4f4ed","sharpened tideglass"),cube("edge_mid","Middle foam edge",[6.25,9.3,7],[6.9,12.9,9],"#c4f4ed","sharpened tideglass"),cube("edge_high","Upper foam edge",[6.75,12.6,7],[7.4,14.9,9],"#c4f4ed","sharpened tideglass"),cube("pearl","Guard pearl",[5.4,5,5.9],[6.6,6.2,6.6],"#e0f2e9","pearl") ]};

const pickaxe: Project = {
  id:"codex_voidforge_pickaxe_01", name:"Voidforge Pickaxe", source:"codex", revision:1,
  description:"An enchanted deep-mining pickaxe with a wrapped dark-oak grip, reinforced metal head and luminous amethyst core.",
  kind:"item", namespace:"blocksmith", baseItem:"minecraft:netherite_pickaxe",
  cubes:[
    cube("pommel","Obsidian pommel",[6.5,0.2,6.5],[9.5,2.1,9.5],"#293239","polished obsidian"),
    cube("pommel_cap","Pommel crystal",[7.15,-0.5,7.15],[8.85,0.5,8.85],"#725392","emissive amethyst"),
    cube("handle_core","Dark oak handle",[7,1.8,7],[9,11.8,9],"#70472d","dark wood"),
    cube("grip_1","Lower grip wrap",[6.7,2.2,6.7],[9.3,3.1,9.3],"#20272c","black leather"),
    cube("grip_2","Middle grip wrap",[6.7,4.1,6.7],[9.3,5,9.3],"#20272c","black leather"),
    cube("grip_3","Upper grip wrap",[6.7,6,6.7],[9.3,6.9,9.3],"#20272c","black leather"),
    cube("grip_4","Top grip wrap",[6.7,7.9,6.7],[9.3,8.8,9.3],"#20272c","black leather"),
    cube("neck","Reinforced neck",[6.4,10.2,6.4],[9.6,12.4,9.6],"#596267","forged metal"),
    cube("head_core","Pickaxe head",[3.2,11.8,6.2],[12.8,14.4,9.8],"#657078","forged metal"),
    cube("head_ridge","Top reinforcement",[4.2,14.2,6.6],[11.8,15.1,9.4],"#949da1","bright metal"),
    cube("left_arm","Left blade shoulder",[1.7,11.2,6.5],[4.2,14,9.5],"#536068","forged metal"),
    cube("left_tip","Left mining point",[0.4,10.2,7],[2.2,12.4,9],"#949da1","bright metal"),
    cube("left_edge","Left cutting edge",[-0.2,9.5,7.35],[1.1,10.9,8.65],"#d2d8d7","sharpened metal"),
    cube("right_arm","Right blade shoulder",[11.8,11.2,6.5],[14.3,14,9.5],"#536068","forged metal"),
    cube("right_tip","Right mining point",[13.8,10.2,7],[15.6,12.4,9],"#949da1","bright metal"),
    cube("right_edge","Right cutting edge",[14.9,9.5,7.35],[16.2,10.9,8.65],"#d2d8d7","sharpened metal"),
    cube("core_socket","Crystal socket",[6.1,12.2,5.75],[9.9,14.2,6.55],"#171d21","obsidian metal"),
    cube("amethyst_core","Amethyst power core",[6.8,12.65,5.35],[9.2,13.85,6.05],"#8a60bd","emissive amethyst"),
    cube("rune_left","Left runic stud",[4.65,12.55,5.7],[5.45,13.35,6.35],"#2bc8d3","emissive rune"),
    cube("rune_right","Right runic stud",[10.55,12.55,5.7],[11.35,13.35,6.35],"#2bc8d3","emissive rune"),
    cube("back_plate","Rear head plate",[5.2,12.1,9.55],[10.8,14.1,10.25],"#293239","dark metal"),
  ],
};

const BUILTINS = [emberGreatsword, moonsteelSword, verdantSword, tideglassCutlass, pickaxe, atm, totem];
const clone = <T,>(value:T):T => JSON.parse(JSON.stringify(value));
const uid = (prefix="cube") => `${prefix}_${Math.random().toString(36).slice(2,9)}`;
const slug = (value:string) => value.toLowerCase().trim().replace(/[^a-z0-9_.-]+/g,"_").replace(/^_+|_+$/g,"")||"model";
const modelKind = (project:Project):ModelKind => project.kind || (project.id.includes("atm")?"furniture":"block");
const namespace = (project:Project) => slug(project.namespace||"blocksmith");
const textBytes = (value:string) => new TextEncoder().encode(value);
const joinBytes = (...arrays:Uint8Array[]) => {const out=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;arrays.forEach(a=>{out.set(a,at);at+=a.length});return out};
const le = (value:number,size:number) => {const out=new Uint8Array(size);for(let i=0;i<size;i++)out[i]=(value>>>(i*8))&255;return out};
const be = (value:number) => new Uint8Array([(value>>>24)&255,(value>>>16)&255,(value>>>8)&255,value&255]);
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const crc32=(data:Uint8Array)=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0};
const pngChunk=(name:string,data:Uint8Array)=>joinBytes(be(data.length),textBytes(name),data,be(crc32(joinBytes(textBytes(name),data))));

async function proceduralPng(part:Cube){
  const width=16,height=16,raw=new Uint8Array(height*(1+width*4)),hex=part.color.replace("#","").padEnd(6,"0"),base=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),seed=[...`${part.id}:${part.material}`].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,7),material=(part.material||"").toLowerCase();
  for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;for(let x=0;x<width;x++){const wave=Math.sin((seed+x*37+y*101)*12.9898)*43758.5453,n=wave-Math.floor(wave);let shade=.88+(n-.5)*.18;if(material.includes("metal")&&n>.88)shade+=.22;if(material.includes("stone")&&n<.22)shade-=.15;if(material.includes("wood")&&x%4===0)shade+=.12;if(material.includes("moss")&&n>.64)shade+=.18;if(material.includes("emissive")||material.includes("light"))shade=1.15+(n>.8?.15:0);const at=y*(width*4+1)+1+x*4;raw[at]=Math.min(255,Math.max(0,Math.round(base[0]*shade)));raw[at+1]=Math.min(255,Math.max(0,Math.round(base[1]*shade)));raw[at+2]=Math.min(255,Math.max(0,Math.round(base[2]*shade)));raw[at+3]=255}}
  const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate")),compressed=new Uint8Array(await new Response(stream).arrayBuffer()),ihdr=joinBytes(be(width),be(height),new Uint8Array([8,6,0,0,0]));
  return joinBytes(new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("IDAT",compressed),pngChunk("IEND",new Uint8Array()));
}

async function spritePng(pixels:(string|null)[]){const width=16,height=16,raw=new Uint8Array(height*(1+width*4));for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;for(let x=0;x<width;x++){const color=pixels[y*16+x],at=y*(width*4+1)+1+x*4;if(color){const hex=color.replace("#","").padEnd(6,"0");raw[at]=parseInt(hex.slice(0,2),16);raw[at+1]=parseInt(hex.slice(2,4),16);raw[at+2]=parseInt(hex.slice(4,6),16);raw[at+3]=255}}}const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate")),compressed=new Uint8Array(await new Response(stream).arrayBuffer()),ihdr=joinBytes(be(width),be(height),new Uint8Array([8,6,0,0,0]));return joinBytes(new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("IDAT",compressed),pngChunk("IEND",new Uint8Array()))}

function makeZip(files:{name:string;data:Uint8Array}[]){let offset=0;const locals:Uint8Array[]=[],centrals:Uint8Array[]=[];for(const file of files){const name=textBytes(file.name),crc=crc32(file.data),local=joinBytes(le(0x04034b50,4),le(20,2),le(0,2),le(0,2),le(0,2),le(0,2),le(crc,4),le(file.data.length,4),le(file.data.length,4),le(name.length,2),le(0,2),name,file.data);locals.push(local);centrals.push(joinBytes(le(0x02014b50,4),le(20,2),le(20,2),le(0,2),le(0,2),le(0,2),le(0,2),le(crc,4),le(file.data.length,4),le(file.data.length,4),le(name.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(offset,4),name));offset+=local.length}const central=joinBytes(...centrals);return joinBytes(...locals,central,le(0x06054b50,4),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(central.length,4),le(offset,4),le(0,2))}

function minecraftJson(project: Project) {
  const ns=namespace(project),id=slug(project.name);
  if(project.sprite)return{credit:"Designed with Codex in Blocksmith",parent:"minecraft:item/handheld",textures:{layer0:`${ns}:item/${id}`}};
  return {
    credit: "Designed with Codex in Blocksmith",
    ...(modelKind(project)==="item"?{parent:"minecraft:item/handheld",gui_light:"front"}:{}),
    texture_size: [16,16],
    textures: Object.fromEntries(project.cubes.map((part,i)=>[`p${i}`,`${ns}:block/${id}/${slug(part.name)}_${i}`])),
    elements: project.cubes.map((part,index)=>({ name:part.name, from:part.from, to:part.to,
      ...(part.rotation.some(Boolean)?{rotation:{origin:part.from.map((v,i)=>(v+part.to[i])/2),axis:"y",angle:part.rotation[1]}}:{}),
      faces:Object.fromEntries(["north","east","south","west","up","down"].map(face=>[face,{texture:`#p${index}`}]))
    }))
  };
}

function download(name:string,data:unknown) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a"); a.href=url; a.download=`${name.replace(/\W+/g,"_").toLowerCase()||"model"}.json`; a.click(); URL.revokeObjectURL(url);
}

function validation(project:Project){const notes:{level:"error"|"warning"|"ready";text:string}[]=[];if(!project.cubes.length&&!project.sprite)notes.push({level:"error",text:"Add geometry or a 16×16 sprite before exporting."});if(!project.sprite&&project.cubes.some(c=>c.from.some((v,i)=>v>=c.to[i])))notes.push({level:"error",text:"Every cube FROM value must be smaller than TO."});if(!project.sprite&&project.cubes.some(c=>[...c.from,...c.to].some(v=>v< -16||v>32)))notes.push({level:"warning",text:"Geometry outside -16 to 32 may render poorly in Java."});if(!project.sprite&&project.cubes.some(c=>c.rotation.filter(Boolean).length>1))notes.push({level:"warning",text:"Java elements rotate on one axis; export currently uses Y rotation."});if(!notes.some(n=>n.level==="error"))notes.push({level:"ready",text:project.sprite?"Vanilla-style 16×16 handheld item ready for Minecraft 26.2.":`Ready for Paper 26.2 as ${modelKind(project)} content.`});return notes}

async function exportPaperBundle(project:Project){
  const ns=namespace(project),id=slug(project.name),kind=modelKind(project),model=minecraftJson(project),files:{name:string;data:Uint8Array}[]=[];const add=(name:string,data:string|Uint8Array)=>files.push({name,data:typeof data==="string"?textBytes(data):data});
  add("resource-pack/pack.mcmeta",JSON.stringify({pack:{description:`Blocksmith: ${project.name}`,pack_format:88}},null,2));
  add(`resource-pack/assets/${ns}/models/${kind==="block"?"block":"item"}/${id}.json`,JSON.stringify(model,null,2));
  if(kind!=="block")add(`resource-pack/assets/${ns}/items/${id}.json`,JSON.stringify({model:{type:"minecraft:model",model:`${ns}:item/${id}`}},null,2));
  if(kind==="block")add(`resource-pack/assets/${ns}/items/${id}.json`,JSON.stringify({model:{type:"minecraft:model",model:`${ns}:block/${id}`}},null,2));
  if(project.sprite)add(`resource-pack/assets/${ns}/textures/item/${id}.png`,await spritePng(project.sprite));else for(let i=0;i<project.cubes.length;i++)add(`resource-pack/assets/${ns}/textures/block/${id}/${slug(project.cubes[i].name)}_${i}.png`,await proceduralPng(project.cubes[i]));
  const content={schema:1,target:{minecraft:"26.2",paper:"26.2",resource_pack:88},id:`${ns}:${id}`,name:project.name,description:project.description,kind,display:{carrier_item:project.baseItem||"minecraft:paper",model_component:`${ns}:${id}`,transform_profile:kind==="item"?"minecraft:item/handheld":"blocksmith:display",scale:1,brightness:"block"},placement:kind==="item"?null:{mode:kind==="block"?"solid":"display",hitbox:kind==="block"?[1,1,1]:[1,project.cubes.reduce((m,c)=>Math.max(m,c.to[1]),16)/16,1]},rig:kind==="mob"?{anchor:project.baseEntity||"minecraft:zombie",hide_anchor:true,bones:project.cubes.map(c=>({id:c.id,name:c.name,pivot:c.from.map((v,i)=>(v+c.to[i])/2),parent:null})),animations:{idle:{loop:true,length_ticks:40,keyframes:[]},walk:{loop:true,length_ticks:20,keyframes:[]},attack:{loop:false,length_ticks:10,keyframes:[]}}}:null};
  add(`paper/content/${ns}/${id}.json`,JSON.stringify(content,null,2));
  add("paper/plugin.yml",`name: BlocksmithContent\nversion: 1.0.0\nmain: dev.blocksmith.paper.BlocksmithPlugin\napi-version: '26.2'\ndescription: Runtime target for Blocksmith content bundles\n`);
  add("README.txt",`BLOCKSMITH PAPER 26.2 BUNDLE\n\nModel: ${project.name}\nType: ${kind}\nID: ${ns}:${id}\n\nresource-pack/ contains the client assets.\npaper/content/ contains placement and display-rig metadata for the Blocksmith Paper runtime.\nFor mobs, the vanilla anchor provides AI and hitboxes while display entities provide the visuals.\n`);
  const blob=new Blob([makeZip(files) as BlobPart],{type:"application/zip"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${id}-paper-26.2.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function exportMinecraftTestPack(project:Project){
  const ns=namespace(project),id=slug(project.name),kind=modelKind(project),model=minecraftJson(project),files:{name:string;data:Uint8Array}[]=[];const add=(name:string,data:string|Uint8Array)=>files.push({name,data:typeof data==="string"?textBytes(data):data});
  add("pack.mcmeta",JSON.stringify({pack:{description:`Blocksmith in-game test: ${project.name}`,pack_format:88}},null,2));
  add(`assets/${ns}/models/${kind==="block"?"block":"item"}/${id}.json`,JSON.stringify(model,null,2));
  add(`assets/${ns}/items/${id}.json`,JSON.stringify({model:{type:"minecraft:model",model:`${ns}:${kind==="block"?"block":"item"}/${id}`}},null,2));
  if(project.sprite)add(`assets/${ns}/textures/item/${id}.png`,await spritePng(project.sprite));else for(let i=0;i<project.cubes.length;i++)add(`assets/${ns}/textures/block/${id}/${slug(project.cubes[i].name)}_${i}.png`,await proceduralPng(project.cubes[i]));
  add("HOW_TO_TEST.txt",`BLOCKSMITH MINECRAFT 26.2 TEST PACK\n\n1. Put this ZIP in your Minecraft resourcepacks folder.\n2. Enable it in Resource Packs.\n3. Enter a world with commands enabled.\n4. Run:\n\n${giveCommand(project)}\n\nMinecraft is the authoritative preview for held, dropped, framed and inventory rendering.\n`);
  const blob=new Blob([makeZip(files) as BlobPart],{type:"application/zip"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${id}-minecraft-26.2-test-pack.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

const giveCommand=(project:Project)=>`/give @s ${project.baseItem||"minecraft:paper"}[minecraft:item_model="${namespace(project)}:${slug(project.name)}"]`;

const PREVIEW_PRESETS:Record<PreviewMode,{yaw:number;pitch:number;zoom:number}>={
  studio:{yaw:2.42,pitch:.58,zoom:18},gui:{yaw:0,pitch:0,zoom:15},firstperson:{yaw:0,pitch:0,zoom:18},thirdperson:{yaw:0,pitch:0,zoom:14},ground:{yaw:0,pitch:0,zoom:14},
};
const DISPLAY_TRANSFORMS:Record<Exclude<PreviewMode,"studio">,{rotation:Vec3;translation:Vec3;scale:Vec3}>={
  gui:{rotation:[30,225,0],translation:[0,0,0],scale:[.625,.625,.625]},
  firstperson:{rotation:[0,-90,25],translation:[1.13,3.2,1.13],scale:[.68,.68,.68]},
  thirdperson:{rotation:[0,-90,55],translation:[0,4,.5],scale:[.85,.85,.85]},
  ground:{rotation:[0,0,0],translation:[0,3,0],scale:[.25,.25,.25]},
};

function Viewport({project,selected,onSelect,previewMode}:{project:Project;selected:string|null;onSelect:(id:string)=>void;previewMode:PreviewMode}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [view,setView]=useState(PREVIEW_PRESETS[previewMode]);
  const [interacting,setInteracting]=useState(false);
  const drag=useRef<{x:number;y:number;yaw:number;pitch:number;moved:boolean}|null>(null);
  const projected=useRef<{id:string;poly:[number,number][];depth:number}[]>([]);
  const frameRequest=useRef<number|null>(null);
  const pendingView=useRef<{yaw:number;pitch:number}|null>(null);

  useEffect(()=>()=>{if(frameRequest.current!==null)cancelAnimationFrame(frameRequest.current)},[]);
  useEffect(()=>setView(PREVIEW_PRESETS[previewMode]),[previewMode]);

  useEffect(()=>{
    const el=canvas.current;if(!el)return;const ctx=el.getContext("2d");if(!ctx)return;
    const rect=el.getBoundingClientRect(),quality=interacting?.55:1,width=Math.max(1,Math.floor(rect.width*quality)),height=Math.max(1,Math.floor(rect.height*quality));el.width=width;el.height=height;ctx.clearRect(0,0,width,height);
    let clip={minX:0,maxX:width-1,minY:0,maxY:height-1};const q=quality;
    if(previewMode==="gui"){ctx.fillStyle="#171b18";ctx.fillRect(0,0,width,height);const size=Math.min(230*q,width*.7,height*.7),x=width/2-size/2,y=height*.52-size/2;ctx.fillStyle="#8d8d8d";ctx.fillRect(x,y,size,size);ctx.fillStyle="#373737";ctx.fillRect(x+5*q,y+5*q,size-10*q,size-10*q);ctx.fillStyle="#c8c8c8";ctx.fillRect(x+9*q,y+9*q,size-14*q,size-14*q);ctx.fillStyle="#454545";ctx.fillRect(x+9*q,y+9*q,size-18*q,size-18*q);clip={minX:Math.ceil(x+9*q),maxX:Math.floor(x+size-9*q),minY:Math.ceil(y+9*q),maxY:Math.floor(y+size-9*q)}}
    else if(previewMode==="firstperson"){const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,"#608ec0");sky.addColorStop(.62,"#9bc7d9");sky.addColorStop(.63,"#5b7b3d");sky.addColorStop(1,"#293a25");ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);ctx.fillStyle="#c28b68";ctx.beginPath();ctx.moveTo(width*.77,height);ctx.lineTo(width*.62,height*.7);ctx.lineTo(width*.72,height*.57);ctx.lineTo(width*.96,height);ctx.fill();for(let i=0;i<9;i++){ctx.fillStyle=i===4?"#e6e6e6cc":"#777a";ctx.fillRect(width/2-116*q+i*27*q,height-31*q,24*q,24*q)}}
    else if(previewMode==="thirdperson"){ctx.fillStyle="#233044";ctx.fillRect(0,0,width,height);ctx.fillStyle="#202b1c";ctx.fillRect(0,height*.72,width,height*.28);ctx.fillStyle="#c28b68";ctx.fillRect(width*.35,height*.24,46*q,46*q);ctx.fillStyle="#3b6780";ctx.fillRect(width*.34,height*.24+46*q,50*q,95*q);ctx.fillStyle="#c28b68";ctx.save();ctx.translate(width*.39,height*.42);ctx.rotate(-.45);ctx.fillRect(30*q,0,24*q,92*q);ctx.restore()}
    else if(previewMode==="ground"){const floor=ctx.createLinearGradient(0,0,0,height);floor.addColorStop(0,"#26302a");floor.addColorStop(.52,"#26302a");floor.addColorStop(.53,"#4f6340");floor.addColorStop(1,"#263620");ctx.fillStyle=floor;ctx.fillRect(0,0,width,height);ctx.fillStyle="#0b0e0b77";ctx.beginPath();ctx.ellipse(width/2,height*.68,55*q,13*q,0,0,Math.PI*2);ctx.fill()}
    const center={x:previewMode==="firstperson"?width*.67:previewMode==="thirdperson"?width*.58:width/2,y:previewMode==="ground"?height*.63:previewMode==="gui"?height*.52:height*.58};
    const transformPoint=(point:Vec3):Vec3=>{if(previewMode==="studio")return point;const t=DISPLAY_TRANSFORMS[previewMode],rad=t.rotation.map(v=>v*Math.PI/180) as Vec3;let x=(point[0]-8)*t.scale[0],y=(point[1]-8)*t.scale[1],z=(point[2]-8)*t.scale[2];let c=Math.cos(rad[0]),s=Math.sin(rad[0]);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(rad[1]);s=Math.sin(rad[1]);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(rad[2]);s=Math.sin(rad[2]);[x,y]=[x*c-y*s,x*s+y*c];return[x+8+t.translation[0],y+8+t.translation[1],z+8+t.translation[2]]};
    const renderZoom=view.zoom*quality,projectPoint=(source:Vec3):[number,number,number]=>{const p=transformPoint(source),x=p[0]-8,y=p[1]-8,z=p[2]-8,cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch),rx=x*cy-z*sy,rz=x*sy+z*cy;return[center.x+rx*renderZoom,center.y-(y*cp-rz*sp)*renderZoom,y*sp+rz*cp]};
    if(previewMode==="studio"&&!project.sprite){ctx.lineWidth=1;for(let i=0;i<=16;i++){const a=projectPoint([i,0,0]),b=projectPoint([i,0,16]),c=projectPoint([0,0,i]),d=projectPoint([16,0,i]);ctx.strokeStyle=i===0||i===16?"#687169":"#343a36";ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.stroke()}}
    type Face={id:string;points:[number,number,number][];color:string;material:string;light:number;uSteps:number;vSteps:number;faceIndex:number;palette?:number[][]};const faces:Face[]=[],polys:{id:string;poly:[number,number][];depth:number}[]=[];
    const renderParts:Cube[]=project.sprite?project.sprite.flatMap((color,i)=>color?[{id:`sprite_${i}`,name:"Generated sprite pixel",from:[i%16,15-Math.floor(i/16),7.5] as Vec3,to:[i%16+1,16-Math.floor(i/16),8.5] as Vec3,rotation:[0,0,0] as Vec3,color,material:"sprite pixel"}]:[]):project.cubes;
    renderParts.forEach(part=>{const[x1,y1,z1]=part.from,[x2,y2,z2]=part.to,dx=Math.abs(x2-x1),dy=Math.abs(y2-y1),dz=Math.abs(z2-z1);const v=[[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1],[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]].map(p=>projectPoint(p as Vec3));const specs=[{i:[0,1,2,3],l:.8,u:dx,w:dy},{i:[5,4,7,6],l:.68,u:dx,w:dy},{i:[4,0,3,7],l:.72,u:dz,w:dy},{i:[1,5,6,2],l:.9,u:dz,w:dy},{i:[3,2,6,7],l:1.08,u:dx,w:dz},{i:[4,5,1,0],l:.55,u:dx,w:dz}];specs.forEach((spec,faceIndex)=>faces.push({id:part.id,points:spec.i.map(n=>v[n]),color:part.color,material:part.material||"custom",light:spec.l,uSteps:Math.max(1,Math.min(12,Math.ceil(spec.u))),vSteps:Math.max(1,Math.min(12,Math.ceil(spec.w))),faceIndex}));if(!project.sprite){const xs=v.map(p=>p[0]),ys=v.map(p=>p[1]);polys.push({id:part.id,poly:[[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)],[Math.min(...xs),Math.max(...ys)]],depth:v.reduce((s,p)=>s+p[2],0)/8})}});
    const baseRgb=(hex:string)=>[0,2,4].map(i=>parseInt(hex.replace("#","").slice(i,i+2),16));
    const seedFor=(value:string)=>[...value].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
    const pixelColor=(face:Face,x:number,y:number)=>{const base=baseRgb(face.color),seed=seedFor(`${face.id}:${face.material}:${face.faceIndex}`),raw=Math.sin((seed+x*37+y*101)*12.9898)*43758.5453,n=raw-Math.floor(raw),m=face.material.toLowerCase();let variance=m.includes("sprite")?0:(n-.5)*.16+(face.id===selected?.1:0);if(m.includes("metal")){variance+=(x%7===0?.06:0)+(n>.9?.16:0)}else if(m.includes("stone")){variance+=(n>.72?.12:n<.2?-.12:0)}else if(m.includes("wood")){variance+=(x%3===0?.12:-.035)}else if(m.includes("moss")){variance+=(n>.62?.2:-.04)}else if(m.includes("glass")){variance+=(y%3===0?.17:0);base[2]=Math.min(255,base[2]+24)}else if(m.includes("light")||m.includes("emissive")){variance=.32+(n>.75?.16:0)}else if(m.includes("keycap")){variance=(x===0||y===0?.2:-.04)}const scale=Math.max(.25,face.light+variance);return base.map(c=>Math.max(0,Math.min(255,Math.round(c*scale))))};
    faces.forEach(face=>{face.palette=Array.from({length:face.uSteps*face.vSteps},(_,i)=>pixelColor(face,i%face.uSteps,Math.floor(i/face.uSteps)))});
    const frame=ctx.getImageData(0,0,width,height),depth=new Float32Array(width*height);depth.fill(Number.NEGATIVE_INFINITY);const edge=(a:[number,number,number],b:[number,number,number],x:number,y:number)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
    const raster=(face:Face,ia:number,ib:number,ic:number,uv:[[number,number],[number,number],[number,number]])=>{const a=face.points[ia],b=face.points[ib],c=face.points[ic],area=edge(a,b,c[0],c[1]);if(area<=.0001)return;const minX=Math.max(clip.minX,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(clip.maxX,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(clip.minY,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(clip.maxY,Math.ceil(Math.max(a[1],b[1],c[1])));for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){const sx=px+.5,sy=py+.5,w0=edge(b,c,sx,sy)/area,w1=edge(c,a,sx,sy)/area,w2=1-w0-w1;if(w0<0||w1<0||w2<0)continue;const z=w0*a[2]+w1*b[2]+w2*c[2],index=py*width+px;if(z<depth[index])continue;depth[index]=z;const u=w0*uv[0][0]+w1*uv[1][0]+w2*uv[2][0],v=w0*uv[0][1]+w1*uv[1][1]+w2*uv[2][1],tx=Math.min(face.uSteps-1,Math.max(0,Math.floor(u*face.uSteps))),ty=Math.min(face.vSteps-1,Math.max(0,Math.floor(v*face.vSteps))),rgb=face.palette![ty*face.uSteps+tx],offset=index*4;frame.data[offset]=rgb[0];frame.data[offset+1]=rgb[1];frame.data[offset+2]=rgb[2];frame.data[offset+3]=255}};
    faces.forEach(face=>{const[a,b,c,d]=face.points,area=edge(a,b,c[0],c[1])+edge(a,c,d[0],d[1]);if(area<=.0001)return;raster(face,0,1,2,[[0,0],[1,0],[1,1]]);raster(face,0,2,3,[[0,0],[1,1],[0,1]])});ctx.putImageData(frame,0,0);projected.current=polys.sort((a,b)=>b.depth-a.depth);
  },[project,selected,view,interacting,previewMode]);

  const down=(e:ReactPointerEvent<HTMLCanvasElement>)=>{if(previewMode!=="studio")return;drag.current={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,moved:false};setInteracting(true);e.currentTarget.setPointerCapture(e.pointerId)};
  const move=(e:ReactPointerEvent<HTMLCanvasElement>)=>{const active=drag.current;if(!active)return;const dx=e.clientX-active.x,dy=e.clientY-active.y;if(Math.abs(dx)+Math.abs(dy)>3)active.moved=true;pendingView.current={yaw:active.yaw+dx*.008,pitch:Math.max(-1.1,Math.min(1.1,active.pitch+dy*.006))};if(frameRequest.current===null)frameRequest.current=requestAnimationFrame(()=>{const next=pendingView.current;if(next)setView(v=>({...v,...next}));frameRequest.current=null})};
  const up=(e:ReactPointerEvent<HTMLCanvasElement>)=>{const active=drag.current;if(active&&!active.moved){const r=e.currentTarget.getBoundingClientRect(),scaleX=e.currentTarget.width/r.width,scaleY=e.currentTarget.height/r.height,x=(e.clientX-r.left)*scaleX,y=(e.clientY-r.top)*scaleY;const inside=(poly:[number,number][])=>poly.reduce((hit,p,i)=>{const q=poly[(i+poly.length-1)%poly.length];return((p[1]>y)!==(q[1]>y))&&(x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])?!hit:hit},false);const hit=projected.current.find(p=>inside(p.poly));if(hit)onSelect(hit.id)}drag.current=null;setInteracting(false)};
  return <canvas ref={canvas} className={`viewport ${previewMode==="studio"?"interactive":"fixed"}`} aria-label={previewMode==="studio"?"Interactive 3D model viewport":`Fixed Minecraft ${previewMode} transform preview`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setInteracting(false)}} onWheel={e=>{if(previewMode==="studio")setView(v=>({...v,zoom:Math.max(8,Math.min(34,v.zoom-e.deltaY*.015))}))}}/>;
}

export default function ModelMaker(){
  const [library,setLibrary]=useState<Project[]>(BUILTINS);
  const [project,setProject]=useState<Project>(clone(atm));
  const [selected,setSelected]=useState<string|null>(atm.cubes[6].id);
  const [previewMode,setPreviewMode]=useState<PreviewMode>("studio");
  const [copied,setCopied]=useState(false);
  const [history,setHistory]=useState<Project[]>([]);const [future,setFuture]=useState<Project[]>([]);const [hydrated,setHydrated]=useState(false);
  const modelInput=useRef<HTMLInputElement>(null);
  const selectedCube=project.cubes.find(c=>c.id===selected)||null;
  const jsonPreview=useMemo(()=>JSON.stringify(minecraftJson(project),null,2),[project]);
  const checks=useMemo(()=>validation(project),[project]);
  const exportBlocked=checks.some(check=>check.level==="error");
  const copyTestCommand=async()=>{await navigator.clipboard.writeText(giveCommand(project));setCopied(true);setTimeout(()=>setCopied(false),1600)};

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("blocksmith-library-v2")||"[]") as Project[];const merged=[...saved];BUILTINS.forEach(b=>{const i=merged.findIndex(p=>p.id===b.id);if(i<0)merged.push(clone(b));else if((merged[i].revision||0)<b.revision)merged[i]=clone(b)});const builtInIds=new Set(BUILTINS.map(b=>b.id)),ordered=[...BUILTINS.map(b=>clone(merged.find(p=>p.id===b.id)||b)),...merged.filter(p=>!builtInIds.has(p.id))];if(ordered.length){setLibrary(ordered);setProject(clone(ordered[0]));setSelected(ordered[0].sprite?null:ordered[0].cubes[0]?.id||null)}}catch{}setHydrated(true)},[]);
  useEffect(()=>{if(hydrated)localStorage.setItem("blocksmith-library-v2",JSON.stringify(library))},[library,hydrated]);
  const commit=(next:Project)=>{setHistory(h=>[...h.slice(-39),clone(project)]);setFuture([]);setProject(next)};
  const updateCube=(patch:Partial<Cube>)=>selectedCube&&commit({...project,cubes:project.cubes.map(c=>c.id===selectedCube.id?{...c,...patch}:c)});
  const save=()=>setLibrary(items=>{const saved={...clone(project),source:"local" as const};const i=items.findIndex(p=>p.id===saved.id);return i<0?[saved,...items]:items.map((p,n)=>n===i?saved:p)});
  const open=(model:Project)=>{setProject(clone(model));setSelected(model.sprite?null:model.cubes[0]?.id||null);setHistory([]);setFuture([])};
  const newModel=()=>{const blank:Project={id:uid("model"),name:"Untitled Model",description:"A new Paper model.",cubes:[],source:"local",revision:1,kind:"item",namespace:"blocksmith",baseItem:"minecraft:paper",baseEntity:"minecraft:zombie"};setLibrary(items=>[blank,...items]);open(blank)};
  const duplicate=()=>{const copy={...clone(project),id:uid("model"),name:`${project.name} Copy`,source:"local" as const};setLibrary(items=>[copy,...items]);open(copy)};
  const deleteModel=()=>{if(project.source==="codex")return;const remaining=library.filter(p=>p.id!==project.id);setLibrary(remaining);open(remaining[0]||clone(atm))};
  const addCube=()=>{const next=cube(uid(),"New cube",[5,5,5],[11,11,11],COLORS[project.cubes.length%COLORS.length],"custom");commit({...project,cubes:[...project.cubes,next]});setSelected(next.id)};
  const undo=()=>{const previous=history.at(-1);if(!previous)return;setFuture(f=>[clone(project),...f]);setProject(previous);setHistory(h=>h.slice(0,-1))};
  const redo=()=>{const next=future[0];if(!next)return;setHistory(h=>[...h,clone(project)]);setProject(next);setFuture(f=>f.slice(1))};
  const importModel=(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;file.text().then(raw=>{try{const data=JSON.parse(raw),parts:Cube[]=(data.elements||[]).map((el:{name?:string;from:Vec3;to:Vec3},i:number)=>cube(uid(),el.name||`Cube ${i+1}`,el.from,el.to,COLORS[i%COLORS.length]));const imported:Project={id:uid("model"),name:file.name.replace(/\.json$/i,""),description:"Imported Minecraft model",cubes:parts,source:"local",revision:1};setLibrary(items=>[imported,...items]);open(imported)}catch{alert("That file is not valid Minecraft model JSON.")}});e.target.value=""};

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-cube">B</span><div><strong>BLOCKSMITH</strong><small>CODEX MODEL WORKBENCH</small></div></div>
      <div className="project-title"><span className="status-dot"/><input aria-label="Project name" value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/><span className="saved">{project.source==="codex"?"Published by Codex":"Local draft"}</span></div>
      <div className="top-actions"><button className="tool-button" onClick={undo} disabled={!history.length} title="Undo">↶</button><button className="tool-button" onClick={redo} disabled={!future.length} title="Redo">↷</button><button className="secondary" onClick={save}>Save</button><button className="secondary" onClick={newModel}>New Model</button><button className="primary" disabled={exportBlocked} onClick={()=>exportPaperBundle(project)}>Export Paper Pack</button></div>
    </header>
    <section className="workspace">
      <aside className="left-panel panel"><div className="panel-heading"><div><span className="eyebrow">OUTLINER</span><h2>{project.sprite?"16 × 16 vanilla sprite":`${project.cubes.length} model parts`}</h2></div>{!project.sprite&&<button className="mini-add" onClick={addCube}>+</button>}</div><div className="tree-label">⌄ ◈ {project.name}</div>{project.sprite?<div className="sprite-info"><b>FLAT HANDHELD ITEM</b><p>Minecraft extrudes the transparent sprite and applies its native tool transforms.</p><div className="sprite-palette">{[...new Set(project.sprite.filter(Boolean))].map(color=><i key={color!} style={{background:color!}}/>)}</div></div>:<><div className="cube-list">{project.cubes.map(c=><button key={c.id} className={`cube-row ${selected===c.id?"active":""}`} onClick={()=>setSelected(c.id)}><span className="cube-glyph">◆</span><span>{c.name}</span><i style={{background:c.color}}/></button>)}</div><button className="add-part" onClick={addCube}>＋ Add cube</button></>}<div className="tips"><strong>Codex workflow</strong><p>Describe a model in this Codex chat.</p><p>Codex adds it here, then publishes it.</p></div></aside>
      <section className={`stage preview-${previewMode}`}><div className="stage-tools"><span className="badge">{previewMode==="studio"?"MODEL WORKSPACE":"LOCKED INVENTORY CHECK"}</span><span className="badge"><i/> TEXTURED</span></div><div className="preview-tabs" role="group" aria-label="Model preview"><button className={previewMode==="studio"?"active":""} onClick={()=>setPreviewMode("studio")}>Model space</button><button className={previewMode==="gui"?"active":""} onClick={()=>setPreviewMode("gui")}>Inventory check</button></div><div className="minecraft-test"><span>AUTHORITATIVE TEST</span><code>{giveCommand(project)}</code><div><button disabled={exportBlocked} onClick={()=>exportMinecraftTestPack(project)}>Download 26.2 pack</button><button onClick={copyTestCommand}>{copied?"Copied!":"Copy command"}</button></div></div><Viewport project={project} selected={selected} onSelect={setSelected} previewMode={previewMode}/><div className="axis"><span className="x">X</span><span className="y">Y</span><span className="z">Z</span></div><div className="stage-note">{previewMode==="studio"?"Geometry inspection · Drag to orbit · Scroll to zoom":"Locked orthographic check · Verify held views inside Minecraft"}</div></section>
      <aside className="right-panel panel"><div className="panel-heading"><div><span className="eyebrow">PAPER 26.2 TARGET</span><h2>{selectedCube?.name||"Model settings"}</h2></div>{selectedCube&&<button className="delete" onClick={()=>{commit({...project,cubes:project.cubes.filter(c=>c.id!==selectedCube.id)});setSelected(null)}}>×</button>}</div><section className="target-card"><label className="field-label">CONTENT TYPE<select value={modelKind(project)} onChange={e=>setProject({...project,kind:e.target.value as ModelKind})}><option value="item">Custom item</option><option value="block">Placeable block</option><option value="furniture">Furniture / display</option><option value="mob">Animated mob</option></select></label><label className="field-label">NAMESPACE<input value={project.namespace||"blocksmith"} onChange={e=>setProject({...project,namespace:slug(e.target.value)})}/></label>{modelKind(project)==="mob"&&<label className="field-label">AI + HITBOX ANCHOR<input value={project.baseEntity||"minecraft:zombie"} onChange={e=>setProject({...project,baseEntity:e.target.value})}/></label>}<div className={`target-summary ${modelKind(project)}`}><b>{modelKind(project)==="mob"?"DISPLAY RIG":modelKind(project)==="item"?"HANDHELD ITEM":modelKind(project)==="block"?"SOLID PLACEMENT":"DISPLAY MODEL"}</b><span>{modelKind(project)==="mob"?"Idle, walk and attack tracks included":modelKind(project)==="item"?"Inherits Minecraft’s standard pickaxe transforms":modelKind(project)==="block"?"Model plus solid placement metadata":"Vanilla-client resource-pack content"}</span></div></section>{selectedCube?<div className="inspector"><label className="field-label">NAME<input value={selectedCube.name} onChange={e=>updateCube({name:e.target.value})}/></label><VectorEditor label="FROM" value={selectedCube.from} onChange={from=>updateCube({from})}/><VectorEditor label="TO" value={selectedCube.to} onChange={to=>updateCube({to})}/><VectorEditor label="ROTATION" value={selectedCube.rotation} onChange={rotation=>updateCube({rotation})}/><label className="field-label">PROCEDURAL MATERIAL<input value={selectedCube.material||""} onChange={e=>updateCube({material:e.target.value})}/></label><div className="field-label">BASE COLOR<div className="swatches">{COLORS.map(color=><button aria-label={`Set color ${color}`} key={color} className={selectedCube.color===color?"chosen":""} style={{background:color}} onClick={()=>updateCube({color})}/>)}</div></div></div>:<p className="empty">Select a part to edit its geometry and material.</p>}<section className="validation-card"><span className="eyebrow">EXPORT CHECK</span>{checks.map((check,i)=><p key={i} className={check.level}><i/>{check.text}</p>)}</section><section className="texture-card procedural-card"><span className="eyebrow">MINECRAFT MATERIAL SYSTEM</span><div className="material-preview"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><strong>Procedural 16×16 textures</strong><p>Export creates real PNG textures for every part, locked to the model’s faces.</p></section><details className="json-box"><summary>Minecraft JSON preview</summary><pre>{jsonPreview}</pre></details></aside>
    </section>
    <section className="library-dock"><div className="library-title"><div><span className="eyebrow">MODEL LIBRARY</span><h2>Codex creations & local drafts</h2></div><div className="library-actions"><button onClick={duplicate}>Duplicate</button><button onClick={()=>modelInput.current?.click()}>Import JSON</button><button onClick={()=>download(project.name,minecraftJson(project))}>Model JSON</button>{project.source==="local"&&<button className="danger" onClick={deleteModel}>Delete</button>}<input ref={modelInput} hidden type="file" accept=".json,application/json" onChange={importModel}/></div></div><div className="model-cards"><button className="new-card" onClick={newModel}><b>＋</b><span>Blank model</span></button>{library.map(model=><button key={model.id} className={`model-card ${project.id===model.id?"active":""}`} onClick={()=>open(model)}><span className="card-art procedural-art" style={{backgroundColor:model.cubes[0]?.color||"#333"}}><i>{model.cubes.length}</i></span><span className="card-copy"><strong>{model.name}</strong><small>{modelKind(model).toUpperCase()} · {model.cubes.length} parts</small></span></button>)}</div></section>
  </main>;
}

function VectorEditor({label,value,onChange}:{label:string;value:Vec3;onChange:(v:Vec3)=>void}){return <fieldset className="vector"><legend>{label}</legend>{["X","Y","Z"].map((axis,i)=><label key={axis}><span>{axis}</span><input type="number" value={value[i]} onChange={e=>{const next=[...value] as Vec3;next[i]=Number(e.target.value);onChange(next)}}/></label>)}</fieldset>}
