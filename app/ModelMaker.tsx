"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Vec3 = [number, number, number];
type Cube = { id: string; name: string; from: Vec3; to: Vec3; rotation: Vec3; color: string };
type Project = { name: string; textureSize: [number, number]; cubes: Cube[] };

const COLORS = ["#79c34a", "#d18b47", "#58a6d6", "#b983d5", "#e9c46a", "#d96b6b"];
const starter: Project = {
  name: "mossy_totem",
  textureSize: [16, 16],
  cubes: [
    { id: "base", name: "Stone base", from: [3, 0, 3], to: [13, 4, 13], rotation: [0, 0, 0], color: "#7e8b82" },
    { id: "body", name: "Totem body", from: [5, 4, 5], to: [11, 15, 11], rotation: [0, 0, 0], color: "#a36c3f" },
    { id: "cap", name: "Moss cap", from: [3, 15, 3], to: [13, 18, 13], rotation: [0, 0, 0], color: "#79c34a" },
  ],
};

const copyProject = (p: Project): Project => JSON.parse(JSON.stringify(p));
const uid = () => `cube_${Math.random().toString(36).slice(2, 8)}`;

function minecraftJson(project: Project) {
  return {
    credit: "Made with Blocksmith AI",
    texture_size: project.textureSize,
    textures: { all: `${project.name}:block/${project.name}` },
    elements: project.cubes.map((cube) => ({
      name: cube.name,
      from: cube.from,
      to: cube.to,
      ...(cube.rotation.some(Boolean)
        ? { rotation: { origin: cube.from.map((v, i) => (v + cube.to[i]) / 2), axis: "y", angle: cube.rotation[1] } }
        : {}),
      faces: Object.fromEntries(["north", "east", "south", "west", "up", "down"].map((face) => [face, { texture: "#all" }])),
    })),
  };
}

function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name || "model"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Viewport({ cubes, selected, onSelect }: { cubes: Cube[]; selected: string | null; onSelect: (id: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ yaw: -0.72, pitch: 0.58, zoom: 18 });
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; moved: boolean } | null>(null);
  const projected = useRef<{ id: string; poly: [number, number][]; depth: number }[]>([]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = el.getBoundingClientRect();
    el.width = rect.width * ratio;
    el.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const center = { x: rect.width / 2, y: rect.height * 0.55 };
    const project = (p: Vec3): [number, number, number] => {
      const x = p[0] - 8, y = p[1] - 8, z = p[2] - 8;
      const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
      const rx = x * cy - z * sy;
      const rz = x * sy + z * cy;
      return [center.x + rx * view.zoom, center.y - (y * cp - rz * sp) * view.zoom, y * sp + rz * cp];
    };

    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const a = project([i, 0, 0]); const b = project([i, 0, 16]);
      const c = project([0, 0, i]); const d = project([16, 0, i]);
      ctx.strokeStyle = i === 0 || i === 16 ? "#6b7168" : "#343a36";
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    }

    type Face = { id: string; points: [number, number, number][]; color: string; depth: number; light: number };
    const faces: Face[] = [];
    const polys: { id: string; poly: [number, number][]; depth: number }[] = [];
    cubes.forEach((cube) => {
      const [x1, y1, z1] = cube.from, [x2, y2, z2] = cube.to;
      const v = [[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1],[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]].map((p) => project(p as Vec3));
      const specs = [
        { i: [0,1,2,3], l: .72 }, { i: [5,4,7,6], l: .9 }, { i: [4,0,3,7], l: .78 },
        { i: [1,5,6,2], l: .62 }, { i: [3,2,6,7], l: 1.08 }, { i: [4,5,1,0], l: .55 },
      ];
      specs.forEach(({ i, l }) => {
        const points = i.map((n) => v[n]);
        faces.push({ id: cube.id, points, color: cube.color, depth: points.reduce((s,p)=>s+p[2],0)/4, light: l });
      });
      const hull = [v[0],v[1],v[5],v[6],v[7],v[3]].map((p) => [p[0],p[1]] as [number,number]);
      polys.push({ id: cube.id, poly: hull, depth: v.reduce((s,p)=>s+p[2],0)/8 });
    });
    faces.sort((a,b)=>a.depth-b.depth).forEach((face) => {
      ctx.beginPath(); face.points.forEach((p,i)=>i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); ctx.closePath();
      const hex = face.color.replace("#", "");
      const rgb = [0,2,4].map((i)=>Math.min(255, parseInt(hex.slice(i,i+2),16)*face.light));
      ctx.fillStyle = `rgb(${rgb.join(",")})`; ctx.fill();
      ctx.strokeStyle = face.id === selected ? "#e5ff82" : "rgba(12,16,13,.65)";
      ctx.lineWidth = face.id === selected ? 2 : 1; ctx.stroke();
    });
    projected.current = polys.sort((a,b)=>b.depth-a.depth);
  }, [cubes, selected, view]);

  const pointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const dx=e.clientX-drag.current.x, dy=e.clientY-drag.current.y;
    if (Math.abs(dx)+Math.abs(dy)>3) drag.current.moved=true;
    setView((v)=>({ ...v, yaw: drag.current!.yaw + dx*.008, pitch: Math.max(-1.1,Math.min(1.1,drag.current!.pitch+dy*.006)) }));
  };
  const pointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drag.current && !drag.current.moved) {
      const rect=e.currentTarget.getBoundingClientRect(), x=e.clientX-rect.left, y=e.clientY-rect.top;
      const inside=(poly:[number,number][])=>poly.reduce((hit,p,i)=>{const q=poly[(i+poly.length-1)%poly.length];return ((p[1]>y)!==(q[1]>y))&&(x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])?!hit:hit;},false);
      const hit=projected.current.find((p)=>inside(p.poly)); if(hit) onSelect(hit.id);
    }
    drag.current=null;
  };
  return <canvas ref={canvas} className="viewport" aria-label="Interactive 3D model viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onWheel={(e)=>setView(v=>({...v,zoom:Math.max(8,Math.min(34,v.zoom-e.deltaY*.015))}))} />;
}

