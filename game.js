import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   ERDEMCRAFT — CREATIVE BETA 2
   Original voxel sandbox. Inspired by the genre, not using
   Minecraft source code, assets or proprietary files.
   ========================================================= */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(76, innerWidth / innerHeight, 0.05, 220);
camera.position.set(0, 11, 18);
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
let elapsed = 0;
let selected = 0;
let lastPortalTime = -10;

const keys = Object.create(null);
const clock = new THREE.Clock();

function resetKeys() {
  for (const k of Object.keys(keys)) delete keys[k];
}

const controls = {
  lock() {
    if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock();
  },
  unlock() {
    if (document.pointerLockElement) document.exitPointerLock();
    resetKeys();
  },
  forward(distance) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    camera.position.addScaledVector(dir, distance);
  },
  right(distance) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
    camera.position.addScaledVector(right, distance);
  }
};

document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === renderer.domElement;
  resetKeys();
  const status = document.getElementById("status");
  if (locked) {
    document.getElementById("start-screen").classList.add("hidden");
    status.textContent = "CREATIVE aktif — W her zaman baktığın yöne götürür.";
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

addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "KeyE") { e.preventDefault(); toggleInventory(); }
  if (e.code === "Escape" && !document.getElementById("inventory").classList.contains("hidden")) {
    e.preventDefault();
    toggleInventory(false);
  }
  if (/Digit[1-9]/.test(e.code)) {
    selected = Number(e.code.slice(-1)) - 1;
    renderHotbar();
  }
  if (e.code === "KeyP" && !locked) saveWorld();
  if (e.code === "KeyO" && !locked) loadWorld();
  if (e.code === "KeyR" && !locked) resetWorld();
});

addEventListener("keyup", e => { keys[e.code] = false; });

const hemi = new THREE.HemisphereLight(0xdff4ff, 0x253223, 1.75);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4d4, 2.6);
sun.position.set(25, 44, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -55;
sun.shadow.camera.right = 55;
sun.shadow.camera.top = 55;
sun.shadow.camera.bottom = -55;
scene.add(sun);

const moonLight = new THREE.DirectionalLight(0x758fc5, 0);
moonLight.position.set(-30, 25, -20);
scene.add(moonLight);

const ambientGlow = new THREE.PointLight(0xffcf70, 0, 18, 2);
ambientGlow.position.set(0, 5, -10);
scene.add(ambientGlow);

const stars = new THREE.Points(
  new THREE.BufferGeometry(),
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.62, transparent: true, opacity: 0 })
);
const starPositions = [];
for (let i = 0; i < 1000; i++) {
  const radius = 72 + Math.random() * 30;
  const a = Math.random() * Math.PI * 2;
  starPositions.push(Math.cos(a) * radius, 18 + Math.random() * 55, Math.sin(a) * radius);
}
stars.geometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
scene.add(stars);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4.5, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xf2f1d4, transparent: true, opacity: 0 })
);
scene.add(moon);

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

function addCloud(x, y, z, scale) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
  const parts = [[-1.8,0,0,2.8,.6,1.2],[0,.2,0,3.6,.85,1.5],[1.9,0,0,2.4,.6,1.2],[.5,.55,0,1.8,.8,1.1]];
  for (const p of parts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(p[3], p[4], p[5]), mat);
    m.position.set(p[0], p[1], p[2]);
    g.add(m);
  }
  g.position.set(x,y,z);
  g.scale.setScalar(scale);
  cloudGroup.add(g);
}
addCloud(-28,29,-24,1.1);
addCloud(10,31,-40,1.4);
addCloud(37,27,-4,.9);
addCloud(-42,34,15,1.5);

/* ----------------------------- BLOCKS ----------------------------- */

const BLOCKS = {
  grass:{name:"Çimen",icon:"🟩",base:"#5daa42",accent:"#3e842d"},
  dirt:{name:"Toprak",icon:"🟫",base:"#8b5b39",accent:"#6b432a"},
  stone:{name:"Taş",icon:"⬜",base:"#81898f",accent:"#697177"},
  cobble:{name:"Kırık Taş",icon:"🔳",base:"#666f76",accent:"#4f565c"},
  deepslate:{name:"Derin Kayrak",icon:"⬛",base:"#40474e",accent:"#31363b"},
  gravel:{name:"Çakıl",icon:"▫️",base:"#938c82",accent:"#716b64"},
  sand:{name:"Kum",icon:"🟨",base:"#dec681",accent:"#c2a863"},
  red_sand:{name:"Kızıl Kum",icon:"🟧",base:"#c66f4c",accent:"#9e5038"},
  sandstone:{name:"Kumtaşı",icon:"🟨",base:"#d8c07e",accent:"#b8a15f"},
  red_sandstone:{name:"Kızıl Kumtaşı",icon:"🟥",base:"#b95c3e",accent:"#8f3e2c"},
  clay:{name:"Kil",icon:"🟤",base:"#ad9891",accent:"#887672"},
  mud:{name:"Çamur",icon:"🟫",base:"#5d554f",accent:"#47413d"},
  snow:{name:"Kar",icon:"⬜",base:"#eff6fa",accent:"#d5e2e8"},
  ice:{name:"Buz",icon:"🧊",base:"#9be0ed",accent:"#6bbbc9",transparent:true,opacity:.76},
  packed_ice:{name:"Sıkı Buz",icon:"🧊",base:"#73bfd3",accent:"#5ca2b6"},
  obsidian:{name:"Obsidyen",icon:"⬛",base:"#21172d",accent:"#3b2651"},
  bedrock:{name:"Ana Kaya",icon:"◼️",base:"#252a2e",accent:"#171b1e"},
  oak_log:{name:"Meşe Kütüğü",icon:"🪵",base:"#8e653e",accent:"#604225"},
  birch_log:{name:"Huş Kütüğü",icon:"🪵",base:"#d8d0b7",accent:"#a89e83"},
  spruce_log:{name:"Ladin Kütüğü",icon:"🪵",base:"#705039",accent:"#4d3426"},
  oak_planks:{name:"Meşe Tahtası",icon:"🟨",base:"#b98149",accent:"#8b5c32"},
  birch_planks:{name:"Huş Tahtası",icon:"🟨",base:"#d8c994",accent:"#afa36e"},
  spruce_planks:{name:"Ladin Tahtası",icon:"🟫",base:"#8e613d",accent:"#684326"},
  leaves:{name:"Yaprak",icon:"🌿",base:"#327c39",accent:"#235b2b",transparent:true,opacity:.94},
  glass:{name:"Cam",icon:"🔷",base:"#a9e8fa",accent:"#70c6db",transparent:true,opacity:.25},
  glass_purple:{name:"Mor Cam",icon:"🟪",base:"#b78bd8",accent:"#8056aa",transparent:true,opacity:.28},
  brick:{name:"Tuğla",icon:"🧱",base:"#ad4c39",accent:"#7d3328"},
  stone_brick:{name:"Taş Tuğla",icon:"🧱",base:"#6c7478",accent:"#4e5559"},
  mossy_stone:{name:"Yosunlu Taş",icon:"🟩",base:"#68776d",accent:"#41604a"},
  quartz:{name:"Kuvars",icon:"⬜",base:"#e7e0d6",accent:"#c9c0b3"},
  netherrack:{name:"Nether Kayası",icon:"🟥",base:"#8e3e40",accent:"#6b292f"},
  soul_sand:{name:"Ruh Kumu",icon:"🟫",base:"#554c45",accent:"#403934"},
  nether_brick:{name:"Nether Tuğlası",icon:"⬛",base:"#34242a",accent:"#24191e"},
  glowstone:{name:"Parlayan Taş",icon:"✨",base:"#dcae5e",accent:"#ffe18b",emissive:"#9d6c16"},
  basalt:{name:"Bazalt",icon:"⬛",base:"#4b4847",accent:"#353333"},
  end_stone:{name:"End Taşı",icon:"🟨",base:"#c9c69a",accent:"#aaa77a"},
  purpur:{name:"Purpur",icon:"🟪",base:"#a77bad",accent:"#835f8c"},
  amethyst:{name:"Ametist",icon:"💜",base:"#9967c7",accent:"#6e459a",emissive:"#3a1958"},
  moss:{name:"Yosun",icon:"🟢",base:"#5d9c46",accent:"#3c7531"},
  copper:{name:"Bakır",icon:"🟧",base:"#b86f4f",accent:"#854d38"},
  iron_block:{name:"Demir Blok",icon:"⬜",base:"#bac0c2",accent:"#8d9498"},
  gold_block:{name:"Altın Blok",icon:"🟨",base:"#e6bb3d",accent:"#b78b1d",emissive:"#6f4c08"},
  diamond_block:{name:"Elmas Blok",icon:"💎",base:"#4bd4d0",accent:"#269c9c",emissive:"#124e4b"},
  emerald_block:{name:"Zümrüt Blok",icon:"🟩",base:"#2dc36d",accent:"#18894b",emissive:"#0e4f2d"},
  redstone_block:{name:"Kızıl Taş Bloğu",icon:"🔴",base:"#a52d2d",accent:"#712020",emissive:"#4f0909"},
  terracotta:{name:"Terracotta",icon:"🟫",base:"#a95e44",accent:"#7c412f"},
  wool_white:{name:"Beyaz Yün",icon:"⬜",base:"#e8e8e4",accent:"#c8c8c3"},
  wool_red:{name:"Kırmızı Yün",icon:"🟥",base:"#be4545",accent:"#873030"},
  wool_blue:{name:"Mavi Yün",icon:"🟦",base:"#4a73bd",accent:"#31528f"},
  wool_green:{name:"Yeşil Yün",icon:"🟩",base:"#5b9b56",accent:"#3b7238"},
  prismarine:{name:"Prismarine",icon:"🟦",base:"#55a6a0",accent:"#3a7d79"},
  sea_lantern:{name:"Deniz Feneri",icon:"💡",base:"#94ddd6",accent:"#d0fff2",emissive:"#5dcfc1"},
  mossy_brick:{name:"Yosunlu Tuğla",icon:"🧱",base:"#68795f",accent:"#405f42"},
  portal_nether:{name:"Nether Portalı",icon:"🟪",base:"#5e2a8f",accent:"#b56cff",transparent:true,opacity:.5,emissive:"#4f1985"},
  portal_end:{name:"End Portalı",icon:"🟩",base:"#153a37",accent:"#54c4ad",transparent:true,opacity:.65,emissive:"#173f38"}
};

