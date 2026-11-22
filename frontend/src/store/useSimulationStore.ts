import { create } from 'zustand';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Shared 60fps mutable clock so 3D orbits run smoothly without React re-render lag
export const simClock = { time: 0 };

export interface ResourceBundle {
  water: number;
  metals: number;
  helium3: number;
  exotic: number;
}

export interface MoonData {
  id: string;
  name: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  zone: 'Solar System' | 'Dwarf & Outer' | 'Milky Way Exoplanets' | 'Cosmic & Multiverse';
  type: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  elevation?: number;
  hasRings?: boolean;
  moons?: MoonData[];
  gravity: string;
  tempC: string;
  atmosphere: string;
  hazards: string;
  description: string;
  colonized: boolean;
  population: number;
  habitats: number;
  extractors: number;
  yields: ResourceBundle;
}

export interface LifeAnalysis {
  verdict: 'Natural Life Possible' | 'Enclosed Habitat Required' | 'Extreme / Uninhabitable';
  score: number;
  summary: string;
  checks: { label: string; status: 'PASS' | 'WARN' | 'FAIL'; detail: string }[];
}

export function analyzeLifePossibility(body: CelestialBody): LifeAnalysis {
  if (body.id === 'earth') {
    return {
      verdict: 'Natural Life Possible',
      score: 100,
      summary: 'Optimal liquid water, breathable N2/O2 atmosphere, magnetosphere, and 1g gravity.',
      checks: [
        { label: 'Liquid Water', status: 'PASS', detail: 'Abundant surface oceans' },
        { label: 'Atmosphere', status: 'PASS', detail: 'Breathable 21% O2 + ozone shield' },
        { label: 'Temperature', status: 'PASS', detail: 'Stable 15°C average' },
        { label: 'Radiation / Gravity', status: 'PASS', detail: '1.0g & strong magnetic field' },
      ],
    };
  }

  if (body.id === 'trappist1' || body.id === 'proxima') {
    return {
      verdict: 'Enclosed Habitat Required',
      score: body.id === 'trappist1' ? 76 : 64,
      summary: 'Located inside the stellar habitable zone, but requires radiation shielding and atmosphere processing.',
      checks: [
        { label: 'Liquid Water', status: 'PASS', detail: 'Subsurface / terminator water likely' },
        { label: 'Atmosphere', status: 'WARN', detail: 'Unbreathable without terraforming' },
        { label: 'Temperature', status: 'PASS', detail: body.tempC },
        { label: 'Radiation / Gravity', status: 'WARN', detail: body.hazards },
      ],
    };
  }

  if (['mars', 'venus', 'ceres', 'jupiter', 'saturn', 'pluto'].includes(body.id)) {
    const scoreMap: Record<string, number> = { mars: 58, venus: 46, ceres: 40, jupiter: 38, saturn: 42, pluto: 28 };
    return {
      verdict: 'Enclosed Habitat Required',
      score: scoreMap[body.id] || 40,
      summary: 'Unprotected human life is impossible, but pressurized domes/aerostats can sustain colonies using local ISRU.',
      checks: [
        { label: 'Liquid Water', status: body.yields.water >= 15 ? 'PASS' : 'WARN', detail: body.yields.water >= 15 ? 'Ice / subsurface reserves' : 'Scarce moisture' },
        { label: 'Atmosphere', status: 'FAIL', detail: body.atmosphere },
        { label: 'Temperature', status: 'WARN', detail: body.tempC },
        { label: 'Radiation / Gravity', status: 'WARN', detail: `${body.gravity} · Shielding needed` },
      ],
    };
  }

  return {
    verdict: 'Extreme / Uninhabitable',
    score: body.zone === 'Cosmic & Multiverse' ? 5 : 14,
    summary: 'Lethal thermal, gravitational, or cosmic conditions. Only autonomous probes or Kardashev-scale mega-structures can operate here.',
    checks: [
      { label: 'Liquid Water', status: body.yields.water > 20 ? 'WARN' : 'FAIL', detail: body.yields.water > 20 ? 'Deep cryogenic ice only' : 'No accessible liquid water' },
      { label: 'Atmosphere', status: 'FAIL', detail: body.atmosphere },
      { label: 'Temperature', status: 'FAIL', detail: body.tempC },
      { label: 'Radiation / Gravity', status: 'FAIL', detail: body.hazards },
    ],
  };
}

