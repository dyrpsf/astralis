import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles,
  Compass,
  Rocket,
  Radio,
  ShieldAlert,
  Atom,
  CheckCircle2,
  X,
} from 'lucide-react';
import { API_BASE } from '../store/useSimulationStore';
import { CuriosityPanel } from './CuriosityPanel';

interface Exoplanet {
  id: string;
  name: string;
  orbitAU: number;
  habitableZone: boolean;
  tempC: string;
  gravity: number;
  confidence: string;
  primaryResource: string;
}

interface StarSystem {
  seed: string;
  starClass: string;
  starColor: string;
  distanceLY: number;
  planets: Exoplanet[];
}

interface GalaxyNode {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  distanceLY: number;
  starClass: string;
  exoplanetCount: number;
  keyWorld: string;
  habitability: number;
  confidence: string;
  resources: string[];
  hazards: string;
  description: string;
}

const GALAXY_NODES: GalaxyNode[] = [
  {
    id: 'sol',
    name: 'Sol (Solar System)',
    pos: [8.5, 0.2, 6.5],
    color: '#fbbf24',
    distanceLY: 0,
    starClass: 'G2V Yellow Dwarf',
    exoplanetCount: 8,
    keyWorld: 'Earth / Mars / Europa',
    habitability: 100,
    confidence: '100% Verified',
    resources: ['Biosphere', 'Helium-3', 'Asteroid Metals'],
    hazards: 'Baseline Reference System',
    description: 'Humanity’s home system located on the inner edge of the Orion–Cygnus Arm.',
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    pos: [10.8, 0.4, 8.6],
    color: '#f87171',
    distanceLY: 4.24,
    starClass: 'M5.5Ve Red Dwarf',
    exoplanetCount: 2,
    keyWorld: 'Proxima Centauri b',
    habitability: 78,
    confidence: '94% Confirmed',
    resources: ['Subsurface Ice', 'Iron Silicates', 'Tidally Locked Terminator'],
    hazards: 'Frequent Superflares & X-Ray Radiation',
    description: 'Closest known star to the Sun; primary target for Breakthrough Starshot laser-sail probes.',
  },
  {
    id: 'barnard',
    name: "Barnard's Star",
    pos: [12.5, -0.3, 4.2],
    color: '#fb923c',
    distanceLY: 5.96,
    starClass: 'M4Ve Red Dwarf',
    exoplanetCount: 1,
    keyWorld: "Barnard's Star b",
    habitability: 52,
    confidence: '88% Confirmed',
    resources: ['Cryo-Volatiles', 'Frozen Methane', 'Rare Earths'],
    hazards: 'Extreme Cold (-150°C), Low Stellar Flux',
    description: 'Ancient, low-activity red dwarf ideal for long-term automated cryo-mining outposts.',
  },
  {
    id: 'sirius',
    name: 'Sirius A / B',
    pos: [6.2, 0.6, 12.2],
    color: '#e0f2fe',
    distanceLY: 8.6,
    starClass: 'A1V + White Dwarf',
    exoplanetCount: 0,
    keyWorld: 'Orbital Dyson Relay',
    habitability: 35,
    confidence: '99% Verified',
    resources: ['25x Solar Luminosity', 'High-Energy Photons', 'Degenerate Matter Study'],
    hazards: 'Intense UV Flux & Binary Gravitational Shear',
    description: 'Brightest star in Earth’s night sky; ideal high-output interstellar laser-highway power station.',
  },
  {
    id: 'tauceti',
    name: 'Tau Ceti',
    pos: [14.2, 0.1, 10.5],
    color: '#fde047',
    distanceLY: 11.9,
    starClass: 'G8V Sun-Like Star',
    exoplanetCount: 4,
    keyWorld: 'Tau Ceti e & f',
    habitability: 84,
    confidence: '86% Confirmed',
    resources: ['Dense Debris Disk', 'Water-Rich Comets', 'Platinum-Group Metals'],
    hazards: 'Heavy Asteroid Bombardment (10x Solar System)',
    description: 'Nearest solitary G-type Sun-like star; prime candidate for a permanent interstellar human enclave.',
  },
  {
    id: 'gliese667',
    name: 'Gliese 667C',
    pos: [2.5, -0.5, 14.8],
    color: '#f97316',
    distanceLY: 23.6,
    starClass: 'M1.5V (Triple System)',
    exoplanetCount: 3,
    keyWorld: 'Gliese 667Cc',
    habitability: 85,
    confidence: '87% Confirmed',
    resources: ['Super-Earth Minerals', 'Geothermal Heat', 'Liquid Water Potential'],
    hazards: 'High Surface Gravity (~1.6g)',
    description: 'Triple-star system hosting a super-Earth squarely inside the habitable zone.',
  },
  {
    id: 'trappist1',
    name: 'TRAPPIST-1',
    pos: [-9.2, -0.3, 12.4],
    color: '#38bdf8',
    distanceLY: 40.7,
    starClass: 'M8V Ultra-Cool Dwarf',
    exoplanetCount: 7,
    keyWorld: 'TRAPPIST-1e, f, g',
    habitability: 91,
    confidence: '92% Confirmed',
    resources: ['7 Earth-Sized Worlds', 'Global Oceans', 'Close-Orbit Inter-Planet Trade'],
    hazards: 'Tidal Locking & Stellar Wind Stripping',
    description: 'Seven tightly packed Earth-sized worlds—three in the habitable zone—allowing days-long interplanetary flights.',
  },
  {
    id: 'kepler186',
    name: 'Kepler-186',
    pos: [-14.5, 0.5, -8.2],
    color: '#a78bfa',
    distanceLY: 582,
    starClass: 'M1V Red Dwarf',
    exoplanetCount: 5,
    keyWorld: 'Kepler-186f',
    habitability: 79,
    confidence: '81% Confirmed',
    resources: ['Silicate Crust', 'Outer Habitable Zone Ice', 'CO2 Greenhouse'],
    hazards: 'Dim Red Sunlight (~33% Earth Flux)',
    description: 'First validated Earth-sized exoplanet discovered in the habitable zone of another star.',
  },
  {
    id: 'kepler452',
    name: 'Kepler-452',
    pos: [-16.8, -0.4, 5.5],
    color: '#facc15',
    distanceLY: 1402,
    starClass: 'G2V Older Sun Twin',
    exoplanetCount: 1,
    keyWorld: 'Kepler-452b ("Earth 2.0")',
    habitability: 83,
    confidence: '76% Confirmed',
    resources: ['Volcanic Activity', 'Thick Atmosphere', '385-Day Orbit'],
    hazards: 'High Gravity (~2g), Runaway Greenhouse Risk',
    description: 'A 6-billion-year-old cousin of Earth orbiting a G2V star remarkably similar to our Sun.',
  },
  {
    id: 'sgrA',
    name: 'Sagittarius A* (Core)',
    pos: [0, 0, 0],
    color: '#fef08a',
    distanceLY: 26670,
    starClass: 'Supermassive Black Hole (4.3M M☉)',
    exoplanetCount: 0,
    keyWorld: 'Penrose Energy Harvester',
    habitability: 10,
    confidence: '100% EHT Imaged',
    resources: ['Gravitational Slingshot', 'Penrose Black Hole Power', 'Relativistic Time Dilation'],
    hazards: 'Extreme Tidal Forces & Lethal Accretion Radiation',
    description: 'The gravitational anchor of the Milky Way; ultimate Kardashev Type III energy extraction site.',
  },
];

