import './style.css';
import * as THREE from 'three';
import { SceneSetup } from './render/scene.js';
import { Planet } from './engine/planet.js';

class App {
  constructor() {
    this.sceneSetup = new SceneSetup('app');
    
    this.planet = new Planet(2, 60); // Radius 2, detail 6 (60/10)
    this.sceneSetup.scene.add(this.planet.group);
    
    this.clock = new THREE.Clock();
    this.isPlaying = true;
    
    this.bindUI();
    this.updateStats();
    this.animate();
  }
  
  bindUI() {
    const btnToggle = document.getElementById('btn-toggle-time');
    btnToggle.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      btnToggle.innerText = this.isPlaying ? 'Pause Simulation' : 'Play Simulation';
      btnToggle.style.color = this.isPlaying ? 'var(--accent)' : 'var(--text-main)';
    });
    
    const btnReset = document.getElementById('btn-reset');
    btnReset.addEventListener('click', () => {
      this.sceneSetup.scene.remove(this.planet.group);
      this.planet.geometry.dispose();
      this.planet.material.dispose();
      this.planet.mantleGeometry.dispose();
      this.planet.mantleMaterial.dispose();
      
      this.planet = new Planet(2, 60);
      this.sceneSetup.scene.add(this.planet.group);
      this.updateStats();
    });
    
    // Initially set play state text
    btnToggle.innerText = 'Pause Simulation';
  }
  
  updateStats() {
    document.getElementById('stat-plates').innerText = this.planet.numPlates;
    // We will update year in animate loop when we add time logic
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock.getDelta();
    if (this.isPlaying) {
      this.planet.update(delta);
      
      // Fake year progression for now
      const currentYear = parseInt(document.getElementById('stat-year').innerText);
      document.getElementById('stat-year').innerText = currentYear + Math.floor(delta * 1000);
    }
    
    this.sceneSetup.render();
  }
}

// Initialize App when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
