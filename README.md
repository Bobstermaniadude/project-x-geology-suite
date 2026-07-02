# Project X - Geology Suite

> An interactive laboratory for high-fidelity planetary dynamics and Earth science simulations.

---

> [!WARNING]
> **This project is heavily work in progress and not ready for use.**
> Everything you see here — the hub, the simulators, the assets — is actively being developed and subject to major changes at any time. Please do not clone, download, or rely on any part of this project yet. Functionality may be broken, incomplete, or entirely missing.

---

**Project X Geology Suite** is a web-based collection of real-time Earth science simulators built with Three.js and modern web standards. Designed for students, educators, researchers, and anyone curious about how our planet works.

---

## Modules

### teXtonics - *Early Access / Work in Progress*

> [!CAUTION]
> **teXtonics is publicly accessible but heavily unfinished.** The simulator is live and can be launched, but it is nowhere near a complete or polished state. Expect missing features, visual bugs, broken interactions, and placeholder content. This is an early development preview only — not a release. Do not judge the final product by what you see right now.

A realistic 3D plate tectonics simulator (in progress).
- Dynamic crust-cell advection
- Convergent collisions & oceanic subductions
- Mid-ocean rifts
- Fully customizable plate structures
- Real-time 3D globe rendering

### Plate Textures - *Available*
Individual tectonic plate PNG textures in equirectangular projection.
- Available at 2K, 4K & 8K resolution
- Ready for 3D globe mapping and simulation pipelines

### seismologyX - *Locked / In Development*
Interactive seismic wave propagator. Access is currently blocked — not yet ready for preview.
- Model P and S waves through planetary interiors
- Customize core compositions
- Map global shadow zones in real-time

### volcanoX - *Locked / In Development*
Thermodynamic volcanic eruptive builder. Access is currently blocked — not yet ready for preview.
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

> [!NOTE]
> This repo is not intended for external use at this stage. The instructions below are for reference only — the project is incomplete and may not build or run as expected.

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

*Part of the Project X initiative - building the next generation of interactive science tools.*
