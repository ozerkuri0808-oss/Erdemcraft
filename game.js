import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   ERDEMCRAFT — CREATIVE BETA
   Original browser voxel sandbox. No Minecraft files/assets.
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83c8ef);
scene.fog = new THREE.Fog(0x83c8ef, 34, 110);

const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.05, 180);
camera.position.set(0, 10, 16);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.prepend(renderer.domElement);

let locked = false;
let yaw = 0;
let pitch = -0.08;

const controls = {
  get isLocked() { return locked; },
  lock() {
    if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock();
  },
  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
  },
  moveForward(distance) {
    camera.position.x += Math.sin(yaw) * distance;
    camera.position.z -= Math.cos(yaw) * distance;
  },
  moveRight(distance) {
    camera.position.x += Math.cos(yaw) * distance;
    camera.position.z += Math.sin(yaw) * distance;
  }
};

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;
  const status = document.getElementById("status");
  if (locked) {
    document.getElementById("start-screen").classList.add("hidden");
    status.textContent = "CREATIVE aktif — dünyayı istediğin gibi kur.";
  } else {
    status.textContent = "Oyun duraklatıldı — devam etmek için ekrana tıkla.";
  }
});

document.addEventListener("mousemove", e => {
  if (!locked) return;
  yaw -= e.movementX * 0.0022;
  pitch -= e.movementY * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

const hemi = new THREE.HemisphereLight(0xdff4ff, 0x243321, 1.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4cf, 2.5);
sun.position.set(25, 42, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
scene.add(sun);

const moonLight = new THREE.DirectionalLight(0x7898d0, 0.0);
moonLight.position.set(-30, 28, -20);
scene.add(moonLight);

const campLight = new THREE.PointLight(0xffd47a, 0.0, 18, 2);
campLight.position.set(0, 7, -7);
scene.add(campLight);

const starsGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 900; i++) {
  const r = 70 + Math.random() * 25;
  const a = Math.random() * Math.PI * 2;
  const y = 18 + Math.random() * 50;
  starPositions.push(Math.cos(a) * r, y, Math.sin(a) * r);
}
starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.65, transparent: true, opacity: 0 })
);
scene.add(stars);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4.2, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xf2f0d2, transparent: true, opacity: 0 })
);
scene.add(moon);

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
function addCloud(x, y, z, scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.84 });
  const pieces = [
    [-1.6, 0, 0, 2.7, 0.65, 1.3],
    [0, 0.18, 0, 3.4, 0.85, 1.5],
    [1.7, 0, 0, 2.2, 0.6, 1.2],
    [0.45, 0.55, 0, 1.9, 0.9, 1.2]
  ];
  for (const p of pieces) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(p[3], p[4], p[5]), mat);
    m.position.set(p[0], p[1], p[2]);
    g.add(m);
  }
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  cloudGroup.add(g);
}
addCloud(-30, 27, -25, 1.1);
addCloud(8, 31, -38, 1.35);
addCloud(36, 26, -8, .9);
addCloud(-42, 34, 15, 1.5);

const BLOCKS = {
  grass:  { name:"Çimen",      icon:"🟩", base:"#61ad45", accent:"#3b812d" },
  dirt:   { name:"Toprak",     icon:"🟫", base:"#8d5b39", accent:"#6d4328" },
  stone:  { name:"Taş",        icon:"⬜", base:"#858e95", accent:"#697177" },
  cobble: { name:"Kırık Taş",  icon:"🔳", base:"#666e75", accent:"#4d555c" },
  wood:   { name:"Kütük",       icon:"🪵", base:"#8d633e", accent:"#64462b" },
  plank:  { name:"Tahta",       icon:"🟨", base:"#b77b45", accent:"#89582f" },
  leaves: { name:"Yaprak",      icon:"🌿", base:"#33813c", accent:"#27632e", transparent:true, opacity:.93 },
  sand:   { name:"Kum",        icon:"🟨", base:"#ddc581", accent:"#c2a961" },
  glass:  { name:"Cam",        icon:"🔷", base:"#aeeaff", accent:"#6fc9e9", transparent:true, opacity:.25 },
  brick:  { name:"Tuğla",      icon:"🧱", base:"#ac4c39", accent:"#7c3228" },
  glow:   { name:"Işık",       icon:"💡", base:"#f0bd4c", accent:"#ffe18b", emissive:"#b57316" }
};

const EGGS = {
  zombie:   { name:"Zombi Yumurtası",   icon:"🧟", color:0x4f934a, hostile:true,  hp:30, damage:7, speed:1.95 },
  skeleton: { name:"İskelet Yumurtası", icon:"💀", color:0xd7d1c3, hostile:true,  hp:24, damage:5, speed:1.72, ranged:true },
  sheep:    { name:"Koyun Yumurtası",   icon:"🐑", color:0xe8e8e8, hostile:false, hp:18, damage:0, speed:1.05 },
  cow:      { name:"İnek Yumurtası",    icon:"🐄", color:0x55443a, hostile:false, hp:24, damage:0, speed:.82 },
  slime:    { name:"Slime Yumurtası",   icon:"🟢", color:0x52d66d, hostile:true,  hp:22, damage:6, speed:1.58 }
};

const ITEMS = [
  ...Object.keys(BLOCKS).map(id => ({ id, kind:"block" })),
  { id:"sword", kind:"tool", name:"Creative Tokat", icon:"🗡️" },
  ...Object.keys(EGGS).map(id => ({ id, kind:"egg" }))
];

