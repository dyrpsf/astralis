# ASTRALIS — Frontend

The 3D interactive web client for **ASTRALIS**, a real-time multi-planetary strategy simulator built with **React, TypeScript, Vite, Three.js (React Three Fiber), and Zustand**.

> **Note:** This directory contains the frontend application only. For backend API setup and Docker configuration, see the `../backend` directory.

---

## Key Features

- **Unified Infinite-Zoom 3D Universe (`UnifiedUniverse3D.tsx`)**
  - Seamless single-canvas navigation across five cosmic layers with zoom-aware Level of Detail (LOD):
    1. **Solar System** (Sun with animated corona, planets, moons, Main Asteroid Belt, Kuiper Belt)
    2. **Milky Way Galaxy** (spiral arms, nearby exoplanets, Sagittarius A*)
    3. **Other Galaxies & Cosmic Web** (neighboring spiral galaxies linked by filaments)
    4. **Observable Universe Horizon** (spherical cosmological boundary)
    5. **Infinite Bubble Multiverse** (logarithmic procedural shells that generate endlessly as you zoom out)
- **60 FPS Decoupled Simulation Loop**
  - Planetary revolutions, moon orbits, and spacecraft movement run directly inside Three.js `useFrame` via a shared `simClock`, preventing React re-render lag.
- **Live Dynamic Orbital Router ("Delivery Man" Pathfinding)**
  - Dijkstra-based stepping-stone router that recalculates optimal refueling corridors every **150ms** as celestial bodies revolve.
  - Supports **click-to-skip** exclusion of any intermediate planet with instant recalculation and zero-allocation GPU line rendering.
- **Life Viability Scanner (`HUD.tsx`)**
  - Click any celestial body to run a 4-factor astrobiology check (**Liquid Water**, **Atmosphere**, **Temperature**, **Radiation / Gravity**) returning a habitability score and verdict.
- **Resource-Driven Expansion**
  - Deploy habitats and harvest **Water Ice ($H_2O$)**, **Metals**, **Helium-3**, and **Exotic Matter** to fund deeper jumps from the Solar System to exoplanets and the Multiverse.
- **AI Mission Strategist & Curiosity Panel (`CuriosityPanel.tsx`)**
  - Connects to the Spring Boot + Gemini backend for real-time survival strategy and astrophysics Q&A.
- **Procedural + Real NASA 2K Planet Textures (`planetTextures.ts`)**
  - Renders high-resolution (`1024×512`) procedural textures out of the box and automatically upgrades to real NASA 2K `.jpg` maps when placed in `public/textures/`.

---

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **3D Engine:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **State Management:** Zustand
- **Styling & Icons:** Tailwind CSS, `lucide-react`

---

## Project Structure

```text
frontend/
├── public/
│   └── textures/                  # Optional NASA 2K maps (earth.jpg, mars.jpg, jupiter.jpg, ...)
├── src/
│   ├── components/
│   │   ├── UnifiedUniverse3D.tsx  # 60 FPS 3D universe, LOD layers & live orbital path renderer
│   │   ├── HUD.tsx                # Resource bar, orbital router, inspector & life viability scanner
│   │   └── CuriosityPanel.tsx     # AI Q&A drawer connected to backend
│   ├── store/
│   │   └── useSimulationStore.ts  # Zustand store, simClock, Dijkstra router & habitability analyzer
│   ├── utils/
│   │   └── planetTextures.ts      # Procedural canvas textures + automatic NASA 2K texture loader
│   ├── App.tsx                    # Root layout & 1s resource/economy tick
│   └── main.tsx                   # React entry point
├── package.json
└── vite.config.ts