function numberColor(hex) { return Number.parseInt(hex.replace("#",""),16); }

function makeTexture(def,id) {
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=32;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=def.base;
  ctx.fillRect(0,0,32,32);
  ctx.globalAlpha=.42;
  ctx.fillStyle=def.accent;
  for(let i=0;i<34;i++){
    const x=Math.floor(Math.random()*32), y=Math.floor(Math.random()*32);
    ctx.fillRect(x,y,2+Math.random()*5,2+Math.random()*5);
  }
  ctx.globalAlpha=1;
  if(id.includes("planks")){
    ctx.strokeStyle="rgba(70,40,18,.35)";
    for(let y=7;y<32;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(32,y);ctx.stroke();}
  }
  if(id.includes("log")){
    ctx.strokeStyle="#4c331f";ctx.lineWidth=2;
    for(let x=4;x<32;x+=7){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-2,32);ctx.stroke();}
  }
  if(id==="grass"){ctx.fillStyle="#77bf52";for(let x=0;x<32;x+=4)ctx.fillRect(x,0,2,6);}
  if(id==="brick"||id==="nether_brick"||id==="stone_brick"||id==="mossy_brick"){
    ctx.strokeStyle="rgba(50,30,25,.45)";ctx.lineWidth=2;
    for(let y=7;y<32;y+=8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(32,y);ctx.stroke();}
    for(let y=0;y<32;y+=16){ctx.beginPath();ctx.moveTo(8,y);ctx.lineTo(8,y+8);ctx.stroke();ctx.beginPath();ctx.moveTo(24,y+8);ctx.lineTo(24,y+16);ctx.stroke();}
  }
  if(id==="glowstone"||id==="sea_lantern"||id==="gold_block"||id==="diamond_block"){
    ctx.fillStyle="#fff4b0";ctx.globalAlpha=.7;ctx.fillRect(9,9,14,14);ctx.globalAlpha=1;
  }
  if(id==="portal_nether"||id==="portal_end"){
    ctx.fillStyle=id==="portal_nether"?"#b46cff":"#5dffe5";
    for(let i=0;i<8;i++){ctx.fillRect(4+i*3,3+(i%2)*10,2,16);}
  }
  const t=new THREE.CanvasTexture(canvas);
  t.magFilter=THREE.NearestFilter;
  t.minFilter=THREE.NearestFilter;
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

const blockGeometry=new THREE.BoxGeometry(1,1,1);
const materials={};
for(const [id,def] of Object.entries(BLOCKS)){
  materials[id]=new THREE.MeshLambertMaterial({
    color:numberColor(def.base),
    map:makeTexture(def,id),
    transparent:!!def.transparent,
    opacity:def.opacity??1,
    depthWrite:!def.transparent,
    emissive:def.emissive?numberColor(def.emissive):0,
    emissiveIntensity:def.emissive?1.3:0
  });
}

/* ------------------------------ MOBS ----------------------------- */