const hotbarItems = [
  { kind:"block", id:"grass" },
  { kind:"block", id:"dirt" },
  { kind:"block", id:"stone" },
  { kind:"block", id:"wood" },
  { kind:"block", id:"plank" },
  { kind:"block", id:"glass" },
  { kind:"block", id:"brick" },
  { kind:"tool", id:"push", name:"Creative İtme", icon:"✋" },
  { kind:"egg", id:"zombie" }
];

function hexToNumber(hex) {
  return Number.parseInt(hex.replace("#",""), 16);
}

function makeTexture(def, id) {
  if (id === "glass") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d");
  ctx.fillStyle = def.base;
  ctx.fillRect(0,0,32,32);
  ctx.globalAlpha = .48;
  ctx.fillStyle = def.accent;
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random()*32);
    const y = Math.floor(Math.random()*32);
    const w = 2 + Math.floor(Math.random()*5);
    const h = 2 + Math.floor(Math.random()*5);
    ctx.fillRect(x,y,w,h);
  }
  ctx.globalAlpha = 1;

  if (id === "grass") {
    ctx.fillStyle = "#76c653";
    for (let x=0; x<32; x+=4) ctx.fillRect(x,0,2,5);
    ctx.fillStyle = "#9b6a43";
    ctx.fillRect(0,25,32,7);
  }
  if (id === "wood") {
    ctx.strokeStyle = "#553a22";
    ctx.lineWidth = 2;
    for (let x=4; x<32; x+=7) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-2,32); ctx.stroke();
    }
  }
  if (id === "plank") {
    ctx.strokeStyle = "rgba(72,43,21,.35)";
    for (let y=6; y<32; y+=8) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(32,y); ctx.stroke();
    }
  }
  if (id === "brick") {
    ctx.strokeStyle = "rgba(72,20,16,.55)";
    ctx.lineWidth = 2;
    for (let y=7; y<32; y+=8) ctx.beginPath(),ctx.moveTo(0,y),ctx.lineTo(32,y),ctx.stroke();
    for (let y=0; y<32; y+=16) {
      ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(8,y+8);ctx.stroke();
      ctx.beginPath();ctx.moveTo(24,y+8);ctx.lineTo(24,y+16);ctx.stroke();
    }
  }
  if (id === "glow") {
    ctx.fillStyle = "#fff4aa";
    ctx.fillRect(9,9,14,14);
  }

  const texture = new THREE.CanvasTexture(c);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const blockGeometry = new THREE.BoxGeometry(1,1,1);
const materials = {};
for (const [id, def] of Object.entries(BLOCKS)) {
  materials[id] = new THREE.MeshLambertMaterial({
    color: hexToNumber(def.base),
    map: makeTexture(def,id),
    transparent: !!def.transparent,
    opacity: def.opacity ?? 1,
    depthWrite: !def.transparent,
    emissive: def.emissive ? hexToNumber(def.emissive) : 0x000000,
    emissiveIntensity: def.emissive ? 1.25 : 0
  });
}

const world = new Map();
const worldMeshes = [];
const terrainHeights = new Map();
const mobs = [];
const mobMeshes = [];
const particles = [];
let cameraBobOffset = 0;
const projectiles = [];
const waterMeshes = [];
const arenaParts = [];

const key = (x,y,z) => x + "," + y + "," + z;
const terrainKey = (x,z) => x + "," + z;

function addBlock(x,y,z,type,replace=false) {
  x = Math.round(x); y = Math.round(y); z = Math.round(z);
  if (y < 0 || y > 28 || !BLOCKS[type]) return null;
  const k = key(x,y,z);
  if (world.has(k) && !replace) return null;
  if (world.has(k)) removeBlockMesh(world.get(k));
  const mesh = new THREE.Mesh(blockGeometry, materials[type]);
  mesh.position.set(x+.5,y+.5,z+.5);
  mesh.castShadow = type === "wood" || type === "leaves";
  mesh.receiveShadow = true;
  mesh.userData.block = {x,y,z,type};
  scene.add(mesh);
  world.set(k,mesh);
  worldMeshes.push(mesh);
  return mesh;
}

function removeBlockMesh(mesh) {
  const p = mesh?.userData?.block;
  if (!p || (p.type === "stone" && p.y === 0)) return false;
  scene.remove(mesh);
  world.delete(key(p.x,p.y,p.z));
  const i = worldMeshes.indexOf(mesh);
  if (i >= 0) worldMeshes.splice(i,1);
  return true;
}

function noise2(x,z) {
  const s = Math.sin(x*127.1 + z*311.7) * 43758.5453;
  return s - Math.floor(s);
}

function isLake(x,z) {
  const dx=x-12, dz=z-10;
  return dx*dx + dz*dz < 68;
}

function heightAt(x,z) {
  if (isLake(x,z)) return 2;
  const wave = Math.sin(x*.23)*1.35 + Math.cos(z*.21)*1.2;
  const small = Math.sin((x+z)*.49)*.55;
  return THREE.MathUtils.clamp(Math.floor(3.5+wave+small),2,8);
}

function clearWater() {
  for (const m of waterMeshes) scene.remove(m);
  waterMeshes.length = 0;
}