export function getBodyPosition(body: CelestialBody, simTime: number): [number, number, number] {
  if (body.orbitRadius === 0) return [0, 0, 0];
  const angle = body.initialAngle + simTime * body.orbitSpeed;
  return [
    Math.cos(angle) * body.orbitRadius,
    body.elevation || 0,
    Math.sin(angle) * body.orbitRadius,
  ];
}

function dist3D(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function computeDynamicPath(
  bodies: CelestialBody[],
  originId: string,
  destId: string,
  excludedIds: string[],
  simTime: number
): { path: string[]; totalDist: number; cost: ResourceBundle } {
  if (originId === destId) {
    return { path: [originId], totalDist: 0, cost: { water: 0, metals: 0, helium3: 0, exotic: 0 } };
  }

  const active = bodies.filter(
    (b) => b.id === originId || b.id === destId || !excludedIds.includes(b.id)
  );
  const posMap: Record<string, [number, number, number]> = {};
  active.forEach((b) => {
    posMap[b.id] = getBodyPosition(b, simTime);
  });

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  active.forEach((b) => {
    dist[b.id] = Infinity;
    prev[b.id] = null;
    unvisited.add(b.id);
  });
  dist[originId] = 0;

  while (unvisited.size > 0) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of unvisited) {
      if (dist[id] < best) {
        best = dist[id];
        u = id;
      }
    }
    if (!u || u === destId) break;
    unvisited.delete(u);

    for (const v of unvisited) {
      const d = dist3D(posMap[u], posMap[v]);
      // Refueling curve (d^1.35) + fixed docking overhead (12) prevents pointless detours
      // while still preferring planets that swing into the corridor between X and Y
      const stopOverhead = v === destId ? 0 : 12;
      const weight = Math.pow(d, 1.35) + stopOverhead;

      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight;
        prev[v] = u;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = destId;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }
  if (path[0] !== originId) {
    return { path: [originId, destId], totalDist: 0, cost: { water: 10, metals: 10, helium3: 0, exotic: 0 } };
  }

  let totalDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDist += dist3D(posMap[path[i]], posMap[path[i + 1]]);
  }

  const destBody = bodies.find((b) => b.id === destId);
  const isExo = destBody?.zone === 'Milky Way Exoplanets';
  const isMulti = destBody?.zone === 'Cosmic & Multiverse';

  const cost: ResourceBundle = {
    water: Math.round(totalDist * 1.2),
    metals: Math.round(totalDist * 1.0),
    helium3: isExo || isMulti ? Math.round(totalDist * 0.8) : Math.round(totalDist * 0.2),
    exotic: isMulti ? Math.round(totalDist * 0.6) : 0,
  };

  return { path, totalDist: Math.round(totalDist), cost };
}