const EGGS = {
  zombie:{name:"Zombi Yumurtası",icon:"🧟",color:0x4f934a,hostile:true,hp:30,damage:7,speed:2},
  husk:{name:"Husk Yumurtası",icon:"🧟",color:0xb89268,hostile:true,hp:30,damage:7,speed:1.9},
  drowned:{name:"Boğulmuş Yumurtası",icon:"🌊",color:0x3e7771,hostile:true,hp:30,damage:7,speed:1.55},
  skeleton:{name:"İskelet Yumurtası",icon:"💀",color:0xd9d4c8,hostile:true,hp:24,damage:5,speed:1.7,ranged:true},
  stray:{name:"Stray Yumurtası",icon:"💀",color:0xaebac2,hostile:true,hp:24,damage:5,speed:1.7,ranged:true},
  wither_skeleton:{name:"Wither İskeleti Yumurtası",icon:"☠️",color:0x34383a,hostile:true,hp:40,damage:9,speed:2},
  creeper:{name:"Creeper Yumurtası",icon:"🟢",color:0x49ad51,hostile:true,hp:28,damage:12,speed:1.6,charger:true},
  spider:{name:"Örümcek Yumurtası",icon:"🕷️",color:0x3d3035,hostile:true,hp:28,damage:6,speed:2.15,spider:true},
  cave_spider:{name:"Mağara Örümceği Yumurtası",icon:"🕷️",color:0x314d43,hostile:true,hp:18,damage:5,speed:2.35,spider:true},
  enderman:{name:"Enderman Yumurtası",icon:"🟪",color:0x171322,hostile:true,hp:40,damage:8,speed:2.3,teleporter:true},
  slime:{name:"Slime Yumurtası",icon:"🟢",color:0x53d96c,hostile:true,hp:22,damage:6,speed:1.65,slime:true},
  magma_cube:{name:"Magma Küpü Yumurtası",icon:"🟥",color:0xc24b32,hostile:true,hp:30,damage:8,speed:1.45,slime:true},
  blaze:{name:"Blaze Yumurtası",icon:"🔥",color:0xe9a13d,hostile:true,hp:30,damage:7,speed:1.4,flying:true,ranged:true},
  ghast:{name:"Ghast Yumurtası",icon:"👻",color:0xe7e7e7,hostile:true,hp:50,damage:10,speed:1.0,flying:true,ranged:true,large:true},
  phantom:{name:"Phantom Yumurtası",icon:"🦇",color:0x53658e,hostile:true,hp:36,damage:8,speed:2.6,flying:true},
  witch:{name:"Cadı Yumurtası",icon:"🧙",color:0x6e496f,hostile:true,hp:26,damage:6,speed:1.15,ranged:true},
  piglin:{name:"Piglin Yumurtası",icon:"🐗",color:0x9b6b62,hostile:true,hp:32,damage:7,speed:1.65,ranged:false},
  zombified_piglin:{name:"Zombileşmiş Piglin Yumurtası",icon:"🐗",color:0x8d8d57,hostile:true,hp:32,damage:7,speed:1.65},
  pillager:{name:"Pillager Yumurtası",icon:"🏹",color:0x6f6861,hostile:true,hp:28,damage:6,speed:1.55,ranged:true},
  vindicator:{name:"Vindicator Yumurtası",icon:"🪓",color:0x72716b,hostile:true,hp:34,damage:8,speed:1.8},
  evoker:{name:"Evoker Yumurtası",icon:"🔮",color:0x72526c,hostile:true,hp:32,damage:6,speed:1.2,ranged:true},
  guardian:{name:"Guardian Yumurtası",icon:"🐡",color:0x4d9990,hostile:true,hp:30,damage:7,speed:1.2,flying:true,ranged:true},
  elder_guardian:{name:"Elder Guardian Yumurtası",icon:"🐡",color:0x668a86,hostile:true,hp:70,damage:12,speed:.9,flying:true,ranged:true,boss:true},
  silverfish:{name:"Silverfish Yumurtası",icon:"🪲",color:0x77797a,hostile:true,hp:12,damage:4,speed:2.5},
  endermite:{name:"Endermite Yumurtası",icon:"🪲",color:0x734a88,hostile:true,hp:14,damage:4,speed:2.4},
  shulker:{name:"Shulker Yumurtası",icon:"🟣",color:0x8a637f,hostile:true,hp:30,damage:7,speed:.7,ranged:true},
  warden:{name:"Warden Yumurtası",icon:"🦌",color:0x31535d,hostile:true,hp:160,damage:18,speed:1.4,boss:true},
  wither:{name:"Wither Yumurtası",icon:"☠️",color:0x27292c,hostile:true,hp:220,damage:20,speed:1.0,flying:true,ranged:true,boss:true},
  ender_dragon:{name:"Ender Ejderhası Yumurtası",icon:"🐉",color:0x3a273b,hostile:true,hp:300,damage:22,speed:2.0,flying:true,boss:true,dragon:true},

  cow:{name:"İnek Yumurtası",icon:"🐄",color:0x524039,hostile:false,hp:24,damage:0,speed:.8,animal:true},
  sheep:{name:"Koyun Yumurtası",icon:"🐑",color:0xe9e9e9,hostile:false,hp:18,damage:0,speed:1.05,animal:true},
  pig:{name:"Domuz Yumurtası",icon:"🐖",color:0xe0a3ae,hostile:false,hp:20,damage:0,speed:1.0,animal:true},
  chicken:{name:"Tavuk Yumurtası",icon:"🐔",color:0xe8e8e0,hostile:false,hp:10,damage:0,speed:1.35,animal:true,bird:true},
  horse:{name:"At Yumurtası",icon:"🐎",color:0x8b6a4b,hostile:false,hp:34,damage:0,speed:1.45,animal:true},
  donkey:{name:"Eşek Yumurtası",icon:"🫏",color:0x756b63,hostile:false,hp:34,damage:0,speed:1.3,animal:true},
  llama:{name:"Lama Yumurtası",icon:"🦙",color:0xbba78d,hostile:false,hp:28,damage:0,speed:1.15,animal:true},
  wolf:{name:"Kurt Yumurtası",icon:"🐺",color:0xb7babd,hostile:false,hp:22,damage:0,speed:1.7,animal:true},
  cat:{name:"Kedi Yumurtası",icon:"🐈",color:0x8d705d,hostile:false,hp:16,damage:0,speed:1.8,animal:true},
  fox:{name:"Tilki Yumurtası",icon:"🦊",color:0xd97836,hostile:false,hp:18,damage:0,speed:1.75,animal:true},
  rabbit:{name:"Tavşan Yumurtası",icon:"🐇",color:0xd7d1c9,hostile:false,hp:10,damage:0,speed:2.0,animal:true},
  goat:{name:"Keçi Yumurtası",icon:"🐐",color:0xc8c1b5,hostile:false,hp:28,damage:0,speed:1.35,animal:true,jumper:true},
  polar_bear:{name:"Kutup Ayısı Yumurtası",icon:"🐻‍❄️",color:0xe8ecef,hostile:false,hp:40,damage:0,speed:.9,animal:true},
  panda:{name:"Panda Yumurtası",icon:"🐼",color:0xd8d8d0,hostile:false,hp:38,damage:0,speed:.7,animal:true},
  bee:{name:"Arı Yumurtası",icon:"🐝",color:0xe4b52f,hostile:false,hp:14,damage:0,speed:2.2,animal:true,flying:true},
  turtle:{name:"Kaplumbağa Yumurtası",icon:"🐢",color:0x5a9260,hostile:false,hp:24,damage:0,speed:.65,animal:true},
  dolphin:{name:"Yunus Yumurtası",icon:"🐬",color:0x6a98b3,hostile:false,hp:22,damage:0,speed:1.8,animal:true,flying:true},
  squid:{name:"Mürekkep Balığı Yumurtası",icon:"🦑",color:0x425d76,hostile:false,hp:16,damage:0,speed:1.0,animal:true,flying:true},
  axolotl:{name:"Aksolotl Yumurtası",icon:"🦎",color:0xe79ba8,hostile:false,hp:16,damage:0,speed:1.4,animal:true,flying:true},
  frog:{name:"Kurbağa Yumurtası",icon:"🐸",color:0x80aa57,hostile:false,hp:16,damage:0,speed:1.5,animal:true,jumper:true},
  camel:{name:"Deve Yumurtası",icon:"🐪",color:0xbda174,hostile:false,hp:38,damage:0,speed:1.0,animal:true},
  sniffer:{name:"Sniffer Yumurtası",icon:"🦕",color:0x6c5748,hostile:false,hp:50,damage:0,speed:.65,animal:true},
  villager:{name:"Köylü Yumurtası",icon:"🧑‍🌾",color:0x8c6b58,hostile:false,hp:30,damage:0,speed:1.0,villager:true},
  iron_golem:{name:"Demir Golem Yumurtası",icon:"🤖",color:0xbec5bf,hostile:false,hp:100,damage:0,speed:.7,golem:true},
  snow_golem:{name:"Kar Golemi Yumurtası",icon:"⛄",color:0xeef7ff,hostile:false,hp:30,damage:0,speed:.9,golem:true}
};

const ITEMS = [
  ...Object.keys(BLOCKS).map(id=>({id,kind:"block"})),
  {id:"push",kind:"tool",name:"Creative İtme",icon:"✋"},
  {id:"bow",kind:"tool",name:"Creative Yay",icon:"🏹"},
  {id:"nether",kind:"portal",name:"Nether Portalı",icon:"🟪"},
  {id:"end",kind:"portal",name:"End Portalı",icon:"🟩"},
  ...Object.keys(EGGS).map(id=>({id,kind:"egg"}))
];

const hotbarItems = [
  {kind:"block",id:"grass"},
  {kind:"block",id:"dirt"},
  {kind:"block",id:"stone"},
  {kind:"block",id:"oak_planks"},
  {kind:"block",id:"glass"},
  {kind:"tool",id:"push",name:"Creative İtme",icon:"✋"},
  {kind:"tool",id:"bow",name:"Creative Yay",icon:"🏹"},
  {kind:"portal",id:"nether",name:"Nether Portalı",icon:"🟪"},
  {kind:"egg",id:"skeleton"}
];

function labelFor(item) {
  if(item.kind==="block") return BLOCKS[item.id];
  if(item.kind==="egg") return EGGS[item.id];
  return {name:item.name,icon:item.icon};
}