function makeWater() {
  clearWater();
  const waterMat = new THREE.MeshPhongMaterial({
    color:0x4eb7d7,
    transparent:true,
    opacity:.52,
    shininess:120,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(8.2,48), waterMat);
  water.rotation.x = -Math.PI/2;
  water.position.set(12,3.02,10);
  water.userData.water=true;
  scene.add(water);
  waterMeshes.push(water);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(7.8,8.3,48),
    new THREE.MeshBasicMaterial({color:0xa6e4e8,transparent:true,opacity:.24,side:THREE.DoubleSide})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.set(12,3.035,10);
  scene.add(ring);
  waterMeshes.push(ring);
}

function clearWorldMeshes() {
  for (const mesh of [...worldMeshes]) scene.remove(mesh);
  worldMeshes.length = 0;
  world.clear();
  terrainHeights.clear();
}

function buildWorld() {
  clearWorldMeshes();

  const radius = 28;
  for (let x=-radius; x<=radius; x++) {
    for (let z=-radius; z<=radius; z++) {
      const h=heightAt(x,z);
      terrainHeights.set(terrainKey(x,z),h);
      for (let y=0; y<=h; y++) {
        let type;
        if (y===0) type="stone";
        else if (y===h) type=isLake(x,z) ? "sand" : (h<=3 ? "sand" : "grass");
        else type=(y>=h-2 ? "dirt" : "stone");
        addBlock(x,y,z,type);
      }

      if (!isLake(x,z) && noise2(x,z)>.989 && Math.abs(x)>5 && Math.abs(z)>5) {
        const trunk=3 + (noise2(x+7,z+5)>.5 ? 1 : 0);
        for (let y=1;y<=trunk;y++) addBlock(x,y+h,z,"wood");
        for (let dx=-2;dx<=2;dx++) for (let dz=-2;dz<=2;dz++) {
          for (let dy=0;dy<=2;dy++) {
            if (Math.abs(dx)+Math.abs(dz)+dy<=4 && !(dx===0&&dz===0&&dy===0)) addBlock(x+dx,h+trunk+dy,z+dz,"leaves");
          }
        }
      }
    }
  }

  // Creative showcase path.
  for (let z=15; z>=-2; z--) {
    for (const x of [-1,0,1]) {
      const gy=getGroundY(x,z)-1;
      const old=world.get(key(x,gy,z));
      if (old) removeBlockMesh(old);
      addBlock(x,gy,z,"cobble");
    }
  }

  // Small building platform at spawn.
  const baseY=getGroundY(0,16)-1;
  for (let x=-4;x<=4;x++) for (let z=13;z<=19;z++) {
    const gy=getGroundY(x,z)-1;
    if (gy>=0) {
      const old=world.get(key(x,gy,z));
      if (old) removeBlockMesh(old);
      addBlock(x,gy,z,"plank");
    }
  }

  makeWater();
  makeMobArena();
}

function getGroundY(x,z) {
  const cx=THREE.MathUtils.clamp(Math.round(x),-28,28);
  const cz=THREE.MathUtils.clamp(Math.round(z),-28,28);
  for (let y=28;y>=0;y--) {
    const mesh = world.get(key(cx,y,cz));
    if (mesh && mesh.userData.block?.type !== "leaves") return y+1;
  }
  return 1;
}

function makeLamp(x,z,y) {
  addBlock(x,y,z,"glow");
  const light=new THREE.PointLight(0xffca69,1.15,11,2);
  light.position.set(x+.5,y+1.2,z+.5);
  scene.add(light);
  arenaParts.push(light);
}

function makeMobArena() {
  const cx=0, cz=-7, r=6;

  for (const p of arenaParts) scene.remove(p);
  arenaParts.length=0;

  // Carve a deep square pit, leaving the bedrock-like base at y=0.
  for (let x=cx-r; x<=cx+r; x++) {
    for (let z=cz-r; z<=cz+r; z++) {
      const top=getGroundY(x,z)-1;
      for (let y=top;y>=1;y--) {
        const mesh=world.get(key(x,y,z));
        if (mesh) removeBlockMesh(mesh);
      }
      addBlock(x,1,z,"cobble");
    }
  }

  for (let x=cx-r-1;x<=cx+r+1;x++) {
    for (const z of [cz-r-1,cz+r+1]) {
      const gy=Math.max(1,getGroundY(x,z)-1);
      addBlock(x,gy,z,"brick");
      addBlock(x,gy+1,z,"brick");
    }
  }
  for (let z=cz-r;z<=cz+r;z++) {
    for (const x of [cx-r-1,cx+r+1]) {
      const gy=Math.max(1,getGroundY(x,z)-1);
      addBlock(x,gy,z,"brick");
      addBlock(x,gy+1,z,"brick");
    }
  }

  for (const p of [[-7,-14],[7,-14],[-7,0],[7,0]]) {
    const gy=getGroundY(p[0],p[1])-1;
    addBlock(p[0],gy,p[1],"cobble");
    makeLamp(p[0],p[1],gy+1);
  }

  const bannerMat=new THREE.MeshBasicMaterial({color:0x15283a});
  const banner=new THREE.Mesh(new THREE.BoxGeometry(5,.05,2),bannerMat);
  banner.position.set(0,6,-14);
  scene.add(banner);
  arenaParts.push(banner);
}

const selection = new THREE.Mesh(
  new THREE.BoxGeometry(1.045,1.045,1.045),
  new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.9})
);
selection.visible=false;
scene.add(selection);

const placementPreview = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshBasicMaterial({color:0x77d9a0,transparent:true,opacity:.28,depthWrite:false})
);
placementPreview.visible=false;
scene.add(placementPreview);

const raycaster=new THREE.Raycaster();
raycaster.far=14;
const center=new THREE.Vector2(0,0);

function hitWorld() {
  raycaster.setFromCamera(center,camera);
  return raycaster.intersectObjects(worldMeshes,false)[0] || null;
}

