import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 28, 95);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 160);
camera.position.set(0, 8, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

let locked = false;
let yaw = 0;
let pitch = 0;

const controls = {
  get isLocked() { return locked; },
  lock() {
    renderer.domElement.requestPointerLock();
  },
  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
    locked = false;
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
  if (locked) {
    start.classList.add("hidden");
    document.getElementById("status").textContent = "CREATIVE aktif — uçabilir ve sınırsız blok/yumurta kullanabilirsin.";
  } else {
    document.getElementById("status").textContent = "Oyun duraklatıldı. Devam etmek için ekrana tıkla.";
  }
});

document.addEventListener("mousemove", (e) => {
  if (!locked) return;
  yaw -= e.movementX * 0.0025;
  pitch -= e.movementY * 0.0025;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

scene.add(new THREE.HemisphereLight(0xddeeff, 0x334422, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(20, 35, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

const BLOCKS = {
  grass: { name:"Çimen", icon:"🟩", color:0x55a630 },
  dirt: { name:"Toprak", icon:"🟫", color:0x8f5b34 },
  stone: { name:"Taş", icon:"⬜", color:0x7b8088 },
  wood: { name:"Kütük", icon:"🪵", color:0x9a6338 },
  leaves: { name:"Yaprak", icon:"🌿", color:0x2f7d32, transparent:true, opacity:.92 },
  sand: { name:"Kum", icon:"🟨", color:0xd9c27a },
  glass: { name:"Cam", icon:"🔷", color:0x9fe8ff, transparent:true, opacity:.28 },
  brick: { name:"Tuğla", icon:"🧱", color:0xa84533 },
  glow: { name:"Işık bloğu", icon:"💡", color:0xffd45c, emissive:0x8a5d00 }
};

const EGGS = {
  zombie: { name:"Zombi Yumurtası", icon:"🧟", color:0x4c8c43, hostile:true },
  skeleton: { name:"İskelet Yumurtası", icon:"💀", color:0xd7d1c3, hostile:true },
  sheep: { name:"Koyun Yumurtası", icon:"🐑", color:0xe7e7e7, hostile:false },
  cow: { name:"İnek Yumurtası", icon:"🐄", color:0x4d3d35, hostile:false }
};

const ITEMS = [
  ...Object.keys(BLOCKS).map(id => ({ id, kind:"block", ...BLOCKS[id] })),
  ...Object.keys(EGGS).map(id => ({ id, kind:"egg", ...EGGS[id] }))
];

const hotbarItems = [
  {kind:"block", id:"grass"}, {kind:"block", id:"dirt"}, {kind:"block", id:"stone"},
  {kind:"block", id:"wood"}, {kind:"block", id:"glass"},
  {kind:"egg", id:"zombie"}, {kind:"egg", id:"skeleton"},
  {kind:"egg", id:"sheep"}, {kind:"egg", id:"cow"}
];

const blockGeometry = new THREE.BoxGeometry(1,1,1);
const materials = {};
for (const [id, def] of Object.entries(BLOCKS)) {
  materials[id] = new THREE.MeshLambertMaterial({
    color:def.color,
    transparent:!!def.transparent,
    opacity:def.opacity ?? 1,
    emissive:def.emissive ?? 0x000000,
    emissiveIntensity:def.emissive ? .8 : 0
  });
}

const world = new Map();
const worldMeshes = [];
const terrainHeights = new Map();
const mobs = [];
const mobMeshes = [];

const key = (x,y,z) => x + "," + y + "," + z;
const terrainKey = (x,z) => x + "," + z;

function addBlock(x,y,z,type, replace=false) {
  if (y < 0 || y > 24) return null;
  const k = key(x,y,z);
  if (world.has(k) && !replace) return null;
  if (world.has(k) && replace) removeBlockMesh(world.get(k));
  const mesh = new THREE.Mesh(blockGeometry, materials[type] || materials.grass);
  mesh.position.set(x + .5, y + .5, z + .5);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.block = {x,y,z,type};
  scene.add(mesh);
  world.set(k, mesh);
  worldMeshes.push(mesh);
  return mesh;
}

function removeBlockMesh(mesh) {
  const p = mesh.userData.block;
  if (!p || p.type === "stone" && p.y === 0) return false;
  scene.remove(mesh);
  world.delete(key(p.x,p.y,p.z));
  const i = worldMeshes.indexOf(mesh);
  if (i >= 0) worldMeshes.splice(i,1);
  return true;
}

function noise2(x,z) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function heightAt(x,z) {
  const wave = Math.sin(x * .28) * 1.15 + Math.cos(z * .24) * 1.1;
  const small = Math.sin((x+z) * .55) * .55;
  return Math.max(2, Math.min(7, Math.floor(3.3 + wave + small)));
}

function buildWorld() {
  const radius = 24;
  for (let x=-radius; x<=radius; x++) {
    for (let z=-radius; z<=radius; z++) {
      const h = heightAt(x,z);
      terrainHeights.set(terrainKey(x,z), h);
      for (let y=0; y<=h; y++) {
        let type = y === 0 ? "stone" : y === h ? (h <= 3 ? "sand" : "grass") : (y >= h-2 ? "dirt" : "stone");
        addBlock(x,y,z,type);
      }
      if (noise2(x,z) > .985 && h >= 4 && Math.abs(x) > 3 && Math.abs(z) > 3) {
        for (let y=1; y<=3; y++) addBlock(x,y+h,z,"wood");
        for (let dx=-1; dx<=1; dx++) for (let dz=-1; dz<=1; dz++) {
          for (let dy=3; dy<=4; dy++) {
            if (Math.abs(dx)+Math.abs(dz) < 3) addBlock(x+dx,h+dy,z+dz,"leaves");
          }
        }
      }
    }
  }
}

buildWorld();

const selection = new THREE.Mesh(
  new THREE.BoxGeometry(1.03,1.03,1.03),
  new THREE.MeshBasicMaterial({color:0xffffff, wireframe:true, transparent:true, opacity:.8})
);
selection.visible = false;
scene.add(selection);

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0,0);

function hitWorld() {
  raycaster.setFromCamera(center, camera);
  return raycaster.intersectObjects(worldMeshes, false)[0] || null;
}

function entityFromObject(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData.entity) return cur.userData.entity;
    cur = cur.parent;
  }
  return null;
}

function hitEntity() {
  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(mobMeshes, true);
  return hits.map(h => entityFromObject(h.object)).find(Boolean) || null;
}

function updateSelection() {
  const hit = hitWorld();
  if (!hit) { selection.visible = false; return; }
  selection.visible = true;
  selection.position.copy(hit.object.position);
}

let selected = 0;
function itemLabel(item) {
  return item.kind === "block" ? BLOCKS[item.id] : EGGS[item.id];
}
function renderHotbar() {
  const hotbar = document.getElementById("hotbar");
  hotbar.innerHTML = "";
  hotbarItems.forEach((item,i) => {
    const d = itemLabel(item);
    const slot = document.createElement("div");
    slot.className = "slot" + (i === selected ? " active" : "");
    slot.innerHTML = '<span class="num">' + (i+1) + '</span><span class="icon">' + d.icon + '</span><span class="name">' + d.name.replace(" Yumurtası","") + '</span>';
    slot.onclick = () => { selected=i; renderHotbar(); };
    hotbar.appendChild(slot);
  });
}
renderHotbar();

function renderInventory() {
  const grid = document.getElementById("inventory-grid");
  grid.innerHTML = "";
  ITEMS.forEach((item,i) => {
    const d = itemLabel(item);
    const b = document.createElement("button");
    b.className = "inv-slot";
    b.innerHTML = '<strong>' + d.icon + ' ' + d.name + '</strong><span>' + (item.kind === "egg" ? "Sağ tık: yaratık çıkar" : "Sağ tık: blok koy") + '</span>';
    b.onclick = () => {
      const hot = hotbarItems.findIndex(h => h.kind === item.kind && h.id === item.id);
      if (hot >= 0) selected = hot;
      else { hotbarItems[selected] = {...item}; }
      renderHotbar();
      toggleInventory(false);
    };
    grid.appendChild(b);
  });
}
renderInventory();

function toggleInventory(force) {
  const inv = document.getElementById("inventory");
  const show = typeof force === "boolean" ? force : inv.classList.contains("hidden");
  inv.classList.toggle("hidden", !show);
  if (show) controls.unlock();
}
document.getElementById("close-inventory").onclick = () => toggleInventory(false);

const keys = {};
addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "KeyE") { e.preventDefault(); toggleInventory(); }
  if (/Digit[1-9]/.test(e.code)) { selected = Number(e.code.slice(-1))-1; renderHotbar(); }
});
addEventListener("keyup", e => keys[e.code] = false);

