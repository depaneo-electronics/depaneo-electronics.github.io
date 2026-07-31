/* Modèle 3D du capteur de vitesse GPS Dépanéo — module partagé
   Textures issues des photos réelles (façade redressée, modules GPS/LCD à plat).
   Utilisé par capteur-vitesse-gps.html (démontage au scroll) et index.html (teaser). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* Profil mesuré sur la photo (L 3.7 × H 2.72, H/L = 0.74) :
   bas plat, bord gauche montant aux 2/3, sommet du toit à x -0.14, coin droit haut arrondi */
const PROFILE = [[-1.85,-1.36],[1.85,-1.36],[1.85,1.20],[-0.14,1.36],[-1.85,0.43]];

function roundedShape(pts, r){
  const s = new THREE.Shape();
  const n = pts.length;
  for (let i=0;i<n;i++){
    const p = new THREE.Vector2(...pts[i]);
    const prev = new THREE.Vector2(...pts[(i-1+n)%n]);
    const next = new THREE.Vector2(...pts[(i+1)%n]);
    const dPrev = p.clone().sub(prev).normalize();
    const dNext = next.clone().sub(p).normalize();
    const a = p.clone().sub(dPrev.clone().multiplyScalar(r));
    const b = p.clone().add(dNext.clone().multiplyScalar(r));
    if (i===0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(p.x, p.y, b.x, b.y);
  }
  s.closePath();
  return s;
}
function scalePts(pts, k){ return pts.map(p => [p[0]*k, p[1]*k]); }
function remapUV(geo){
  geo.computeBoundingBox();
  const bb = geo.boundingBox, sx = bb.max.x-bb.min.x, sy = bb.max.y-bb.min.y;
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i=0;i<pos.count;i++){
    uv.setXY(i, (pos.getX(i)-bb.min.x)/sx, (pos.getY(i)-bb.min.y)/sy);
  }
  uv.needsUpdate = true;
}

function loadTex(url){
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Boîte dont les faces avant ET arrière portent la texture photo (visible sous tous les angles) */
function photoBox(w, h, d, tex, sideColor){
  const side = new THREE.MeshStandardMaterial({ color: sideColor, roughness:.6, metalness:.1 });
  const front = new THREE.MeshStandardMaterial({ map: tex, roughness:.5, metalness:.05 });
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, front, front]);
}

