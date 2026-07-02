import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

function latLonToVector3(lat, lon) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const x = Math.cos(latRad) * Math.sin(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z).normalize();
}

const PREDEFINED_PLATES = [
  {
    name: "Pacific Plate",
    lat: -15, lon: -160,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(-0.6, 0.7, -0.39).normalize(),
    angularVelocity: 0.038,
    file: "pacific_plate.png",
    hexColor: "#6baed6",
    area: "20.1%"
  },
  {
    name: "North American Plate",
    lat: 52, lon: -100,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(-0.1, -0.9, 0.4).normalize(),
    angularVelocity: 0.018,
    file: "north_american_plate.png",
    hexColor: "#fee391",
    area: "14.8%"
  },
  {
    name: "Eurasian Plate",
    lat: 48, lon: 75,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.1, -0.99, -0.05).normalize(),
    angularVelocity: 0.012,
    file: "eurasian_plate.png",
    hexColor: "#989c89",
    area: "13.2%"
  },
  {
    name: "African Plate",
    lat: 0, lon: 20,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.55, 0.75, 0.35).normalize(),
    angularVelocity: 0.020,
    file: "african_plate.png",
    hexColor: "#d4ceb0",
    area: "11.9%"
  },
  {
    name: "Antarctic Plate",
    lat: -82, lon: 0,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(-0.1, 0.99, 0.1).normalize(),
    angularVelocity: 0.008,
    file: "antarctic_plate.png",
    hexColor: "#7393a7",
    area: "11.8%"
  },
  {
    name: "Indo-Australian Plate",
    lat: -25, lon: 130,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.68, 0.65, -0.32).normalize(),
    angularVelocity: 0.035,
    file: "australian_plate.png",
    hexColor: "#9e9ac8",
    area: "9.1%"
  },
  {
    name: "South American Plate",
    lat: -20, lon: -55,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(-0.25, -0.9, -0.35).normalize(),
    angularVelocity: 0.018,
    file: "south_american_plate.png",
    hexColor: "#ccd5ae",
    area: "8.5%"
  },
  {
    name: "Nazca Plate",
    lat: -18, lon: -95,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(0.15, -0.5, 0.85).normalize(),
    angularVelocity: 0.040,
    file: "nazca_plate.png",
    hexColor: "#F5C0C0",
    area: "3.0%"
  },
  {
    name: "Cocos Plate",
    lat: 12, lon: -102,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(0.4, 0.2, 0.89).normalize(),
    angularVelocity: 0.038,
    file: "cocos_plate.png",
    hexColor: "#9667e0",
    area: "0.6%"
  },
  {
    name: "Caribbean Plate",
    lat: 15, lon: -72,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.2, -0.9, 0.38).normalize(),
    angularVelocity: 0.022,
    file: "caribbean_plate.png",
    hexColor: "#84e3c8",
    area: "0.6%"
  },
  {
    name: "Arabian Plate",
    lat: 22, lon: 45,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.6, 0.7, 0.38).normalize(),
    angularVelocity: 0.028,
    file: "arabian_plate.png",
    hexColor: "#9c7979",
    area: "1.0%"
  },
  {
    name: "Philippine Sea Plate",
    lat: 18, lon: 134,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(-0.65, 0.55, -0.52).normalize(),
    angularVelocity: 0.036,
    file: "philippine_sea_plate.png",
    hexColor: "#f68080",
    area: "1.1%"
  },
  {
    name: "Indian Plate",
    lat: 15, lon: 78,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.7, 0.65, 0.3).normalize(),
    angularVelocity: 0.038,
    file: "indian_plate.png",
    hexColor: "#a8ddb5",
    area: "2.3%"
  },
  {
    name: "Scotia Plate",
    lat: -57, lon: -40,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(0.1, -0.95, -0.3).normalize(),
    angularVelocity: 0.025,
    file: "scotia_plate.png",
    hexColor: "#a99743",
    area: "0.3%"
  },
  {
    name: "Juan de Fuca Plate",
    lat: 45, lon: -128,
    isOceanic: true,
    eulerAxis: new THREE.Vector3(0.5, 0.2, 0.84).normalize(),
    angularVelocity: 0.032,
    file: "juan_de_fuca_plate.png",
    hexColor: "#df65b0",
    area: "0.05%"
  },
  {
    name: "Somali Plate",
    lat: -2, lon: 40,
    isOceanic: false,
    eulerAxis: new THREE.Vector3(0.3, 0.8, 0.5).normalize(),
    angularVelocity: 0.022,
    file: "somali_plate.png",
    hexColor: "#fdae6b",
    area: "3.2%"
  }
];

function createGlowRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Radial gradient for a beautiful soft glowing ring
  const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.4)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Global scope uniform references for the shader hack
const sharedUniforms = {
  uMaskTex: { value: null },
  uBoundsTex: { value: null },
  uTargetColor: { value: new THREE.Vector3(-1, -1, -1) },
  uHighlightActive: { value: 0.0 }
};

/**
 * teXtonics Planet Engine v3
 *
 * Key design:
 *  - ONE IcosahedronGeometry (indexed, detail=4 → 2562 unique verts).
 *    Used directly as both simulation grid AND render mesh.
 *    No duplicate-vert copy needed → smooth shading for free.
 *  - Plates are Voronoi regions on the sphere.
 *    Each frame: rotate N seed points, re-assign every vert to nearest seed.
 *  - Boundary physics applied per-vert by checking relative plate velocity.
 */