export default function ModelMaker() {
  const [project, setProject] = useState<Project>(starter);
  const [selected, setSelected] = useState<string | null>("cap");
  const [history, setHistory] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(["Try: “Add two blue cubes for eyes” or “Make the selected cube taller.”"]);
  const fileInput = useRef<HTMLInputElement>(null);
  const cube = project.cubes.find((c)=>c.id===selected) ?? null;
  const jsonPreview = useMemo(()=>JSON.stringify(minecraftJson(project),null,2),[project]);

  const commit = (next: Project) => { setHistory((h)=>[...h.slice(-29),copyProject(project)]); setFuture([]); setProject(next); };
  const updateCube = (patch: Partial<Cube>) => cube && commit({ ...project, cubes: project.cubes.map((c)=>c.id===cube.id?{...c,...patch}:c) });
  const addCube = (name="New cube", color=COLORS[project.cubes.length%COLORS.length]) => {
    const next={id:uid(),name,from:[5,5,5] as Vec3,to:[11,11,11] as Vec3,rotation:[0,0,0] as Vec3,color};
    commit({...project,cubes:[...project.cubes,next]}); setSelected(next.id);
  };
  const removeCube = () => { if(!cube) return; commit({...project,cubes:project.cubes.filter(c=>c.id!==cube.id)}); setSelected(null); };
  const undo = () => { const prev=history.at(-1); if(!prev)return; setFuture(f=>[copyProject(project),...f]); setProject(prev); setHistory(h=>h.slice(0,-1)); };
  const redo = () => { const next=future[0]; if(!next)return; setHistory(h=>[...h,copyProject(project)]); setProject(next); setFuture(f=>f.slice(1)); };

  useEffect(()=>{ const saved=localStorage.getItem("blocksmith-project"); if(saved) try { setProject(JSON.parse(saved)); } catch {} },[]);
  useEffect(()=>{ localStorage.setItem("blocksmith-project",JSON.stringify(project)); },[project]);

  const runPrompt = () => {
    const text=prompt.trim(); if(!text)return;
    const lower=text.toLowerCase();
    if(lower.includes("add") || lower.includes("create")) {
      const count=lower.includes("two")?2:lower.includes("three")?3:1;
      const color=COLORS.find(c=>lower.includes({"#58a6d6":"blue","#79c34a":"green","#d96b6b":"red","#e9c46a":"yellow"}[c]||""))||COLORS[project.cubes.length%COLORS.length];
      const created=Array.from({length:count},(_,i)=>({id:uid(),name:`AI cube ${project.cubes.length+i+1}`,from:[4+i*4,8,4] as Vec3,to:[7+i*4,11,7] as Vec3,rotation:[0,0,0] as Vec3,color}));
      commit({...project,cubes:[...project.cubes,...created]}); setSelected(created.at(-1)!.id); setMessages(m=>[...m,`You: ${text}`,`Blocksmith: Added ${count} cube${count>1?"s":""}.`]);
    } else if(cube && (lower.includes("tall")||lower.includes("height"))) {
      updateCube({to:[cube.to[0],Math.min(32,cube.to[1]+4),cube.to[2]]}); setMessages(m=>[...m,`You: ${text}`,"Blocksmith: Made the selected cube 4 units taller."]);
    } else if(cube && lower.includes("wide")) {
      updateCube({from:[Math.max(-16,cube.from[0]-2),cube.from[1],cube.from[2]],to:[Math.min(32,cube.to[0]+2),cube.to[1],cube.to[2]]}); setMessages(m=>[...m,`You: ${text}`,"Blocksmith: Widened the selected cube."]);
    } else {
      setMessages(m=>[...m,`You: ${text}`,"Blocksmith: I can currently add colored cubes or make the selected cube taller/wider. Cloud AI is the next connection step."]);
    }
    setPrompt("");
  };

  const importFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file)return;
    file.text().then((raw)=>{ try { const data=JSON.parse(raw); const elements=data.elements||[]; const cubes:Cube[]=elements.map((el:{name?:string;from:Vec3;to:Vec3},i:number)=>({id:uid(),name:el.name||`Cube ${i+1}`,from:el.from,to:el.to,rotation:[0,0,0],color:COLORS[i%COLORS.length]})); commit({...project,name:file.name.replace(/\.json$/i,""),cubes}); setSelected(cubes[0]?.id||null); } catch { setMessages(m=>[...m,"Import failed: that file is not valid Minecraft model JSON."]); } });
    e.target.value="";
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-cube">B</span><div><strong>BLOCKSMITH</strong><small>AI MODEL STUDIO</small></div></div>
      <div className="project-title"><span className="status-dot"/><input aria-label="Project name" value={project.name} onChange={(e)=>setProject({...project,name:e.target.value})}/><span className="saved">Saved locally</span></div>
      <div className="top-actions">
        <button className="tool-button" onClick={undo} disabled={!history.length} title="Undo"><Icon>↶</Icon></button>
        <button className="tool-button" onClick={redo} disabled={!future.length} title="Redo"><Icon>↷</Icon></button>
        <button className="secondary" onClick={()=>fileInput.current?.click()}>Import</button>
        <button className="primary" onClick={()=>download(project.name,minecraftJson(project))}>Export JSON</button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importFile}/>
      </div>
    </header>

    <section className="workspace">
      <aside className="left-panel panel">
        <div className="panel-heading"><div><span className="eyebrow">OUTLINER</span><h2>Model parts</h2></div><button className="mini-add" onClick={()=>addCube()} aria-label="Add cube">+</button></div>
        <div className="tree-label">⌄ ◈ {project.name}</div>
        <div className="cube-list">{project.cubes.map((c)=><button key={c.id} className={`cube-row ${selected===c.id?"active":""}`} onClick={()=>setSelected(c.id)}><span className="cube-glyph">◆</span><span>{c.name}</span><i style={{background:c.color}}/></button>)}</div>
        <button className="add-part" onClick={()=>addCube()}><span>＋</span> Add cube</button>
        <div className="tips"><strong>Quick controls</strong><p>Drag to orbit · Scroll to zoom</p><p>Click a cube to select it</p></div>
      </aside>

      <section className="stage">
        <div className="stage-tools"><span className="badge">PERSPECTIVE</span><span className="badge"><i/> 16 × 16 GRID</span></div>
        <Viewport cubes={project.cubes} selected={selected} onSelect={setSelected}/>
        <div className="axis"><span className="x">X</span><span className="y">Y</span><span className="z">Z</span></div>
        <div className="stage-note">Minecraft Java · Block / item model</div>
      </section>

      <aside className="right-panel panel">
        <div className="panel-heading"><div><span className="eyebrow">INSPECTOR</span><h2>{cube?.name||"Nothing selected"}</h2></div>{cube&&<button className="delete" onClick={removeCube} aria-label="Delete cube">×</button>}</div>
        {cube ? <div className="inspector">
          <label className="field-label">NAME<input value={cube.name} onChange={(e)=>updateCube({name:e.target.value})}/></label>
          <VectorEditor label="FROM" value={cube.from} onChange={(from)=>updateCube({from})}/>
          <VectorEditor label="TO" value={cube.to} onChange={(to)=>updateCube({to})}/>
          <VectorEditor label="ROTATION" value={cube.rotation} onChange={(rotation)=>updateCube({rotation})}/>
          <div className="field-label">MATERIAL COLOR<div className="swatches">{COLORS.map(color=><button key={color} aria-label={`Use ${color}`} className={cube.color===color?"chosen":""} style={{background:color}} onClick={()=>updateCube({color})}/>)}</div></div>
          <div className="dimensions"><span>SIZE</span><strong>{cube.to.map((n,i)=>n-cube.from[i]).join(" × ")}</strong><small>pixels</small></div>
        </div> : <p className="empty">Select a cube in the viewport or model parts list.</p>}
        <details className="json-box"><summary>Minecraft JSON preview</summary><pre>{jsonPreview}</pre></details>
      </aside>
    </section>

    <section className="ai-dock">
      <div className="ai-mark">✦</div><div className="chat"><div className="chat-head"><strong>Blocksmith Assistant</strong><span>LOCAL COMMAND MODE</span></div><div className="messages">{messages.slice(-3).map((m,i)=><p key={i}>{m}</p>)}</div>
      <div className="prompt-row"><input aria-label="AI modeling instruction" placeholder="Describe a change to your model…" value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&runPrompt()}/><button onClick={runPrompt}>Build <span>↗</span></button></div></div>
    </section>
  </main>;
}

function VectorEditor({label,value,onChange}:{label:string;value:Vec3;onChange:(v:Vec3)=>void}) {
  return <fieldset className="vector"><legend>{label}</legend>{(["X","Y","Z"] as const).map((axis,i)=><label key={axis}><span>{axis}</span><input type="number" value={value[i]} onChange={(e)=>{const next=[...value] as Vec3;next[i]=Number(e.target.value);onChange(next)}}/></label>)}</fieldset>;
}
