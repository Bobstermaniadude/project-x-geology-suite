import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneSetup {
  constructor(containerId, onVertexClicked) {
    this.container = document.getElementById(containerId);
    this.onVertexClicked = onVertexClicked;
    
    // Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1c1917);
    
    // Add space dust/stars in the background
    this.createStarfield();
    
    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5.5);
    
    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Setup Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 12;
    this.controls.rotateSpeed = 0.8;
    
    // Setup Lighting
    this.setupLighting();
    
    // Raycaster for interactive picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.targetMesh = null; // Set this when planet is instantiated
    
    // Add Click listener
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    
    // Handle Resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  createStarfield() {
    const starCount = 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    const color = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      // Spawn in a sphere around origin
      const radius = 20 + Math.random() * 80;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Star color variation — warm mineral tones, no neon cyan
      const r = Math.random();
      if (r > 0.85) {
        color.setHSL(0.08 + Math.random() * 0.04, 0.35, 0.75); // warm brass
      } else if (r > 0.7) {
        color.setHSL(0.48 + Math.random() * 0.05, 0.25, 0.7); // muted verdigris
      } else {
        color.setRGB(0.88, 0.86, 0.82); // parchment white
      }
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambientLight);
    
    // Main sunlight
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    this.sunLight.position.set(6, 4, 6);
    this.scene.add(this.sunLight);
    
    // Warm brass fill from below
    this.backLight = new THREE.DirectionalLight(0xb8956b, 0.35);
    this.backLight.position.set(-6, -4, -6);
    this.scene.add(this.backLight);
    
    // Verdigris rim — mineral accent, not neon
    this.rimLight = new THREE.DirectionalLight(0x2a9d8f, 0.15);
    this.rimLight.position.set(-6, 4, -2);
    this.scene.add(this.rimLight);
  }
  
  setTargetMesh(mesh) {
    this.targetMesh = mesh;
  }
  
  onPointerDown(event) {
    // Standard mouse picking
    // Calculate click coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (!this.targetMesh) return;
    
    const intersects = this.raycaster.intersectObject(this.targetMesh, true);
    if (intersects.length > 0) {
      // Filter to only front-facing hits: reject any hit whose surface normal
      // points away from the camera (i.e. we'd be clicking through to the back)
      let hit = null;
      for (const candidate of intersects) {
        // For a sphere, the face normal in world space is approximately the
        // direction from center to the hit point
        const hitNormal = candidate.point.clone().normalize();
        const rayDir = this.raycaster.ray.direction;
        // Front face: normal faces *towards* the camera, so dot < 0
        if (hitNormal.dot(rayDir) < 0) {
          hit = candidate;
          break;
        }
      }
      if (!hit) return;
      
      const point = hit.point;
      const localPoint = this.targetMesh.worldToLocal(point.clone());
      if (this.onVertexClicked) {
        this.onVertexClicked(localPoint, hit);
      }
    }
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