function entityFromObject(obj) {
  let cur=obj;
  while(cur) {
    if(cur.userData.entity) return cur.userData.entity;
    cur=cur.parent;
  }
  return null;
}

function hitEntity() {
  raycaster.setFromCamera(center,camera);
  const hits=raycaster.intersectObjects(mobMeshes,true);
  return hits.map(h=>entityFromObject(h.object)).find(Boolean) || null;
}

function selectedLabel(item) {
  if (item.kind==="block") return BLOCKS[item.id];
  if (item.kind==="egg") return EGGS[item.id];
  return {name:item.name || "Creative İtme",icon:item.icon || "✋"};
}

let selected=0;

function renderHotbar() {
  const bar=document.getElementById("hotbar");
  bar.innerHTML="";
  hotbarItems.forEach((item,i)=>{
    const d=selectedLabel(item);
    const slot=document.createElement("div");
    slot.className="slot"+(i===selected?" active":"");
    slot.innerHTML='<span class="num">'+(i+1)+'</span><span class="icon">'+d.icon+'</span><span class="name">'+d.name.replace(" Yumurtası","")+'</span><span class="keyline"></span>';
    slot.onclick=()=>{selected=i;renderHotbar();};
    bar.appendChild(slot);
  });
}

function renderInventory() {
  const grid=document.getElementById("inventory-grid");
  grid.innerHTML="";
  ITEMS.forEach(item=>{
    const d=selectedLabel(item);
    const button=document.createElement("button");
    button.className="inv-slot";
    const action=item.kind==="egg" ? "Sağ tık: yaratık çıkar" : item.kind==="tool" ? "Sol tık: vur + geri it" : "Sağ tık: blok koy";
    button.innerHTML="<strong>"+d.icon+" "+d.name+"</strong><span>"+action+"</span>";
    button.onclick=()=>{
      const idx=hotbarItems.findIndex(h=>h.kind===item.kind&&h.id===item.id);
      if(idx>=0) selected=idx;
      else hotbarItems[selected]={...item, ...(item.kind==="tool"?{name:d.name,icon:d.icon}:{})};
      renderHotbar();
      toggleInventory(false);
      showMessage(d.icon+" "+d.name+" seçildi.");
    };
    grid.appendChild(button);
  });
}

function toggleInventory(force) {
  const inv=document.getElementById("inventory");
  const show=typeof force==="boolean"?force:inv.classList.contains("hidden");
  inv.classList.toggle("hidden",!show);
  if(show) controls.unlock();
}

renderHotbar();
renderInventory();

const keys={};
addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="KeyE"){e.preventDefault();toggleInventory();}
  if(e.code==="Escape"){document.getElementById("inventory").classList.add("hidden");}
  if(/Digit[1-9]/.test(e.code)){
    selected=THREE.MathUtils.clamp(Number(e.code.slice(-1))-1,0,hotbarItems.length-1);
    renderHotbar();
  }
  if(e.code==="KeyP"&&!locked) saveWorld();
  if(e.code==="KeyO"&&!locked) loadWorld();
  if(e.code==="KeyR"&&!locked) resetWorld();
});
addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("wheel",e=>{
  if(!locked)return;
  const dir=e.deltaY>0?1:-1;
  selected=(selected+dir+hotbarItems.length)%hotbarItems.length;
  renderHotbar();
},{passive:true});

const clock=new THREE.Clock();
let elapsed=0;
let spawnTimer=null;
let aiAccumulator=0;
let fpsTimer=0;
let fpsFrames=0;
let currentFps=60;
let bobTime=0;
let lastTarget=null;

function terrainY(x,z){return getGroundY(x,z)+.02;}

function createMobPart(geo,color) {
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));
  m.castShadow=true;
  m.receiveShadow=true;
  return m;
}

function makeEyes(g,color=0x111111) {
  const mat=new THREE.MeshBasicMaterial({color});
  for(const sx of [-.16,.16]) {
    const eye=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.06),mat);
    eye.position.set(sx,1.83,.33);
    g.add(eye);
  }
}

function makeHumanoid(type,color) {
  const g=new THREE.Group();
  const torso=createMobPart(new THREE.BoxGeometry(.72,1,.48),color);
  torso.position.y=1.02;
  g.add(torso);

  const head=createMobPart(new THREE.BoxGeometry(.64,.64,.64),new THREE.Color(color).multiplyScalar(.92));
  head.position.y=1.82;
  g.add(head);
  makeEyes(g,type==="skeleton"?0x242424:0x0a1209);

  const limbMatColor=type==="skeleton"?0xbfc0bb:color;
  const armL=createMobPart(new THREE.BoxGeometry(.22,.82,.22),limbMatColor);
  const armR=armL.clone();
  armL.position.set(-.52,1.02,0);
  armR.position.set(.52,1.02,0);
  armL.userData.limb="arm"; armR.userData.limb="arm";
  g.add(armL,armR);

  const legL=createMobPart(new THREE.BoxGeometry(.24,.82,.24),limbMatColor);
  const legR=legL.clone();
  legL.position.set(-.2,.33,0);
  legR.position.set(.2,.33,0);
  legL.userData.limb="leg"; legR.userData.limb="leg";
  g.add(legL,legR);
  return g;
}

