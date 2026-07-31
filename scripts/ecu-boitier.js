/* ═══════════════════════════════════════════════════════════════════
   ARCHIVE — Boîtier de gestion 3D (calculateur ECU générique)
   Retiré de l'accueil le 10/07/2026 à la demande de Baptiste
   (« on verra ça plus tard »). Conservé ici pour réintégration future.

   Pour le réutiliser :
     import { buildEcu } from './scripts/ecu-boitier.js';
     const { group, parts } = buildEcu();
     scene.add(group);
     // parts : [{ g, base, explode, win, rot }] — même API que buildGpsSensor :
     // dans la boucle : kp = smooth(win[0], win[1], k) puis
     // g.position = base + explode * kp ; g.rotation = rot * kp

   Texture carte : images/textures/ecu-pcb.jpg
   (photo réelle de carte de calculateur, Wikimedia Commons, licence CC0 :
   File:ECU VAN KUTIJE SLIKA PCB-A I KOMPONENATA.jpg)
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function makeLabelTexture(){
  const c = document.createElement('canvas'); c.width = 760; c.height = 400;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f4ee'; x.fillRect(0,0,760,400);
  x.strokeStyle = '#c9cdbd'; x.lineWidth = 4; x.strokeRect(8,8,744,384);
  // code-barres
  let bx = 40;
  x.fillStyle = '#14170f';
  while (bx < 380){ const w = 3 + Math.random()*9; x.fillRect(bx, 36, w, 78); bx += w + 4 + Math.random()*8; }
  x.font = '500 30px "JetBrains Mono", monospace'; x.fillStyle = '#3f4839';
  x.fillText('REF 24-0457-B', 420, 66);
  x.fillText('12V — CAN BUS', 420, 106);
  x.fillStyle = '#14170f'; x.font = '800 58px Inter, Arial';
  x.fillText('DÉPANÉO', 40, 190);
  x.fillStyle = '#3c8f19'; x.fillRect(318, 152, 226, 44);
  x.fillStyle = '#f2f5ee'; x.font = 'italic 700 36px Inter, Arial';
  x.fillText('electronics', 336, 186);
  // tampon atelier
  x.strokeStyle = '#3c8f19'; x.lineWidth = 5;
  x.strokeRect(40, 240, 500, 110);
  x.fillStyle = '#3c8f19'; x.font = '700 44px Inter, Arial';
  x.fillText('✓ TESTÉ & RÉPARÉ', 68, 310);
  x.font = '500 26px "JetBrains Mono", monospace'; x.fillStyle = '#5b6455';
  x.fillText('CHÂTEAUBOURG — 07/2026', 68, 344);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildEcu(){
  const housing  = new THREE.MeshPhysicalMaterial({ color:0x1a1d20, roughness:.45, metalness:.25, clearcoat:.3, clearcoatRoughness:.4, envMapIntensity:.8 });
  const housing2 = new THREE.MeshPhysicalMaterial({ color:0x111316, roughness:.55, metalness:.2, clearcoat:.2, clearcoatRoughness:.5, envMapIntensity:.7 });
  const metal    = new THREE.MeshStandardMaterial({ color:0x9aa0a6, roughness:.3, metalness:.95 });

  const group = new THREE.Group();
  const parts = [];
  function addPart(obj, explode, win, rot){
    const g = new THREE.Group(); g.add(obj); group.add(g);
    parts.push({ g, base:g.position.clone(), explode:new THREE.Vector3(...explode),
                 win, rot: rot ? new THREE.Vector3(...rot) : null });
    return g;
  }

  // — Bac inférieur + pattes de fixation
  const baseG = new THREE.Group();
  const tub = new THREE.Mesh(new RoundedBoxGeometry(3.5,2.3,.55,3,.09), housing2);
  baseG.add(tub);
  [-1,1].forEach(function(s){
    const tab = new THREE.Mesh(new RoundedBoxGeometry(.55,.5,.12,2,.05), housing2);
    tab.position.set(s*2.0,-1.05,-.1); baseG.add(tab);
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.16,14),
      new THREE.MeshStandardMaterial({ color:0xfafaf7, roughness:.9 }));
    hole.rotation.x = Math.PI/2; hole.position.set(s*2.0,-1.05,-.1); baseG.add(hole);
  });
  baseG.position.z = -.30;
  addPart(baseG, [0,-1.05,-.45], [.6,.88]);

  // — Couvercle nervuré + étiquette atelier
  const lidG = new THREE.Group();
  lidG.add(new THREE.Mesh(new RoundedBoxGeometry(3.5,2.3,.22,3,.08), housing));
  [-1.5,-1.28,1.28,1.5].forEach(function(rx){
    const rib = new THREE.Mesh(new THREE.BoxGeometry(.07,2.0,.04), housing);
    rib.position.set(rx, 0, .12); lidG.add(rib);
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.0),
    new THREE.MeshStandardMaterial({ map:makeLabelTexture(), roughness:.65, metalness:0 }));
  label.position.set(-.05, .05, .125); lidG.add(label);
  lidG.position.z = .16;
  addPart(lidG, [0,1.35,.7], [.14,.4]);

  // — Vis de couvercle ×4 (s'envolent en tournant)
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(sc){
    const sG = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.16,18), metal);
    body.rotation.x = Math.PI/2; sG.add(body);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(.1,.024,.03), housing2);
    slot.position.z = .085; sG.add(slot);
    sG.position.set(sc[0]*1.52, sc[1]*0.92, .30);
    addPart(sG, [sc[0]*.4, .85 + sc[1]*.2, .8], [0,.18], [0,0,sc[0]*3.5]);
  });

  // — Carte électronique : vraie photo de carte de calculateur (CC0)
  const pcbG = new THREE.Group();
  const ecuPcbTex = new THREE.TextureLoader().load('images/textures/ecu-pcb.jpg');
  ecuPcbTex.colorSpace = THREE.SRGBColorSpace; ecuPcbTex.anisotropy = 8;
  const pcbSide = new THREE.MeshStandardMaterial({ color:0x0a5429, roughness:.55 });
  pcbG.add(new THREE.Mesh(new THREE.BoxGeometry(3.15,1.95,.06),
    [ pcbSide, pcbSide, pcbSide, pcbSide,
      new THREE.MeshStandardMaterial({ map:ecuPcbTex, roughness:.5, metalness:.15 }),
      new THREE.MeshStandardMaterial({ color:0x094a24, roughness:.6 }) ]));
  // condensateurs électrolytiques (manchon + sommet alu rainuré en croix)
  [[1.25,-.35,.16],[1.25,.25,.14],[.95,-.6,.13],[.95,.55,.12]].forEach(function(cp){
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(cp[2],cp[2],.34,20),
      new THREE.MeshStandardMaterial({ color:0x24306b, roughness:.4, metalness:.3 }));
    cap.rotation.x = Math.PI/2; cap.position.set(cp[0], cp[1], .2); pcbG.add(cap);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(cp[2]*.92,cp[2]*.92,.02,20), metal);
    top.rotation.x = Math.PI/2; top.position.set(cp[0], cp[1], .375); pcbG.add(top);
    [0, Math.PI/2].forEach(function(rot){
      const groove = new THREE.Mesh(new THREE.BoxGeometry(cp[2]*1.7,.02,.012),
        new THREE.MeshStandardMaterial({ color:0x5a5f66, roughness:.5, metalness:.7 }));
      groove.rotation.z = rot; groove.position.set(cp[0], cp[1], .388); pcbG.add(groove);
    });
  });
  // relais
  [[-.15,.45],[.5,.45]].forEach(function(rp){
    const relay = new THREE.Mesh(new RoundedBoxGeometry(.52,.4,.3,2,.03),
      new THREE.MeshStandardMaterial({ color:0xd8dade, roughness:.5 }));
    relay.position.set(rp[0], rp[1], .18); pcbG.add(relay);
  });
  // microcontrôleur (avec rangées de broches dorées) + quartz
  const mcu = new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.07),
    new THREE.MeshStandardMaterial({ color:0x121417, roughness:.35, metalness:.4 }));
  mcu.position.set(.55,-.35,.07); pcbG.add(mcu);
  [-1,1].forEach(function(s){
    const legs = new THREE.Mesh(new THREE.BoxGeometry(.62,.05,.03),
      new THREE.MeshStandardMaterial({ color:0xc9a227, roughness:.3, metalness:.9 }));
    legs.position.set(.55, -.35 + s*.31, .05); pcbG.add(legs);
    const legs2 = new THREE.Mesh(new THREE.BoxGeometry(.05,.62,.03),
      new THREE.MeshStandardMaterial({ color:0xc9a227, roughness:.3, metalness:.9 }));
    legs2.position.set(.55 + s*.31, -.35, .05); pcbG.add(legs2);
  });
  const quartz = new THREE.Mesh(new RoundedBoxGeometry(.24,.11,.09,2,.03), metal);
  quartz.position.set(.15,-.15,.08); pcbG.add(quartz);
  // quelques composants CMS en relief (la photo fournit déjà la densité)
  for (let i=0;i<6;i++){
    const comp = new THREE.Mesh(new THREE.BoxGeometry(.1+Math.random()*.14,.07+Math.random()*.1,.06),
      new THREE.MeshStandardMaterial({ color: Math.random()<.5?0x1b1d1f:0x33373d, roughness:.35, metalness:.6 }));
    comp.position.set(-1.3+Math.random()*1.8, -.75+Math.random()*1.3, .06);
    pcbG.add(comp);
  }
  // barrettes de connexion vers les connecteurs
  [-.72,.78].forEach(function(hx){
    const header = new THREE.Mesh(new THREE.BoxGeometry(.95,.14,.2),
      new THREE.MeshStandardMaterial({ color:0x14170f, roughness:.5 }));
    header.position.set(hx,.86,.12); pcbG.add(header);
  });
  pcbG.position.z = -.06;
  addPart(pcbG, [0,.3,.95], [.34,.62], [-.3,0,0]);

  // — Connecteurs multibroches ×2 (sur la tranche haute, comme les calculateurs réels)
  const connectorPlastic = new THREE.MeshStandardMaterial({ color:0x17191c, roughness:.7, metalness:.05, envMapIntensity:.35 });
  [-.72,.78].forEach(function(cx){
    const cG = new THREE.Group();
    const shell = new THREE.Mesh(new RoundedBoxGeometry(1.0,.5,.5,2,.06), connectorPlastic);
    cG.add(shell);
    const cavity = new THREE.Mesh(new THREE.BoxGeometry(.86,.2,.38),
      new THREE.MeshStandardMaterial({ color:0x050605, roughness:.8 }));
    cavity.position.y = .17; cG.add(cavity);
    // broches dorées (2 rangées, comme un vrai connecteur de calculateur)
    for (let r=0;r<2;r++) for (let i=0;i<7;i++){
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.14,8),
        new THREE.MeshStandardMaterial({ color:0xc9a227, roughness:.3, metalness:.9 }));
      pin.position.set(-.36+i*.12, .2, -.09 + r*.18); cG.add(pin);
    }
    const latch = new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.56), connectorPlastic);
    latch.position.set(0,-.14,0); cG.add(latch);
    cG.position.set(cx, 1.22, -.06);
    addPart(cG, [cx*1.2, .85, .15], [.5,.76]);
  });

  return { group, parts };
}