const INITIAL_BODIES: CelestialBody[] = [
  {
    id: 'mercury', name: 'Mercury', zone: 'Solar System', type: 'Inner Terrestrial', color: '#a1a1aa',
    radius: 0.6, orbitRadius: 9, orbitSpeed: 0.38, initialAngle: 0.4,
    gravity: '3.7 m/s²', tempC: '-180°C to 430°C', atmosphere: 'Exosphere (Trace)',
    hazards: 'Extreme solar radiation & thermal swings',
    description: 'Rich in heavy metals and intense solar energy for Dyson-swarm precursors.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 2, metals: 25, helium3: 5, exotic: 0 },
  },
  {
    id: 'venus', name: 'Venus', zone: 'Solar System', type: 'Cloud-Base Terrestrial', color: '#eab308',
    radius: 1.05, orbitRadius: 14, orbitSpeed: 0.28, initialAngle: 2.1,
    gravity: '8.87 m/s²', tempC: '465°C (50km: 25°C)', atmosphere: '96% CO2, Sulfuric Clouds',
    hazards: 'Crushing surface pressure & acid clouds',
    description: 'Floating 50km aerostat habitats harvest atmospheric gases and solar power.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 8, metals: 14, helium3: 2, exotic: 0 },
  },
  {
    id: 'earth', name: 'Earth', zone: 'Solar System', type: 'Homeworld (+ Luna)', color: '#3b82f6',
    radius: 1.3, orbitRadius: 20, orbitSpeed: 0.2, initialAngle: 0.0,
    moons: [{ id: 'luna', name: 'Luna', color: '#cbd5e1', radius: 0.32, orbitRadius: 2.4, orbitSpeed: 1.5 }],
    gravity: '9.81 m/s²', tempC: '15°C avg', atmosphere: '78% N2, 21% O2',
    hazards: 'Finite planetary resources—cannot fund interstellar expansion alone',
    description: 'Humanity’s cradle. Supplies starter water & metals, but outer colonies are required to go further.',
    colonized: true, population: 8200000000, habitats: 100, extractors: 10,
    yields: { water: 12, metals: 10, helium3: 2, exotic: 0 },
  },
  {
    id: 'mars', name: 'Mars', zone: 'Solar System', type: 'Terrestrial (+ Phobos)', color: '#ef4444',
    radius: 0.95, orbitRadius: 27, orbitSpeed: 0.14, initialAngle: 0.35,
    moons: [{ id: 'phobos', name: 'Phobos', color: '#9ca3af', radius: 0.16, orbitRadius: 1.7, orbitSpeed: 2.0 }],
    gravity: '3.72 m/s²', tempC: '-63°C avg', atmosphere: '95% CO2 (Thin)',
    hazards: 'Global dust storms & cosmic radiation',
    description: 'Primary multi-planetary staging hub with subsurface ice and iron-oxide ore.',
    colonized: true, population: 650, habitats: 3, extractors: 2,
    yields: { water: 18, metals: 20, helium3: 3, exotic: 0 },
  },
  {
    id: 'ceres', name: 'Ceres', zone: 'Dwarf & Outer', type: 'Dwarf Planet (Asteroid Belt)', color: '#a8a29e',
    radius: 0.55, orbitRadius: 34, orbitSpeed: 0.1, initialAngle: 0.7,
    gravity: '0.28 m/s²', tempC: '-105°C avg', atmosphere: 'Transient Water Vapor',
    hazards: 'Micro-meteoroid impacts in the Main Belt',
    description: 'Water-ice mantle and platinum-group metals make Ceres the ultimate refueling depot.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 35, metals: 30, helium3: 6, exotic: 0 },
  },
  {
    id: 'jupiter', name: 'Jupiter', zone: 'Solar System', type: 'Gas Giant (+ Europa, Ganymede)', color: '#d97706',
    radius: 2.4, orbitRadius: 45, orbitSpeed: 0.065, initialAngle: 1.0,
    moons: [
      { id: 'europa', name: 'Europa', color: '#38bdf8', radius: 0.35, orbitRadius: 3.6, orbitSpeed: 1.5 },
      { id: 'ganymede', name: 'Ganymede', color: '#94a3b8', radius: 0.45, orbitRadius: 4.8, orbitSpeed: 0.9 },
    ],
    gravity: '24.79 m/s²', tempC: '-145°C', atmosphere: 'Hydrogen & Helium',
    hazards: 'Intense radiation belts around Galilean moons',
    description: 'Europa’s subsurface ocean and Jupiter’s Helium-3 fuel deep-space fusion drives.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 45, metals: 15, helium3: 40, exotic: 2 },
  },
  {
    id: 'saturn', name: 'Saturn', zone: 'Solar System', type: 'Ringed Giant (+ Titan)', color: '#f59e0b',
    radius: 2.0, orbitRadius: 58, orbitSpeed: 0.045, initialAngle: 1.4, hasRings: true,
    moons: [{ id: 'titan', name: 'Titan', color: '#fbbf24', radius: 0.48, orbitRadius: 4.8, orbitSpeed: 0.85 }],
    gravity: '10.44 m/s²', tempC: '-178°C', atmosphere: 'H2 / He (Titan: Dense N2)',
    hazards: 'Cryogenic temperatures (-179°C)',
    description: 'Titan’s hydrocarbon lakes and Saturn’s Helium-3 power outer-system logistics.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 35, metals: 18, helium3: 55, exotic: 4 },
  },
  {
    id: 'uranus', name: 'Uranus', zone: 'Solar System', type: 'Ice Giant', color: '#22d3ee',
    radius: 1.5, orbitRadius: 70, orbitSpeed: 0.032, initialAngle: 2.0,
    gravity: '8.69 m/s²', tempC: '-195°C', atmosphere: 'H2, He, Methane Ice',
    hazards: 'Extreme axial tilt & supersonic winds',
    description: 'Abundant Helium-3 and deuterium—the premier fusion refinery of the Solar System.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 30, metals: 12, helium3: 75, exotic: 6 },
  },
  {
    id: 'neptune', name: 'Neptune', zone: 'Solar System', type: 'Ice Giant (+ Triton)', color: '#2563eb',
    radius: 1.45, orbitRadius: 82, orbitSpeed: 0.024, initialAngle: 2.6,
    moons: [{ id: 'triton', name: 'Triton', color: '#93c5fd', radius: 0.3, orbitRadius: 2.8, orbitSpeed: -1.1 }],
    gravity: '11.15 m/s²', tempC: '-200°C', atmosphere: 'H2, He, Methane',
    hazards: '2,100 km/h winds & minimal sunlight',
    description: 'Final planetary staging post before the Kuiper Belt and Oort Cloud.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 28, metals: 15, helium3: 80, exotic: 10 },
  },
  {
    id: 'pluto', name: 'Pluto', zone: 'Dwarf & Outer', type: 'Kuiper Dwarf (+ Charon)', color: '#d6d3d1',
    radius: 0.55, orbitRadius: 94, orbitSpeed: 0.018, initialAngle: 3.1,
    moons: [{ id: 'charon', name: 'Charon', color: '#a8a29e', radius: 0.25, orbitRadius: 1.5, orbitSpeed: 1.4 }],
    gravity: '0.62 m/s²', tempC: '-229°C', atmosphere: 'Frozen Nitrogen / Methane',
    hazards: 'Deep cryogenic freeze & 5.5-hour comm lag',
    description: 'Kuiper Belt relay outpost harvesting cryo-volatiles for Oort Cloud crossings.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 40, metals: 20, helium3: 30, exotic: 12 },
  },
  {
    id: 'eris', name: 'Eris', zone: 'Dwarf & Outer', type: 'Scattered Disc Dwarf', color: '#e2e8f0',
    radius: 0.55, orbitRadius: 108, orbitSpeed: 0.014, initialAngle: 3.7,
    gravity: '0.82 m/s²', tempC: '-243°C', atmosphere: 'Frozen Methane',
    hazards: 'Edge of heliosphere—high galactic cosmic rays',
    description: 'Gateway to the Oort Cloud and interstellar launch accelerator.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 35, metals: 25, helium3: 45, exotic: 18 },
  },
  {
    id: 'proxima', name: 'Proxima Centauri b', zone: 'Milky Way Exoplanets', type: 'Exoplanet (4.2 LY)', color: '#f87171',
    radius: 2.2, orbitRadius: 175, orbitSpeed: 0.008, initialAngle: 0.6, elevation: 6,
    gravity: '11.2 m/s²', tempC: '-39°C', atmosphere: 'Suspected Dense CO2/N2',
    hazards: 'Red-dwarf superflares & tidal locking',
    description: 'Humanity’s first extrasolar foothold. Requires outer-system Helium-3 to reach.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 60, metals: 70, helium3: 90, exotic: 35 },
  },
  {
    id: 'trappist1', name: 'TRAPPIST-1e', zone: 'Milky Way Exoplanets', type: 'Exoplanet (40.7 LY)', color: '#38bdf8',
    radius: 2.4, orbitRadius: 225, orbitSpeed: 0.006, initialAngle: 2.3, elevation: -8,
    gravity: '9.1 m/s²', tempC: '-22°C', atmosphere: 'Temperate Ocean Potential',
    hazards: 'Stellar wind stripping',
    description: 'Seven Earth-sized worlds enabling massive galactic-scale resource harvesting.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 95, metals: 85, helium3: 110, exotic: 55 },
  },
  {
    id: 'sgrA', name: 'Sagittarius A*', zone: 'Milky Way Exoplanets', type: 'Galactic Core Black Hole', color: '#fde047',
    radius: 4.5, orbitRadius: 280, orbitSpeed: 0.004, initialAngle: 4.2, elevation: 0,
    gravity: '4.3M Solar Masses', tempC: 'Accretion: 10¹⁰ K', atmosphere: 'Relativistic Plasma',
    hazards: 'Extreme tidal forces & lethal Hawking/X-ray flux',
    description: 'Penrose energy harvesting here generates the Exotic Matter needed to breach the Multiverse.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 0, metals: 40, helium3: 200, exotic: 150 },
  },
  {
    id: 'andromeda', name: 'Local Group · Andromeda', zone: 'Cosmic & Multiverse', type: 'Intergalactic Hub (2.5M LY)', color: '#a78bfa',
    radius: 18, orbitRadius: 680, orbitSpeed: 0.002, initialAngle: 1.2, elevation: 45,
    gravity: '1.5 Trillion Stars', tempC: 'Intergalactic Void', atmosphere: 'Cosmic Web Filaments',
    hazards: 'Dark energy expansion horizon',
    description: 'Intergalactic staging node linking the Milky Way to Laniakea and the Cosmic Web.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 120, metals: 150, helium3: 300, exotic: 280 },
  },
  {
    id: 'multiverse', name: 'Multiverse Horizon', zone: 'Cosmic & Multiverse', type: 'Ultimate Goal · Bubble / Quantum / Brane', color: '#34d399',
    radius: 42, orbitRadius: 2150, orbitSpeed: 0.001, initialAngle: 3.8, elevation: -60,
    gravity: '11-Dimensional Bulk', tempC: 'Planck Scale', atmosphere: 'Eternal Inflation Field',
    hazards: 'Causal disconnection & vacuum decay',
    description: 'The ultimate destination of human civilization: transcending our Observable Universe into the Multiverse.',
    colonized: false, population: 0, habitats: 0, extractors: 0,
    yields: { water: 999, metals: 999, helium3: 999, exotic: 999 },
  },
];

