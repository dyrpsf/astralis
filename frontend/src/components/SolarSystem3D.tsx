import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore, type PlanetData, type MoonData } from '../store/useSimulationStore';
import { getPlanetTexture, getGlowTexture, getRingTexture } from '../utils/planetTextures';

const planetPositions: Record<string, THREE.Vector3> = {};

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  return <Line points={points} color="#38bdf8" lineWidth={0.75} transparent opacity={0.18} />;
}

function SunWithCorona() {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Sprite>(null);
  const auraRef = useRef<THREE.Sprite>(null);

  const sunTex = useMemo(() => getPlanetTexture('sun', '#fbbf24'), []);
  const coreGlow = useMemo(() => getGlowTexture('rgba(255,255,230,1)', 'rgba(254,240,138,0.65)'), []);
  const innerCorona = useMemo(() => getGlowTexture('rgba(251,191,36,0.85)', 'rgba(249,115,22,0.35)'), []);
  const outerAura = useMemo(() => getGlowTexture('rgba(245,158,11,0.45)', 'rgba(234,88,12,0.08)'), []);
  const deepHalo = useMemo(() => getGlowTexture('rgba(251,146,60,0.22)', 'rgba(124,45,18,0.0)'), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (sunRef.current) sunRef.current.rotation.y += delta * 0.1;
    if (coronaRef.current) {
      const s = 18 + Math.sin(t * 2.2) * 1.1;
      coronaRef.current.scale.set(s, s, 1);
    }
    if (auraRef.current) {
      const s = 34 + Math.cos(t * 1.4) * 2.0;
      auraRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      {/* Boiling Solar Photosphere */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[3.7, 48, 48]} />
        <meshBasicMaterial map={sunTex} />
      </mesh>
      {/* Layer 1: Blinding White-Gold Core Glow */}
      <sprite scale={[11.5, 11.5, 1]}>
        <spriteMaterial map={coreGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      {/* Layer 2: Pulsing Fiery Corona */}
      <sprite ref={coronaRef} scale={[18, 18, 1]}>
        <spriteMaterial map={innerCorona} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      {/* Layer 3: Wide Golden Solar Aura */}
      <sprite ref={auraRef} scale={[34, 34, 1]}>
        <spriteMaterial map={outerAura} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      {/* Layer 4: Deep Space Ambient Solar Bloom */}
      <sprite scale={[56, 56, 1]}>
        <spriteMaterial map={deepHalo} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function MoonMesh({ moon }: { moon: MoonData }) {
  const moonRef = useRef<THREE.Group>(null);
  const speed = useSimulationStore((s) => s.speed);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (moonRef.current) {
      angleRef.current += delta * moon.orbitSpeed * (speed === 0 ? 0 : Math.min(speed, 10) * 0.35);
      moonRef.current.position.x = Math.cos(angleRef.current) * moon.orbitRadius;
      moonRef.current.position.z = Math.sin(angleRef.current) * moon.orbitRadius;
    }
  });

  return (
    <group ref={moonRef}>
      <mesh>
        <sphereGeometry args={[moon.radius, 16, 16]} />
        <meshStandardMaterial color={moon.color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function AnimatedCargoPulse({ fromId, toId }: { fromId: string; toId: string }) {
  const shipRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(Math.random());

  useFrame((_, delta) => {
    const start = planetPositions[fromId];
    const end = planetPositions[toId];
    if (!start || !end || !shipRef.current) return;

    tRef.current = (tRef.current + delta * 0.25) % 1;
    const t = tRef.current;
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += 6;

    const inv = 1 - t;
    const x = inv * inv * start.x + 2 * inv * t * mid.x + t * t * end.x;
    const y = inv * inv * start.y + 2 * inv * t * mid.y + t * t * end.y;
    const z = inv * inv * start.z + 2 * inv * t * mid.z + t * t * end.z;
    shipRef.current.position.set(x, y, z);
  });

  return (
    <mesh ref={shipRef}>
      <sphereGeometry args={[0.24, 12, 12]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

function TradeArcs() {
  const routes = useSimulationStore((s) => s.routes);
  return (
    <group>
      {routes.map((route) => {
        const start = planetPositions[route.fromId];
        const end = planetPositions[route.toId];
        if (!start || !end) return null;
        const mid = start.clone().add(end).multiplyScalar(0.5);
        mid.y += 6;
        return (
          <group key={route.id}>
            <QuadraticBezierLine
              start={[start.x, start.y, start.z]}
              end={[end.x, end.y, end.z]}
              mid={[mid.x, mid.y, mid.z]}
              color="#38bdf8"
              lineWidth={1.8}
              dashed
              dashSize={0.6}
              gapSize={0.35}
            />
            <AnimatedCargoPulse fromId={route.fromId} toId={route.toId} />
          </group>
        );
      })}
    </group>
  );
}

function ParticleBelt({ inner, outer, count, color, size }: { inner: number; outer: number; count: number; color: string; size: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = inner + Math.random() * (outer - inner);
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [inner, outer, count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.7} />
    </points>
  );
}

function HalleyComet() {
  const groupRef = useRef<THREE.Group>(null);
  const speed = useSimulationStore((s) => s.speed);
  const angleRef = useRef(0.6);
  const glowTex = useMemo(() => getGlowTexture('rgba(224,242,254,0.95)', 'rgba(56,189,248,0.25)'), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      angleRef.current += delta * 0.22 * (speed === 0 ? 0 : Math.min(speed, 10) * 0.4);
      const x = Math.cos(angleRef.current) * 44 - 16;
      const z = Math.sin(angleRef.current) * 25;
      const y = Math.sin(angleRef.current) * 7;
      groupRef.current.position.set(x, y, z);
      groupRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#f0f9ff" />
      </mesh>
      <sprite scale={[2.6, 2.6, 1]}>
        <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      <mesh position={[0, 0, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.65, 7.0, 16, 1, true]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.26} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html distanceFactor={55} position={[0, 1.0, 0]} center>
        <div className="rounded-md bg-sky-950/85 border border-sky-400/40 px-2 py-0.5 text-[10px] font-mono text-sky-200 whitespace-nowrap backdrop-blur-md">
          Halley's Comet
        </div>
      </Html>
    </group>
  );
}

function OumuamuaVisitor() {
  const ref = useRef<THREE.Group>(null);
  const speed = useSimulationStore((s) => s.speed);
  const tRef = useRef(-35);

  useFrame((_, delta) => {
    if (ref.current) {
      tRef.current += delta * 1.4 * (speed === 0 ? 0 : Math.min(speed, 10) * 0.3);
      if (tRef.current > 55) tRef.current = -55;
      ref.current.position.set(tRef.current, 12 + Math.sin(tRef.current * 0.08) * 4, -22 + tRef.current * 0.35);
      ref.current.rotation.x += delta * 1.2;
      ref.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group ref={ref}>
      <mesh scale={[1.2, 0.25, 0.25]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#f87171" roughness={0.8} />
      </mesh>
      <Html distanceFactor={55} position={[0, 0.9, 0]} center>
        <div className="rounded-md bg-rose-950/85 border border-rose-400/40 px-2 py-0.5 text-[10px] font-mono text-rose-200 whitespace-nowrap backdrop-blur-md">
          1I/'Oumuamua
        </div>
      </Html>
    </group>
  );
}

function OortCloud() {
  const positions = useMemo(() => {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 108 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.25} color="#64748b" transparent opacity={0.42} />
    </points>
  );
}

function PlanetMesh({ planet }: { planet: PlanetData }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const speed = useSimulationStore((s) => s.speed);
  const selectedPlanetId = useSimulationStore((s) => s.selectedPlanetId);
  const activeCrisis = useSimulationStore((s) => s.activeCrisis);
  const selectPlanet = useSimulationStore((s) => s.selectPlanet);

  const isSelected = selectedPlanetId === planet.id;
  const hasCrisis = activeCrisis?.planetId === planet.id;
  const angleRef = useRef(planet.orbitRadius * 0.55);

  const surfaceTex = useMemo(() => getPlanetTexture(planet.id, planet.color), [planet.id, planet.color]);
  const ringTex = useMemo(() => getRingTexture(), []);
  const hasAtmo = ['earth', 'venus', 'mars', 'jupiter', 'neptune', 'uranus'].includes(planet.id);

  useFrame((_, delta) => {
    if (groupRef.current) {
      angleRef.current += delta * planet.orbitSpeed * (speed === 0 ? 0 : Math.min(speed, 10) * 0.3);
      const x = Math.cos(angleRef.current) * planet.orbitRadius;
      const z = Math.sin(angleRef.current) * planet.orbitRadius;
      groupRef.current.position.set(x, 0, z);
      planetPositions[planet.id] = new THREE.Vector3(x, 0, z);
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          selectPlanet(planet.id);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[planet.radius, 40, 40]} />
        <meshStandardMaterial
          map={surfaceTex}
          roughness={0.68}
          metalness={0.12}
          emissive={hasCrisis ? '#ef4444' : isSelected ? planet.color : '#000000'}
          emissiveIntensity={hasCrisis ? 0.55 : isSelected ? 0.25 : 0}
        />
      </mesh>

      {hasAtmo && (
        <mesh>
          <sphereGeometry args={[planet.radius * 1.09, 32, 32]} />
          <meshBasicMaterial
            color={planet.id === 'earth' ? '#38bdf8' : planet.color}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {planet.hasRings && (
        <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[planet.radius + 0.45, planet.radius + 1.85, 64]} />
          <meshStandardMaterial map={ringTex} side={THREE.DoubleSide} transparent opacity={0.88} />
        </mesh>
      )}

      {planet.colonized && planet.id !== 'earth' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.radius + 0.3, planet.radius + 0.42, 32]} />
          <meshBasicMaterial color={hasCrisis ? '#ef4444' : '#22d3ee'} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      )}

      {planet.moons?.map((moon) => (
        <MoonMesh key={moon.id} moon={moon} />
      ))}

      <Html distanceFactor={52} position={[0, planet.radius + 1.0, 0]} center>
        <button
          onClick={() => selectPlanet(planet.id)}
          className={`px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider whitespace-nowrap border backdrop-blur-md transition-all ${
            hasCrisis
              ? 'bg-red-500/30 border-red-400 text-red-100 animate-pulse'
              : isSelected
              ? 'bg-cyan-500/30 border-cyan-400 text-white scale-110 shadow-lg shadow-cyan-500/25'
              : 'bg-slate-950/75 border-white/10 text-slate-300 hover:border-cyan-400/60 hover:text-white'
          }`}
        >
          {planet.name} {hasCrisis ? '⚠' : planet.colonized && planet.id !== 'earth' ? '●' : ''}
        </button>
      </Html>
    </group>
  );
}

export function SolarSystem3D() {
  const planets = useSimulationStore((s) => s.planets);
  const selectPlanet = useSimulationStore((s) => s.selectPlanet);

  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 44, 80], fov: 44 }}
        onPointerMissed={() => selectPlanet(null)}
      >
        <color attach="background" args={['#020510']} />
        <ambientLight intensity={0.48} />
        <pointLight position={[0, 0, 0]} intensity={4.2} distance={380} decay={0.32} color="#fff7ed" />
        <Stars radius={240} depth={90} count={7000} factor={4} saturation={0.3} fade speed={0.4} />

        <SunWithCorona />

        {planets.map((planet) => (
          <group key={planet.id}>
            <OrbitRing radius={planet.orbitRadius} />
            <PlanetMesh planet={planet} />
          </group>
        ))}

        <ParticleBelt inner={24.5} outer={30.5} count={2200} color="#a8a29e" size={0.14} />
        <ParticleBelt inner={70} outer={96} count={2600} color="#93c5fd" size={0.16} />

        <TradeArcs />
        <HalleyComet />
        <OumuamuaVisitor />
        <OortCloud />

        <OrbitControls enableDamping dampingFactor={0.05} minDistance={8} maxDistance={250} />
      </Canvas>
    </div>
  );
}