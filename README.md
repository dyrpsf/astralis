# ASTRALIS

**ASTRALIS** is a real-time 3D multi-planetary strategy simulator and infinite-zoom cosmic sandbox. Navigate smoothly from the Solar System to the Infinite Multiverse at 60 FPS, compute live orbital transfer routes around revolving planets, scan worlds for habitability, harvest resources to fund deeper expansion, and consult a Gemini-powered AI Mission Strategist.

---

## Live Deployment & Demo

| Resource | Link |
| :--- | :--- |
| **Live Frontend (Vercel)** | `[Add your .vercel.app URL here]` |
| **Live Backend API (Render)** | https://astralis-backend-zehc.onrender.com |
| **Presentation Video** | `[Add your demo video link here]` |

> **Note:** The backend runs on Render's free tier and may take ~30–50 seconds to wake up on the first AI request.

---

## Core Features

### 1. Unified Infinite-Zoom 3D Universe
A single continuous Three.js canvas with zoom-aware Level of Detail (LOD) across five cosmic scales:
1. **Solar System** — Animated Sun corona, planets, moons, Main Asteroid Belt, and Kuiper Belt.
2. **Milky Way Galaxy** — 4-arm spiral starfield, nearby exoplanets, and Sagittarius A*.
3. **Other Galaxies & Cosmic Web** — Neighboring spiral galaxies linked by intergalactic filaments.
4. **Observable Universe Horizon** — Cosmological boundary shell.
5. **Infinite Bubble Multiverse** — Procedurally generated concentric universe shells that expand logarithmically as you zoom out.

### 2. Live Dynamic Orbital Router ("Delivery Man" Pathfinding)
- Runs a **Dijkstra-based stepping-stone router** every **150ms** as planets revolve in real time.
- Uses a refueling cost curve ($d^{1.35}$) with docking overhead to pick realistic transfer corridors without unnecessary zigzags.
- Supports **click-to-skip** hazard avoidance, instantly rerouting around excluded worlds.
- Renders paths with a **zero-allocation pre-allocated GPU buffer** and a constant-speed delivery spacecraft at 60 FPS.

### 3. Life Viability Scanner & Resource Economy
- **Astrobiology Scanner:** Click any celestial body to evaluate liquid water, atmosphere, temperature, and radiation/gravity.
- **Resource-Driven Expansion:** Colonize worlds and harvest **Water Ice (H₂O)**, **Metals**, **Helium-3**, and **Exotic Matter** to unlock interstellar and intergalactic jumps.

### 4. AI Mission Strategist & Curiosity Panel
- Integrated with **Google Gemini** through a Java/Spring Boot backend for live mission planning, survival strategy, and astrophysics Q&A.

### 5. Realistic Planet Rendering
- Generates high-resolution (`1024×512`) procedural surface textures with continents, clouds, polar caps, craters, and gas bands out of the box.
- Automatically upgrades any planet to **NASA 2K equirectangular imagery** when `.jpg` maps are placed in `frontend/public/textures/`.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Three.js (`@react-three/fiber`, `@react-three/drei`), Zustand, Tailwind CSS, `lucide-react` |
| **Backend** | Java 25, Spring Boot, Maven, Google Gemini API |
| **Deployment** | Vercel (Frontend), Render via multi-stage Docker (Backend) |

---

## Repository Structure

```text
astralis/
├── frontend/                  # React + Three.js 3D client (see frontend/README.md)
│   ├── public/textures/       # Optional NASA 2K planet texture maps
│   ├── src/
│   │   ├── components/        # UnifiedUniverse3D, HUD, CuriosityPanel
│   │   ├── store/             # Zustand state, 60 FPS simClock, Dijkstra router
│   │   └── utils/             # Procedural + NASA texture loader
│   └── package.json
├── backend/                   # Spring Boot + Gemini API service
│   ├── src/main/java/         # REST controllers & Gemini integration
│   ├── Dockerfile             # Multi-stage Java 25 Alpine build
│   └── pom.xml
└── README.md