function renderHotbar() {
  const bar=document.getElementById("hotbar");
  bar.innerHTML="";
  hotbarItems.forEach((item,i)=>{
    const d=labelFor(item);
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
    const d=labelFor(item);
    const button=document.createElement("button");
    button.className="inv-slot";
    const action=item.kind==="egg"?"Sağ tık: spawn egg":item.kind==="block"?"Sağ tık: blok koy":item.kind==="portal"?"Sağ tık: portal kur":"Sol tık: "+d.name;
    button.innerHTML="<strong>"+d.icon+" "+d.name+"</strong><span>"+action+"</span>";
    button.onclick=()=>{
      const idx=hotbarItems.findIndex(h=>h.kind===item.kind&&h.id===item.id);
      if(idx>=0) selected=idx;
      else hotbarItems[selected]={...item,name:d.name,icon:d.icon};
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
  if(show) {
    controls.unlock();
  } else if(document.getElementById("start-screen").classList.contains("hidden")) {
    setTimeout(()=>controls.lock(),0);
  }
}
renderHotbar();
renderInventory();

/* ------------------------------ WORLD ----------------------------- */

const world=new Map();
const worldMeshes=[];
const terrainHeights=new Map();
const waterMeshes=[];
const specialLights=[];
const mobs=[];
const mobMeshes=[];
const particles=[];
const projectiles=[];
const portals=[];
const portalGroups=[];

const key=(x,y,z)=>x+","+y+","+z;
const terrainKey=(x,z)=>x+","+z;

function addBlock(x,y,z,type,replace=false){
  x=Math.round(x);y=Math.round(y);z=Math.round(z);
  if(y<0||y>30||!BLOCKS[type])return null;
  const k=key(x,y,z);
  if(world.has(k)&&!replace)return null;
  if(world.has(k))removeBlockMesh(world.get(k));
  const mesh=new THREE.Mesh(blockGeometry,materials[type]);
  mesh.position.set(x+.5,y+.5,z+.5);
  mesh.castShadow=type!=="glass"&&type!=="ice";
  mesh.receiveShadow=true;
  mesh.userData.block={x,y,z,type};
  scene.add(mesh);
  world.set(k,mesh);
  worldMeshes.push(mesh);
  return mesh;
}

function removeBlockMesh(mesh){
  const p=mesh?.userData?.block;
  if(!p||p.type==="bedrock")return false;
  scene.remove(mesh);
  world.delete(key(p.x,p.y,p.z));
  const i=worldMeshes.indexOf(mesh);
  if(i>=0)worldMeshes.splice(i,1);
  return true;
}

function noise2(x,z){
  const s=Math.sin(x*127.1+z*311.7)*43758.5453;
  return s-Math.floor(s);
}

function getGroundY(x,z){
  const cx=THREE.MathUtils.clamp(Math.round(x),-32,32);
  const cz=THREE.MathUtils.clamp(Math.round(z),-32,32);
  for(let y=30;y>=0;y--){
    const m=world.get(key(cx,y,cz));
    if(m&&m.userData.block?.type!=="leaves"&&m.userData.block?.type!=="glass")return y+1;
  }
  return 1;
}

function terrainY(x,z){
  return getGroundY(x,z)+0.04;
}

function lakeAt(x,z){
  const dx=x-13,dz=z-11;
  return dx*dx+dz*dz<75;
}

function heightAt(x,z){
  if(lakeAt(x,z))return 2;
  const a=Math.sin(x*.21)*1.35;
  const b=Math.cos(z*.24)*1.2;
  const c=Math.sin((x+z)*.51)*.6;
  return THREE.MathUtils.clamp(Math.floor(3.7+a+b+c),2,9);
}

function clearSceneCollection(collection){
  for(const m of collection)scene.remove(m);
  collection.length=0;
}

function buildWater(){
  clearSceneCollection(waterMeshes);
  const waterMat=new THREE.MeshPhongMaterial({color:0x49b9dc,transparent:true,opacity:.5,shininess:120,depthWrite:false,side:THREE.DoubleSide});
  const water=new THREE.Mesh(new THREE.CircleGeometry(8.8,52),waterMat);
  water.rotation.x=-Math.PI/2;
  water.position.set(13,3.02,11);
  scene.add(water);
  waterMeshes.push(water);
}

function addLamp(x,z,y){
  addBlock(x,y,z,"glowstone");
  const l=new THREE.PointLight(0xffc96f,1.2,12,2);
  l.position.set(x+.5,y+1,z+.5);
  scene.add(l);
  specialLights.push(l);
}

function clearWorld(){
  for(const m of [...worldMeshes])scene.remove(m);
  worldMeshes.length=0;
  world.clear();
  terrainHeights.clear();
}

function buildWorld(){
  clearWorld();
  clearSceneCollection(waterMeshes);
  clearSceneCollection(specialLights);
  for(const p of [...portalGroups])scene.remove(p);
  portalGroups.length=0;
  portals.length=0;

  const radius=31;
  for(let x=-radius;x<=radius;x++){
    for(let z=-radius;z<=radius;z++){
      const h=heightAt(x,z);
      terrainHeights.set(terrainKey(x,z),h);
      for(let y=0;y<=h;y++){
        let type;
        if(y===0)type="bedrock";
        else if(y===h)type=lakeAt(x,z)?"sand":(h<=3?"sand":"grass");
        else if(y>=h-2)type="dirt";
        else type="stone";
        addBlock(x,y,z,type);
      }

      if(!lakeAt(x,z)&&noise2(x,z)>.989&&Math.abs(x)>6&&Math.abs(z)>6){
        const trunk=3+(noise2(x+4,z+8)>.5?1:0);
        const logType=noise2(x+12,z+15)>.66?"birch_log":noise2(x+8,z+3)>.5?"spruce_log":"oak_log";
        for(let y=1;y<=trunk;y++)addBlock(x,h+y,z,logType);
        for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=0;dy<=2;dy++){
          if(Math.abs(dx)+Math.abs(dz)+dy<=4&&!(dx===0&&dz===0&&dy===0))addBlock(x+dx,h+trunk+dy,z+dz,"leaves");
        }
      }
    }
  }

  // Decorative road and a Creative build platform.
  for(let z=18;z>=0;z--)for(const x of [-1,0,1]){
    const y=getGroundY(x,z)-1;
    const old=world.get(key(x,y,z));
    if(old)removeBlockMesh(old);
    addBlock(x,y,z,"cobble");
  }
  for(let x=-5;x<=5;x++)for(let z=14;z<=20;z++){
    const y=getGroundY(x,z)-1;
    const old=world.get(key(x,y,z));
    if(old)removeBlockMesh(old);
    addBlock(x,y,z,"oak_planks");
  }

  buildWater();
  buildArena();
  createPortal("nether",-12,-18);
  createPortal("end",14,18);
  createPortal("nether",20,-18);
  createPortal("end",-20,18);
}

function buildArena(){
  const cx=0,cz=-7,r=6;
  for(let x=cx-r;x<=cx+r;x++)for(let z=cz-r;z<=cz+r;z++){
    const top=getGroundY(x,z)-1;
    for(let y=top;y>=1;y--){
      const m=world.get(key(x,y,z));
      if(m)removeBlockMesh(m);
    }
    addBlock(x,1,z,"deepslate");
  }
  for(let x=cx-r-1;x<=cx+r+1;x++){
    for(const z of [cz-r-1,cz+r+1]){
      const y=Math.max(2,getGroundY(x,z)-1);
      addBlock(x,y,z,"brick");addBlock(x,y+1,z,"brick");
    }
  }
  for(let z=cz-r;z<=cz+r;z++){
    for(const x of [cx-r-1,cx+r+1]){
      const y=Math.max(2,getGroundY(x,z)-1);
      addBlock(x,y,z,"brick");addBlock(x,y+1,z,"brick");
    }
  }
  for(const p of [[-8,-15],[8,-15],[-8,1],[8,1]]){
    const y=getGroundY(p[0],p[1])-1;
    addLamp(p[0],p[1],Math.max(1,y+1));
  }
}

function createPortal(kind,x,z){
  const baseY=getGroundY(x,z)-1;
  const g=new THREE.Group();
  const frameType=kind==="nether"?"obsidian":"end_stone";
  const surfaceType=kind==="nether"?"portal_nether":"portal_end";
  const planeMat=new THREE.MeshBasicMaterial({
    color:kind==="nether"?0x8d45e8:0x31c0a5,
    transparent:true,opacity:.58,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  for(let dx=-1;dx<=1;dx++)for(let dy=0;dy<=3;dy++){
    if(dx===0&&dy>0&&dy<3)continue;
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1,1,.45),materials[frameType]);
    frame.position.set((x+dx)+.5,baseY+dy+1,z+.5);
    g.add(frame);
  }
  for(const yy of [1,2,3-1]){
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.95),planeMat);
    plane.rotation.y=0;
    plane.position.set(x+.5,baseY+yy+.5,z+.28);
    plane.scale.y=1.0;
    g.add(plane);
  }
  const glow=new THREE.PointLight(kind==="nether"?0x9a52ff:0x4affd3,.75,10,2);
  glow.position.set(x+.5,baseY+2.4,z+.1);
  g.add(glow);
  g.position.z+=.18;
  scene.add(g);
  portalGroups.push(g);
  portals.push({kind,x:x+.5,z:z+.5,y:baseY+1.8});
}