const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();

function terrainY(x,z) {
  return (terrainHeights.get(terrainKey(Math.round(x), Math.round(z))) ?? 3) + .85;
}

function makeMobPart(geo, color, y) {
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({color}));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function spawnMob(type, pos) {
  const def = EGGS[type];
  if (!def) return;
  const entity = {
    type, hp: 20, maxHp:20, hostile:def.hostile, speed:def.hostile?1.35:.75,
    attackCooldown:0, wander:Math.random()*5, dead:false, group:null, target:null
  };
  const g = new THREE.Group();
  g.position.copy(pos);
  g.userData.entity = entity;
  const color = def.color;
  const body = makeMobPart(new THREE.BoxGeometry(.8,1.0,.6), color, .95);
  body.userData.entity = entity;
  const head = makeMobPart(new THREE.BoxGeometry(.62,.62,.62), new THREE.Color(color).multiplyScalar(.9), 1.72);
  head.userData.entity = entity;
  g.add(body, head);
  if (type === "skeleton") {
    const eyeMat = new THREE.MeshBasicMaterial({color:0x111111});
    for (const sx of [-.16,.16]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08), eyeMat);
      eye.position.set(sx,1.8,.30);
      eye.userData.entity = entity;
      g.add(eye);
    }
  }
  scene.add(g);
  entity.group = g;
  mobs.push(entity);
  mobMeshes.push(...g.children);
  showMessage(def.icon + " " + def.name + " çıktı!");
  return entity;
}

