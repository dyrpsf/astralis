import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, Sparkles, Compass, Layers } from 'lucide-react';
import { CuriosityPanel } from './CuriosityPanel';
import { getPlanetTexture, getGlowTexture, getRingTexture } from '../utils/planetTextures';

interface CosmicStage {
  id: string;
  title: string;
  scale: string;
  category: 'Solar System Objects' | 'Galactic & Superclusters' | 'Cosmology & Multiverse';
  visual:
    | 'moons'
    | 'dwarf'
    | 'asteroids'
    | 'comets'
    | 'oort'
    | 'stars'
    | 'galaxy'
    | 'localgroup'
    | 'virgo'
    | 'laniakea'
    | 'web'
    | 'observable'
    | 'beyondhorizon'
    | 'blackhole'
    | 'bounce'
    | 'multiverse'
    | 'bubbles'
    | 'quantum'
    | 'brane'
    | 'math'
    | 'ultimate'
    | 'beyond';
  color: string;
  description: string;
  feasibility: string;
}

const COSMIC_STAGES: CosmicStage[] = [
  {
    id: 'moons',
    title: '1. Moons (Natural Satellites)',
    scale: '10 km – 5,268 km (Ganymede)',
    category: 'Solar System Objects',
    visual: 'moons',
    color: '#38bdf8',
    description: 'Over 290 known planetary moons—including Luna, Phobos, Europa, Ganymede, Enceladus, Titan, and Triton—hosting subsurface oceans, water ice, and low-gravity launchports.',
    feasibility: 'Primary near-term bases for Artemis, cryo-research, and propellant depots.',
  },
  {
    id: 'dwarf',
    title: '2. Dwarf Planets',
    scale: '940 km (Ceres) – 2,377 km (Pluto)',
    category: 'Solar System Objects',
    visual: 'dwarf',
    color: '#e2e8f0',
    description: 'Ceres in the Asteroid Belt, plus Pluto (+ Charon), Haumea, Makemake, and Eris in the Kuiper Belt and Scattered Disc—icy worlds rich in volatiles and rare metals.',
    feasibility: 'Strategic deep-space refueling hubs and outer-system relay stations.',
  },
  {
    id: 'asteroids',
    title: '3. Asteroids (Main Belt & NEAs)',
    scale: '10 m – 525 km (Vesta)',
    category: 'Solar System Objects',
    visual: 'asteroids',
    color: '#f59e0b',
    description: 'Millions of rocky and metallic remnants between Mars and Jupiter, packed with platinum-group metals, iron, nickel, and hydrated minerals for zero-gravity ISRU mining.',
    feasibility: 'Unlocks self-sustaining off-world manufacturing without Earth launch costs.',
  },
  {
    id: 'comets',
    title: '4. Comets & Other Objects',
    scale: '1 km – 100 km Nuclei (Tails > 100M km)',
    category: 'Solar System Objects',
    visual: 'comets',
    color: '#38bdf8',
    description: 'Icy wanderers like Halley’s Comet, Centaurs, Kuiper Belt objects, and interstellar visitors like 1I/\'Oumuamua and 2I/Borisov passing through our Solar System.',
    feasibility: 'Rich reservoirs of water ice, organics, and interstellar material samples.',
  },
  {
    id: 'oort',
    title: '5. The Oort Cloud',
    scale: '2,000 – 100,000 AU (~1.5 LY)',
    category: 'Solar System Objects',
    visual: 'oort',
    color: '#38bdf8',
    description: 'A vast hollow spherical shell of trillions of icy planetesimals and long-period comets surrounding the Sun, marking the outer gravitational boundary of our Solar System.',
    feasibility: 'Kardashev Type I–II · Cryo-fuel staging zone for interstellar launches.',
  },
  {
    id: 'interstellar',
    title: '6. Interstellar Space & Nearby Star Systems',
    scale: '4.2 – 50 Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'stars',
    color: '#fbbf24',
    description: 'The Local Interstellar Cloud containing Alpha/Proxima Centauri, Barnard’s Star, Sirius, Tau Ceti, and TRAPPIST-1—humanity’s first extrasolar frontier.',
    feasibility: 'Reachable in 20–200 years via fusion drives and laser-sail probes.',
  },
  {
    id: 'milkyway',
    title: '7. Milky Way Galaxy',
    scale: '105,700 Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'galaxy',
    color: '#60a5fa',
    description: 'Our barred spiral galaxy hosting 100–400 billion stars, massive nebulae, and the supermassive black hole Sagittarius A* at its core.',
    feasibility: 'Kardashev Type II–III · Colonizable over millions of years via Von Neumann waves.',
  },
  {
    id: 'localgroup',
    title: '8. The Local Group',
    scale: '10 Million Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'localgroup',
    color: '#818cf8',
    description: 'A gravitationally bound family of 80+ galaxies led by the Milky Way, Andromeda (M31), and Triangulum—the largest structure humanity can permanently keep.',
    feasibility: 'Gravitationally bound forever against dark energy expansion.',
  },
  {
    id: 'virgo',
    title: '9. Virgo Supercluster Region',
    scale: '110 Million Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'virgo',
    color: '#a78bfa',
    description: 'A colossal concentration of over 100 galaxy groups and clusters centered on the massive Virgo Cluster.',
    feasibility: 'Requires relativistic intergalactic transit before dark energy separates clusters.',
  },
  {
    id: 'laniakea',
    title: '10. Laniakea Supercluster',
    scale: '520 Million Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'laniakea',
    color: '#c084fc',
    description: 'Our home supercluster ("Immeasurable Heaven"), containing ~100,000 galaxies flowing along gravitational rivers toward the Great Attractor.',
    feasibility: 'Kardashev Type III+ · Macro-scale intergalactic horizon.',
  },
  {
    id: 'cosmicweb',
    title: '11. The Cosmic Web',
    scale: '1 – 10 Billion Light-Years',
    category: 'Galactic & Superclusters',
    visual: 'web',
    color: '#e879f9',
    description: 'The largest known structure in nature: vast dark-matter filaments of galaxies woven around immense cosmic voids.',
    feasibility: 'Mostly beyond causal reach due to accelerating cosmic expansion.',
  },
  {
    id: 'observable',
    title: '12. Observable Universe',
    scale: '93 Billion Light-Years Diameter',
    category: 'Cosmology & Multiverse',
    visual: 'observable',
    color: '#22d3ee',
    description: 'The spherical boundary (46.6 B LY radius) from which light has had time to reach Earth since the Big Bang, containing ~2 trillion galaxies.',
    feasibility: 'Hard physical limit: Only ~16 B LY (Cosmic Event Horizon) is ever reachable at light speed.',
  },
  {
    id: 'beyondhorizon',
    title: '13. Beyond Our Observable Universe Horizon',
    scale: '> 93 Billion Light-Years (Unobservable)',
    category: 'Cosmology & Multiverse',
    visual: 'beyondhorizon',
    color: '#f59e0b',
    description: 'Spacetime continuing past our light cone, receding faster than c. Cosmic flatness measurements suggest the whole universe is vastly larger—or infinite.',
    feasibility: 'Causally disconnected under standard General Relativity.',
  },
  {
    id: 'blackhole',
    title: '14. Black Hole Cosmology',
    scale: 'Event Horizon / Singularity',
    category: 'Cosmology & Multiverse',
    visual: 'blackhole',
    color: '#fb923c',
    description: 'Proposes that every black hole’s interior could bud a new spacetime universe (Cosmological Natural Selection), or that our universe exists inside a higher-dimensional black hole.',
    feasibility: 'Extreme spacetime curvature, relativistic jets & Penrose energy extraction.',
  },
  {
    id: 'bigbounce',
    title: '15. Big Bounce Universe',
    scale: 'Cyclic Quantum Spacetime',
    category: 'Cosmology & Multiverse',
    visual: 'bounce',
    color: '#f43f5e',
    description: 'Loop Quantum Cosmology model where a collapsing prior universe rebounds at Planck density into a new Big Bang—an eternal cycle of expansion and contraction.',
    feasibility: 'Eliminates the classical Big Bang singularity.',
  },
  {
    id: 'multiverse',
    title: '16. The Multiverse (Overview)',
    scale: 'Ensemble of Universes',
    category: 'Cosmology & Multiverse',
    visual: 'multiverse',
    color: '#38bdf8',
    description: 'The overarching cosmological framework suggesting our universe is one of many—ranging from pocket bubbles and quantum branches to higher-dimensional branes.',
    feasibility: 'Theoretical frontier uniting quantum mechanics, inflation & string theory.',
  },
  {
    id: 'bubbles',
    title: '17. Inflationary / Bubble Multiverse',
    scale: 'Eternal Inflation (Level II)',
    category: 'Cosmology & Multiverse',
    visual: 'bubbles',
    color: '#0ea5e9',
    description: 'Eternal cosmic inflation continuously spawns infinite pocket "bubble universes" in an inflating field, each with potentially different physical constants.',
    feasibility: 'Pocket universes separated by exponentially expanding space.',
  },
  {
    id: 'quantum',
    title: '18. Quantum Multiverse (Many-Worlds)',
    scale: 'Hilbert Space (Level III)',
    category: 'Cosmology & Multiverse',
    visual: 'quantum',
    color: '#34d399',
    description: 'Hugh Everett’s interpretation of quantum mechanics: every quantum measurement branches reality into parallel, non-interacting timelines.',
    feasibility: 'Coexists in the same spacetime via quantum superposition.',
  },
  {
    id: 'brane',
    title: '19. Brane Multiverse (M-Theory)',
    scale: '11-Dimensional Bulk',
    category: 'Cosmology & Multiverse',
    visual: 'brane',
    color: '#a78bfa',
    description: 'String/M-Theory model where our 3D universe is a membrane ("brane") floating in a higher-dimensional bulk alongside parallel branes; collisions may spark Big Bangs.',
    feasibility: 'Gravity may leak across bulk dimensions.',
  },
  {
    id: 'math',
    title: '20. Mathematical Multiverse (Level IV)',
    scale: 'All Mathematical Structures',
    category: 'Cosmology & Multiverse',
    visual: 'math',
    color: '#facc15',
    description: 'Max Tegmark’s Mathematical Universe Hypothesis: every consistent mathematical structure exists physically as its own universe with its own laws of math and physics.',
    feasibility: 'Ultimate ensemble of all computable realities.',
  },
  {
    id: 'ultimate',
    title: '21. The Ultimate Scale · The Whole Journey',
    scale: 'Planck Length (10⁻³⁵ m) → Multiverse',
    category: 'Cosmology & Multiverse',
    visual: 'ultimate',
    color: '#38bdf8',
    description: 'The complete unbroken ladder of existence—from moons, dwarf planets, asteroids, comets, Oort Cloud, Milky Way, and Laniakea all the way to the Observable Universe and Multiverse.',
    feasibility: 'Maps humanity’s trajectory from Kardashev Type 0.73 to cosmic comprehension.',
  },
  {
    id: 'beyond',
    title: '22. What Lies Beyond the Multiverse',
    scale: 'Meta-Reality / Pure Information',
    category: 'Cosmology & Multiverse',
    visual: 'beyond',
    color: '#f8fafc',
    description: 'Beyond all physical and mathematical multiverses lies the ultimate question of existence: an underlying informational substrate, timeless meta-logic, or why anything exists at all.',
    feasibility: 'The final philosophical & scientific horizon of human curiosity.',
  },
];