function checkPortals(){
  if(elapsed-lastPortalTime<2.0)return;
  for(const p of portals){
    const dx=camera.position.x-p.x,dz=camera.position.z-p.z;
    if(dx*dx+dz*dz<2.5&&Math.abs(camera.position.y-p.y)<3){
      let target=null;
      for(const other of portals){
        if(other!==p&&other.kind===p.kind){target=other;break;}
      }
      if(target){
        camera.position.set(target.x,target.y+2.5,target.z+4);
        lastPortalTime=elapsed;
        showMessage(p.kind==="nether"?"🟪 Nether portaluna geçtin!":"🟩 End portaluna geçtin!");
      }
      break;
    }
  }
}

/* ---------------------------- RAYCAST ---------------------------- */

const selection=new THREE.Mesh(
  new THREE.BoxGeometry(1.05,1.05,1.05),
  new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.9})
);
selection.visible=false;
scene.add(selection);

const placementPreview=new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshBasicMaterial({color:0x82e7ae,transparent:true,opacity:.27,depthWrite:false})
);
placementPreview.visible=false;
scene.add(placementPreview);

const raycaster=new THREE.Raycaster();
raycaster.far=14;
const center=new THREE.Vector2(0,0);

function hitWorld(){
  raycaster.setFromCamera(center,camera);
  return raycaster.intersectObjects(worldMeshes,false)[0]||null;
}

function entityFromObject(obj){
  let cur=obj;
  while(cur){
    if(cur.userData.entity)return cur.userData.entity;
    cur=cur.parent;
  }
  return null;
}

function hitEntity(){
  raycaster.setFromCamera(center,camera);
  const hits=raycaster.intersectObjects(mobMeshes,true);
  return hits.map(h=>entityFromObject(h.object)).find(Boolean)||null;
}

function placementData(){
  const hit=hitWorld();
  if(!hit)return null;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const b=hit.object.userData.block;
  return {hit,b,x:b.x+Math.round(normal.x),y:b.y+Math.round(normal.y),z:b.z+Math.round(normal.z)};
}

function updateSelection(){
  if(!locked){
    selection.visible=false;
    placementPreview.visible=false;
    document.getElementById("target-name").style.opacity="0";
    return;
  }
  const hit=hitWorld();
  if(hit){selection.visible=true;selection.position.copy(hit.object.position)}else selection.visible=false;

  const entity=hitEntity();
  const target=document.getElementById("target-name");
  if(entity){
    target.textContent=EGGS[entity.type].icon+" "+EGGS[entity.type].name.replace(" Yumurtası","")+" • "+Math.ceil(entity.hp)+" HP";
    target.style.opacity="1";
  }else target.style.opacity="0";

  const item=hotbarItems[selected];
  const p=placementData();
  if((item.kind==="block")&&p&&p.y>=0&&p.y<=30&&!world.has(key(p.x,p.y,p.z))){
    placementPreview.visible=true;
    placementPreview.position.set(p.x+.5,p.y+.5,p.z+.5);
  }else placementPreview.visible=false;
}

/* ------------------------------ MOBS ------------------------------ */

function part(geo,color){
  const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color}));
  m.castShadow=true;m.receiveShadow=true;return m;
}

function eye(g,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.06),new THREE.MeshBasicMaterial({color:0x151515}));
  m.position.set(x,y,z);g.add(m);
}

function addSimpleBow(g){
  const bow=new THREE.Group();
  bow.userData.bow=true;
  const wood=new THREE.MeshLambertMaterial({color:0x8b5a34});
  const curveTop=new THREE.Mesh(new THREE.BoxGeometry(.08,.58,.08),wood);
  curveTop.rotation.z=-.38;curveTop.position.y=.28;
  const curveBottom=curveTop.clone();curveBottom.rotation.z=.38;curveBottom.position.y=-.28;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.09,.22,.09),wood);
  const string=new THREE.Mesh(new THREE.BoxGeometry(.018,.7,.018),new THREE.MeshBasicMaterial({color:0xe9e9e9}));
  string.position.z=.04;
  bow.add(curveTop,curveBottom,grip,string);
  bow.position.set(.68,1.16,.12);
  bow.rotation.z=-.06;
  g.add(bow);
  return bow;
}

function makeHumanoid(type,color){
  const g=new THREE.Group();
  const torso=part(new THREE.BoxGeometry(.74,1,.5),color);torso.position.y=1.03;g.add(torso);
  const head=part(new THREE.BoxGeometry(.64,.64,.64),new THREE.Color(color).multiplyScalar(.9));head.position.y=1.82;g.add(head);
  eye(g,-.16,1.83,.33);eye(g,.16,1.83,.33);
  const limbColor=type==="skeleton"||type==="stray"||type==="wither_skeleton"?0xc6c4ba:color;
  const arms=[],legs=[];
  for(const x of [-.5,.5]){
    const arm=part(new THREE.BoxGeometry(.21,.8,.21),limbColor);arm.position.set(x,1.03,0);arm.userData.limb="arm";g.add(arm);arms.push(arm);
  }
  for(const x of [-.2,.2]){
    const leg=part(new THREE.BoxGeometry(.24,.8,.24),limbColor);leg.position.set(x,.31,0);leg.userData.limb="leg";g.add(leg);legs.push(leg);
  }
  if(["skeleton","stray","wither_skeleton","pillager","witch","evoker","piglin"].includes(type))addSimpleBow(g);
  if(type==="villager"){
    const nose=part(new THREE.BoxGeometry(.16,.24,.2),0x9c735f);nose.position.set(0,1.68,.42);g.add(nose);
  }
  return g;
}

function makeSpider(type,color){
  const g=new THREE.Group();
  const body=part(new THREE.BoxGeometry(1.2,.55,1.45),color);body.position.y=.7;g.add(body);
  const head=part(new THREE.BoxGeometry(.78,.62,.74),new THREE.Color(color).multiplyScalar(1.08));head.position.set(0,.8,.76);g.add(head);
  for(const x of [-.28,.28])for(const z of [-.5,-.15,.2,.55]){
    const leg=part(new THREE.BoxGeometry(.12,.8,.12),color);
    leg.position.set(x*1.9,.48,z);
    leg.rotation.z=x<0?-.9:.9;
    leg.userData.limb="leg";
    g.add(leg);
  }
  for(const x of [-.17,0,.17])eye(g,x,.88,1.12);
  return g;
}