function makeAnimal(type,color) {
  const g=new THREE.Group();
  const body=createMobPart(new THREE.BoxGeometry(type==="cow"?1.05:1.15,.78,.72),color);
  body.position.y=.78;
  g.add(body);

  const head=createMobPart(new THREE.BoxGeometry(.62,.58,.62),new THREE.Color(color).multiplyScalar(.92));
  head.position.set(0,1.22,.58);
  g.add(head);

  const legColor=type==="cow"?0x3b302b:0xd0d0d0;
  for(const x of [-.35,.35]) for(const z of [-.23,.23]) {
    const leg=createMobPart(new THREE.BoxGeometry(.17,.58,.17),legColor);
    leg.position.set(x,.28,z);
    leg.userData.limb="leg";
    g.add(leg);
  }

  if(type==="cow"){
    const hornMat=new THREE.MeshLambertMaterial({color:0xe6dac3});
    for(const x of [-.21,.21]) {
      const horn=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,8),hornMat);
      horn.position.set(x,1.52,.65);
      horn.rotation.z=x<0?.3:-.3;
      g.add(horn);
    }
  }

  const eyeMat=new THREE.MeshBasicMaterial({color:0x161616});
  for(const x of [-.13,.13]){
    const eye=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.05),eyeMat);
    eye.position.set(x,1.31,.88);
    g.add(eye);
  }
  return g;
}

function makeSlime(color) {
  const g=new THREE.Group();
  const mat=new THREE.MeshLambertMaterial({color,transparent:true,opacity:.86});
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.02,.82,1.02),mat);
  body.position.y=.52;
  g.add(body);
  const eyeMat=new THREE.MeshBasicMaterial({color:0x103318});
  for(const x of [-.18,.18]){
    const eye=new THREE.Mesh(new THREE.BoxGeometry(.13,.17,.05),eyeMat);
    eye.position.set(x,.61,.5);
    g.add(eye);
  }
  return g;
}

function makeHealthBar(entity) {
  const canvas=document.createElement("canvas");
  canvas.width=192;canvas.height=34;
  const ctx=canvas.getContext("2d");
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
  sprite.scale.set(1.85,.34,1);
  sprite.position.y=2.55;
  sprite.userData.noRaycast=true;
  sprite.userData.healthSprite=true;
  entity.healthCanvas=canvas;
  entity.healthTexture=texture;
  entity.healthSprite=sprite;
  entity.group.add(sprite);
  updateHealthBar(entity);
}

function updateHealthBar(entity) {
  if(!entity.healthCanvas||!entity.healthTexture)return;
  const ctx=entity.healthCanvas.getContext("2d");
  ctx.clearRect(0,0,192,34);
  ctx.fillStyle="rgba(5,10,14,.78)";
  ctx.roundRect(1,1,190,32,10);ctx.fill();
  const ratio=THREE.MathUtils.clamp(entity.hp/entity.maxHp,0,1);
  ctx.fillStyle=ratio>.5?"#79db9f":ratio>.2?"#e6c95f":"#eb766d";
  ctx.roundRect(9,9,174*ratio,16,7);ctx.fill();
  ctx.fillStyle="#ffffff";
  ctx.font="bold 11px system-ui";
  ctx.textAlign="center";
  ctx.fillText(String(Math.max(0,Math.ceil(entity.hp)))+" / "+entity.maxHp,96,21);
  entity.healthTexture.needsUpdate=true;
}

function spawnMob(type,pos,forced=false) {
  const def=EGGS[type];
  if(!def)return null;
  if(mobs.length>=140&&!forced){
    showMessage("⚠️ Mob limiti: 140");
    return null;
  }

  const entity={
    type, hp:def.hp, maxHp:def.hp, hostile:def.hostile, ranged:!!def.ranged,
    speed:def.speed, damage:def.damage, attackCooldown:.3+Math.random()*.5,
    wander:.5+Math.random()*2.8, dead:false, target:null,
    vx:0,vy:0,vz:0,age:0,pain:0,phase:Math.random()*Math.PI*2
  };

  const g=type==="slime"?makeSlime(def.color):(type==="sheep"||type==="cow"?makeAnimal(type,def.color):makeHumanoid(type,def.color));
  g.position.copy(pos);
  g.userData.entity=entity;
  g.traverse(o=>{
    o.userData.entity=entity;
    if(o.isMesh)o.castShadow=true;
  });
  scene.add(g);
  entity.group=g;
  entity.parts=[...g.children].filter(o=>o.userData.limb);
  mobs.push(entity);
  mobMeshes.push(...g.children.filter(o=>o.isMesh&&!o.userData.healthSprite));
  makeHealthBar(entity);
  return entity;
}

function removeMob(entity) {
  entity.dead=true;
  if(entity.group){
    entity.group.traverse(o=>{
      const i=mobMeshes.indexOf(o);
      if(i>=0)mobMeshes.splice(i,1);
    });
    scene.remove(entity.group);
  }
  const i=mobs.indexOf(entity);
  if(i>=0)mobs.splice(i,1);
}

function spawnParticles(pos,color=0xffffff,count=8,spread=.45) {
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(
      new THREE.BoxGeometry(.08,.08,.08),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95})
    );
    m.position.copy(pos);
    m.userData.particle={
      life:.35+Math.random()*.35,
      max:.7,
      vx:(Math.random()-.5)*spread,
      vy:.9+Math.random()*1.4,
      vz:(Math.random()-.5)*spread
    };
    scene.add(m);
    particles.push(m);
  }
}

function updateParticles(dt) {
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i],d=p.userData.particle;
    d.life-=dt;
    p.position.x+=d.vx*dt;
    p.position.y+=d.vy*dt;
    p.position.z+=d.vz*dt;
    d.vy-=3.5*dt;
    p.rotation.x+=dt*4;
    p.rotation.y+=dt*5;
    p.material.opacity=Math.max(0,d.life/d.max);
    if(d.life<=0){
      scene.remove(p);
      particles.splice(i,1);
    }
  }
}