function removeMob(entity) {
  entity.dead = true;
  if (entity.group) {
    entity.group.traverse(o => {
      const i = mobMeshes.indexOf(o);
      if (i >= 0) mobMeshes.splice(i,1);
    });
    scene.remove(entity.group);
  }
  const i = mobs.indexOf(entity);
  if (i >= 0) mobs.splice(i,1);
}

function damageMob(entity, amount, source="oyuncu") {
  if (!entity || entity.dead) return;
  entity.hp -= amount;
  entity.group.scale.setScalar(.88);
  setTimeout(() => { if (entity.group && !entity.dead) entity.group.scale.setScalar(1); }, 90);
  if (entity.hp <= 0) {
    showMessage(EGGS[entity.type].icon + " " + EGGS[entity.type].name.replace(" Yumurtası","") + " yenildi.");
    removeMob(entity);
  }
}

let aiTick = 0;
function updateMobs(dt) {
  aiTick -= dt;
  if (aiTick > 0) return;
  aiTick = .18;

  for (const mob of [...mobs]) {
    if (mob.dead) continue;
    mob.attackCooldown = Math.max(0, mob.attackCooldown - .18);

    if (mob.hostile) {
      let best = null, bestDist = 999;
      for (const other of mobs) {
        if (other === mob || other.dead) continue;
        const d = mob.group.position.distanceTo(other.group.position);
        if (d < bestDist) { best = other; bestDist = d; }
      }
      mob.target = bestDist < 13 ? best : null;
    } else {
      mob.target = null;
    }

    const p = mob.group.position;
    if (mob.target && mob.target.group) {
      const t = mob.target.group.position;
      const dx = t.x-p.x, dz=t.z-p.z;
      const dist = Math.hypot(dx,dz);
      if (dist > 1.45) {
        p.x += (dx/dist) * mob.speed * .18;
        p.z += (dz/dist) * mob.speed * .18;
        mob.group.rotation.y = Math.atan2(dx,dz);
      } else if (mob.attackCooldown <= 0) {
        damageMob(mob.target, mob.type === "skeleton" ? 5 : 7, mob.type);
        mob.attackCooldown = .9;
      }
    } else if (!mob.hostile) {
      mob.wander -= .18;
      if (mob.wander <= 0) { mob.wander = 2 + Math.random()*3; mob.group.rotation.y = Math.random()*Math.PI*2; }
      p.x += Math.sin(mob.group.rotation.y) * mob.speed * .05;
      p.z += Math.cos(mob.group.rotation.y) * mob.speed * .05;
    }
    p.x = THREE.MathUtils.clamp(p.x, -23, 23);
    p.z = THREE.MathUtils.clamp(p.z, -23, 23);
    p.y = terrainY(p.x,p.z);
  }
}