function makeAnimal(type,color){
  const g=new THREE.Group();
  let bodySize=[1.05,.72,.75];
  if(["horse","donkey","camel","sniffer"].includes(type))bodySize=[1.2,1.15,.8];
  if(type==="chicken")bodySize=[.62,.6,.62];
  if(type==="rabbit")bodySize=[.56,.5,.62];
  const body=part(new THREE.BoxGeometry(...bodySize),color);body.position.y=bodySize[1]/2+.15;g.add(body);
  const head=part(new THREE.BoxGeometry(.62,.58,.62),new THREE.Color(color).multiplyScalar(.92));
  head.position.set(0,body.position.y+.45,.58);g.add(head);
  for(const x of [-.36,.36])for(const z of [-.24,.24]){
    const leg=part(new THREE.BoxGeometry(.16,Math.max(.42,bodySize[1]*.7),.16),type==="chicken"?0xe8b05a:0x4e4a45);
    leg.position.set(x,body.position.y-bodySize[1]/2-.05,z);leg.userData.limb="leg";g.add(leg);
  }
  eye(g,-.13,head.position.y+.06,.88);eye(g,.13,head.position.y+.06,.88);
  if(type==="chicken"){
    const wing=part(new THREE.BoxGeometry(.5,.3,.08),0xd7d7d0);wing.position.set(.38,.72,.02);g.add(wing);
  }
  if(["cow","goat"].includes(type)){
    const hornMat=0xe5ddc7;
    for(const x of [-.22,.22]){
      const horn=new THREE.Mesh(new THREE.ConeGeometry(.07,.22,8),new THREE.MeshLambertMaterial({color:hornMat}));
      horn.position.set(x,head.position.y+.32,.62);horn.rotation.z=x<0?.32:-.32;g.add(horn);
    }
  }
  return g;
}

function makeCreeper(color){
  const g=new THREE.Group();
  const body=part(new THREE.BoxGeometry(.7,1.45,.62),color);body.position.y=1.05;g.add(body);
  const head=part(new THREE.BoxGeometry(.7,.7,.7),new THREE.Color(color).multiplyScalar(.92));head.position.y=1.95;g.add(head);
  for(const x of [-.18,.18])eye(g,x,2.04,.37);
  const mouth=part(new THREE.BoxGeometry(.38,.12,.04),0x102314);mouth.position.set(0,1.79,.36);g.add(mouth);
  for(const x of [-.22,.22])for(const z of [-.2,.2]){
    const leg=part(new THREE.BoxGeometry(.2,.6,.2),color);leg.position.set(x,.3,z);leg.userData.limb="leg";g.add(leg);
  }
  return g;
}

function makeSlime(type,color){
  const g=new THREE.Group();
  const mat=new THREE.MeshLambertMaterial({color,transparent:true,opacity:.84});
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.02,.88,1.02),mat);body.position.y=.55;g.add(body);
  eye(g,-.18,.63,.52);eye(g,.18,.63,.52);
  return g;
}

function makeSpiderBoss(type,color){
  if(type==="spider"||type==="cave_spider")return makeSpider(type,color);
  if(type==="creeper")return makeCreeper(color);
  return null;
}

function makeFlying(type,color){
  const g=new THREE.Group();
  const main=part(new THREE.BoxGeometry(type==="ghast"?1.7:.9,.55,1.35),color);main.position.y=1;g.add(main);
  const w1=part(new THREE.BoxGeometry(1.1,.08,.55),new THREE.Color(color).multiplyScalar(.9));w1.position.x=-.82;w1.position.y=1.02;g.add(w1);
  const w2=w1.clone();w2.position.x=.82;g.add(w2);
  eye(g,-.18,1.08,.7);eye(g,.18,1.08,.7);
  return g;
}

function makeDragon(color){
  const g=new THREE.Group();
  const body=part(new THREE.BoxGeometry(1.5,1.0,2.3),color);body.position.y=1.5;g.add(body);
  const head=part(new THREE.BoxGeometry(1.1,.9,1.15),new THREE.Color(color).multiplyScalar(1.1));head.position.set(0,1.7,1.55);g.add(head);
  for(const x of [-.7,.7]){
    const wing=part(new THREE.BoxGeometry(2.1,.08,1.15),0x5a3f5e);wing.position.set(x,1.75,0);wing.rotation.z=x<0?-.18:.18;g.add(wing);
  }
  return g;
}

function makeGolem(type,color){
  const g=makeHumanoid(type,color);
  g.scale.set(1.25,1.22,1.25);
  return g;
}

function makeMobModel(type,color){
  if(type==="dragon"||type==="ender_dragon")return makeDragon(color);
  if(["spider","cave_spider"].includes(type))return makeSpider(type,color);
  if(type==="creeper")return makeCreeper(color);
  if(["slime","magma_cube"].includes(type))return makeSlime(type,color);
  if(EGGS[type]?.flying&&["blaze","ghast","phantom","guardian","elder_guardian","wither","ender_dragon"].includes(type))return makeFlying(type,color);
  if(EGGS[type]?.animal)return makeAnimal(type,color);
  if(EGGS[type]?.golem)return makeGolem(type,color);
  return makeHumanoid(type,color);
}

function updateHealthBar(entity){
  if(!entity.canvas)return;
  const ctx=entity.canvas.getContext("2d");
  ctx.clearRect(0,0,192,34);
  ctx.fillStyle="rgba(4,8,12,.82)";
  ctx.roundRect(1,1,190,32,9);ctx.fill();
  const r=THREE.MathUtils.clamp(entity.hp/entity.maxHp,0,1);
  ctx.fillStyle=r>.5?"#79db9f":r>.2?"#e7c55d":"#e87770";
  ctx.roundRect(9,9,174*r,16,7);ctx.fill();
  ctx.fillStyle="#fff";ctx.font="bold 11px system-ui";ctx.textAlign="center";
  ctx.fillText(Math.ceil(Math.max(0,entity.hp))+" / "+entity.maxHp,96,21);
  entity.texture.needsUpdate=true;
}

function attachHealthBar(entity){
  const canvas=document.createElement("canvas");canvas.width=192;canvas.height=34;
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
  sprite.scale.set(1.85,.34,1);sprite.position.y=2.7;entity.group.add(sprite);
  entity.canvas=canvas;entity.texture=texture;updateHealthBar(entity);
}

function spawnMob(type,pos){
  const def=EGGS[type];
  if(!def||mobs.length>=180)return null;
  const entity={
    type,hp:def.hp,maxHp:def.hp,hostile:def.hostile,damage:def.damage,speed:def.speed,
    ranged:!!def.ranged,attackCooldown:.3+Math.random()*.6,wander:.7+Math.random()*2.5,
    age:Math.random()*5,vy:0,vx:0,vz:0,target:null,dead:false,aiming:false,shootAnim:0
  };
  const g=makeMobModel(type,def.color);
  g.position.copy(pos);
  g.userData.entity=entity;
  g.traverse(o=>{
    o.userData.entity=entity;
    if(o.isMesh)o.castShadow=true;
  });
  scene.add(g);
  entity.group=g;
  entity.parts=g.children.filter(o=>o.userData.limb);
  entity.bow=g.children.find(o=>o.userData.bow)||null;
  mobs.push(entity);
  for(const c of g.children)if(c.isMesh&&!c.userData.healthSprite)mobMeshes.push(c);
  attachHealthBar(entity);
  return entity;
}

function removeMob(entity){
  entity.dead=true;
  if(entity.group){
    entity.group.traverse(o=>{
      const i=mobMeshes.indexOf(o);if(i>=0)mobMeshes.splice(i,1);
    });
    scene.remove(entity.group);
  }
  const i=mobs.indexOf(entity);if(i>=0)mobs.splice(i,1);
}

function nearestTarget(entity,maxDistance){
  let target=null,best=maxDistance;
  for(const other of mobs){
    if(other===entity||other.dead||!other.group)continue;
    const d=entity.group.position.distanceTo(other.group.position);
    if(d<best){best=d;target=other;}
  }
  return target;
}

function mobGround(entity){
  return getGroundY(entity.group.position.x,entity.group.position.z);
}

function mobCanStep(entity,x,z){
  const cur=mobGround(entity),next=getGroundY(x,z);
  if(next-cur>1.15)return false;
  const head=world.get(key(Math.round(x),Math.floor(next+1),Math.round(z)));
  return !head;
}

function damageMob(entity,amount,source="player",knock=new THREE.Vector3()){
  if(!entity||entity.dead)return;
  entity.hp-=amount;
  entity.vx+=knock.x;entity.vy=Math.max(entity.vy,knock.y);entity.vz+=knock.z;
  updateHealthBar(entity);
  spawnParticles(entity.group.position,EGGS[entity.type].color,5,.32);
  if(source==="player")showMessage(EGGS[entity.type].icon+" geri itildi • "+Math.max(0,Math.ceil(entity.hp))+" HP");
  if(entity.hp<=0){
    showMessage(EGGS[entity.type].icon+" "+EGGS[entity.type].name.replace(" Yumurtası","")+" elendi.");
    spawnParticles(entity.group.position,EGGS[entity.type].color,12,.62);
    removeMob(entity);
  }
}