function damageMob(entity,amount,source="player",knock=new THREE.Vector3()) {
  if(!entity||entity.dead)return;
  entity.hp-=amount;
  entity.pain=.16;
  entity.vx+=knock.x;
  entity.vy=Math.max(entity.vy,knock.y);
  entity.vz+=knock.z;
  entity.group.scale.setScalar(.93);
  setTimeout(()=>{if(entity.group&&!entity.dead)entity.group.scale.setScalar(1)},80);
  updateHealthBar(entity);
  spawnParticles(entity.group.position,EGGS[entity.type].color,5,.35);
  if(source==="player") showMessage(EGGS[entity.type].icon+" geri itildi  •  "+Math.max(0,Math.ceil(entity.hp))+" HP");
  if(entity.hp<=0){
    showMessage(EGGS[entity.type].icon+" "+EGGS[entity.type].name.replace(" Yumurtası","")+" elendi.");
    spawnParticles(entity.group.position,EGGS[entity.type].color,12,.65);
    removeMob(entity);
  }
}

function mobGround(entity) {
  return getGroundY(entity.group.position.x,entity.group.position.z);
}

function mobCanMoveTo(entity,x,z) {
  const current=mobGround(entity);
  const next=getGroundY(x,z);
  const delta=next-current;
  if(delta>1.15)return false;
  const head=world.get(key(Math.round(x),Math.floor(next+1),Math.round(z)));
  return !head;
}

function nearestTarget(entity,maxDistance=14) {
  let target=null,best=maxDistance;
  for(const other of mobs){
    if(other===entity||other.dead||!other.group)continue;
    const d=entity.group.position.distanceTo(other.group.position);
    if(d<best){best=d;target=other;}
  }
  return target;
}

function updateMobPhysics(entity,dt) {
  const p=entity.group.position;
  const ground=mobGround(entity);
  entity.vy-=18*dt;
  p.y+=entity.vy*dt;

  const onGround=p.y<=ground+.06&&entity.vy<=0;
  if(onGround){
    p.y=ground+.03;
    entity.vy=0;
  }

  p.x+=entity.vx*dt;
  p.z+=entity.vz*dt;
  entity.vx*=Math.pow(.04,dt);
  entity.vz*=Math.pow(.04,dt);

  p.x=THREE.MathUtils.clamp(p.x,-27.5,27.5);
  p.z=THREE.MathUtils.clamp(p.z,-27.5,27.5);

  if(p.y<-2){
    showMessage(EGGS[entity.type].icon+" çukura düştü!");
    removeMob(entity);
  }
}

function fireProjectile(from,to,owner) {
  const dir=to.clone().sub(from).normalize();
  const m=new THREE.Mesh(
    new THREE.SphereGeometry(.09,8,8),
    new THREE.MeshBasicMaterial({color:0xf3f1de})
  );
  m.position.copy(from);
  scene.add(m);
  projectiles.push({mesh:m,dir,speed:12,life:1.8,owner});
}

function updateProjectiles(dt) {
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.life-=dt;
    p.mesh.position.addScaledVector(p.dir,p.speed*dt);
    let hit=null;
    for(const m of mobs){
      if(m===p.owner||m.dead)continue;
      if(m.group.position.distanceTo(p.mesh.position)<.65){hit=m;break;}
    }
    if(hit){
      const k=p.dir.clone().multiplyScalar(1.6);
      damageMob(hit,p.owner.damage,p.owner.type,k);
      scene.remove(p.mesh);
      projectiles.splice(i,1);
      continue;
    }
    if(p.life<=0){
      scene.remove(p.mesh);
      projectiles.splice(i,1);
    }
  }
}

function animateMob(entity,dt) {
  entity.age+=dt;
  const walk=Math.sin(entity.age*8+entity.phase);
  for(const part of entity.parts||[]){
    if(part.userData.limb==="arm")part.rotation.x=walk*.28;
    if(part.userData.limb==="leg")part.rotation.x=-walk*.28;
  }
  if(entity.type==="slime"){
    const s=1+Math.sin(entity.age*5+entity.phase)*.045;
    entity.group.scale.set(1+(1-s)*.55,s,1+(1-s)*.55);
  }
  if(entity.healthSprite)entity.healthSprite.quaternion.copy(camera.quaternion);
}

