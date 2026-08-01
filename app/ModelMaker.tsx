"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Vec3 = [number, number, number];
type Cube = { id: string; name: string; from: Vec3; to: Vec3; rotation: Vec3; color: string; material?: string };
type Project = { id: string; name: string; description: string; cubes: Cube[]; source: "codex" | "local"; revision: number };

const COLORS = ["#78c84f", "#293239", "#2bc8d3", "#949da1", "#d5a642", "#bd5a4d", "#725392"];
const cube = (id: string, name: string, from: Vec3, to: Vec3, color: string, material = "painted metal"): Cube => ({ id, name, from, to, rotation: [0,0,0], color, material });

const atm: Project = {
  id: "codex_atm_01", name: "Weathered ATM", source: "codex", revision: 2,
  description: "A detailed street ATM with screen, keypad, card reader, receipt and cash slots.",
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
  cubes:[
    cube("base","Stone base",[3,0,3],[13,4,13],"#7e8b82","stone"),
    cube("body","Totem body",[5,4,5],[11,15,11],"#a36c3f","wood"),
    cube("cap","Moss cap",[3,15,3],[13,18,13],"#79c34a","moss"),
  ],
};

const BUILTINS = [atm, totem];
const clone = <T,>(value:T):T => JSON.parse(JSON.stringify(value));
const uid = (prefix="cube") => `${prefix}_${Math.random().toString(36).slice(2,9)}`;

function minecraftJson(project: Project) {
  return {
    credit: "Designed with Codex in Blocksmith",
    texture_size: [64,64],
    textures: { all: `${project.name.toLowerCase().replace(/\W+/g,"_")}:block/texture` },
    elements: project.cubes.map((part)=>({ name:part.name, from:part.from, to:part.to,
      ...(part.rotation.some(Boolean)?{rotation:{origin:part.from.map((v,i)=>(v+part.to[i])/2),axis:"y",angle:part.rotation[1]}}:{}),
      faces:Object.fromEntries(["north","east","south","west","up","down"].map(face=>[face,{texture:"#all"}]))
    }))
  };
}

function download(name:string,data:unknown) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  const a=document.createElement("a"); a.href=url; a.download=`${name.replace(/\W+/g,"_").toLowerCase()||"model"}.json`; a.click(); URL.revokeObjectURL(url);
}

