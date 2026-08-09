import { NextRequest, NextResponse } from "next/server";

const API="https://api.mineskin.org/v2";
const headers=(key:string)=>({Accept:"application/json",Authorization:`Bearer ${key}`,"MineSkin-User-Agent":"Blocksmith/1.0 (Blackwake NPC skin exporter)"});
const message=(payload:any,status:number)=>NextResponse.json(payload,{status});

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
    const incoming=await request.json(),key=String(incoming.apiKey||"").trim(),job=String(incoming.job||"");
    if(!key||!job)return message({error:"MineSkin API key and queue job are required."},400);
    const response=await fetch(`${API}/queue/${encodeURIComponent(job)}`,{headers:headers(key)}),payload:any=await response.json().catch(()=>({error:"MineSkin returned an unreadable response."}));
    if(response.ok&&payload?.job?.status==="completed"&&!payload?.skin?.texture?.data?.value&&payload.job.result){const skinResponse=await fetch(`${API}/skins/${encodeURIComponent(payload.job.result)}`,{headers:headers(key)}),skinPayload=await skinResponse.json().catch(()=>null);if(skinResponse.ok&&skinPayload?.skin)payload.skin=skinPayload.skin}
    return message(payload,response.status);
  }catch(error){return message({error:error instanceof Error?error.message:"MineSkin request failed."},500)}
}