export class Planet {
  constructor(radius = 2.0, detail = 5, targetPlateCount = 15) {
    this.radius      = radius;
    this.numPlates   = targetPlateCount;
    this.seaLevel    = -0.10;
    this.visualMode  = 'geo';
    this.noise       = createNoise3D();
    this.group       = new THREE.Group();

    // ── Load Earth Textures & Masks ──────────────────────────────────────
    this.textureLoader = new THREE.TextureLoader();
    
    // Texture resolution presets (don't change overlay textures)
    this.TEXTURE_PRESETS = {
      '2K': {
        day: '/2k_earth_daymap.jpg',
        night: '/2k_earth_nightmap.jpg',
        clouds: '/2k_earth_clouds.jpg',
        normal: '/2k_earth_normal_map.png',
        bump: null,
        specular: '/2k_earth_specular_map.png'
      },
      '4K': {
        day: '/8081_earthmap4k.jpg',
        night: '/8081_earthlights4k.jpg',
        clouds: '/2k_earth_clouds.jpg',  // no 4K clouds available
        normal: '/2k_earth_normal_map.png', // no 4K normal available
        bump: '/8081_earthbump4k.jpg',
        specular: '/8081_earthspec4k.jpg'
      }
    };
    this.currentResolution = '2K';
    
    this.dayTex = this.textureLoader.load('/2k_earth_daymap.jpg');
    this.nightTex = this.textureLoader.load('/2k_earth_nightmap.jpg');
    this.cloudsTex = this.textureLoader.load('/2k_earth_clouds.jpg');
    this.normalTex = this.textureLoader.load('/2k_earth_normal_map.png');
    this.specularTex = this.textureLoader.load('/2k_earth_specular_map.png');
    this.bumpTex = null;
    
    // Mask for interactive satellite plates (NOT resolution-dependent)
    sharedUniforms.uMaskTex.value = this.textureLoader.load('/allplates.png');
    // Mask for boundaries with arrows (NOT resolution-dependent)
    sharedUniforms.uBoundsTex.value = this.textureLoader.load('/platesandbounds.png');

    // Load mask into a canvas context for CPU raycast color picking
    this._loadMaskImage('/allplates.png');

    // ── Simulation + render geometry (same object, indexed) ────────────────
    // Three.js IcosahedronGeometry is indexed for detail > 0
    const geo = new THREE.IcosahedronGeometry(radius, detail);

    // If somehow non-indexed (shouldn't happen), use as is
    if (!geo.index) {
      this._buildGridNonIndexed(geo);
      this.renderGeo = geo;
    } else {
      this._buildGridIndexed(geo);
      this.renderGeo = geo;
    }

    // Attach color buffer (one colour per unique vert → smooth interpolation)
    this.renderGeo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(this.gridSize * 3), 3)
    );

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.72,
      metalness: 0.08,
      flatShading: false,   // smooth — no more faceted look
    });
    this.mesh = new THREE.Mesh(this.renderGeo, this.material);
    this.group.add(this.mesh);

    // ── Static Satellite Group & Plate Meshes ──────────────────────────────
    this.satellitePlatesGroup = new THREE.Group();
    this.satellitePlatesGroup.visible = false;
    this.group.add(this.satellitePlatesGroup);

    const satGeo = new THREE.SphereGeometry(radius, 128, 128); // high res sphere
    this.satellitePlateMeshes = [];

    PREDEFINED_PLATES.forEach((plate, idx) => {
      const texture = this.textureLoader.load(`/plate_outputs/2k/${plate.file}`);
      
      const uniforms = {
        uSelected: { value: 0.0 },
        uTexelSize: { value: new THREE.Vector2(1.0 / 2048.0, 1.0 / 1024.0) }
      };

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.8,
        metalness: 0.1,
        depthWrite: false,
      });

      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uSelected = uniforms.uSelected;
        shader.uniforms.uTexelSize = uniforms.uTexelSize;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
           uniform float uSelected;
           uniform vec2 uTexelSize;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           
           #ifdef USE_MAP
             vec2 customUv = vMapUv;
           #else
             vec2 customUv = vUv;
           #endif
           
           float centerAlpha = texture2D(map, customUv).a;
           
           if (uSelected > 0.5) {
               float isInside = step(0.05, centerAlpha);
               
               // Sample 8 surrounding neighbors for edge detection
               float edgeSum = 0.0;
               vec2 texelSize = uTexelSize;
               for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
                   for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
                       if (dx == 0.0 && dy == 0.0) continue;
                       vec2 offset = vec2(dx, dy) * texelSize * 2.0;
                       float neighborAlpha = texture2D(map, customUv + offset).a;
                       float nMatch = step(0.05, neighborAlpha);
                       edgeSum += abs(isInside - nMatch);
                   }
               }
               
               if (edgeSum > 0.5) {
                   gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0, 1.0, 0.85), 0.92);
                   gl_FragColor.rgb += vec3(0.0, 0.3, 0.25); // bloom
                   gl_FragColor.a = 1.0;
               } else if (isInside > 0.5) {
                   gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0, 0.75, 0.65), 0.15);
                   gl_FragColor.a = 1.0;
               } else {
                   discard;
               }
           } else {
               if (centerAlpha < 0.05) {
                   discard;
               }
           }
          `
        );
      };

      const mesh = new THREE.Mesh(satGeo, mat);
      mesh.userData = {
        plateName: plate.name,
        index: idx,
        uniforms: uniforms,
        material: mat,
        texture: texture
      };
      this.satellitePlateMeshes.push(mesh);
      this.satellitePlatesGroup.add(mesh);
    });

    // ── Static Boundaries Overlay Mesh ──────────────────────────────────────
    const boundsGeo = new THREE.SphereGeometry(radius * 1.002, 128, 128);
    this.boundsTex = this.textureLoader.load('/plate_outputs/2k/boundaries_overlay.png');
    this.boundsMaterial = new THREE.MeshBasicMaterial({
      map: this.boundsTex,
      transparent: true,
      depthWrite: false,
    });
    this.satelliteBoundsMesh = new THREE.Mesh(boundsGeo, this.boundsMaterial);
    // Disable raycasting so clicks go through to the plate meshes beneath
    this.satelliteBoundsMesh.raycast = function() {};
    this.satellitePlatesGroup.add(this.satelliteBoundsMesh);

    // ── Atmosphere glow ────────────────────────────────────────────────────
    const atmosGeo = new THREE.SphereGeometry(radius * 1.03, 48, 48);
    const atmosMat = new THREE.MeshStandardMaterial({
      color: 0x4499ff,
      transparent: true,
      opacity: 0.07,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    this.group.add(new THREE.Mesh(atmosGeo, atmosMat));

    // ── Dynamic Clouds Layer ───────────────────────────────────────────────
    const cloudsGeo = new THREE.SphereGeometry(radius * 1.015, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: this.cloudsTex,
      alphaMap: this.cloudsTex,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    this.cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    this.group.add(this.cloudsMesh);

    // ── Water sphere ───────────────────────────────────────────────────────
    this.waterGeo = new THREE.SphereGeometry(radius, 64, 64);
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0055bb,
      transparent: true,
      opacity: 0.52,
      roughness: 0.04,
      metalness: 0.12,
      depthWrite: false,
    });
    this.waterMesh = new THREE.Mesh(this.waterGeo, this.waterMaterial);
    this.waterMesh.scale.setScalar((this.radius + this.seaLevel * 0.18) / this.radius);
    this.group.add(this.waterMesh);

    // ── Mantle sphere ──────────────────────────────────────────────────────
    this.mantleGeo = new THREE.SphereGeometry(radius * 0.92, 24, 24);
    this.mantleMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd2200,
      emissive: 0xbb1100,
      emissiveIntensity: 1.6,
      roughness: 1.0,
    });
    this.mantleMesh = new THREE.Mesh(this.mantleGeo, this.mantleMaterial);
    this.group.add(this.mantleMesh);

    // ── Seismic Earthquake Ring System ─────────────────────────────────────
    this.earthquakes = [];
    this.eqGeometry = new THREE.RingGeometry(0.01, 0.25, 32);
    this.eqTexture = createGlowRingTexture();

    // ── Group Coincident Vertices (to prevent mesh separation) ─────────────
    this._groupCoincidentVertices();

    // ── Generate plates + terrain ──────────────────────────────────────────
    this._generatePlates();
    this._assignVertsToPlates();
    this._generateTerrain();
    this._paintMesh();
  }

  _loadMaskImage(url) {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      this.maskCtx = canvas.getContext('2d', { willReadFrequently: true });
      this.maskCtx.drawImage(img, 0, 0);
      this.maskWidth = img.width;
      this.maskHeight = img.height;
    };
  }

  getPlateColorAtUV(uv) {
    if (!this.maskCtx || !uv) return null;
    const cx = Math.floor(uv.x * this.maskWidth);
    const cy = Math.floor((1 - uv.y) * this.maskHeight);
    
    // Average a 5×5 neighborhood to defeat JPG compression noise
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    const radius = 2;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const px = Math.max(0, Math.min(this.maskWidth - 1, cx + dx));
        const py = Math.max(0, Math.min(this.maskHeight - 1, cy + dy));
        const data = this.maskCtx.getImageData(px, py, 1, 1).data;
        totalR += data[0];
        totalG += data[1];
        totalB += data[2];
        count++;
      }
    }
    
    return new THREE.Vector3(totalR / count / 255, totalG / count / 255, totalB / count / 255);
  }

  highlightSatellitePlateByName(name) {
    this.satellitePlateMeshes.forEach(mesh => {
      if (name && mesh.userData.plateName === name) {
        mesh.userData.uniforms.uSelected.value = 1.0;
      } else {
        mesh.userData.uniforms.uSelected.value = 0.0;
      }
    });
  }

  getPredefinedPlateByName(name) {
    return PREDEFINED_PLATES.find(p => p.name === name);
  }

  /**
   * Hot-swap satellite texture resolution. Loads individual plate textures and overlay.
   * @param {'2K'|'4K'} resolution
   */
  setSatelliteResolution(resolution) {
    if (resolution !== '2K' && resolution !== '4K') return;
    this.currentResolution = resolution;
    
    const resLower = resolution.toLowerCase();
    const w = resolution === '2K' ? 2048 : 4000;
    const h = resolution === '2K' ? 1024 : 2000;
    
    // Update individual plate textures
    this.satellitePlateMeshes.forEach(mesh => {
      if (mesh.userData.texture) {
        mesh.userData.texture.dispose();
      }
      const plate = PREDEFINED_PLATES[mesh.userData.index];
      const newTex = this.textureLoader.load(`/plate_outputs/${resLower}/${plate.file}`);
      mesh.userData.texture = newTex;
      mesh.material.map = newTex;
      mesh.userData.uniforms.uTexelSize.value.set(1.0 / w, 1.0 / h);
      mesh.material.needsUpdate = true;
    });
    
    // Update boundaries overlay texture
    if (this.boundsTex) {
      this.boundsTex.dispose();
    }
    this.boundsTex = this.textureLoader.load(`/plate_outputs/${resLower}/boundaries_overlay.png`);
    this.boundsMaterial.map = this.boundsTex;
    this.boundsMaterial.needsUpdate = true;
  }

  // ── Grid from indexed geometry (normal path) ──────────────────────────────
  _buildGridIndexed(geo) {
    const pos = geo.getAttribute('position');
    const idx = geo.index;
    const N   = pos.count;
    this._initArrays(N);

    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      this.verts[i]   = v.clone();
      this.vertDir[i] = v.clone().normalize();
      this.vertElev[i] = -0.25;
    }

    // Neighbors from index buffer
    this.neighbors = Array.from({ length: N }, () => []);
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      this.neighbors[a].push(b, c);
      this.neighbors[b].push(a, c);
      this.neighbors[c].push(a, b);
    }
    for (let i = 0; i < N; i++) {
      this.neighbors[i] = [...new Set(this.neighbors[i])];
    }
  }

  // ── Grid from non-indexed geometry (fallback) ─────────────────────────────
  _buildGridNonIndexed(geo) {
    const pos = geo.getAttribute('position');
    const N   = pos.count;
    this._initArrays(N);

    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      this.verts[i]    = v.clone();
      this.vertDir[i]  = v.clone().normalize();
      this.vertElev[i] = -0.25;
    }

    this.neighbors = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i += 3) {
      this.neighbors[i    ].push(i + 1, i + 2);
      this.neighbors[i + 1].push(i,     i + 2);
      this.neighbors[i + 2].push(i,     i + 1);
    }
  }

  _initArrays(N) {
    this.gridSize  = N;
    this.verts     = new Array(N);
    this.vertDir   = new Array(N);
    this.vertPlate = new Int32Array(N);
    this.vertElev  = new Float32Array(N);
    this.vertCrust = new Uint8Array(N);
    this.vertAge   = new Float32Array(N);
    this.vertBound = new Uint8Array(N);
  }

  // ── Plate generation ──────────────────────────────────────────────────────
  _generatePlates() {
    this.plates = [];
    for (let p = 0; p < this.numPlates; p++) {
      let name = "";
      let seedPos = new THREE.Vector3();
      let isOceanic = false;
      let eulerAxis = new THREE.Vector3();
      let angularVelocity = 0.0;

      if (p < PREDEFINED_PLATES.length) {
        const ref = PREDEFINED_PLATES[p];
        name = "Plate " + (p + 1); // Use generic numbered plates for Geo Mode
        isOceanic = ref.isOceanic;
        
        // Convert real geographic lat/lon to 3D direction vector
        const dirVec = latLonToVector3(ref.lat, ref.lon);
        
        // Find nearest grid vertex to the geographic predefined target seed position
        let bestIndex = 0;
        let bestDot = -Infinity;
        for (let i = 0; i < this.gridSize; i++) {
          const dot = this.vertDir[i].dot(dirVec);
          if (dot > bestDot) {
            bestDot = dot;
            bestIndex = i;
          }
        }
        seedPos.copy(this.verts[bestIndex]);
        eulerAxis.copy(ref.eulerAxis);
        angularVelocity = ref.angularVelocity;
      } else {
        // Fallback for extra plates beyond predefined major/minor ones
        name = `Microplate ${String.fromCharCode(65 + (p - PREDEFINED_PLATES.length) % 26)}`;
        isOceanic = Math.random() > 0.5;
        const randIndex = Math.floor(Math.random() * this.gridSize);
        seedPos.copy(this.verts[randIndex]);
        eulerAxis.set(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        angularVelocity = (Math.random() * 0.04 + 0.015) * (Math.random() > 0.5 ? 1 : -1);
      }

      this.plates.push({
        id:              p,
        name:            name,
        isOceanic:       isOceanic,
        color:           new THREE.Color().setHSL(p / this.numPlates, 0.88, 0.55),
        seedPos:         seedPos.clone(),
        eulerAxis:       eulerAxis,
        angularVelocity: angularVelocity,
      });
    }
  }

  // ── Voronoi assignment (dot-product, O(N×P)) ──────────────────────────────
  _assignVertsToPlates() {
    const dirs = this.plates.map(p => p.seedPos.clone().normalize());
    for (let i = 0; i < this.gridSize; i++) {
      const d = this.vertDir[i];
      let best = 0, bestDot = -Infinity;
      for (let p = 0; p < this.numPlates; p++) {
        const dot = d.dot(dirs[p]);
        if (dot > bestDot) { bestDot = dot; best = p; }
      }
      this.vertPlate[i] = best;
    }
  }

  // ── Procedural Earth-like continent layout ────────────────────────────────
  _generateTerrain() {
    for (let i = 0; i < this.gridSize; i++) {
      const d = this.vertDir[i];
      const pId = this.vertPlate[i];
      const plate = this.plates[pId];
      const isOceanicPlate = plate ? plate.isOceanic : false;

      // Add simplex noise to create organic coastline shapes
      const n1 = this.noise(d.x * 2.0, d.y * 2.0, d.z * 2.0) * 0.35;
      const n2 = this.noise(d.x * 5.0, d.y * 5.0, d.z * 5.0) * 0.12;
      const score = (isOceanicPlate ? -0.22 : 0.38) + n1 + n2;

      if (score > 0.15) {
        this.vertCrust[i] = 1; // Continental
        this.vertElev[i]  = Math.min(0.75, 0.05 + (score - 0.15) * 0.85);
      } else {
        this.vertCrust[i] = 0; // Oceanic
        this.vertElev[i]  = Math.max(-0.32, -0.25 + (n1 + n2) * 0.06);
        this.vertAge[i]   = Math.random() * 8;
      }
    }
  }

  _groupCoincidentVertices() {
    const N = this.gridSize;
    const posMap = new Map();

    for (let i = 0; i < N; i++) {
      // Round coordinates to 4 decimal places to account for floating-point variation
      const x = Math.round(this.verts[i].x * 10000) / 10000;
      const y = Math.round(this.verts[i].y * 10000) / 10000;
      const z = Math.round(this.verts[i].z * 10000) / 10000;
      const key = `${x},${y},${z}`;

      if (!posMap.has(key)) {
        posMap.set(key, []);
      }
      posMap.get(key).push(i);
    }

    this.vertRep = new Int32Array(N);
    this.uniqueVerts = [];
    
    for (const indices of posMap.values()) {
      const rep = indices[0];
      this.uniqueVerts.push(rep);
      for (const idx of indices) {
        this.vertRep[idx] = rep;
      }
    }

    const uniqueNeighbors = new Map();
    for (const rep of this.uniqueVerts) {
      uniqueNeighbors.set(rep, new Set());
    }

    // Rebuild clean neighbor sets across the unique vertices
    const idx = this.renderGeo.index;
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const rA = this.vertRep[idx.getX(i)];
        const rB = this.vertRep[idx.getX(i + 1)];
        const rC = this.vertRep[idx.getX(i + 2)];
        if (rA !== rB) { uniqueNeighbors.get(rA).add(rB); uniqueNeighbors.get(rB).add(rA); }
        if (rA !== rC) { uniqueNeighbors.get(rA).add(rC); uniqueNeighbors.get(rC).add(rA); }
        if (rB !== rC) { uniqueNeighbors.get(rB).add(rC); uniqueNeighbors.get(rC).add(rB); }
      }
    } else {
      for (let i = 0; i < N; i += 3) {
        const rA = this.vertRep[i];
        const rB = this.vertRep[i + 1];
        const rC = this.vertRep[i + 2];
        if (rA !== rB) { uniqueNeighbors.get(rA).add(rB); uniqueNeighbors.get(rB).add(rA); }
        if (rA !== rC) { uniqueNeighbors.get(rA).add(rC); uniqueNeighbors.get(rC).add(rA); }
        if (rB !== rC) { uniqueNeighbors.get(rB).add(rC); uniqueNeighbors.get(rC).add(rB); }
      }
    }

    // Assign neighbors to contain physical unique representative indices
    this.neighbors = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i++) {
      const rep = this.vertRep[i];
      this.neighbors[i] = Array.from(uniqueNeighbors.get(rep));
    }
  }

  // ── Per-frame physics update ──────────────────────────────────────────────
  update(deltaTime, simSpeed = 1.0) {
    const dt = deltaTime * simSpeed;
    if (dt <= 0) return;

    // Rotate clouds layer independently
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.003 * dt;
      this.cloudsMesh.rotation.x += 0.001 * dt;
    }

    // Rotate plate seeds
    for (const plate of this.plates) {
      plate.seedPos.applyAxisAngle(plate.eulerAxis, plate.angularVelocity * dt);
      plate.seedPos.normalize().multiplyScalar(this.radius);
    }

    // Re-assign verts to nearest plate seed
    const dirs = this.plates.map(p => p.seedPos.clone().normalize());
    for (let i = 0; i < this.gridSize; i++) {
      const d = this.vertDir[i];
      let best = 0, bestDot = -Infinity;
      for (let p = 0; p < this.numPlates; p++) {
        const dot = d.dot(dirs[p]);
        if (dot > bestDot) { bestDot = dot; best = p; }
      }
      this.vertPlate[i] = best;
    }

    // Boundary detection + geological effects
    const velA = new THREE.Vector3();
    const velB = new THREE.Vector3();
    const norm = new THREE.Vector3();

    for (let i = 0; i < this.gridSize; i++) {
      const myP  = this.vertPlate[i];
      const plA  = this.plates[myP];
      let conv = false, div = false, trans = false;

      for (const nb of this.neighbors[i]) {
        const nbP = this.vertPlate[nb];
        if (nbP === myP) continue;
        const plB = this.plates[nbP];
        const pos = this.vertDir[i];
        velA.crossVectors(plA.eulerAxis, pos).multiplyScalar(plA.angularVelocity);
        velB.crossVectors(plB.eulerAxis, pos).multiplyScalar(plB.angularVelocity);
        velA.sub(velB);
        norm.subVectors(this.vertDir[nb], pos).normalize();
        const comp = velA.dot(norm);
        if      (comp >  0.0004) conv  = true;
        else if (comp < -0.0004) div   = true;
        else                      trans = true;
      }

      if (conv) {
        this.vertBound[i] = 2;
        if (this.vertCrust[i] === 1) {
          // Gradual mountain building — spiky but not runaway
          const peakNoise = this.noise(this.vertDir[i].x * 16, this.vertDir[i].y * 16, this.vertDir[i].z * 16) * 0.06;
          const rate = 0.00045 * (1.0 + Math.abs(peakNoise)) * dt * 60;
          this.vertElev[i] = Math.min(0.72, this.vertElev[i] + rate);
        } else {
          // Subduction trench
          this.vertElev[i] = Math.max(-0.40, this.vertElev[i] - 0.00015 * dt * 60);
        }
      } else if (div) {
        this.vertBound[i] = 1;
        if (this.vertCrust[i] === 0) {
          // Mid-ocean ridge (new hot crust)
          this.vertAge[i]  = 0;
          this.vertElev[i] = -0.10;
        } else {
          // Continental rift
          this.vertElev[i] = Math.max(-0.05, this.vertElev[i] - 0.0002 * dt * 60);
        }
      } else {
        this.vertBound[i] = trans ? 4 : 0;
      }

      // Oceanic thermal subsidence (GDH1 model approximation)
      if (this.vertCrust[i] === 0 && !div) {
        this.vertAge[i] += dt * 2.5;
        const target = -0.10 - 0.21 * (1 - Math.exp(-this.vertAge[i] * 0.07));
        this.vertElev[i] += (target - this.vertElev[i]) * Math.min(1, dt * 0.8);
      }

      // Continental erosion — gentle, keeps land above sea level
      if (this.vertCrust[i] === 1) {
        if (this.vertBound[i] !== 2) {
          this.vertElev[i] = Math.max(0.03, this.vertElev[i] - dt * 0.00012);
        } else {
          // High-altitude gravity relaxation/wastage to keep mountains organic
          if (this.vertElev[i] > 0.60) {
            this.vertElev[i] -= dt * 0.00008;
          }
        }
      }
    }

    // ── Update active earthquakes ──
    for (let i = this.earthquakes.length - 1; i >= 0; i--) {
      const eq = this.earthquakes[i];
      eq.age += dt;
      if (eq.age >= eq.maxAge) {
        this.group.remove(eq.mesh);
        eq.material.dispose();
        this.earthquakes.splice(i, 1);
      } else {
        const t = eq.age / eq.maxAge;
        const scale = t * eq.maxScale;
        eq.mesh.scale.setScalar(scale);
        if (t < 0.15) {
          eq.material.opacity = t / 0.15;
        } else {
          eq.material.opacity = 1.0 - (t - 0.15) / 0.85;
        }
      }
    }

    // ── Spawn new earthquakes at transform or convergent boundaries ──
    if (Math.random() < 0.22 * simSpeed) {
      const candidates = [];
      for (let i = 0; i < this.gridSize; i++) {
        if (this.vertBound[i] === 4 || this.vertBound[i] === 2) {
          candidates.push(i);
        }
      }
      if (candidates.length > 0) {
        const idx = candidates[Math.floor(Math.random() * candidates.length)];
        const pos = this.verts[idx].clone();
        
        const mat = new THREE.MeshBasicMaterial({
          map: this.eqTexture,
          transparent: true,
          opacity: 0.0,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        
        // Yellow for transform, Red for convergent
        if (this.vertBound[idx] === 4) {
          mat.color.setHex(0xffcc00);
        } else {
          mat.color.setHex(0xff3b30);
        }
        
        const eqMesh = new THREE.Mesh(this.eqGeometry, mat);
        const normal = pos.clone().normalize();
        
        const currentElev = this.vertElev[idx];
        const h = this.radius + 0.04 + currentElev * 0.30;
        eqMesh.position.copy(normal).multiplyScalar(h);
        eqMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        
        // Set scale to 0.001 immediately on creation to prevent the brief full-circle flash!
        eqMesh.scale.setScalar(0.001);
        
        this.group.add(eqMesh);
        this.earthquakes.push({
          mesh: eqMesh,
          material: mat,
          age: 0,
          maxAge: 1.2 + Math.random() * 0.8,
          maxScale: 1.0 + Math.random() * 0.8
        });
      }
    }

    // ── Synchronize Coincident Vertices: copy rep state to duplicates ──
    if (this.vertRep) {
      for (let i = 0; i < this.gridSize; i++) {
        const rep = this.vertRep[i];
        if (i !== rep) {
          this.vertElev[i]  = this.vertElev[rep];
          this.vertPlate[i] = this.vertPlate[rep];
          this.vertAge[i]   = this.vertAge[rep];
          this.vertCrust[i] = this.vertCrust[rep];
          this.vertBound[i] = this.vertBound[rep];
        }
      }
    }

    this._paintMesh();
  }

  // ── Paint vertex colors + displace positions ──────────────────────────────
  _paintMesh() {
    const pos  = this.renderGeo.getAttribute('position');
    const col  = this.renderGeo.getAttribute('color');
    const mode = this.visualMode;
    const tmp  = new THREE.Vector3();

    for (let i = 0; i < this.gridSize; i++) {
      const elev  = this.vertElev[i];
      const crust = this.vertCrust[i];
      const bound = this.vertBound[i];
      const age   = this.vertAge[i];
      const plate = this.plates[this.vertPlate[i]];

      // Displace vertex radially by elevation — clamped to prevent tearing
      let dispElev = Math.max(-0.38, Math.min(0.72, elev));
      
      // Make high mountain peaks extra spiky and pyramid-like as requested!
      if (dispElev > 0.32) {
        const excess = dispElev - 0.32;
        // Apply an exponential power curve to pinch the mountain tops into sharp peaks/pyramids
        dispElev = 0.32 + Math.pow(excess / 0.40, 1.45) * 0.40;
      }
      
      tmp.copy(this.vertDir[i]).multiplyScalar(this.radius + dispElev * 0.18);
      pos.setXYZ(i, tmp.x, tmp.y, tmp.z);

      let r = 0, g = 0, b = 0;

      if (mode === 'satellite') {
        r = 1.0; g = 1.0; b = 1.0;
      } else if (mode === 'geo') {
        // ── Geological / realistic view ──
        if (crust === 0) {
          if (age < 0.8) {
            // Fresh hot rift glow → orange-red
            const t = age / 0.8;
            r = 1.0; g = 0.35 * t; b = 0.0;
          } else {
            // Ocean: shallow teal → deep navy
            const depth = Math.max(0, Math.min(1, (-elev - 0.06) / 0.26));
            r = 0.01 + 0.03 * (1 - depth);
            g = 0.18 - 0.06 * depth;
            b = 0.38 + 0.22 * depth;
            
            // Add polar ice in ocean (sea ice)
            const lat = Math.abs(this.vertDir[i].y);
            if (lat > 0.88) {
              const iceT = Math.min(1, (lat - 0.88) / 0.12);
              r = r * (1 - iceT) + 0.9 * iceT;
              g = g * (1 - iceT) + 0.95 * iceT;
              b = b * (1 - iceT) + 1.0 * iceT;
            }
          }
        } else {
          // Land colour by elevation and latitude
          const lat = Math.abs(this.vertDir[i].y);
          const n = this.noise(
            this.vertDir[i].x * 8,
            this.vertDir[i].y * 8,
            this.vertDir[i].z * 8
          ) * 0.04; // subtle texture noise

          if (lat > 0.82) {
            // Polar ice caps
            const iceT = Math.min(1, (lat - 0.82) / 0.1);
            const w = 0.85 + iceT * 0.15 + n;
            r = w; g = w; b = w + 0.05;
          } else if (elev > 0.55) {
            // High peaks → snowcapped (max is 0.72)
            const t = Math.min(1, (elev - 0.55) / 0.17);
            r = 0.72 + t * 0.25 + n; g = 0.72 + t * 0.25 + n; b = 0.78 + t * 0.20 + n;
          } else if (elev > 0.32) {
            // Mid-altitude rock / alpine grey-brown
            const t = Math.min(1, (elev - 0.32) / 0.23);
            r = 0.46 - t * 0.04 + n; g = 0.40 - t * 0.03 + n; b = 0.30 - t * 0.02 + n;
          } else if (elev > 0.10) {
            // Forest / plains based on latitude (deserts near 30 deg, forests near equator and 45-60 deg)
            const desertLikelihood = Math.max(0, 1 - Math.abs(lat - 0.33) * 5);
            if (desertLikelihood > 0.5 && this.noise(this.vertDir[i].x*3, this.vertDir[i].y*3, this.vertDir[i].z*3) > 0) {
              // Desert sand
              r = 0.75 + n; g = 0.65 + n; b = 0.45 + n;
            } else {
              // Green forest
              r = 0.15 + n; g = 0.44 + n * 1.5; b = 0.18 + n;
            }
          } else if (elev > 0.045) {
            // Lowland savanna/jungle
            r = 0.22 + n; g = 0.50 + n; b = 0.22 + n;
          } else {
            // Coastal beach / delta
            r = 0.72 + n; g = 0.67 + n; b = 0.50 + n;
          }
        }

      } else if (mode === 'plates') {
        r = plate.color.r; g = plate.color.g; b = plate.color.b;
        if (bound !== 0) { r *= 0.28; g *= 0.28; b *= 0.28; }

      } else if (mode === 'activity') {
        if      (bound === 1) { r = 1.0; g = 0.45; b = 0.0;  }  // Divergent orange
        else if (bound === 2) { r = 1.0; g = 0.05; b = 0.1;  }  // Convergent red
        else if (bound === 3) { r = 1.0; g = 0.0;  b = 0.55; }  // Subduction pink
        else if (bound === 4) { r = 0.9; g = 0.82; b = 0.0;  }  // Transform yellow
        else                  { r = 0.09; g = 0.10; b = 0.13; } // Stable dark

      } else if (mode === 'elevation') {
        const t = Math.max(0, Math.min(1, (elev + 0.40) / 1.25));
        if      (t < 0.27) { r = 0.01; g = 0.03; b = 0.20; }
        else if (t < 0.36) { r = 0.03; g = 0.20; b = 0.42; }
        else if (t < 0.48) { r = 0.10; g = 0.42; b = 0.14; }
        else if (t < 0.63) { r = 0.56; g = 0.60; b = 0.17; }
        else if (t < 0.78) { r = 0.50; g = 0.34; b = 0.20; }
        else               { r = 0.93; g = 0.93; b = 0.95; }
      }

      col.setXYZ(i, r, g, b);
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.renderGeo.computeVertexNormals();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  setSeaLevel(offset) {
    this.seaLevel = offset;
    this.waterMesh.scale.setScalar((this.radius + offset * 0.18) / this.radius);
  }

  setVisualOverlay(mode) {
    this.visualMode = mode;
    
    if (mode === 'satellite') {
      // Show decoupled satellite mesh, hide geo simulation mesh
      this.mesh.visible = false;
      this.satellitePlatesGroup.visible = true;
      this.waterMesh.visible = false; // Baked into satellite texture
      this.mantleMesh.visible = false;
      
      // Clear interactive highlights
      this.highlightSatellitePlateByName(null);
    } else {
      // Revert to geological mesh
      this.mesh.visible = true;
      this.satellitePlatesGroup.visible = false;
      this.waterMesh.visible = true;
      this.mantleMesh.visible = true;
      
      // Update geo mesh material mapping for overlays
      this.material.map = null;
      this.material.emissiveMap = null;
      this.material.emissive.setHex(0x000000);
      this.material.emissiveIntensity = 0.0;
      this.material.normalMap = null;
      this.material.roughnessMap = null;
      this.material.roughness = 0.72;
      this.material.metalness = 0.08;
      this.material.needsUpdate = true;
    }
    
    if (this.cloudsMesh) {
      if (mode === 'geo' || mode === 'satellite') {
        this.cloudsMesh.material.opacity = 0.42;
        this.cloudsMesh.visible = true;
      } else {
        this.cloudsMesh.material.opacity = 0.04;
        this.cloudsMesh.visible = true;
      }
      this.cloudsMesh.material.needsUpdate = true;
    }
    
    // Only paint vertices if we are using the geo mesh
    if (mode !== 'satellite') {
      this._paintMesh();
    }
  }

  getPlateStats() {
    let continental = 0, oceanic = 0, convergent = 0, divergent = 0;
    for (let i = 0; i < this.gridSize; i++) {
      if (this.vertCrust[i] === 1) continental++; else oceanic++;
      if (this.vertBound[i] === 2) convergent++;
      if (this.vertBound[i] === 1) divergent++;
    }
    const T = this.gridSize;
    return {
      plates:             this.plates.length,
      continentalPercent: Math.round(continental / T * 100) + '%',
      oceanicPercent:     Math.round(oceanic      / T * 100) + '%',
      convergentLength:   Math.round(convergent  * 290) + ' km',
      divergentLength:    Math.round(divergent   * 290) + ' km',
    };
  }

  dispose() {
    // Dispose loaded textures to free memory
    if (this.dayTex) this.dayTex.dispose();
    if (this.nightTex) this.nightTex.dispose();
    if (this.cloudsTex) this.cloudsTex.dispose();
    if (this.normalTex) this.normalTex.dispose();
    if (this.specularTex) this.specularTex.dispose();
    if (this.bumpTex) this.bumpTex.dispose();

    this.renderGeo.dispose();
    this.material.dispose();
    this.waterGeo.dispose();
    this.waterMaterial.dispose();
    this.mantleGeo.dispose();
    this.mantleMaterial.dispose();
    
    // Dispose satellite plate meshes and textures
    if (this.satellitePlateMeshes) {
      this.satellitePlateMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        if (mesh.userData.texture) mesh.userData.texture.dispose();
        mesh.material.dispose();
      });
      this.satellitePlateMeshes = [];
    }
    
    // Dispose boundaries overlay
    if (this.boundsTex) this.boundsTex.dispose();
    if (this.satelliteBoundsMesh) {
      this.satelliteBoundsMesh.geometry.dispose();
      this.boundsMaterial.dispose();
    }
    
    // Dispose cloud mesh resources
    if (this.cloudsMesh) {
      this.cloudsMesh.geometry.dispose();
      this.cloudsMesh.material.dispose();
    }
    
    // Dispose active earthquakes
    for (const eq of this.earthquakes) {
      this.group.remove(eq.mesh);
      eq.material.dispose();
    }
    this.earthquakes = [];
    if (this.eqGeometry) this.eqGeometry.dispose();
    if (this.eqTexture) this.eqTexture.dispose();
  }
}