function shootArrow(owner,target){
  const from=new THREE.Vector3(owner.group.position.x,owner.group.position.y+1.45,owner.group.position.z);
  const to=target.group.position.clone();to.y+=1;
  const dir=to.sub(from).normalize();
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.48,7),new THREE.MeshLambertMaterial({color:0x8c6538}));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  mesh.position.copy(from);
  scene.add(mesh);
  projectiles.push({mesh,dir,speed:13,life:1.7,owner});
}

function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.life-=dt;
    p.mesh.position.addScaledVector(p.dir,p.speed*dt);
    let hit=null;
    for(const mob of mobs){
      if(mob===p.owner||mob.dead)continue;
      if(mob.group.position.distanceTo(p.mesh.position)<.7){hit=mob;break;}
    }
    if(hit){
      damageMob(hit,p.owner.damage,p.owner.type,p.dir.clone().multiplyScalar(1.8));
      scene.remove(p.mesh);projectiles.splice(i,1);continue;
    }
    if(p.life<=0||p.mesh.position.y<0){
      scene.remove(p.mesh);projectiles.splice(i,1);
    }
  }
}

function animateMob(entity,dt){
  entity.age+=dt;
  const walk=Math.sin(entity.age*8);
  for(const limb of entity.parts||[]){
    if(limb.userData.limb==="arm")limb.rotation.x=entity.aiming?-.85:walk*.28;
    if(limb.userData.limb==="leg")limb.rotation.x=-walk*.28;
  }
  if(entity.bow){
    entity.bow.rotation.z=entity.aiming?-0.16:-0.06;
    entity.bow.scale.y=entity.aiming?.92:1;
    if(entity.shootAnim>0)entity.shootAnim=Math.max(0,entity.shootAnim-dt);
  }
  if(entity.type==="slime"||entity.type==="magma_cube"){
    const s=1+Math.sin(entity.age*5)*.045;
    entity.group.scale.y=s;
  }
  if(entity.type==="enderman"&&Math.random()<.002){
    entity.group.position.x+=(Math.random()-.5)*5;
    entity.group.position.z+=(Math.random()-.5)*5;
  }
  if(entity.healthSprite)entity.healthSprite.quaternion.copy(camera.quaternion);
}

let aiTick=0;

function updateMobs(dt){
  aiTick-=dt;
  if(aiTick>0){
    for(const mob of mobs)animateMob(mob,dt);
    return;
  }
  aiTick=.1;

  for(const mob of [...mobs]){
    if(mob.dead||!mob.group)continue;
    mob.attackCooldown=Math.max(0,mob.attackCooldown-.1);
    mob.wander=Math.max(0,mob.wander-.1);

    const p=mob.group.position;
    const flying=!!EGGS[mob.type]?.flying;
    if(!flying){
      mob.vy-=18*.1;
      p.y+=mob.vy*.1;
      const ground=mobGround(mob);
      if(p.y<=ground+.03&&mob.vy<=0){p.y=ground+.03;mob.vy=0}
    }else{
      const hover=terrainY(p.x,p.z)+4+Math.sin(mob.age*2+mob.type.length)*1.3;
      p.y=THREE.MathUtils.lerp(p.y,hover,.06);
    }

    p.x+=mob.vx*.1;p.z+=mob.vz*.1;
    mob.vx*=.78;mob.vz*=.78;
    p.x=THREE.MathUtils.clamp(p.x,-31,31);p.z=THREE.MathUtils.clamp(p.z,-31,31);

    let target=mob.hostile?nearestTarget(mob,20):nearestTarget(mob,3.8);
    mob.target=target;

    if(target){
      const t=target.group.position;
      const dx=t.x-p.x,dz=t.z-p.z,dist=Math.max(.001,Math.hypot(dx,dz));
      mob.group.rotation.y=Math.atan2(dx,dz);

      if(mob.ranged&&dist>3&&dist<14){
        mob.aiming=true;
        if(mob.attackCooldown<=0){
          shootArrow(mob,target);
          mob.attackCooldown=mob.type==="blaze"?1.05:.95;
          mob.shootAnim=.2;
        }
      }else{
        mob.aiming=false;
        if(dist>1.35){
          const step=mob.speed*.1;
          const nx=p.x+(dx/dist)*step,nz=p.z+(dz/dist)*step;
          if(flying){p.x=THREE.MathUtils.lerp(p.x,nx,.7);p.z=THREE.MathUtils.lerp(p.z,nz,.7)}
          else if(mobCanStep(mob,nx,nz)){p.x=nx;p.z=nz}
          else mob.vy=Math.max(mob.vy,6.8);
        }else if(mob.attackCooldown<=0){
          const knock=new THREE.Vector3(dx/dist*.8,.5,dz/dist*.8);
          damageMob(target,mob.damage,mob.type,knock);
          mob.attackCooldown=mob.type==="warden"?.95:.82;
        }
      }

      if(mob.type==="creeper"&&dist<2.4){
        mob.aiming=false;
        if(mob.attackCooldown<=0){
          mob.hp=0;spawnParticles(p,0x76d07a,18,.9);removeMob(mob);
          for(const other of [...mobs])if(other!==mob&&!other.dead&&other.group.position.distanceTo(p)<3.3)damageMob(other,10,"creeper");
        }
      }
    }else if(mob.wander<=0){
      mob.wander=1.5+Math.random()*3.5;
      mob.group.rotation.y=Math.random()*Math.PI*2;
      mob.aiming=false;
      if(EGGS[mob.type]?.jumper)mob.vy=6.2;
    }else{
      const step=mob.speed*.055;
      const nx=p.x+Math.sin(mob.group.rotation.y)*step;
      const nz=p.z+Math.cos(mob.group.rotation.y)*step;
      if(flying){p.x=nx;p.z=nz}else if(mobCanStep(mob,nx,nz)){p.x=nx;p.z=nz}
    }

    if(p.y<-3)removeMob(mob);
    else animateMob(mob,.1);
  }
}

/* ---------------------------- PARTICLES ---------------------------- */

function spawnParticles(pos,color,count=8,spread=.45){
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}));
    m.position.copy(pos);
    m.userData.p={life:.3+Math.random()*.4,vx:(Math.random()-.5)*spread,vy:.8+Math.random()*1.5,vz:(Math.random()-.5)*spread,max:.7};
    scene.add(m);particles.push(m);
  }
}

function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const m=particles[i],d=m.userData.p;
    d.life-=dt;
    m.position.x+=d.vx*dt;m.position.y+=d.vy*dt;m.position.z+=d.vz*dt;
    d.vy-=3.5*dt;
    m.rotation.x+=dt*5;m.rotation.y+=dt*4;
    m.material.opacity=Math.max(0,d.life/d.max);
    if(d.life<=0){scene.remove(m);particles.splice(i,1)}
  }
}

/* ----------------------------- PLAYER ----------------------------- */

let spawnTimer=null;
let bob=0;
let bobOffset=0;

function updatePlayer(dt){
  if(!locked)return;
  const sprint=keys.ShiftLeft||keys.ShiftRight;
  const speed=(sprint?13.5:7.5)*dt;
  if(keys.KeyW)controls.forward(speed);
  if(keys.KeyS)controls.forward(-speed);
  if(keys.KeyA)controls.right(-speed);
  if(keys.KeyD)controls.right(speed);
  if(keys.Space)camera.position.y+=8.5*dt;
  if(sprint)camera.position.y-=8.5*dt;

  camera.position.x=THREE.MathUtils.clamp(camera.position.x,-33,33);
  camera.position.z=THREE.MathUtils.clamp(camera.position.z,-33,33);
  camera.position.y=THREE.MathUtils.clamp(camera.position.y,1.3,45);

  const moving=keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD;
  if(moving){
    bob+=dt*(sprint?11:8);
    const next=Math.sin(bob)*.024;
    camera.position.y+=next-bobOffset;
    bobOffset=next;
  }else if(bobOffset){
    camera.position.y-=bobOffset;bobOffset=0;
  }
  checkPortals();
}