let spawnTimer = null;
function performAction(button) {
  if (!controls.isLocked) return;
  const item = hotbarItems[selected];
  const worldHit = hitWorld();
  const entity = hitEntity();

  if (button === 0) {
    if (entity) { damageMob(entity, 8); return; }
    if (worldHit) {
      if (removeBlockMesh(worldHit.object)) showMessage("Blok kırıldı.");
    }
    return;
  }

  if (button === 2) {
    if (!worldHit) return;
    if (item.kind === "egg") {
      const n = worldHit.object.userData.block;
      const normal = worldHit.face.normal.clone().transformDirection(worldHit.object.matrixWorld).normalize();
      const spawn = new THREE.Vector3(n.x + .5 + normal.x, n.y + 1.01 + normal.y, n.z + .5 + normal.z);
      spawnMob(item.id, spawn);
      return;
    }
    const normal = worldHit.face.normal.clone().transformDirection(worldHit.object.matrixWorld).normalize();
    const n = worldHit.object.userData.block;
    const x = n.x + Math.round(normal.x), y=n.y+Math.round(normal.y), z=n.z+Math.round(normal.z);
    if (!world.has(key(x,y,z))) { addBlock(x,y,z,item.id); showMessage(itemLabel(item).name + " koyuldu."); }
  }
}

document.body.addEventListener("mousedown", e => {
  if (!controls.isLocked) return;
  if (e.button === 0) performAction(0);
  if (e.button === 2) {
    performAction(2);
    clearInterval(spawnTimer);
    spawnTimer = setInterval(() => performAction(2), 180);
  }
});
addEventListener("mouseup", e => {
  if (e.button === 2) { clearInterval(spawnTimer); spawnTimer=null; }
});
document.addEventListener("contextmenu", e => e.preventDefault());

function updatePlayer(dt) {
  if (!controls.isLocked) return;
  const speed = (keys.ShiftLeft || keys.ShiftRight ? 12 : 7) * dt;
  if (keys.KeyW) controls.moveForward(speed);
  if (keys.KeyS) controls.moveForward(-speed);
  if (keys.KeyA) controls.moveRight(-speed);
  if (keys.KeyD) controls.moveRight(speed);
  if (keys.Space) camera.position.y += 8*dt;
  if (keys.ShiftLeft || keys.ShiftRight) camera.position.y -= 8*dt;
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1, 35);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -30, 30);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -30, 30);
}

function showMessage(text) {
  const el = document.getElementById("message");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(showMessage.t);
  showMessage.t = setTimeout(() => el.classList.remove("show"), 1100);
}

const start = document.getElementById("start-screen");
document.getElementById("play").onclick = () => controls.lock();

addEventListener("resize", () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  updatePlayer(dt);
  updateMobs(dt);
  if (controls.isLocked) updateSelection();
  renderer.render(scene,camera);
}
animate();