function updateMobs(dt) {
  aiAccumulator-=dt;
  if(aiAccumulator>0)return;
  aiAccumulator=.1;

  for(const mob of [...mobs]){
    if(mob.dead||!mob.group)continue;
    mob.attackCooldown=Math.max(0,mob.attackCooldown-.1);
    mob.wander=Math.max(0,mob.wander-.1);
    mob.age+=.1;

    updateMobPhysics(mob,.1);
    if(mob.dead)continue;

    const p=mob.group.position;
    const target=mob.hostile?nearestTarget(mob,14):nearestTarget(mob,4.5);
    mob.target=target;

    if(target){
      const tp=target.group.position;
      const dx=tp.x-p.x,dz=tp.z-p.z;
      const dist=Math.max(.001,Math.hypot(dx,dz));

      if(mob.hostile){
        if(mob.ranged&&dist<10&&dist>3){
          mob.group.rotation.y=Math.atan2(dx,dz);
          if(mob.attackCooldown<=0){
            fireProjectile(new THREE.Vector3(p.x,p.y+1.4,p.z),new THREE.Vector3(tp.x,tp.y+1,tp.z),mob);
            mob.attackCooldown=1.25;
          }
        } else if(dist>1.35){
          const nx=p.x+(dx/dist)*mob.speed*.11;
          const nz=p.z+(dz/dist)*mob.speed*.11;
          if(mobCanMoveTo(mob,nx,nz)){p.x=nx;p.z=nz}
          else mob.vy=Math.max(mob.vy,6.5);
          mob.group.rotation.y=Math.atan2(dx,dz);
        } else if(mob.attackCooldown<=0){
          const k=new THREE.Vector3(dx/dist*.7, .5, dz/dist*.7);
          damageMob(target,mob.damage,mob.type,k);
          mob.attackCooldown=mob.type==="skeleton"?1.05:.82;
        }
      } else if(dist<4.5){
        const nx=p.x-(dx/dist)*mob.speed*.13;
        const nz=p.z-(dz/dist)*mob.speed*.13;
        if(mobCanMoveTo(mob,nx,nz)){p.x=nx;p.z=nz}
      }
    } else if(mob.wander<=0){
      mob.wander=1.8+Math.random()*3;
      mob.group.rotation.y=Math.random()*Math.PI*2;
    } else {
      const nx=p.x+Math.sin(mob.group.rotation.y)*mob.speed*.055;
      const nz=p.z+Math.cos(mob.group.rotation.y)*mob.speed*.055;
      if(mobCanMoveTo(mob,nx,nz)){p.x=nx;p.z=nz}
    }

    animateMob(mob,.1);
  }
}

function updateWorldAnimations(dt) {
  for(const water of waterMeshes){
    water.rotation.z += dt*.025;
    water.position.y=3.02+Math.sin(elapsed*1.7)*.015;
  }
  cloudGroup.position.x=Math.sin(elapsed*.005)*5;
}

function updateSky(t) {
  const phase=(t*.035)%(Math.PI*2);
  const daylight=THREE.MathUtils.clamp((Math.sin(phase)+.2)/1.2,.06,1);
  const dawn=THREE.MathUtils.clamp((daylight-.08)/.92,0,1);

  sun.position.set(Math.cos(phase)*42,Math.sin(phase)*42+10,18);
  sun.intensity=.25+dawn*2.45;
  hemi.intensity=.45+dawn*1.45;
  moonLight.intensity=(1-dawn)*.75;
  campLight.intensity=(1-dawn)*1.4;

  const dayColor=new THREE.Color(0x8cd4f5);
  const nightColor=new THREE.Color(0x0b1326);
  const duskColor=new THREE.Color(0xc57e78);
  let sky;
  if(dawn<.25) sky=nightColor.clone().lerp(duskColor,dawn/.25);
  else sky=duskColor.clone().lerp(dayColor,(dawn-.25)/.75);
  scene.background.copy(sky);
  scene.fog.color.copy(sky);

  stars.material.opacity=(1-dawn)*.92;
  moon.material.opacity=(1-dawn)*.95;
  moon.position.set(Math.cos(phase+Math.PI)*48,Math.sin(phase+Math.PI)*30+28, -25);
}

function updatePlayer(dt) {
  if(!locked)return;

  const sprint=keys.ShiftLeft||keys.ShiftRight;
  const speed=(sprint?13:7.4)*dt;
  if(keys.KeyW)controls.moveForward(speed);
  if(keys.KeyS)controls.moveForward(-speed);
  if(keys.KeyA)controls.moveRight(-speed);
  if(keys.KeyD)controls.moveRight(speed);
  if(keys.Space)camera.position.y+=8.5*dt;
  if(sprint)camera.position.y-=8.5*dt;

  camera.position.x=THREE.MathUtils.clamp(camera.position.x,-31,31);
  camera.position.z=THREE.MathUtils.clamp(camera.position.z,-31,31);
  camera.position.y=THREE.MathUtils.clamp(camera.position.y,1.2,42);

  const moving=keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD;
  if(moving){
    bobTime+=dt*(sprint?11:8);
    const nextBob=Math.sin(bobTime)*.025;
    camera.position.y += nextBob-cameraBobOffset;
    cameraBobOffset=nextBob;
  } else if(cameraBobOffset!==0){
    camera.position.y -= cameraBobOffset;
    cameraBobOffset=0;
  }
}

function placementData() {
  const hit=hitWorld();
  if(!hit)return null;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const b=hit.object.userData.block;
  return {hit,normal,b,x:b.x+Math.round(normal.x),y:b.y+Math.round(normal.y),z:b.z+Math.round(normal.z)};
}

function updateSelection() {
  if(!locked){
    selection.visible=false;
    placementPreview.visible=false;
    document.getElementById("target-name").style.opacity="0";
    return;
  }

  const hit=hitWorld();
  if(hit){
    selection.visible=true;
    selection.position.copy(hit.object.position);
  } else selection.visible=false;

  const entity=hitEntity();
  const target=document.getElementById("target-name");
  if(entity){
    target.textContent=EGGS[entity.type].icon+" "+EGGS[entity.type].name.replace(" Yumurtası","")+"  •  "+Math.ceil(entity.hp)+" HP";
    target.style.opacity="1";
  } else target.style.opacity="0";

  const item=hotbarItems[selected];
  const p=placementData();
  if(item.kind==="block"&&p&&p.y>=0&&p.y<=28){
    placementPreview.visible=true;
    placementPreview.position.set(p.x+.5,p.y+.5,p.z+.5);
  } else placementPreview.visible=false;
}

