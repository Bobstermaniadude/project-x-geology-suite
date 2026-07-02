# Project X — Geology Suite

> An interactive laboratory for high-fidelity planetary dynamics and Earth science simulations.

**Project X Geology Suite** is a web-based collection of real-time Earth science simulators built with Three.js and modern web standards. Designed for students, educators, researchers, and anyone curious about how our planet works.

---

##  Modules

### teXtonics — *In Development*
A realistic 3D plate tectonics simulator.
- Dynamic crust-cell advection
- Convergent collisions & oceanic subductions
- Mid-ocean rifts
- Fully customizable plate structures
- Real-time 3D globe rendering

### Plate Textures — *Available Now*
Individual tectonic plate PNG textures in equirectangular projection.
- Available at 2K, 4K & 8K resolution
- Ready for 3D globe mapping and simulation pipelines

### seismologyX — *In Development*
Interactive seismic wave propagator.
- Model P and S waves through planetary interiors
- Customize core compositions
- Map global shadow zones in real-time

### volcanoX — *In Development*
Thermodynamic volcanic eruptive builder.
- Simulate magma chamber pressure & gas solubility
- Viscosity dynamics
- Pyroclastic flow pathway modeling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Rendering | Three.js |
| Noise Generation | simplex-noise |
| Geo Computation | d3-geo-voronoi, d3-array |
| Build Tool | Vite |
| Language | HTML, CSS, JavaScript (ES Modules) |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Install & Run

```bash
git clone https://github.com/Bobstermaniadude/project-x-geology-suite.git
cd project-x-geology-suite
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
Geology Suite/
├── index.html              # Main hub / landing page
├── teXtonics/
│   ├── index.html          # teXtonics app entry
│   └── src/
│       ├── main.js         # App bootstrap
│       ├── style.css       # teXtonics styles
│       ├── engine/         # Simulation logic
│       └── render/         # Three.js scene
├── src/
│   ├── main.js             # Shared utilities
│   ├── engine/             # Shared engine modules
│   └── render/             # Shared render modules
├── public/                 # Static assets
├── vite.config.js
└── package.json
```

---

## Created By

- **Skanda Ramanathan**
- **Srivarenya Vempati**

---

## License

This project is currently unlicensed. All rights reserved.

---

*Part of the Project X initiative — building the next generation of interactive science tools.*
