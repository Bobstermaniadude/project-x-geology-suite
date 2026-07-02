import * as THREE from 'three';
import { geoVoronoi } from 'd3-geo-voronoi';

export class Planet {
  constructor(radius = 1, detail = 50) {
    this.radius = radius;
    this.detail = detail;
    this.numPlates = 20;
    
    // Generating high-res icosphere for the mesh
    this.geometry = new THREE.IcosahedronGeometry(this.radius, Math.floor(this.detail / 10)); // ~2562 vertices for detail=5
    // Need non-indexed geometry to color vertices individually if they share faces
    this.geometry = this.geometry.toNonIndexed();
    
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      wireframe: false,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });
    
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // Add mantle (inner sphere) to see when plates diverge
    this.mantleGeometry = new THREE.IcosahedronGeometry(this.radius * 0.98, Math.floor(this.detail / 10));
    this.mantleMaterial = new THREE.MeshStandardMaterial({
      color: 0x882200, // deep magma red
      roughness: 0.9,
      emissive: 0x330000
    });
    this.mantleMesh = new THREE.Mesh(this.mantleGeometry, this.mantleMaterial);
    
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.add(this.mantleMesh);
    
    this.plates = [];
    this.generatePlates();
  }
  
  generatePlates() {
    // 1. Generate random seed points (plate centers) on a sphere
    const sites = [];
    for (let i = 0; i < this.numPlates; i++) {
      // Random point on sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      // Convert to lat/lon for d3-geo-voronoi
      const lon = (theta * 180 / Math.PI) - 180;
      const lat = (phi * 180 / Math.PI) - 90;
      sites.push([lon, lat]);
      
      // Generate a random Euler pole (axis of rotation) and angular velocity
      const eulerAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      
      const angularVelocity = (Math.random() * 0.05 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      
      this.plates.push({
        id: i,
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        eulerAxis: eulerAxis,
        angularVelocity: angularVelocity
      });
    }
    
    this.assignVerticesToPlates(sites);
  }
  
  assignVerticesToPlates(sites) {
    const positionAttribute = this.geometry.getAttribute('position');
    const colors = [];
    this.vertexPlateIds = []; // Store which plate each vertex belongs to
    
    const vec3 = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      vec3.fromBufferAttribute(positionAttribute, i);
      vec3.normalize();
      
      const lat = Math.asin(vec3.y) * 180 / Math.PI;
      const lon = Math.atan2(vec3.x, vec3.z) * 180 / Math.PI;
      
      let minDist = Infinity;
      let nearestPlateId = 0;
      
      for (let p = 0; p < sites.length; p++) {
        const site = sites[p];
        const dist = this.haversineDistance(lat, lon, site[1], site[0]);
        if (dist < minDist) {
          minDist = dist;
          nearestPlateId = p;
        }
      }
      
      this.vertexPlateIds.push(nearestPlateId);
      const color = this.plates[nearestPlateId].color;
      colors.push(color.r, color.g, color.b);
    }
    
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.attributes.color.needsUpdate = true;
  }
  
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 1;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  update(deltaTime) {
    // Update vertex positions based on their plate's Euler pole
    const positionAttribute = this.geometry.getAttribute('position');
    const vec3 = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const plateId = this.vertexPlateIds[i];
      const plate = this.plates[plateId];
      
      vec3.fromBufferAttribute(positionAttribute, i);
      
      // Rotate vertex around Euler pole
      const angle = plate.angularVelocity * deltaTime;
      vec3.applyAxisAngle(plate.eulerAxis, angle);
      
      positionAttribute.setXYZ(i, vec3.x, vec3.y, vec3.z);
    }
    
    positionAttribute.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
