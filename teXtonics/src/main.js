import './style.css';
import * as THREE from 'three';
import { SceneSetup } from './render/scene.js';
import { Planet } from './engine/planet.js';

class App {
  constructor() {
    this.isPlaying = true;
    this.simSpeed = 1.0;

    // Geological years (in Million Years - Myr)
    this.currentYear = 0;
    this.lastTime = performance.now() / 1000;

    // Interactive state
    this.selectedPlateId = null;

    // Initialize scene with raycast callback
    this.sceneSetup = new SceneSetup('app', this.onGlobeClicked.bind(this));

    // Create initial planet
    this.plateCount = 15;
    this.planet = new Planet(2.0, 5, this.plateCount);
    this.sceneSetup.scene.add(this.planet.group);
    this.sceneSetup.setTargetMesh(this.planet.mesh);

    // Initial UI bind & stats
    this.bindUI();
    this.updateStats();
    
    // Create HTML overlays for geological plates
    this.initPlateLabels();

    // Fade out the instruction help toast after 6 seconds to prevent screen clutter
    setTimeout(() => {
      const toast = document.querySelector('.help-toast');
      if (toast) {
        toast.classList.add('fade-out');
      }
    }, 6000);

    // Start animation loop
    this.animate();
  }

  onGlobeClicked(localPoint, hit) {
    if (this.planet.visualMode === 'satellite') {
      if (hit && hit.object && hit.object.userData && hit.object.userData.plateName) {
        const plateName = hit.object.userData.plateName;
        // Highlight the plate on the satellite view
        this.planet.highlightSatellitePlateByName(plateName);
        // Show details in the inspector
        this.showSatelliteInspector(plateName);
      }
      return;
    }

    // Geological mode: Find nearest cell to find clicked plate ID
    let nearestIndex = 0;
    let minDist = Infinity;

    for (let i = 0; i < this.planet.gridSize; i++) {
      const dist = localPoint.distanceToSquared(this.planet.verts[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }

    const plateId = this.planet.vertPlate[nearestIndex];
    this.selectPlate(plateId);
  }

  showSatelliteInspector(name) {
    this.selectedPlateId = null; // Unselect geo plate
    document.getElementById('inspector-placeholder').classList.add('hidden');
    document.getElementById('inspector-content').classList.remove('hidden');
    
    document.getElementById('insp-plate-id').innerText = name;
    
    const colorBadge = document.getElementById('insp-plate-color');
    const plate = this.planet.getPredefinedPlateByName(name);
    
    if (plate) {
      colorBadge.style.backgroundColor = plate.hexColor;
      document.getElementById('insp-plate-area').innerText = plate.area || 'N/A';
      
      const cmYear = Math.round(plate.angularVelocity * 100) / 10;
      document.getElementById('val-plate-speed').innerText = cmYear + ' cm/yr';
      
      const x = plate.eulerAxis.x.toFixed(2);
      const y = plate.eulerAxis.y.toFixed(2);
      const z = plate.eulerAxis.z.toFixed(2);
      document.getElementById('val-pole-xyz').innerText = `[${x}, ${y}, ${z}]`;

      // Sync the sliders
      document.getElementById('slider-plate-speed').value = plate.angularVelocity;
      document.getElementById('slider-pole-x').value = plate.eulerAxis.x;
      document.getElementById('slider-pole-y').value = plate.eulerAxis.y;
      document.getElementById('slider-pole-z').value = plate.eulerAxis.z;
    } else {
      colorBadge.style.backgroundColor = '#cccccc';
      document.getElementById('insp-plate-area').innerText = 'N/A';
      document.getElementById('val-plate-speed').innerText = '0.0 cm/yr';
      document.getElementById('val-pole-xyz').innerText = '[0.00, 0.00, 0.00]';
    }
    
    // Disable sliders for static map
    document.getElementById('slider-plate-speed').disabled = true;
    document.getElementById('slider-pole-x').disabled = true;
    document.getElementById('slider-pole-y').disabled = true;
    document.getElementById('slider-pole-z').disabled = true;
  }

  selectPlate(plateId) {
    this.selectedPlateId = plateId;
    const plate = this.planet.plates[plateId];
    if (!plate) return;

    // Show active inspector pane
    document.getElementById('inspector-placeholder').classList.add('hidden');
    document.getElementById('inspector-content').classList.remove('hidden');

    // Set plate info
    document.getElementById('insp-plate-id').innerText = plate.name || ('#' + (plateId + 1));

    const colorBadge = document.getElementById('insp-plate-color');
    colorBadge.style.backgroundColor = plate.color.getStyle();

    // Re-enable sliders for dynamic simulation map
    document.getElementById('slider-plate-speed').disabled = false;
    document.getElementById('slider-pole-x').disabled = false;
    document.getElementById('slider-pole-y').disabled = false;
    document.getElementById('slider-pole-z').disabled = false;

    // Calculate plate area share
    let cellCount = 0;
    for (let i = 0; i < this.planet.gridSize; i++) {
      if (this.planet.vertPlate[i] === plateId) cellCount++;
    }
    const percent = Math.round((cellCount / this.planet.gridSize) * 1000) / 10;
    document.getElementById('insp-plate-area').innerText = percent + '%';

    // Setup Speed Slider (scaled to cm/year representation)
    const speedSlider = document.getElementById('slider-plate-speed');
    // Map plate.angularVelocity to slider range
    speedSlider.value = Math.abs(plate.angularVelocity);
    const cmYear = Math.round(Math.abs(plate.angularVelocity) * 100) / 10;
    document.getElementById('val-plate-speed').innerText = cmYear + ' cm/yr';

    // Setup Euler pole vector sliders
    document.getElementById('slider-pole-x').value = plate.eulerAxis.x;
    document.getElementById('slider-pole-y').value = plate.eulerAxis.y;
    document.getElementById('slider-pole-z').value = plate.eulerAxis.z;
    this.updateEulerPoleValues(plate);
  }

  updateEulerPoleValues(plate) {
    const x = plate.eulerAxis.x.toFixed(2);
    const y = plate.eulerAxis.y.toFixed(2);
    const z = plate.eulerAxis.z.toFixed(2);
    document.getElementById('val-pole-xyz').innerText = `[${x}, ${y}, ${z}]`;
  }

  bindUI() {
    // 1. Play/Pause
    const btnToggle = document.getElementById('btn-toggle-time');
    btnToggle.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      btnToggle.innerText = this.isPlaying ? 'Pause Simulation' : 'Play Simulation';
      btnToggle.classList.toggle('is-paused', !this.isPlaying);
    });

    // 2. Speed Slider
    const speedSlider = document.getElementById('slider-speed');
    speedSlider.addEventListener('input', (e) => {
      this.simSpeed = parseFloat(e.target.value);
      document.getElementById('val-speed').innerText = this.simSpeed.toFixed(1) + 'x';
    });

    // 3. Sea Level Slider
    const seaLevelSlider = document.getElementById('slider-sealevel');
    seaLevelSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.planet.setSeaLevel(val);
      document.getElementById('val-sealevel').innerText = val.toFixed(2);
      this.updateStats();
    });

    // 4. Plate Count Slider
    const plateSlider = document.getElementById('slider-plates');
    plateSlider.addEventListener('input', (e) => {
      this.plateCount = parseInt(e.target.value);
      document.getElementById('val-plates').innerText = this.plateCount;
    });

    // 5. Regenerate Button with user epoch-reset logic!
    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
      // Clean up Three.js groups and geometries to free up memory
      this.sceneSetup.scene.remove(this.planet.group);
      this.planet.dispose();
      
      // Instantiate fresh Planet with requested plate count
      this.planet = new Planet(2.0, 5, this.plateCount);
      this.sceneSetup.scene.add(this.planet.group);
      this.sceneSetup.setTargetMesh(this.planet.mesh);

      // Reset geological epoch to zero as requested!
      this.currentYear = 0;
      document.getElementById('stat-year').innerText = '0';
      document.getElementById('stat-era').innerText = 'Mesozoic (Triassic)';
      document.getElementById('epoch-progress').style.width = '0%';

      // Close Plate Inspector
      this.closeInspector();

      // Sync Sea level slider
      const curSea = parseFloat(document.getElementById('slider-sealevel').value);
      this.planet.setSeaLevel(curSea);

      // Re-enable current overlay
      const activeBtn = document.querySelector('.btn-overlay.active');
      const mode = activeBtn ? activeBtn.getAttribute('data-mode') : 'geo';
      this.planet.setVisualOverlay(mode);
      this.sceneSetup.setTargetMesh(mode === 'satellite' ? this.planet.satellitePlatesGroup : this.planet.mesh);

      // Refresh labels
      this.plateLabels.forEach(el => el.remove());
      this.initPlateLabels();

      this.updateStats();
    });

    // 6. Overlay selector buttons
    const overlayButtons = document.querySelectorAll('.btn-overlay');
    overlayButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        overlayButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.planet.setVisualOverlay(mode);
        this.sceneSetup.setTargetMesh(mode === 'satellite' ? this.planet.satellitePlatesGroup : this.planet.mesh);
        
        // Hide inspector if switching to satellite, or clear highlight if switching back
        if (mode === 'satellite') {
          this.closeInspector();
        }
      });
    });

    // 7. Plate Inspector Controllers
    // Speed Controller
    const inspSpeedSlider = document.getElementById('slider-plate-speed');
    inspSpeedSlider.addEventListener('input', (e) => {
      if (this.selectedPlateId === null) return;
      const speed = parseFloat(e.target.value);
      const plate = this.planet.plates[this.selectedPlateId];
      // Keep sign of velocity
      const sign = plate.angularVelocity >= 0 ? 1 : -1;
      plate.angularVelocity = speed * sign;

      const cmYear = Math.round(speed * 100) / 10;
      document.getElementById('val-plate-speed').innerText = cmYear + ' cm/yr';
    });

    // Euler Pole Sliders
    const poleX = document.getElementById('slider-pole-x');
    const poleY = document.getElementById('slider-pole-y');
    const poleZ = document.getElementById('slider-pole-z');

    const onPoleSliderChange = () => {
      if (this.selectedPlateId === null) return;
      const plate = this.planet.plates[this.selectedPlateId];

      const vx = parseFloat(poleX.value);
      const vy = parseFloat(poleY.value);
      const vz = parseFloat(poleZ.value);

      // Normalize vector, fallback if 0
      const vec = new THREE.Vector3(vx, vy, vz);
      if (vec.lengthSq() < 0.01) vec.set(0, 1, 0);
      vec.normalize();

      plate.eulerAxis.copy(vec);
      this.updateEulerPoleValues(plate);
    };

    poleX.addEventListener('input', onPoleSliderChange);
    poleY.addEventListener('input', onPoleSliderChange);
    poleZ.addEventListener('input', onPoleSliderChange);

    // Close inspector button
    document.getElementById('btn-close-inspector').addEventListener('click', () => {
      this.closeInspector();
    });

    // 8. Graphics Settings — Resolution Buttons
    const resButtons = document.querySelectorAll('.btn-resolution');
    resButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const res = btn.getAttribute('data-res');
        if (!res || res === this.planet.currentResolution) return;

        // Update active state
        resButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.classList.add('loading');

        // Swap textures
        this.planet.setSatelliteResolution(res);

        // Remove loading state after textures load (approximate)
        setTimeout(() => btn.classList.remove('loading'), 1500);

        // If not in satellite mode, switch to it so user sees the change
        const activeOverlay = document.querySelector('.btn-overlay.active');
        if (activeOverlay && activeOverlay.getAttribute('data-mode') !== 'satellite') {
          const satBtn = document.querySelector('.btn-overlay[data-mode="satellite"]');
          if (satBtn) {
            document.querySelectorAll('.btn-overlay').forEach(b => b.classList.remove('active'));
            satBtn.classList.add('active');
            this.planet.setVisualOverlay('satellite');
            this.sceneSetup.setTargetMesh(this.planet.satellitePlatesGroup);
          }
        }
      });
    });
  }

  closeInspector() {
    this.selectedPlateId = null;
    document.getElementById('inspector-placeholder').classList.remove('hidden');
    document.getElementById('inspector-content').classList.add('hidden');
  }

  initPlateLabels() {
    this.plateLabels = [];
    const container = document.getElementById('app');
    for (let i = 0; i < this.planet.numPlates; i++) {
      const el = document.createElement('div');
      el.className = 'plate-label';
      el.innerText = (i + 1).toString();
      container.appendChild(el);
      this.plateLabels.push(el);
    }
  }

  updatePlateLabels() {
    if (this.planet.visualMode === 'satellite') {
      this.plateLabels.forEach(el => el.style.display = 'none');
      return;
    }
    
    const vec = new THREE.Vector3();
    const camPos = this.sceneSetup.camera.position.clone().normalize();

    for (let i = 0; i < this.planet.numPlates; i++) {
      const plate = this.planet.plates[i];
      const el = this.plateLabels[i];
      if (!plate || !el) continue;
      
      // Calculate dot product to see if the plate normal faces the camera
      const dir = plate.seedPos.clone().normalize();
      if (dir.dot(camPos) < -0.1) {
        el.style.display = 'none';
        continue;
      }
      
      vec.copy(plate.seedPos);
      vec.applyMatrix4(this.planet.mesh.matrixWorld);
      vec.project(this.sceneSetup.camera);
      
      // Check if behind the globe conceptually via z
      if (vec.z > 1.0) {
        el.style.display = 'none';
        continue;
      }
      
      el.style.display = 'flex';
      const x = (vec.x * .5 + .5) * window.innerWidth;
      const y = (vec.y * -.5 + .5) * window.innerHeight;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }

  updateStats() {
    const stats = this.planet.getPlateStats();
    document.getElementById('stat-plates').innerText = stats.plates;
    document.getElementById('stat-continental').innerText = stats.continentalPercent;
    document.getElementById('stat-oceanic').innerText = stats.oceanicPercent;
    document.getElementById('stat-convergent').innerText = stats.convergentLength;
    document.getElementById('stat-divergent').innerText = stats.divergentLength;
  }

  updateEraDisplay() {
    const eraName = document.getElementById('stat-era');
    const progress = document.getElementById('epoch-progress');

    const year = this.currentYear;
    let era = "";
    let pct = 0;

    if (year < 50) {
      era = "Mesozoic (Triassic)";
      pct = (year / 50) * 100;
    } else if (year < 130) {
      era = "Mesozoic (Jurassic)";
      pct = ((year - 50) / 80) * 100;
    } else if (year < 250) {
      era = "Mesozoic (Cretaceous)";
      pct = ((year - 130) / 120) * 100;
    } else if (year < 380) {
      era = "Cenozoic (Neogene)";
      pct = ((year - 250) / 130) * 100;
    } else {
      era = "Future Earth (Pangea Ultima)";
      pct = 100;
    }

    eraName.innerText = era;
    progress.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const now = performance.now() / 1000;
    const delta = Math.min(now - this.lastTime, 0.1); // Cap delta to avoid large jumps
    this.lastTime = now;

    if (this.isPlaying) {
      // 1. Tick simulation physics
      // deltaTime scaled to speed up the visual drift slightly
      this.planet.update(delta, this.simSpeed * 0.15);

      // 2. Tick geological epoch years
      this.currentYear += delta * this.simSpeed * 9.5;
      document.getElementById('stat-year').innerText = Math.floor(this.currentYear);

      // 3. Update ERA markers
      this.updateEraDisplay();

      // 4. Update Inspector values in case plate values changed or were re-calculated
      if (this.selectedPlateId !== null) {
        // Redraw inspection share details
        let cellCount = 0;
        for (let i = 0; i < this.planet.gridSize; i++) {
          if (this.planet.vertPlate[i] === this.selectedPlateId) cellCount++;
        }
        const percent = Math.round((cellCount / this.planet.gridSize) * 1000) / 10;
        document.getElementById('insp-plate-area').innerText = percent + '%';
      }

      // Periodic stats panel refresh (to conserve render power)
      if (Math.random() < 0.03) {
        this.updateStats();
      }
    }
    
    // 5. Update HTML Plate Labels positions over the globe
    this.updatePlateLabels();

    this.sceneSetup.render();
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
