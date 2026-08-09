import { NextRequest, NextResponse } from "next/server";

const API="https://api.mineskin.org/v2";
const headers=(key?:string)=>({Accept:"application/json","MineSkin-User-Agent":"Blocksmith/1.0 (Blackwake NPC skin exporter)",...(key?{Authorization:`Bearer ${key}`}:{})});
const message=(payload:any,status:number)=>NextResponse.json(payload,{status});
const skinUuid=(reference:string)=>{const value=reference.trim();try{const url=new URL(value);return url.pathname.split("/").filter(Boolean).at(-1)||""}catch{return value}};
const validSkinUuid=(value:string)=>/^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value);
const textureUrl=(value:string)=>{try{const url=new URL(value);return url.protocol==="https:"&&url.hostname==="textures.minecraft.net"&&url.pathname.startsWith("/texture/")}catch{return false}};
const base64=(bytes:Uint8Array)=>{let binary="";for(let offset=0;offset<bytes.length;offset+=16384)binary+=String.fromCharCode(...bytes.subarray(offset,offset+16384));return btoa(binary)};

export async function POST(request:NextRequest){
  try{
    if(request.headers.get("content-type")?.includes("multipart/form-data")){
      const incoming=await request.formData(),key=String(incoming.get("apiKey")||"").trim(),id=String(incoming.get("id")||""),variant=incoming.get("variant")==="slim"?"slim":"classic",skin=incoming.get("skin");
      if(!key)return message({error:"A MineSkin API key is required."},400);
      if(!/^[a-z0-9][a-z0-9._-]{0,47}$/.test(id))return message({error:"The character ID is invalid."},400);
      if(!(skin instanceof Blob)||skin.type!=="image/png")return message({error:"A PNG skin is required."},400);
      const form=new FormData();form.set("file",skin,`${id}.png`);form.set("variant",variant);form.set("name",id.slice(0,20));form.set("visibility","unlisted");
      const response=await fetch(`${API}/queue`,{method:"POST",headers:headers(key),body:form}),payload=await response.json().catch(()=>({error:"MineSkin returned an unreadable response."}));
      return message(payload,response.status);
    }
    const incoming=await request.json(),key=String(incoming.apiKey||"").trim();
    if(incoming.action==="import"){
      const uuid=skinUuid(String(incoming.reference||""));if(!validSkinUuid(uuid))return message({error:"Enter a current MineSkin UUID or MineSkin skin URL."},400);
      const skinResponse=await fetch(`${API}/skins/${encodeURIComponent(uuid)}`,{headers:headers(key)}),skinPayload:any=await skinResponse.json().catch(()=>({error:"MineSkin returned an unreadable skin response."}));
      if(!skinResponse.ok)return message(skinPayload,skinResponse.status);const skin=skinPayload?.skin||skinPayload,url=skin?.texture?.url?.skin;
      if(typeof url!=="string"||!textureUrl(url)||typeof skin?.texture?.data?.value!=="string")return message({error:"MineSkin did not return a complete Minecraft texture profile."},502);
      const textureResponse=await fetch(url),bytes=new Uint8Array(await textureResponse.arrayBuffer()),signature=[137,80,78,71,13,10,26,10];if(!textureResponse.ok||bytes.length<24||!signature.every((byte,index)=>bytes[index]===byte))return message({error:"The hosted Minecraft skin PNG could not be downloaded."},502);
      const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),width=view.getUint32(16),height=view.getUint32(20);if(width!==64||(height!==64&&height!==32))return message({error:"The MineSkin texture is not a 64×64 or legacy 64×32 player skin."},422);
      return message({success:true,skin,png:base64(bytes),width,height},200);
    }
    const job=String(incoming.job||"");
    if(!key||!job)return message({error:"MineSkin API key and queue job are required."},400);
    const response=await fetch(`${API}/queue/${encodeURIComponent(job)}`,{headers:headers(key)}),payload:any=await response.json().catch(()=>({error:"MineSkin returned an unreadable response."}));
    if(response.ok&&payload?.job?.status==="completed"&&!payload?.skin?.texture?.data?.value&&payload.job.result){const skinResponse=await fetch(`${API}/skins/${encodeURIComponent(payload.job.result)}`,{headers:headers(key)}),skinPayload=await skinResponse.json().catch(()=>null);if(skinResponse.ok&&skinPayload?.skin)payload.skin=skinPayload.skin}
    return message(payload,response.status);
  }catch(error){return message({error:error instanceof Error?error.message:"MineSkin request failed."},500)}
}