const PROPULSION_MODES = [
  { id: 'fusion', name: 'Fusion Drive', speedC: 0.1 },
  { id: 'laser', name: 'Laser Sail', speedC: 0.2 },
  { id: 'antimatter', name: 'Antimatter Torch', speedC: 0.5 },
  { id: 'relativistic', name: 'Relativistic', speedC: 0.85 },
];

function SpiralGalaxy({
  selectedId,
  launchedIds,
  onSelect,
}: {
  selectedId: string;
  launchedIds: string[];
  onSelect: (id: string) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 11000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const innerColor = new THREE.Color('#fde047');
    const midColor = new THREE.Color('#a78bfa');
    const outerColor = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 27;
      const spinAngle = radius * 0.46;
      const branchAngle = ((i % 4) / 4) * Math.PI * 2;

      const randomX = (Math.random() - 0.5) * (0.45 + radius * 0.14);
      const randomY = (Math.random() - 0.5) * (1.3 - radius * 0.03);
      const randomZ = (Math.random() - 0.5) * (0.45 + radius * 0.14);

      pos[i * 3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      pos[i * 3 + 1] = randomY;
      pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const t = radius / 27;
      const mixed =
        t < 0.5
          ? innerColor.clone().lerp(midColor, t * 2)
          : midColor.clone().lerp(outerColor, (t - 0.5) * 2);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
    }
  });

  const solNode = GALAXY_NODES[0];

  return (
    <group>
      <Stars radius={120} depth={50} count={3000} factor={3} fade speed={0.3} />

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.13} vertexColors transparent opacity={0.85} depthWrite={false} />
      </points>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.85} />
      </mesh>

      {launchedIds.map((targetId) => {
        const target = GALAXY_NODES.find((n) => n.id === targetId);
        if (!target || target.id === 'sol') return null;
        return (
          <Line
            key={targetId}
            points={[solNode.pos, target.pos]}
            color="#22d3ee"
            lineWidth={2}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />
        );
      })}

      {GALAXY_NODES.map((node) => {
        const isSelected = node.id === selectedId;
        const isLaunched = launchedIds.includes(node.id);
        return (
          <group key={node.id} position={node.pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <sphereGeometry args={[isSelected ? 0.55 : 0.36, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>

            {(isSelected || isLaunched) && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.65, 0.82, 32]} />
                <meshBasicMaterial
                  color={isLaunched ? '#34d399' : '#22d3ee'}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            <Html distanceFactor={36} position={[0, 0.9, 0]} center>
              <button
                onClick={() => onSelect(node.id)}
                className={`rounded px-2 py-0.5 text-[10px] font-mono whitespace-nowrap border transition ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/30 text-white scale-110'
                    : isLaunched
                    ? 'border-emerald-400/70 bg-emerald-950/80 text-emerald-200'
                    : 'border-slate-700/80 bg-slate-950/80 text-slate-300 hover:border-cyan-400/60'
                }`}
              >
                {node.name} <span className="text-amber-400">· {node.distanceLY} LY</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function InterstellarView() {
  const [selectedId, setSelectedId] = useState<string>('proxima');
  const [propulsion, setPropulsion] = useState(PROPULSION_MODES[1]);
  const [launchedIds, setLaunchedIds] = useState<string[]>(['proxima']);
  const [seed, setSeed] = useState('ALPHA-7');
  const [system, setSystem] = useState<StarSystem | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedNode = GALAXY_NODES.find((n) => n.id === selectedId) || GALAXY_NODES[1];
  const isLaunched = launchedIds.includes(selectedNode.id);

  const transitYears =
    selectedNode.distanceLY === 0
      ? '0'
      : (selectedNode.distanceLY / propulsion.speedC).toFixed(1);

  const launchSeedShip = (id: string) => {
    if (!launchedIds.includes(id)) {
      setLaunchedIds((prev) => [...prev, id]);
    }
  };

  const scanSector = async (customSeed?: string) => {
    const targetSeed = customSeed || seed;
    if (customSeed) setSeed(customSeed);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/exoplanets/generate?seed=${encodeURIComponent(targetSeed)}`);
      const data = await res.json();
      setSystem(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-[#050814]">
      <Canvas camera={{ position: [0, 24, 38], fov: 45 }}>
        <color attach="background" args={['#050814']} />
        <SpiralGalaxy selectedId={selectedId} launchedIds={launchedIds} onSelect={setSelectedId} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={10} maxDistance={75} />
      </Canvas>

      {/* LEFT SIDEBAR: GALACTIC DIRECTORY & PROPULSION */}
      <aside className="pointer-events-auto fixed top-24 left-4 bottom-20 w-64 flex flex-col gap-3 z-20">
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/85 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            <span className="flex items-center gap-1"><Atom className="h-3.5 w-3.5 text-cyan-400" /> Propulsion Drive</span>
            <span className="text-amber-400">{(propulsion.speedC * 100).toFixed(0)}% c</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PROPULSION_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setPropulsion(m)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium border transition ${
                  propulsion.id === m.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:text-white'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/85 p-3 backdrop-blur-md">
          <p className="mb-2 px-1 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Milky Way Catalog ({GALAXY_NODES.length})
          </p>
          <div className="space-y-1">
            {GALAXY_NODES.map((node) => {
              const active = node.id === selectedId;
              const deployed = launchedIds.includes(node.id);
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-cyan-500/20 border border-cyan-400/50 text-white'
                      : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                    <span className="truncate font-medium">{node.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ml-1 ${deployed ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {deployed ? 'SEED' : `${node.distanceLY}LY`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* RIGHT TOP PANEL: SELECTED STAR & EXOPLANET INSPECTOR */}
      <aside className="pointer-events-auto fixed top-24 right-4 w-84 max-h-[54vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-950/85 p-4 backdrop-blur-md z-20">
        <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h2 className="text-base font-bold text-white">{selectedNode.name}</h2>
            <p className="text-[11px] font-mono text-cyan-400">{selectedNode.starClass}</p>
          </div>
          <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
            {selectedNode.confidence}
          </span>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-slate-300">{selectedNode.description}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="rounded-lg bg-slate-900/90 p-2 border border-slate-800">
            <div className="text-[10px] text-slate-400">TRANSIT ({propulsion.name})</div>
            <div className="text-amber-400 font-bold">{transitYears} Years</div>
          </div>
          <div className="rounded-lg bg-slate-900/90 p-2 border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Radio className="h-3 w-3" /> COMM LAG
            </div>
            <div className="text-cyan-400 font-bold">{selectedNode.distanceLY} Years</div>
          </div>
          <div className="col-span-2 rounded-lg bg-slate-900/90 p-2 border border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">KEY TARGET</span>
            <span className="text-white font-semibold">{selectedNode.keyWorld}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedNode.resources.map((res) => (
            <span key={res} className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
              {res}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{selectedNode.hazards}</span>
        </div>

        {selectedNode.id !== 'sol' && (
          <button
            onClick={() => launchSeedShip(selectedNode.id)}
            disabled={isLaunched}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition ${
              isLaunched
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {isLaunched ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Autonomous Seed Ship En Route
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" /> Launch Interstellar Seed Ship
              </>
            )}
          </button>
        )}
      </aside>

      {/* BOTTOM-RIGHT: TIER 3 UNCHARTED SECTOR SCANNER */}
      <div className="pointer-events-auto fixed bottom-6 right-4 w-84 md:w-[420px] rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 backdrop-blur-md z-20">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Tier 3 · Uncharted Sector Scanner
          </h2>
          {system && (
            <button onClick={() => setSystem(null)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex gap-1.5">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value.toUpperCase())}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-cyan-400"
            placeholder="SECTOR-492-A"
          />
          <button
            onClick={() => scanSector()}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            <Compass className="h-3.5 w-3.5" />
            {loading ? '...' : 'Scan'}
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          {['ALPHA-7', 'ORION-9', 'VEGA-X', 'CYGNUS-4'].map((preset) => (
            <button
              key={preset}
              onClick={() => scanSector(preset)}
              className="rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:border-cyan-400/50 hover:text-cyan-300"
            >
              {preset}
            </button>
          ))}
        </div>

        {system && (
          <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: system.starColor }} />
              {system.seed} · {system.starClass} · {system.distanceLY} LY
            </div>
            {system.planets.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="font-bold text-white">{p.name}</span>
                  <span className={p.habitableZone ? 'text-emerald-400' : 'text-slate-400'}>
                    {p.habitableZone ? 'HABITABLE ZONE' : `${p.orbitAU} AU`}
                  </span>
                </div>
                <div className="mt-0.5 text-slate-400">
                  {p.tempC} · {p.gravity} m/s² · <span className="text-cyan-300">{p.primaryResource}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CURIOSITY PANEL FOR INTERSTELLAR MAP */}
      <CuriosityPanel
        topic={selectedNode.name}
        context={`${selectedNode.starClass}, ${selectedNode.distanceLY} LY away. ${selectedNode.description}`}
      />
    </div>
  );
}