/* Texture de circuit imprimé réaliste (pistes, pastilles, vias, sérigraphie) */
export function makePcbTexture(w = 1024, h = 512, base = '#0c6b34'){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // variation du vernis épargne
  for (let i=0;i<240;i++){
    x.fillStyle = 'rgba(255,255,255,' + (Math.random()*.03) + ')';
    x.fillRect(Math.random()*w, Math.random()*h, 2+Math.random()*30, 1+Math.random()*3);
  }
  // pistes (tracé manhattan)
  x.strokeStyle = 'rgba(190,230,180,.28)'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i=0;i<26;i++){
    let px = Math.random()*w, py = Math.random()*h;
    x.beginPath(); x.moveTo(px, py);
    for (let s=0;s<4;s++){
      if (Math.random()<.5) px += (Math.random()-.5)*w*.3; else py += (Math.random()-.5)*h*.4;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  // vias et pastilles dorées
  for (let i=0;i<80;i++){
    const vx = Math.random()*w, vy = Math.random()*h, r = 3+Math.random()*4;
    x.fillStyle = '#c9a227';
    x.beginPath(); x.arc(vx, vy, r, 0, Math.PI*2); x.fill();
    x.fillStyle = base;
    x.beginPath(); x.arc(vx, vy, r*.45, 0, Math.PI*2); x.fill();
  }
  // sérigraphie blanche
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2;
  for (let i=0;i<16;i++){
    x.strokeRect(Math.random()*(w-90), Math.random()*(h-50), 40+Math.random()*70, 16+Math.random()*30);
  }
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '600 20px "JetBrains Mono", monospace';
  x.fillText('DEPANEO', 24, h-22);
  x.fillText('GPS-V2', w-140, 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Construit le capteur complet.
   options.animateLCD : rafraîchit la vitesse affichée toutes les 700 ms.
   Retourne { group, parts } — parts : [{ g, base, explode, win, rot }] pour le démontage séquencé. */
export function buildGpsSensor(options = {}){
  const animateLCD = options.animateLCD !== false;

  // — Écran LCD animé : véritable matrice 16×2 à points 5×7 (comme le HD44780 du produit)
  const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 1024; lcdCanvas.height = 264;
  const lcdTexture = new THREE.CanvasTexture(lcdCanvas); lcdTexture.colorSpace = THREE.SRGBColorSpace;
  let lcdSpeed = 12.4, lcdSats = 9;
  const FONT57 = {
    '0':[14,17,19,21,25,17,14], '1':[4,12,4,4,4,4,14],   '2':[14,17,1,2,4,8,31],
    '3':[31,2,4,2,1,17,14],     '4':[2,6,10,18,31,2,2],  '5':[31,16,30,1,1,17,14],
    '6':[6,8,16,30,17,17,14],   '7':[31,1,2,4,8,8,8],    '8':[14,17,17,14,17,17,14],
    '9':[14,17,17,15,1,2,12],   'K':[17,18,20,24,20,18,17],'M':[17,27,21,21,17,17,17],
    'H':[17,17,17,31,17,17,17], '/':[0,1,2,4,8,16,0],    ':':[0,12,12,0,12,12,0],
    '.':[0,0,0,0,0,12,12],      ' ':[0,0,0,0,0,0,0]
  };
  function drawLCD(){
    const x = lcdCanvas.getContext('2d');
    // fond : bleu-violet avec point chaud du rétroéclairage, comme la photo
    const g = x.createLinearGradient(0,0,0,264);
    g.addColorStop(0,'#3d54ee'); g.addColorStop(.55,'#3247e2'); g.addColorStop(1,'#2634c4');
    x.fillStyle = g; x.fillRect(0,0,1024,264);
    const halo = x.createRadialGradient(340,120,20, 340,120,560);
    halo.addColorStop(0,'rgba(150,175,255,.32)'); halo.addColorStop(1,'rgba(150,175,255,0)');
    x.fillStyle = halo; x.fillRect(0,0,1024,264);

    const line1 = (lcdSpeed.toFixed(1) + ' KM/H').padEnd(14) + String(lcdSats).padStart(2,'0');
    const line2 = '14:32   02/07/26';
    const COLS = 16, DOT = 9, GAP = 2.6, CW = 5*(DOT+GAP), PITCH = (1024-56)/COLS;
    const drawChar = (ch, cx, cy) => {
      const bm = FONT57[ch] || FONT57[' '];
      for (let r=0; r<8; r++){
        const bits = r < 7 ? bm[r] : 0;
        for (let c=0; c<5; c++){
          const lit = (bits >> (4-c)) & 1;
          const px = cx + c*(DOT+GAP), py = cy + r*(DOT+GAP);
          if (lit){
            x.shadowColor = 'rgba(210,225,255,.95)'; x.shadowBlur = 7;
            x.fillStyle = '#f4f8ff';
          } else {
            x.shadowBlur = 0;
            x.fillStyle = 'rgba(235,242,255,.07)';   // pixels éteints, faiblement visibles
          }
          x.fillRect(px, py, DOT, DOT);
        }
      }
      x.shadowBlur = 0;
    };
    for (let i=0;i<COLS;i++){
      drawChar(line1[i] || ' ', 28 + i*PITCH + (PITCH-CW)/2, 26);
      drawChar(line2[i] || ' ', 28 + i*PITCH + (PITCH-CW)/2, 146);
    }
    // reflet de vitre discret en travers
    const refl = x.createLinearGradient(0,0,1024,264);
    refl.addColorStop(.12,'rgba(255,255,255,0)'); refl.addColorStop(.22,'rgba(255,255,255,.06)');
    refl.addColorStop(.30,'rgba(255,255,255,0)');
    x.fillStyle = refl; x.fillRect(0,0,1024,264);
    // assombrissement sous le bord haut du cadre
    const top = x.createLinearGradient(0,0,0,42);
    top.addColorStop(0,'rgba(0,0,20,.4)'); top.addColorStop(1,'rgba(0,0,20,0)');
    x.fillStyle = top; x.fillRect(0,0,1024,42);
    lcdTexture.needsUpdate = true;
  }
  drawLCD();
  if (animateLCD && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    setInterval(function(){
      lcdSpeed = Math.max(0, 12.4 + (Math.random()-.5)*1.6);
      if (Math.random() < .25) lcdSats = 8 + Math.floor(Math.random()*4);
      drawLCD();
    }, 700);
  }

  // Textures photo
  const faceTex = loadTex('images/textures/capteur-face.jpg');
  const gpsTex  = loadTex('images/textures/capteur-module-gps.jpg');
  const lcdModTex = loadTex('images/textures/capteur-module-lcd.jpg');

  // Plastique imprimé 3D satiné — clearcoat marqué pour que les arêtes accrochent la lumière
  const blackPlastic = new THREE.MeshPhysicalMaterial({ color:0x171916, roughness:.42, metalness:.06, clearcoat:.5, clearcoatRoughness:.32, envMapIntensity:.9 });
  const darkPlastic  = new THREE.MeshPhysicalMaterial({ color:0x121412, roughness:.5, metalness:.05, clearcoat:.4, clearcoatRoughness:.38, envMapIntensity:.8 });

  const group = new THREE.Group();
  const parts = [];
  function addPart(obj, explode, win, rot){
    const g = new THREE.Group(); g.add(obj); group.add(g);
    parts.push({ g, base:g.position.clone(), explode:new THREE.Vector3(...explode),
                 win, rot: rot ? new THREE.Vector3(...rot) : null });
    return g;
  }

  // ——— Position de la vitre (calculée tôt : la coque avant ET la façade sont percées) ———
  const faceShapeForBB = roundedShape(scalePts(PROFILE,.985),.2);
  const tmpBBGeo = new THREE.ShapeGeometry(faceShapeForBB);
  tmpBBGeo.computeBoundingBox();
  const bbF = tmpBBGeo.boundingBox, bwF = bbF.max.x - bbF.min.x, bhF = bbF.max.y - bbF.min.y;
  tmpBBGeo.dispose();
  const INS = { l:.03, r:0, b:.02, t:.04 };
  const glass = { u:(230+988)/2/1110, v:(408+616)/2/816, w:(988-230)/1110, h:(616-408)/816 };
  const gx = bbF.min.x + ((glass.u - INS.l)/(1-INS.l-INS.r)) * bwF;
  const gy = bbF.min.y + (((1-glass.v) - INS.b)/(1-INS.b-INS.t)) * bhF;
  const gw = glass.w/(1-INS.l-INS.r) * bwF;
  const gh = glass.h/(1-INS.b-INS.t) * bhF;
  const hw = gw*1.02, hh = gh*1.02;
  function rectPath(w, h){
    const p = new THREE.Path();
    p.moveTo(gx-w/2, gy-h/2); p.lineTo(gx+w/2, gy-h/2);
    p.lineTo(gx+w/2, gy+h/2); p.lineTo(gx-w/2, gy+h/2);
    p.closePath();
    return p;
  }

  // — Coque avant + lèvre de cadre (une seule pièce), percée à l'emplacement de l'écran
  const frontGroup = new THREE.Group();
  const frontShape = roundedShape(PROFILE,.2);
  frontShape.holes.push(rectPath(hw, hh));
  const frontGeo = new THREE.ExtrudeGeometry(frontShape,
    { depth:.22, bevelEnabled:true, bevelThickness:.05, bevelSize:.05, bevelSegments:3, curveSegments:10 });
  frontGeo.translate(0,0,-.06);
  frontGroup.add(new THREE.Mesh(frontGeo, blackPlastic));
  const lipShape = roundedShape(scalePts(PROFILE,1.07),.21);
  lipShape.holes.push(roundedShape(scalePts(PROFILE,.97),.19));
  const lipGeo = new THREE.ExtrudeGeometry(lipShape,
    { depth:.16, bevelEnabled:true, bevelThickness:.04, bevelSize:.04, bevelSegments:2, curveSegments:10 });
  lipGeo.translate(0,0,.18);
  frontGroup.add(new THREE.Mesh(lipGeo, darkPlastic));
  addPart(frontGroup, [0,0,1.1], [.08,.26]);

  // — Façade (photo réelle redressée) avec OUVERTURE : la dalle LCD est encastrée
  //   derrière le cadre imprimé, avec les parois du puits visibles — comme le vrai produit.
  const facePart = new THREE.Group();
  const faceShape = roundedShape(scalePts(PROFILE,.985),.2);
  // ouverture légèrement plus grande que la vitre imprimée (le cadre photo reste en relief autour)
  faceShape.holes.push(rectPath(hw, hh));

  const faceGeo = new THREE.ShapeGeometry(faceShape, 10);
  remapUV(faceGeo);
  {
    const uv = faceGeo.attributes.uv;
    for (let i=0;i<uv.count;i++){
      uv.setXY(i, INS.l + uv.getX(i)*(1-INS.l-INS.r), INS.b + uv.getY(i)*(1-INS.b-INS.t));
    }
    uv.needsUpdate = true;
  }
  const faceMesh = new THREE.Mesh(faceGeo,
    new THREE.MeshStandardMaterial({ map:faceTex, roughness:.48, metalness:.04 }));
  faceMesh.position.z = .225;
  facePart.add(faceMesh);

  // Le puits est formé par les parois biseautées du trou de la coque avant (aucune pièce
  // rapportée = aucun scintillement possible). Derrière la dalle : plaque de fond sombre
  // qui bouche tout interstice, quel que soit l'angle.
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(hw + .5, hh + .5),
    new THREE.MeshStandardMaterial({ color:0x05060a, roughness:.95, metalness:0 }));
  backing.position.set(gx, gy, .07);
  facePart.add(backing);

  // dalle LCD encastrée : exactement la taille de l'ouverture (moins un cheveu),
  // elle ne croise donc jamais les parois
  const lcdMat = new THREE.MeshStandardMaterial({ map:lcdTexture, emissive:0x3350e8, emissiveMap:lcdTexture, emissiveIntensity:.85, roughness:.18 });
  const lcdPlane = new THREE.Mesh(new THREE.PlaneGeometry(hw - .012, hh - .012), lcdMat);
  lcdPlane.position.set(gx, gy, .12);
  facePart.add(lcdPlane);
  addPart(facePart, [0,.15,2.1], [.08,.26]);                          // 01 — écran (façade + dalle)

  // — Module LCD 16×2 (photo réelle à plat)
  const lcdModule = photoBox(2.55, 1.18, .26, lcdModTex, 0x0f3d1e);
  lcdModule.position.set(.02, -.29, -.08);
  addPart(lcdModule, [0,-1.05,1.3], [.30,.46], [-.18,0,0]);

  // — Module GPS à antenne céramique (photo réelle à plat)
  const gpsModule = photoBox(1.02, 1.1, .14, gpsTex, 0x14275c);
  gpsModule.position.set(.35, .62, -.18);
  addPart(gpsModule, [-.3,-1.15,1.9], [.36,.52], [.18,.3,0]);         // 02 — antenne GPS

  // — Carte principale (texture PCB générée + modules Arduino/alim)
  const mainBoard = new THREE.Group();
  const pcbTex = makePcbTexture(1024, 512);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.5, .07),
    [ new THREE.MeshStandardMaterial({ color:0x0a5429, roughness:.55 }),
      new THREE.MeshStandardMaterial({ color:0x0a5429, roughness:.55 }),
      new THREE.MeshStandardMaterial({ color:0x0a5429, roughness:.55 }),
      new THREE.MeshStandardMaterial({ color:0x0a5429, roughness:.55 }),
      new THREE.MeshStandardMaterial({ map:pcbTex, roughness:.5, metalness:.15 }),
      new THREE.MeshStandardMaterial({ color:0x094a24, roughness:.6 }) ]);
  mainBoard.add(board);
  // Arduino pro mini (bleu) + module d'alimentation, comme sur la photo de l'intérieur
  const arduino = new THREE.Mesh(new THREE.BoxGeometry(.85,.42,.1),
    new THREE.MeshStandardMaterial({ color:0x14357a, roughness:.45, metalness:.2 }));
  arduino.position.set(-.6,-.25,.08); mainBoard.add(arduino);
  const buck = new THREE.Mesh(new THREE.BoxGeometry(.6,.5,.12),
    new THREE.MeshStandardMaterial({ color:0x123068, roughness:.45, metalness:.2 }));
  buck.position.set(.55,-.2,.09); mainBoard.add(buck);
  const inductor = new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.12,18),
    new THREE.MeshStandardMaterial({ color:0x2a2d33, roughness:.5 }));
  inductor.rotation.x = Math.PI/2; inductor.position.set(.72,-.05,.1); mainBoard.add(inductor);
  // barrette de connexion
  const header = new THREE.Mesh(new THREE.BoxGeometry(1.6,.12,.14),
    new THREE.MeshStandardMaterial({ color:0x14170f, roughness:.5 }));
  header.position.set(-.2,.5,.09); mainBoard.add(header);
  for (let i=0;i<12;i++){
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.16,6),
      new THREE.MeshStandardMaterial({ color:0xc9a227, roughness:.3, metalness:.9 }));
    pin.rotation.x = Math.PI/2; pin.position.set(-.9+i*.13,.5,.16); mainBoard.add(pin);
  }
  mainBoard.position.set(0,-.15,-.5);
  addPart(mainBoard, [0,-.05,.85], [.44,.60], [0,.35,0]);             // 03 — carte Dépanéo

  // — Coque arrière (profonde, comme l'impression 3D réelle)
  const backGeo = new THREE.ExtrudeGeometry(roundedShape(PROFILE,.2),
    { depth:.95, bevelEnabled:true, bevelThickness:.07, bevelSize:.07, bevelSegments:3, curveSegments:10 });
  backGeo.translate(0,0,-1.1);
  addPart(new THREE.Mesh(backGeo, blackPlastic), [0,0,-1.9], [.52,.66]);

  // — Molettes latérales (vis de serrage moletées, au niveau du pivot)
  function knob(side){
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.18,28), darkPlastic);
    disc.rotation.z = Math.PI/2; g.add(disc);
    for (let i=0;i<16;i++){
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(.17,.045,.045), blackPlastic);
      const a = i/16*Math.PI*2;
      ridge.position.set(0, Math.cos(a)*.23, Math.sin(a)*.23);
      ridge.rotation.x = -a; g.add(ridge);
    }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.4,16),
      new THREE.MeshStandardMaterial({ color:0xb9bec4, roughness:.28, metalness:.95 }));
    shaft.rotation.z = Math.PI/2; shaft.position.x = side*-.26; g.add(shaft);
    const washer = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.03,20),
      new THREE.MeshStandardMaterial({ color:0x9aa0a6, roughness:.3, metalness:.9 }));
    washer.rotation.z = Math.PI/2; washer.position.x = side*-.14; g.add(washer);
    g.position.set(side*2.16, -.15, -.4);
    return g;
  }
  addPart(knob(1),  [1.8,0,0], [.60,.72]);
  addPart(knob(-1), [-1.8,0,0], [.60,.72]);

  // — Étrier de fixation : fin, au plus près du corps, trous sombres en creux
  const bracket = new THREE.Group();
  const bBottom = new THREE.Mesh(new RoundedBoxGeometry(4.35,.12,.8,2,.04), blackPlastic);
  bBottom.position.y = -1.72; bracket.add(bBottom);
  [-1,1].forEach(function(s){
    const arm = new THREE.Mesh(new RoundedBoxGeometry(.12,1.7,.8,2,.04), blackPlastic);
    arm.position.set(s*2.06, -.92, 0); bracket.add(arm);
  });
  [-.9,-.3,.3,.9].forEach(function(px){
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.14,12),
      new THREE.MeshStandardMaterial({ color:0x060706, roughness:.85 }));
    hole.position.set(px,-1.72,0); bracket.add(hole);
  });
  bracket.position.z = -.4;
  addPart(bracket, [0,-1.3,0], [.66,.80]);                            // 04 — étrier

  // — Câble fin qui pend naturellement + connecteur étanche compact
  const cableGroup = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(.45,-1.3,-.5), new THREE.Vector3(.6,-2.0,-.05),
    new THREE.Vector3(.3,-2.6,.35), new THREE.Vector3(-.5,-2.75,.35),
    new THREE.Vector3(-1.2,-2.45,.25), new THREE.Vector3(-1.55,-2.05,.2)
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 56, .042, 12),
    new THREE.MeshStandardMaterial({ color:0xdedad0, roughness:.5 }));
  cableGroup.add(cable);
  const connGroup = new THREE.Group();
  const connBody = new THREE.Mesh(new RoundedBoxGeometry(.34,.15,.15,2,.04), blackPlastic);
  connGroup.add(connBody);
  const connSeal = new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.07,12),
    new THREE.MeshStandardMaterial({ color:0xb03030, roughness:.5 }));
  connSeal.rotation.z = Math.PI/2; connSeal.position.x = -.2; connGroup.add(connSeal);
  const end = curve.getPoint(1), tan = curve.getTangent(1);
  connGroup.position.copy(end).add(tan.clone().multiplyScalar(.18));
  connGroup.rotation.z = Math.atan2(tan.y, tan.x);
  cableGroup.add(connGroup);
  addPart(cableGroup, [.2,-1.5,.3], [.78,.92]);                       // 05 — connecteur

  return { group, parts };
}

export function smooth(a, b, x){ const t = Math.min(1, Math.max(0, (x-a)/(b-a))); return t*t*(3-2*t); }