function SpiralPoints({ count = 5500, radiusMax = 10, colorA = '#fde047', colorB = '#38bdf8' }: { count?: number; radiusMax?: number; colorA?: string; colorB?: string }) {
  const coreGlow = useMemo(() => getGlowTexture('rgba(254,240,138,0.95)', 'rgba(245,158,11,0.18)'), []);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color(colorA);
    const c2 = new THREE.Color(colorB);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * radiusMax;
      const spin = r * 0.65;
      const branch = ((i % 4) / 4) * Math.PI * 2;
      pos[i * 3] = Math.cos(branch + spin) * r + (Math.random() - 0.5) * (0.35 + r * 0.12);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.55;
      pos[i * 3 + 2] = Math.sin(branch + spin) * r + (Math.random() - 0.5) * (0.35 + r * 0.12);
      const mixed = c1.clone().lerp(c2, r / radiusMax);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { positions: pos, colors: col };
  }, [count, radiusMax, colorA, colorB]);

  return (
    <group>
      <sprite scale={[radiusMax * 0.65, radiusMax * 0.65, 1]}>
        <spriteMaterial map={coreGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.13} vertexColors transparent opacity={0.92} depthWrite={false} />
      </points>
    </group>
  );
}

function DynamicCosmicMesh({ visual, color }: { visual: CosmicStage['visual']; color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const jupiterTex = useMemo(() => getPlanetTexture('jupiter', '#d97706'), []);
  const plutoTex = useMemo(() => getPlanetTexture('pluto', '#d6d3d1'), []);
  const erisTex = useMemo(() => getPlanetTexture('eris', '#e2e8f0'), []);
  const ringTex = useMemo(() => getRingTexture(), []);
  const cyanGlow = useMemo(() => getGlowTexture('rgba(224,242,254,0.95)', 'rgba(56,189,248,0.22)'), []);
  const goldGlow = useMemo(() => getGlowTexture('rgba(255,250,210,1)', 'rgba(245,158,11,0.32)'), []);
  const violetGlow = useMemo(() => getGlowTexture('rgba(233,213,255,0.9)', 'rgba(168,85,247,0.25)'), []);

  const oortPositions = useMemo(() => {
    const pos = new Float32Array(3600 * 3);
    for (let i = 0; i < 3600; i++) {
      const r = 7.5 + Math.random() * 3.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const asteroidPositions = useMemo(() => {
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4.6 + Math.random() * 5.2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, []);

  const webNodes = useMemo(() => {
    const nodes: [number, number, number][] = [];
    for (let i = 0; i < 28; i++) {
      nodes.push([
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 16,
      ]);
    }
    return nodes;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.16;
    }
    if (pulseRef.current && visual === 'bounce') {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.42;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  if (visual === 'moons') {
    return (
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[2.7, 48, 48]} />
          <meshStandardMaterial map={jupiterTex} roughness={0.65} />
        </mesh>
        {[
          { r: 4.6, size: 0.45, c: '#fde047' },
          { r: 6.4, size: 0.58, c: '#38bdf8' },
          { r: 8.5, size: 0.72, c: '#cbd5e1' },
        ].map((m, i) => (
          <group key={i} rotation={[0, i * 2.1, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[m.r - 0.03, m.r + 0.03, 64]} />
              <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.25} />
            </mesh>
            <mesh position={[m.r, 0, 0]}>
              <sphereGeometry args={[m.size, 24, 24]} />
              <meshStandardMaterial color={m.c} roughness={0.65} />
            </mesh>
            <sprite position={[m.r, 0, 0]} scale={[m.size * 3.2, m.size * 3.2, 1]}>
              <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.45} />
            </sprite>
          </group>
        ))}
      </group>
    );
  }

  if (visual === 'dwarf') {
    return (
      <group ref={groupRef}>
        {/* Pluto */}
        <mesh position={[-5.2, 0.3, 0]}>
          <sphereGeometry args={[1.45, 36, 36]} />
          <meshStandardMaterial map={plutoTex} roughness={0.75} />
        </mesh>
        {/* Haumea with Ring */}
        <group position={[0, 0, 0]}>
          <mesh scale={[1.3, 0.85, 0.9]}>
            <sphereGeometry args={[1.15, 32, 32]} />
            <meshStandardMaterial map={erisTex} roughness={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
            <ringGeometry args={[1.8, 2.7, 64]} />
            <meshStandardMaterial map={ringTex} side={THREE.DoubleSide} transparent opacity={0.75} />
          </mesh>
        </group>
        {/* Eris */}
        <mesh position={[5.4, -0.4, 0.5]}>
          <sphereGeometry args={[1.4, 36, 36]} />
          <meshStandardMaterial map={erisTex} roughness={0.65} />
        </mesh>
      </group>
    );
  }

  if (visual === 'asteroids') {
    return (
      <group ref={groupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[asteroidPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.18} color="#d6d3d1" transparent opacity={0.85} />
        </points>
        <mesh scale={[1.4, 0.95, 1.1]}>
          <dodecahedronGeometry args={[2.0, 1]} />
          <meshStandardMaterial map={plutoTex} roughness={0.9} metalness={0.25} />
        </mesh>
        <sprite scale={[7, 7, 1]}>
          <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.25} />
        </sprite>
      </group>
    );
  }

  if (visual === 'comets') {
    return (
      <group ref={groupRef}>
        <mesh position={[3.2, 0, 0]}>
          <dodecahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.5} />
        </mesh>
        <sprite position={[3.2, 0, 0]} scale={[5.5, 5.5, 1]}>
          <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </sprite>
        {/* Inner Ion Tail */}
        <mesh position={[-3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[1.1, 12.5, 24, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Outer Dust Tail */}
        <mesh position={[-3.5, 0.5, 0]} rotation={[0, 0, Math.PI / 2.08]}>
          <coneGeometry args={[2.1, 13.5, 24, 1, true]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.16} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (visual === 'oort') {
    return (
      <group ref={groupRef}>
        <sprite scale={[6.5, 6.5, 1]}>
          <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </sprite>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[oortPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.14} color="#7dd3fc" transparent opacity={0.8} />
        </points>
      </group>
    );
  }

  if (visual === 'stars') {
    const starCoords: [number, number, number][] = [
      [0, 0, 0], [4.5, 2, -2], [-5.2, 1, 3], [6.2, -3, 4], [-3.2, -4, -5], [2.4, 5, 3], [-6.2, 3, -4],
    ];
    return (
      <group ref={groupRef}>
        {starCoords.map((pos, i) => (
          <group key={i}>
            <sprite position={pos} scale={[i === 0 ? 4.2 : 2.6, i === 0 ? 4.2 : 2.6, 1]}>
              <spriteMaterial map={i === 0 ? goldGlow : cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
            </sprite>
            {i > 0 && <Line points={[[0, 0, 0], pos]} color="#38bdf8" lineWidth={1.3} dashed dashSize={0.45} gapSize={0.3} />}
          </group>
        ))}
      </group>
    );
  }

  if (visual === 'galaxy') {
    return (
      <group ref={groupRef}>
        <SpiralPoints count={7500} radiusMax={11.5} colorA="#fde047" colorB="#38bdf8" />
      </group>
    );
  }

  if (visual === 'localgroup') {
    return (
      <group ref={groupRef}>
        <group position={[-4.8, 0, 1]} rotation={[0.3, 0, 0.2]}>
          <SpiralPoints count={2600} radiusMax={4.4} colorA="#fde047" colorB="#60a5fa" />
        </group>
        <group position={[5.2, 1.5, -2]} rotation={[-0.4, 0.2, -0.3]}>
          <SpiralPoints count={3000} radiusMax={5.4} colorA="#f9a8d4" colorB="#818cf8" />
        </group>
        <group position={[0.5, -3.5, 4]} rotation={[0.6, 0, 0.4]}>
          <SpiralPoints count={1400} radiusMax={2.6} colorA="#6ee7b7" colorB="#38bdf8" />
        </group>
      </group>
    );
  }

  if (visual === 'virgo' || visual === 'laniakea' || visual === 'web') {
    return (
      <group ref={groupRef}>
        {webNodes.map((node, i) => {
          const next = webNodes[(i + 1) % webNodes.length];
          const anchor: [number, number, number] = visual === 'laniakea' ? [0, 0, 0] : webNodes[(i + 3) % webNodes.length];
          return (
            <group key={i}>
              <sprite position={node} scale={[1.8, 1.8, 1]}>
                <spriteMaterial map={violetGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
              </sprite>
              <Line points={[node, next]} color={color} lineWidth={1.3} transparent opacity={0.5} />
              <Line points={[node, anchor]} color="#38bdf8" lineWidth={0.9} transparent opacity={0.32} />
            </group>
          );
        })}
        {visual === 'laniakea' && (
          <sprite scale={[7.5, 7.5, 1]}>
            <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
          </sprite>
        )}
      </group>
    );
  }

  if (visual === 'observable' || visual === 'beyondhorizon') {
    return (
      <group ref={groupRef}>
        <sprite scale={[12, 12, 1]}>
          <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.35} />
        </sprite>
        <mesh>
          <sphereGeometry args={[3.6, 28, 28]} />
          <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.45} />
        </mesh>
        <mesh>
          <sphereGeometry args={[7.6, 32, 32]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.32} />
        </mesh>
        {visual === 'beyondhorizon' && (
          <mesh>
            <sphereGeometry args={[12.2, 24, 24]} />
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.22} />
          </mesh>
        )}
      </group>
    );
  }

  if (visual === 'blackhole') {
    return (
      <group ref={groupRef}>
        {/* Pitch-Black Event Horizon */}
        <mesh>
          <sphereGeometry args={[2.9, 40, 40]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Fiery Photon Ring Halo */}
        <sprite scale={[10.5, 10.5, 1]}>
          <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.65} />
        </sprite>
        {/* Tilted Glowing Accretion Disk */}
        <mesh rotation={[Math.PI / 2.25, 0.2, 0]}>
          <ringGeometry args={[3.2, 9.2, 64]} />
          <meshBasicMaterial map={ringTex} color="#fb923c" side={THREE.DoubleSide} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Gravitationally Lensed Vertical Ring */}
        <mesh rotation={[0.1, 0, 0]}>
          <ringGeometry args={[2.95, 3.65, 64]} />
          <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* Relativistic Polar Jets */}
        <mesh position={[0, 7.2, 0]}>
          <coneGeometry args={[1.0, 11, 20, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.38} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, -7.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[1.0, 11, 20, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.38} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    );
  }

  if (visual === 'bounce') {
    return (
      <group ref={groupRef}>
        <mesh ref={pulseRef}>
          <icosahedronGeometry args={[5.5, 2]} />
          <meshBasicMaterial color="#f43f5e" wireframe transparent opacity={0.6} />
        </mesh>
        <sprite scale={[8.5, 8.5, 1]}>
          <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </sprite>
      </group>
    );
  }

  if (visual === 'bubbles' || visual === 'multiverse') {
    const bubbles: [number, number, number, number, string][] = [
      [0, 0, 0, 3.1, '#38bdf8'],
      [-6.2, 2.5, -2, 2.2, '#a78bfa'],
      [6.5, -2, 1.5, 2.6, '#34d399'],
      [2, 5.5, -3, 1.9, '#fbbf24'],
      [-4, -5, 3, 2.1, '#f43f5e'],
      [5, 4.2, 4, 1.7, '#22d3ee'],
    ];
    return (
      <group ref={groupRef}>
        {bubbles.map(([x, y, z, r, c], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[r, 28, 28]} />
              <meshPhysicalMaterial color={c} transparent opacity={0.28} roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh>
              <sphereGeometry args={[r * 1.01, 20, 20]} />
              <meshBasicMaterial color={c} wireframe transparent opacity={0.35} />
            </mesh>
            <sprite scale={[r * 1.6, r * 1.6, 1]}>
              <spriteMaterial map={i % 2 === 0 ? cyanGlow : violetGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.75} />
            </sprite>
          </group>
        ))}
      </group>
    );
  }

  if (visual === 'quantum') {
    return (
      <group ref={groupRef}>
        {[0, 0.6, 1.2, 1.8, 2.4].map((rot, i) => (
          <mesh key={i} rotation={[rot, rot * 0.7, 0]}>
            <torusGeometry args={[6.2, 0.08, 16, 100]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#34d399' : '#38bdf8'} transparent opacity={0.8} />
          </mesh>
        ))}
        <sprite scale={[7.5, 7.5, 1]}>
          <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </sprite>
      </group>
    );
  }

  if (visual === 'brane') {
    return (
      <group ref={groupRef}>
        {[-4.2, -1.4, 1.4, 4.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 14, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#a78bfa' : '#38bdf8'} wireframe transparent opacity={0.65} />
          </mesh>
        ))}
        <sprite scale={[10, 10, 1]}>
          <spriteMaterial map={violetGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.5} />
        </sprite>
      </group>
    );
  }

  if (visual === 'math') {
    return (
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[6.2, 1]} />
          <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.65} />
        </mesh>
        <mesh>
          <dodecahedronGeometry args={[3.8, 0]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.8} />
        </mesh>
        <sprite scale={[7, 7, 1]}>
          <spriteMaterial map={goldGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.6} />
        </sprite>
      </group>
    );
  }

  if (visual === 'ultimate') {
    return (
      <group ref={groupRef}>
        {[1.6, 3.2, 5.0, 7.0, 9.4].map((r, i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.25, i * 0.3, 0]}>
            <torusGeometry args={[r, 0.08, 16, 100]} />
            <meshBasicMaterial color={['#fbbf24', '#38bdf8', '#a78bfa', '#34d399', '#f43f5e'][i]} />
          </mesh>
        ))}
        <sprite scale={[8, 8, 1]}>
          <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
        </sprite>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh>
        <torusKnotGeometry args={[4.5, 0.55, 140, 24]} />
        <meshBasicMaterial color="#f8fafc" wireframe transparent opacity={0.5} />
      </mesh>
      <sprite scale={[12, 12, 1]}>
        <spriteMaterial map={cyanGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

export function CosmicHorizonView() {
  const [stageIdx, setStageIdx] = useState(0);
  const stage = COSMIC_STAGES[stageIdx];

  return (
    <div className="relative h-full w-full bg-[#020510]">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 9, 24], fov: 45 }}>
        <color attach="background" args={['#020510']} />
        <ambientLight intensity={0.65} />
        <pointLight position={[14, 14, 14]} intensity={1.8} />
        <Stars radius={120} depth={50} count={4500} factor={3.5} saturation={0.3} fade speed={0.4} />
        <DynamicCosmicMesh visual={stage.visual} color={stage.color} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={8} maxDistance={48} />
      </Canvas>

      {/* Left 22-Stage Direct Jump Menu (Premium Glass UI) */}
      <aside className="pointer-events-auto fixed top-24 left-4 bottom-24 w-72 flex flex-col rounded-2xl border border-white/10 bg-slate-950/75 p-3.5 shadow-[0_0_40px_rgba(0,0,0,0.65)] backdrop-blur-xl z-20 hidden md:flex">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5 px-1">
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">
            <Layers className="h-3.5 w-3.5" /> Cosmic Scale ({COSMIC_STAGES.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {stageIdx + 1}/{COSMIC_STAGES.length}
          </span>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {COSMIC_STAGES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setStageIdx(idx)}
              className={`w-full rounded-xl px-3 py-2 text-left text-[11px] transition-all truncate ${
                idx === stageIdx
                  ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/20 border border-cyan-400/50 text-white font-semibold shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Right Stage Info Card (Premium Glass UI) */}
      <div className="pointer-events-auto fixed top-24 right-4 w-80 md:w-96 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 shadow-[0_0_45px_rgba(0,0,0,0.7)] backdrop-blur-xl z-20">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400" />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
              {stage.category}
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-400">
              STAGE {stageIdx + 1} / {COSMIC_STAGES.length}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            {stage.title}
          </h2>
          <p className="text-xs font-mono text-cyan-300 mt-1">Scale: {stage.scale}</p>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">{stage.description}</p>

          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-950/30 p-3 text-[11px] font-mono text-emerald-300 flex items-start gap-2">
            <Compass className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{stage.feasibility}</span>
          </div>
        </div>
      </div>

      {/* Bottom Slider Controls */}
      <div className="pointer-events-auto fixed bottom-4 left-4 right-4 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.7)] backdrop-blur-xl z-20">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setStageIdx((i) => Math.max(0, i - 1))}
            disabled={stageIdx === 0}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-35 hover:border-cyan-400/60 hover:bg-white/10 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>

          <input
            type="range"
            min={0}
            max={COSMIC_STAGES.length - 1}
            value={stageIdx}
            onChange={(e) => setStageIdx(Number(e.target.value))}
            className="flex-1 accent-cyan-400 cursor-pointer"
          />

          <button
            onClick={() => setStageIdx((i) => Math.min(COSMIC_STAGES.length - 1, i + 1))}
            disabled={stageIdx === COSMIC_STAGES.length - 1}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-35 hover:brightness-110 transition"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <CuriosityPanel
        topic={stage.title}
        context={`Scale: ${stage.scale}. ${stage.description}`}
      />
    </div>
  );
}