function performAction(button) {
  if(!locked)return;
  const item=hotbarItems[selected];
  const worldHit=hitWorld();
  const entity=hitEntity();

  if(button===0){
    if(entity){
      const itemPower=item.kind==="tool"?14:8;
      const forward=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).normalize();
      damageMob(entity,itemPower,"player",new THREE.Vector3(forward.x*5,3.6,forward.z*5));
      return;
    }
    if(worldHit){
      if(removeBlockMesh(worldHit.object)){
        const p=worldHit.object.position.clone();
        spawnParticles(p,BLOCKS[worldHit.object.userData.block.type]?.base ? hexToNumber(BLOCKS[worldHit.object.userData.block.type].base):0xffffff,8,.55);
        showMessage("🧱 Blok kırıldı.");
      }
    }
    return;
  }

  if(button===2){
    const p=placementData();
    if(!p)return;

    if(item.kind==="egg"){
      const spawn=new THREE.Vector3(p.x+.5,p.y+.04,p.z+.5);
      spawnMob(item.id,spawn);
      showMessage(EGGS[item.id].icon+" spawn!");
      return;
    }

    if(item.kind==="tool")return;

    if(!world.has(key(p.x,p.y,p.z))){
      addBlock(p.x,p.y,p.z,item.id);
      spawnParticles(new THREE.Vector3(p.x+.5,p.y+.5,p.z+.5),hexToNumber(BLOCKS[item.id].base),5,.24);
      showMessage(BLOCKS[item.id].icon+" "+BLOCKS[item.id].name+" koyuldu.");
    }
  }
}

document.body.addEventListener("mousedown",e=>{
  if(!locked)return;
  if(e.button===0)performAction(0);
  if(e.button===2){
    performAction(2);
    clearInterval(spawnTimer);
    const item=hotbarItems[selected];
    if(item.kind==="egg")spawnTimer=setInterval(()=>performAction(2),220);
  }
});

addEventListener("mouseup",e=>{
  if(e.button===2){clearInterval(spawnTimer);spawnTimer=null}
});
document.addEventListener("contextmenu",e=>e.preventDefault());

function saveWorld() {
  try{
    const data=[...world.values()].map(m=>{
      const b=m.userData.block;return[b.x,b.y,b.z,b.type];
    });
    localStorage.setItem("erdemcraft-beta-save",JSON.stringify(data));
    showMessage("💾 Dünya kaydedildi.");
  }catch{showMessage("⚠️ Kayıt başarısız.");}
}

function loadWorld() {
  try{
    const raw=localStorage.getItem("erdemcraft-beta-save");
    if(!raw){showMessage("ℹ️ Henüz kayıt yok.");return}
    clearWorldMeshes();
    clearWater();
    JSON.parse(raw).forEach(([x,y,z,type])=>addBlock(x,y,z,type));
    makeWater();
    makeMobArena();
    showMessage("📂 Dünya yüklendi.");
  }catch{showMessage("⚠️ Kayıt okunamadı.");}
}

function clearAllMobs() {
  for(const mob of [...mobs])removeMob(mob);
  for(const p of [...projectiles])scene.remove(p.mesh);
  projectiles.length=0;
}

function resetWorld() {
  clearAllMobs();
  buildWorld();
  spawnDemoMobs();
  showMessage("↻ Yeni dünya oluşturuldu.");
}

function spawnDemoMobs() {
  clearAllMobs();
  const spots=[
    ["zombie",-3,-7],
    ["skeleton",3,-7],
    ["slime",0,-4],
    ["sheep",-5,3],
    ["cow",5,4]
  ];
  for(const [type,x,z] of spots){
    const y=terrainY(x,z);
    spawnMob(type,new THREE.Vector3(x+.5,y,z+.5),true);
  }
  // A second small battle starts near the lake so the world feels alive.
  spawnMob("zombie",new THREE.Vector3(13.5,terrainY(13,12),12.5),true);
  spawnMob("slime",new THREE.Vector3(15.5,terrainY(15,12),12.5),true);
}

function updateHUD() {
  const item=selectedLabel(hotbarItems[selected]);
  const phase=((elapsed*.035)%(Math.PI*2));
  const d=(Math.sin(phase)+.2)/1.2;
  const timeText=d>.6?"Gündüz":d>.22?"Akşam":"Gece";
  document.getElementById("stats").textContent=
    "🌍 Creative Beta  •  👾 "+mobs.length+"/140 mob  •  "+timeText+"  •  "+Math.round(currentFps)+" FPS";
  document.getElementById("status").textContent=
    locked ? "Seçili: "+item.icon+" "+item.name : "Fareyi kilitlemek için ekrana tıkla.";
}

function showMessage(text){
  const el=document.getElementById("message");
  el.textContent=text;
  el.classList.add("show");
  clearTimeout(showMessage.t);
  showMessage.t=setTimeout(()=>el.classList.remove("show"),1200);
}

document.getElementById("play").onclick=()=>controls.lock();
document.getElementById("close-inventory").onclick=()=>toggleInventory(false);
document.getElementById("save-btn").onclick=()=>saveWorld();
document.getElementById("load-btn").onclick=()=>loadWorld();
document.getElementById("reset-btn").onclick=()=>resetWorld();

buildWorld();
spawnDemoMobs();
camera.position.y=getGroundY(0,16)+6;

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  elapsed+=dt;

  fpsFrames++;
  fpsTimer+=dt;
  if(fpsTimer>=.5){
    currentFps=fpsFrames/fpsTimer;
    fpsFrames=0;fpsTimer=0;
  }

  updatePlayer(dt);
  updateMobs(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateWorldAnimations(dt);
  updateSky(elapsed);
  updateSelection();
  updateHUD();
  renderer.render(scene,camera);
}

animate();