function Viewport({project,selected,onSelect}:{project:Project;selected:string|null;onSelect:(id:string)=>void}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const [view,setView]=useState({yaw:2.42,pitch:.58,zoom:18});
  const drag=useRef<{x:number;y:number;yaw:number;pitch:number;moved:boolean}|null>(null);
  const projected=useRef<{id:string;poly:[number,number][];depth:number}[]>([]);

  useEffect(()=>{
    const el=canvas.current;if(!el)return;const ctx=el.getContext("2d");if(!ctx)return;
    const rect=el.getBoundingClientRect(),width=Math.max(1,Math.floor(rect.width)),height=Math.max(1,Math.floor(rect.height));el.width=width;el.height=height;ctx.clearRect(0,0,width,height);
    const center={x:width/2,y:height*.58};
    const projectPoint=(p:Vec3):[number,number,number]=>{const x=p[0]-8,y=p[1]-8,z=p[2]-8,cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch),rx=x*cy-z*sy,rz=x*sy+z*cy;return[center.x+rx*view.zoom,center.y-(y*cp-rz*sp)*view.zoom,y*sp+rz*cp]};
    ctx.lineWidth=1;for(let i=0;i<=16;i++){const a=projectPoint([i,0,0]),b=projectPoint([i,0,16]),c=projectPoint([0,0,i]),d=projectPoint([16,0,i]);ctx.strokeStyle=i===0||i===16?"#687169":"#343a36";ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(d[0],d[1]);ctx.stroke()}
    type Face={id:string;points:[number,number,number][];color:string;material:string;light:number;uSteps:number;vSteps:number;faceIndex:number};const faces:Face[]=[],polys:{id:string;poly:[number,number][];depth:number}[]=[];
    project.cubes.forEach(part=>{const[x1,y1,z1]=part.from,[x2,y2,z2]=part.to,dx=Math.abs(x2-x1),dy=Math.abs(y2-y1),dz=Math.abs(z2-z1);const v=[[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1],[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]].map(p=>projectPoint(p as Vec3));const specs=[{i:[0,1,2,3],l:.8,u:dx,w:dy},{i:[5,4,7,6],l:.68,u:dx,w:dy},{i:[4,0,3,7],l:.72,u:dz,w:dy},{i:[1,5,6,2],l:.9,u:dz,w:dy},{i:[3,2,6,7],l:1.08,u:dx,w:dz},{i:[4,5,1,0],l:.55,u:dx,w:dz}];specs.forEach((spec,faceIndex)=>faces.push({id:part.id,points:spec.i.map(n=>v[n]),color:part.color,material:part.material||"custom",light:spec.l,uSteps:Math.max(1,Math.min(12,Math.ceil(spec.u))),vSteps:Math.max(1,Math.min(12,Math.ceil(spec.w))),faceIndex}));const xs=v.map(p=>p[0]),ys=v.map(p=>p[1]);polys.push({id:part.id,poly:[[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)],[Math.min(...xs),Math.max(...ys)]],depth:v.reduce((s,p)=>s+p[2],0)/8})});
    const baseRgb=(hex:string)=>[0,2,4].map(i=>parseInt(hex.replace("#","").slice(i,i+2),16));
    const seedFor=(value:string)=>[...value].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,2166136261);
    const pixelColor=(face:Face,x:number,y:number)=>{const base=baseRgb(face.color),seed=seedFor(`${face.id}:${face.material}:${face.faceIndex}`),raw=Math.sin((seed+x*37+y*101)*12.9898)*43758.5453,n=raw-Math.floor(raw),m=face.material.toLowerCase();let variance=(n-.5)*.16+(face.id===selected?.1:0);if(m.includes("metal")){variance+=(x%7===0?.06:0)+(n>.9?.16:0)}else if(m.includes("stone")){variance+=(n>.72?.12:n<.2?-.12:0)}else if(m.includes("wood")){variance+=(x%3===0?.12:-.035)}else if(m.includes("moss")){variance+=(n>.62?.2:-.04)}else if(m.includes("glass")){variance+=(y%3===0?.17:0);base[2]=Math.min(255,base[2]+24)}else if(m.includes("light")||m.includes("emissive")){variance=.32+(n>.75?.16:0)}else if(m.includes("keycap")){variance=(x===0||y===0?.2:-.04)}const scale=Math.max(.25,face.light+variance);return base.map(c=>Math.max(0,Math.min(255,Math.round(c*scale))))};
    const frame=ctx.getImageData(0,0,width,height),depth=new Float32Array(width*height);depth.fill(Number.NEGATIVE_INFINITY);const edge=(a:[number,number,number],b:[number,number,number],x:number,y:number)=>(x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
    const raster=(face:Face,ia:number,ib:number,ic:number,uv:[[number,number],[number,number],[number,number]])=>{const a=face.points[ia],b=face.points[ib],c=face.points[ic],area=edge(a,b,c[0],c[1]);if(Math.abs(area)<.0001)return;const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));for(let py=minY;py<=maxY;py++)for(let px=minX;px<=maxX;px++){const sx=px+.5,sy=py+.5,w0=edge(b,c,sx,sy)/area,w1=edge(c,a,sx,sy)/area,w2=1-w0-w1;if(w0<0||w1<0||w2<0)continue;const z=w0*a[2]+w1*b[2]+w2*c[2],index=py*width+px;if(z<depth[index])continue;depth[index]=z;const u=w0*uv[0][0]+w1*uv[1][0]+w2*uv[2][0],v=w0*uv[0][1]+w1*uv[1][1]+w2*uv[2][1],tx=Math.min(face.uSteps-1,Math.max(0,Math.floor(u*face.uSteps))),ty=Math.min(face.vSteps-1,Math.max(0,Math.floor(v*face.vSteps))),rgb=pixelColor(face,tx,ty),offset=index*4;frame.data[offset]=rgb[0];frame.data[offset+1]=rgb[1];frame.data[offset+2]=rgb[2];frame.data[offset+3]=255}};
    faces.forEach(face=>{raster(face,0,1,2,[[0,0],[1,0],[1,1]]);raster(face,0,2,3,[[0,0],[1,1],[0,1]])});ctx.putImageData(frame,0,0);projected.current=polys.sort((a,b)=>b.depth-a.depth);
  },[project,selected,view]);

  const down=(e:ReactPointerEvent<HTMLCanvasElement>)=>{drag.current={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,moved:false};e.currentTarget.setPointerCapture(e.pointerId)};
  const move=(e:ReactPointerEvent<HTMLCanvasElement>)=>{const active=drag.current;if(!active)return;const dx=e.clientX-active.x,dy=e.clientY-active.y;if(Math.abs(dx)+Math.abs(dy)>3)active.moved=true;setView(v=>({...v,yaw:active.yaw+dx*.008,pitch:Math.max(-1.1,Math.min(1.1,active.pitch+dy*.006))}))};
  const up=(e:ReactPointerEvent<HTMLCanvasElement>)=>{const active=drag.current;if(active&&!active.moved){const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const inside=(poly:[number,number][])=>poly.reduce((hit,p,i)=>{const q=poly[(i+poly.length-1)%poly.length];return((p[1]>y)!==(q[1]>y))&&(x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])?!hit:hit},false);const hit=projected.current.find(p=>inside(p.poly));if(hit)onSelect(hit.id)}drag.current=null};
  return <canvas ref={canvas} className="viewport" aria-label="Interactive 3D model viewport" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null}} onWheel={e=>setView(v=>({...v,zoom:Math.max(8,Math.min(34,v.zoom-e.deltaY*.015))}))}/>;
}