interface SimulationState {
  year: number;
  speed: number;
  cameraTarget: 'solar' | 'galaxy' | 'multiverse';
  selectedId: string | null;
  bodies: CelestialBody[];
  civResources: ResourceBundle;
  originId: string;
  destId: string;
  excludedIds: string[];
  computedPath: string[];
  pathDistance: number;
  pathCost: ResourceBundle;
  missionLog: string;
  aiAdvice: { source: string; recommendation: string } | null;
  aiLoading: boolean;

  setSpeed: (s: number) => void;
  setCameraTarget: (t: 'solar' | 'galaxy' | 'multiverse') => void;
  selectBody: (id: string | null) => void;
  setRoute: (originId: string, destId: string) => void;
  toggleExcludeBody: (id: string) => void;
  clearExclusions: () => void;
  recomputePath: () => void;
  deployOrHarvest: (id: string) => void;
  launchPathMission: () => void;
  requestAiStrategy: (id: string) => Promise<void>;
  tick: () => void;
}

const initialRoute = computeDynamicPath(INITIAL_BODIES, 'earth', 'jupiter', [], 0);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  year: 2036,
  speed: 1,
  cameraTarget: 'solar',
  selectedId: 'mars',
  bodies: INITIAL_BODIES,
  civResources: { water: 120, metals: 120, helium3: 35, exotic: 0 },

  originId: 'earth',
  destId: 'jupiter',
  excludedIds: [],
  computedPath: initialRoute.path,
  pathDistance: initialRoute.totalDist,
  pathCost: initialRoute.cost,
  missionLog: 'Select Origin & Destination to compute live orbital refueling path.',

  aiAdvice: null,
  aiLoading: false,

  setSpeed: (speed) => set({ speed }),
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  selectBody: (id) => set({ selectedId: id, aiAdvice: null }),

  setRoute: (originId, destId) => {
    const state = get();
    const res = computeDynamicPath(state.bodies, originId, destId, state.excludedIds, simClock.time);
    set({
      originId,
      destId,
      computedPath: res.path,
      pathDistance: res.totalDist,
      pathCost: res.cost,
    });
  },

  toggleExcludeBody: (id) => {
    const state = get();
    if (id === state.originId || id === state.destId) return;
    const exists = state.excludedIds.includes(id);
    const nextExcluded = exists
      ? state.excludedIds.filter((x) => x !== id)
      : [...state.excludedIds, id];
    const res = computeDynamicPath(state.bodies, state.originId, state.destId, nextExcluded, simClock.time);
    set({
      excludedIds: nextExcluded,
      computedPath: res.path,
      pathDistance: res.totalDist,
      pathCost: res.cost,
      missionLog: exists ? `Restored ${id.toUpperCase()} to orbital router.` : `Skipped ${id.toUpperCase()} — path recalculated around it.`,
    });
  },

  clearExclusions: () => {
    const state = get();
    const res = computeDynamicPath(state.bodies, state.originId, state.destId, [], simClock.time);
    set({
      excludedIds: [],
      computedPath: res.path,
      pathDistance: res.totalDist,
      pathCost: res.cost,
    });
  },

  recomputePath: () => {
    const state = get();
    const res = computeDynamicPath(
      state.bodies,
      state.originId,
      state.destId,
      state.excludedIds,
      simClock.time
    );
    // Only trigger a React state update if the waypoints or distance actually changed
    const samePath =
      res.path.length === state.computedPath.length &&
      res.path.every((id, idx) => id === state.computedPath[idx]);

    if (!samePath || Math.abs(res.totalDist - state.pathDistance) >= 2) {
      set({
        computedPath: res.path,
        pathDistance: res.totalDist,
        pathCost: res.cost,
      });
    }
  },

  deployOrHarvest: (id) => {
    const state = get();
    const body = state.bodies.find((b) => b.id === id);
    if (!body) return;

    if (!body.colonized) {
      set({
        bodies: state.bodies.map((b) =>
          b.id === id ? { ...b, colonized: true, population: 150, habitats: 1, extractors: 1 } : b
        ),
        missionLog: `Colony deployed on ${body.name}! Harvesting resources for civilization pool.`,
      });
    } else {
      set({
        bodies: state.bodies.map((b) =>
          b.id === id ? { ...b, extractors: b.extractors + 1, population: b.population + 120 } : b
        ),
        civResources: {
          water: state.civResources.water + body.yields.water * 2,
          metals: state.civResources.metals + body.yields.metals * 2,
          helium3: state.civResources.helium3 + body.yields.helium3 * 2,
          exotic: state.civResources.exotic + body.yields.exotic * 2,
        },
        missionLog: `Harvested resources from ${body.name} (+${body.yields.water * 2} H2O, +${body.yields.metals * 2} Metals, +${body.yields.helium3 * 2} He-3).`,
      });
    }
  },

  launchPathMission: () => {
    const state = get();
    const { civResources, pathCost, destId, computedPath } = state;
    if (
      civResources.water < pathCost.water ||
      civResources.metals < pathCost.metals ||
      civResources.helium3 < pathCost.helium3 ||
      civResources.exotic < pathCost.exotic
    ) {
      set({
        missionLog: 'Insufficient resources! Colonize & harvest closer planets first to fund this jump.',
      });
      return;
    }

    const dest = state.bodies.find((b) => b.id === destId);
    set({
      civResources: {
        water: civResources.water - pathCost.water,
        metals: civResources.metals - pathCost.metals,
        helium3: civResources.helium3 - pathCost.helium3,
        exotic: civResources.exotic - pathCost.exotic,
      },
      bodies: state.bodies.map((b) =>
        computedPath.includes(b.id) && !b.colonized
          ? { ...b, colonized: true, population: 200, habitats: 1, extractors: 1 }
          : b
      ),
      selectedId: destId,
      missionLog: `Mission succeeded! Reached & established outpost at ${dest?.name} via${computedPath.length - 1} hops.`,
    });
  },

  requestAiStrategy: async (id) => {
    const state = get();
    const body = state.bodies.find((b) => b.id === id);
    if (!body) return;
    set({ aiLoading: true, aiAdvice: null });
    try {
      const res = await fetch(`${API_BASE}/api/ai/strategize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planet: body.name, crisis: body.hazards, energy: 75, water: state.civResources.water, oxygen: 85, }), }); const data = await res.json(); set({ aiAdvice: data, aiLoading: false }); } catch { set({ aiAdvice: { source: 'Local Engine', recommendation: `• Harvest ${body.name} to fund deeper jumps.\n• Mitigate: ${body.hazards}.` },
        aiLoading: false,
      });
    }
  },

  // Runs once per second for resources & dynamic orbital re-routing (never blocks 60fps 3D!)
  tick: () => {
    const state = get();
    if (state.speed === 0) return;

    let w = 0, m = 0, h = 0, e = 0;
    state.bodies.forEach((b) => {
      if (b.colonized) {
        const mult = 0.16 * Math.max(1, b.extractors * 0.4) * Math.min(state.speed, 10);
        w += b.yields.water * mult;
        m += b.yields.metals * mult;
        h += b.yields.helium3 * mult;
        e += b.yields.exotic * mult;
      }
    });

    const updatedRoute = computeDynamicPath(
      state.bodies,
      state.originId,
      state.destId,
      state.excludedIds,
      simClock.time
    );

    set({
      year: Number((state.year + 0.08 * state.speed).toFixed(2)),
      civResources: {
        water: Math.round(state.civResources.water + w),
        metals: Math.round(state.civResources.metals + m),
        helium3: Math.round(state.civResources.helium3 + h),
        exotic: Math.round(state.civResources.exotic + e),
      },
      computedPath: updatedRoute.path,
      pathDistance: updatedRoute.totalDist,
      pathCost: updatedRoute.cost,
    });
  },
}));