/* ------------------------------ ACTIONS ---------------------------- */

function placePortal(kind,p){
  createPortal(kind,p.x,p.z);
  showMessage(kind==="nether"?"🟪 Nether Portalı kuruldu.":"🟩 End Portalı kuruldu.");
}

function performAction(button){
  if(!locked)return;
  const item=hotbarItems[selected];
  const target=hitEntity();

  if(button===0){
    if(target){
      const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();
      const amount=item.kind==="tool"&&item.id==="bow"?5:14;
      damageMob(target,amount,"player",new THREE.Vector3(dir.x*5,3.8,dir.z*5));
      return;
    }
    const hit=hitWorld();
    if(hit&&removeBlockMesh(hit.object)){
      const b=hit.object.userData.block;
      spawnParticles(hit.object.position,numberColor(BLOCKS[b.type]?.base||"#ffffff"),8,.5);
      showMessage("🧱 Blok kırıldı.");
    }
    return;
  }

  if(button===2){
    if(item.kind==="portal"){
      const p=placementData();
      if(p){placePortal(item.id,p)}
      return;
    }

    const p=placementData();
    if(!p)return;

    if(item.kind==="egg"){
      spawnMob(item.id,new THREE.Vector3(p.x+.5,p.y+.04,p.z+.5));
      showMessage(EGGS[item.id].icon+" spawn!");
      return;
    }

    if(item.kind==="tool"){
      if(item.id==="bow"&&target){
        // Player bow has a simple visible shot.
        const fake={group:{position:camera.position.clone()},damage:8,type:"player"};
        shootArrow(fake,target);
        showMessage("🏹 Ok atıldı!");
      }
      return;
    }

    if(!world.has(key(p.x,p.y,p.z))){
      addBlock(p.x,p.y,p.z,item.id);
      spawnParticles(new THREE.Vector3(p.x+.5,p.y+.5,p.z+.5),numberColor(BLOCKS[item.id].base),5,.23);
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
    if(hotbarItems[selected].kind==="egg")spawnTimer=setInterval(()=>performAction(2),240);
  }
});

addEventListener("mouseup",e=>{
  if(e.button===2){clearInterval(spawnTimer);spawnTimer=null}
});

addEventListener("wheel",e=>{
  if(!locked)return;
  selected=(selected+(e.deltaY>0?1:-1)+hotbarItems.length)%hotbarItems.length;
  renderHotbar();
},{passive:true});

document.addEventListener("contextmenu",e=>e.preventDefault());

/* --------------------------- SAVE / LOAD --------------------------- */

function saveWorld(){
  try{
    const data=[...world.values()].map(m=>{
      const b=m.userData.block;return[b.x,b.y,b.z,b.type];
    });
    localStorage.setItem("erdemcraft-beta-world",JSON.stringify(data));
    showMessage("💾 Dünya kaydedildi.");
  }catch{showMessage("⚠️ Kayıt başarısız.");}
}

function loadWorld(){
  try{
    const raw=localStorage.getItem("erdemcraft-beta-world");
    if(!raw){showMessage("ℹ️ Henüz kayıt yok.");return}
    clearWorld();
    JSON.parse(raw).forEach(a=>addBlock(a[0],a[1],a[2],a[3]));
    buildWater();
    for(const p of [...portalGroups])scene.remove(p);
    portalGroups.length=0;portals.length=0;
    createPortal("nether",-12,-18);createPortal("nether",20,-18);
    createPortal("end",14,18);createPortal("end",-20,18);
    spawnDemoMobs();
    showMessage("📂 Dünya yüklendi.");
  }catch{showMessage("⚠️ Kayıt okunamadı.");}
}

function resetWorld(){
  clearAllMobs();
  for(const p of [...projectiles])scene.remove(p.mesh);
  projectiles.length=0;
  buildWorld();
  spawnDemoMobs();
  camera.position.set(0,getGroundY(0,16)+6,16);
  showMessage("↻ Yeni dünya oluşturuldu.");
}

function clearAllMobs(){
  for(const mob of [...mobs])removeMob(mob);
}

/* ------------------------------ HUD ------------------------------- */

let fpsFrames=0,fpsTimer=0,fps=60;

function showMessage(text){
  const el=document.getElementById("message");
  el.textContent=text;
  el.classList.add("show");
  clearTimeout(showMessage.t);
  showMessage.t=setTimeout(()=>el.classList.remove("show"),1250);
}

function updateHUD(dt){
  fpsFrames++;fpsTimer+=dt;
  if(fpsTimer>.6){fps=fpsFrames/fpsTimer;fpsFrames=0;fpsTimer=0}
  const item=labelFor(hotbarItems[selected]);
  const phase=(elapsed*.035)%(Math.PI*2);
  const light=THREE.MathUtils.clamp((Math.sin(phase)+.2)/1.2,.06,1);
  const time=light>.62?"Gündüz":light>.24?"Akşam":"Gece";
  document.getElementById("stats").textContent="🌍 Beta 2 • 👾 "+mobs.length+"/180 mob • "+time+" • "+Math.round(fps)+" FPS";
  document.getElementById("status").textContent=locked?"Seçili: "+item.icon+" "+item.name:"Fareyi kilitlemek için ekrana tıkla.";
}

/* --------------------------- SKY / LOOP --------------------------- */

function updateSky(){
  const phase=(elapsed*.035)%(Math.PI*2);
  const day=THREE.MathUtils.clamp((Math.sin(phase)+.18)/1.18,.06,1);
  const warm=new THREE.Color(0xc77e74);
  const skyDay=new THREE.Color(0x8fd6f6);
  const skyNight=new THREE.Color(0x091226);
  const sky=day<.25?skyNight.clone().lerp(warm,day/.25):warm.clone().lerp(skyDay,(day-.25)/.75);

  scene.background.copy(sky);
  scene.fog=new THREE.Fog(sky,35,118);
  sun.position.set(Math.cos(phase)*44,Math.sin(phase)*44+11,18);
  sun.intensity=.3+day*2.35;
  hemi.intensity=.5+day*1.35;
  moonLight.intensity=(1-day)*.72;
  ambientGlow.intensity=(1-day)*1.3;
  stars.material.opacity=(1-day)*.95;
  moon.material.opacity=(1-day)*.95;
  moon.position.set(Math.cos(phase+Math.PI)*52,Math.sin(phase+Math.PI)*34+28,-26);
  cloudGroup.position.x=Math.sin(elapsed*.006)*5;
  for(const water of waterMeshes)water.rotation.z+=.0015;
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  elapsed+=dt;
  updatePlayer(dt);
  updateMobs(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateSky();
  updateSelection();
  updateHUD(dt);
  renderer.render(scene,camera);
}

document.getElementById("play").onclick=()=>controls.lock();
document.getElementById("close-inventory").onclick=()=>toggleInventory(false);
document.getElementById("save-btn").onclick=()=>saveWorld();
document.getElementById("load-btn").onclick=()=>loadWorld();
document.getElementById("reset-btn").onclick=()=>resetWorld();

buildWorld();
spawnMob("zombie",new THREE.Vector3(-3,terrainY(-3,-7),-7));
spawnMob("skeleton",new THREE.Vector3(3,terrainY(3,-7),-7));
spawnMob("creeper",new THREE.Vector3(0,terrainY(0,-4),-4));
spawnMob("slime",new THREE.Vector3(-4,terrainY(-4,-3),-3));
spawnMob("sheep",new THREE.Vector3(-5,terrainY(-5,3),3));
spawnMob("cow",new THREE.Vector3(5,terrainY(5,4),4));
spawnMob("pillager",new THREE.Vector3(8,terrainY(8,-5),-5));
spawnMob("spider",new THREE.Vector3(-8,terrainY(-8,-5),-5));

camera.position.y=getGroundY(0,16)+6;

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

animate();