export default function ModelMaker(){
  const [library,setLibrary]=useState<Project[]>(BUILTINS);
  const [project,setProject]=useState<Project>(clone(atm));
  const [selected,setSelected]=useState<string|null>(atm.cubes[6].id);
  const [history,setHistory]=useState<Project[]>([]);const [future,setFuture]=useState<Project[]>([]);const [hydrated,setHydrated]=useState(false);
  const modelInput=useRef<HTMLInputElement>(null);
  const selectedCube=project.cubes.find(c=>c.id===selected)||null;
  const jsonPreview=useMemo(()=>JSON.stringify(minecraftJson(project),null,2),[project]);

  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("blocksmith-library-v2")||"[]") as Project[];const merged=[...saved];BUILTINS.forEach(b=>{const i=merged.findIndex(p=>p.id===b.id);if(i<0)merged.push(clone(b));else if((merged[i].revision||0)<b.revision)merged[i]=clone(b)});if(merged.length){setLibrary(merged);setProject(clone(merged[0]));setSelected(merged[0].cubes[0]?.id||null)}}catch{}setHydrated(true)},[]);
  useEffect(()=>{if(hydrated)localStorage.setItem("blocksmith-library-v2",JSON.stringify(library))},[library,hydrated]);
  const commit=(next:Project)=>{setHistory(h=>[...h.slice(-39),clone(project)]);setFuture([]);setProject(next)};
  const updateCube=(patch:Partial<Cube>)=>selectedCube&&commit({...project,cubes:project.cubes.map(c=>c.id===selectedCube.id?{...c,...patch}:c)});
  const save=()=>setLibrary(items=>{const saved={...clone(project),source:"local" as const};const i=items.findIndex(p=>p.id===saved.id);return i<0?[saved,...items]:items.map((p,n)=>n===i?saved:p)});
  const open=(model:Project)=>{setProject(clone(model));setSelected(model.cubes[0]?.id||null);setHistory([]);setFuture([])};
  const newModel=()=>{const blank:Project={id:uid("model"),name:"Untitled Model",description:"A new local model.",cubes:[],source:"local",revision:1};setLibrary(items=>[blank,...items]);open(blank)};
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
      <div className="top-actions"><button className="tool-button" onClick={undo} disabled={!history.length} title="Undo">↶</button><button className="tool-button" onClick={redo} disabled={!future.length} title="Redo">↷</button><button className="secondary" onClick={save}>Save</button><button className="secondary" onClick={newModel}>New Model</button><button className="primary" onClick={()=>download(project.name,minecraftJson(project))}>Export JSON</button></div>
    </header>
    <section className="workspace">
      <aside className="left-panel panel"><div className="panel-heading"><div><span className="eyebrow">OUTLINER</span><h2>{project.cubes.length} model parts</h2></div><button className="mini-add" onClick={addCube}>+</button></div><div className="tree-label">⌄ ◈ {project.name}</div><div className="cube-list">{project.cubes.map(c=><button key={c.id} className={`cube-row ${selected===c.id?"active":""}`} onClick={()=>setSelected(c.id)}><span className="cube-glyph">◆</span><span>{c.name}</span><i style={{background:c.color}}/></button>)}</div><button className="add-part" onClick={addCube}>＋ Add cube</button><div className="tips"><strong>Codex workflow</strong><p>Describe a model in this Codex chat.</p><p>Codex adds it here, then publishes it.</p></div></aside>
      <section className="stage"><div className="stage-tools"><span className="badge">PERSPECTIVE</span><span className="badge"><i/> TEXTURED</span></div><Viewport project={project} selected={selected} onSelect={setSelected}/><div className="axis"><span className="x">X</span><span className="y">Y</span><span className="z">Z</span></div><div className="stage-note">Drag to orbit · Scroll to zoom · Click to select</div></section>
      <aside className="right-panel panel"><div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h2>{selectedCube?.name||"Model settings"}</h2></div>{selectedCube&&<button className="delete" onClick={()=>{commit({...project,cubes:project.cubes.filter(c=>c.id!==selectedCube.id)});setSelected(null)}}>×</button>}</div>{selectedCube?<div className="inspector"><label className="field-label">NAME<input value={selectedCube.name} onChange={e=>updateCube({name:e.target.value})}/></label><VectorEditor label="FROM" value={selectedCube.from} onChange={from=>updateCube({from})}/><VectorEditor label="TO" value={selectedCube.to} onChange={to=>updateCube({to})}/><VectorEditor label="ROTATION" value={selectedCube.rotation} onChange={rotation=>updateCube({rotation})}/><label className="field-label">PROCEDURAL MATERIAL<input value={selectedCube.material||""} onChange={e=>updateCube({material:e.target.value})}/></label><div className="field-label">BASE COLOR<div className="swatches">{COLORS.map(color=><button key={color} className={selectedCube.color===color?"chosen":""} style={{background:color}} onClick={()=>updateCube({color})}/>)}</div></div></div>:<p className="empty">Select a part to edit its geometry and material.</p>}<section className="texture-card procedural-card"><span className="eyebrow">MINECRAFT MATERIAL SYSTEM</span><div className="material-preview"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><strong>Face-attached procedural pixels</strong><p>Patterns are generated from each part’s material and remain locked to every face while you rotate.</p></section><details className="json-box"><summary>Minecraft JSON preview</summary><pre>{jsonPreview}</pre></details></aside>
    </section>
    <section className="library-dock"><div className="library-title"><div><span className="eyebrow">MODEL LIBRARY</span><h2>Codex creations & local drafts</h2></div><div className="library-actions"><button onClick={duplicate}>Duplicate</button><button onClick={()=>modelInput.current?.click()}>Import JSON</button>{project.source==="local"&&<button className="danger" onClick={deleteModel}>Delete</button>}<input ref={modelInput} hidden type="file" accept=".json,application/json" onChange={importModel}/></div></div><div className="model-cards"><button className="new-card" onClick={newModel}><b>＋</b><span>Blank model</span></button>{library.map(model=><button key={model.id} className={`model-card ${project.id===model.id?"active":""}`} onClick={()=>open(model)}><span className="card-art procedural-art" style={{backgroundColor:model.cubes[0]?.color||"#333"}}><i>{model.cubes.length}</i></span><span className="card-copy"><strong>{model.name}</strong><small>{model.source==="codex"?"CODEX LIBRARY":"LOCAL"} · {model.cubes.length} parts</small></span></button>)}</div></section>
  </main>;
}

function VectorEditor({label,value,onChange}:{label:string;value:Vec3;onChange:(v:Vec3)=>void}){return <fieldset className="vector"><legend>{label}</legend>{["X","Y","Z"].map((axis,i)=><label key={axis}><span>{axis}</span><input type="number" value={value[i]} onChange={e=>{const next=[...value] as Vec3;next[i]=Number(e.target.value);onChange(next)}}/></label>)}</fieldset>}
