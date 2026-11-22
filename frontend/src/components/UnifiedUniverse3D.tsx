import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  useSimulationStore,
  getBodyPosition,
  simClock,
  type CelestialBody,
  type MoonData,
} from '../store/useSimulationStore';
import { getPlanetTexture, getGlowTexture, getRingTexture } from '../utils/planetTextures';

type ZoomTier = 'solar' | 'galaxy' | 'cosmos';

function ClockAndZoomDriver({ onTierChange }: { onTierChange: (t: ZoomTier) => void }) {
  const speed = useSimulationStore((s) => s.speed);
  const { camera } = useThree();
  const lastTierRef = useRef<ZoomTier>('solar');

  useFrame((_, delta) => {
    if (speed > 0) {
      simClock.time += Math.min(delta, 0.05) * speed * 0.35;
    }
    const dist = camera.position.length();
    const nextTier: ZoomTier = dist < 420 ? 'solar' : dist < 2000 ? 'galaxy' : 'cosmos';
    if (nextTier !== lastTierRef.current) {
      lastTierRef.current = nextTier;
      onTierChange(nextTier);
    }
  });

  return null;
}

function CameraController() {
  const { camera } = useThree();
  const target = useSimulationStore((s) => s.cameraTarget);

  useEffect(() => {
    if (target === 'solar') camera.position.set(0, 48, 86);
    if (target === 'galaxy') camera.position.set(0, 280, 460);
    if (target === 'multiverse') camera.position.set(0, 1600, 3100);
  }, [target, camera]);

  return null;
}

function SunWithCorona() {
  const sunRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Sprite>(null);
  const sunTex = useMemo(() => getPlanetTexture('sun', '#fbbf24'), []);
  const coreGlow = useMemo(() => getGlowTexture('rgba(255,255,230,1)', 'rgba(254,240,138,0.65)'), []);
  const innerCorona = useMemo(() => getGlowTexture('rgba(251,191,36,0.85)', 'rgba(249,115,22,0.35)'), []);
  const outerAura = useMemo(() => getGlowTexture('rgba(245,158,11,0.45)', 'rgba(234,88,12,0.06)'), []);

  useFrame((state, delta) => {
    if (sunRef.current) sunRef.current.rotation.y += delta * 0.1;
    if (coronaRef.current) {
      const s = 18 + Math.sin(state.clock.elapsedTime * 2) * 1.2;
      coronaRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[3.7, 36, 36]} />
        <meshBasicMaterial map={sunTex} />
      </mesh>
      <sprite scale={[12, 12, 1]}>
        <spriteMaterial map={coreGlow} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      <sprite ref={coronaRef} scale={[18, 18, 1]}>
        <spriteMaterial map={innerCorona} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
      <sprite scale={[38, 38, 1]}>
        <spriteMaterial map={outerAura} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

function OrbitRing({ radius, color = '#38bdf8', opacity = 0.15 }: { radius: number; color?: string; opacity?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  return <Line points={points} color={color} lineWidth={0.8} transparent opacity={opacity} />;
}

function MoonMesh({ moon }: { moon: MoonData }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      const a = simClock.time * moon.orbitSpeed;
      ref.current.position.set(Math.cos(a) * moon.orbitRadius, 0, Math.sin(a) * moon.orbitRadius);
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[moon.radius, 12, 12]} />
        <meshStandardMaterial color={moon.color} roughness={0.75} />
      </mesh>
    </group>
  );
}

// LAYER 2: MILKY WAY GALAXY (Radius 145 – 340)
function MilkyWayGalaxy() {
  const { positions, colors } = useMemo(() => {
    const count = 7000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color('#fde047');
    const c2 = new THREE.Color('#38bdf8');
    const c3 = new THREE.Color('#a78bfa');

    for (let i = 0; i < count; i++) {
      const r = 145 + Math.random() * 195;
      const spin = r * 0.025;
      const branch = ((i % 4) / 4) * Math.PI * 2;
      pos[i * 3] = Math.cos(branch + spin) * r + (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = Math.sin(branch + spin) * r + (Math.random() - 0.5) * 32;

      const t = (r - 145) / 195;
      const mixed = t < 0.5 ? c1.clone().lerp(c2, t * 2) : c2.clone().lerp(c3, (t - 0.5) * 2);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { positions: pos, colors: col };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.4} vertexColors transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

function DistantSpiralGalaxy({
  position,
  rotation,
  radius,
  colorA,
  colorB,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  colorA: string;
  colorB: string;
}) {
  const glowTex = useMemo(() => getGlowTexture('rgba(255,248,220,0.9)', 'rgba(168,85,247,0.22)'), []);
  const { positions, colors } = useMemo(() => {
    const count = 900;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color(colorA);
    const c2 = new THREE.Color(colorB);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * radius;
      const spin = r * (3.2 / radius);
      const branch = ((i % 3) / 3) * Math.PI * 2;
      pos[i * 3] = Math.cos(branch + spin) * r + (Math.random() - 0.5) * (radius * 0.15);
      pos[i * 3 + 1] = (Math.random() - 0.5) * (radius * 0.08);
      pos[i * 3 + 2] = Math.sin(branch + spin) * r + (Math.random() - 0.5) * (radius * 0.15);
      const mixed = c1.clone().lerp(c2, r / radius);
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }
    return { positions: pos, colors: col };
  }, [radius, colorA, colorB]);

  return (
    <group position={position} rotation={rotation}>
      <sprite scale={[radius * 0.85, radius * 0.85, 1]}>
        <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.7} />
      </sprite>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={2.2} vertexColors transparent opacity={0.8} depthWrite={false} />
      </points>
    </group>
  );
}

// LAYER 3: OTHER GALAXIES & COSMIC WEB (Radius 500 – 1,350, INSIDE our Observable Universe)
function OtherGalaxiesField() {
  const galaxies = useMemo(
    () => [
      { pos: [580, 90, -340] as [number, number, number], rot: [0.4, 0.2, 0.3] as [number, number, number], r: 150, a: '#fef08a', b: '#818cf8' },
      { pos: [-540, -120, 420] as [number, number, number], rot: [-0.5, 0.3, -0.2] as [number, number, number], r: 95, a: '#6ee7b7', b: '#38bdf8' },
      { pos: [260, -240, 780] as [number, number, number], rot: [0.7, -0.4, 0.1] as [number, number, number], r: 115, a: '#f9a8d4', b: '#c084fc' },
      { pos: [-820, 210, -490] as [number, number, number], rot: [0.15, 0.5, 0.8] as [number, number, number], r: 130, a: '#fde047', b: '#fb923c' },
      { pos: [920, -160, 560] as [number, number, number], rot: [-0.3, 0.6, 0.4] as [number, number, number], r: 120, a: '#bae6fd', b: '#60a5fa' },
      { pos: [-420, 480, -860] as [number, number, number], rot: [0.6, 0.1, -0.5] as [number, number, number], r: 110, a: '#e879f9', b: '#818cf8' },
      { pos: [640, 420, 760] as [number, number, number], rot: [-0.4, -0.3, 0.6] as [number, number, number], r: 105, a: '#fde68a', b: '#34d399' },
      { pos: [-960, -320, -260] as [number, number, number], rot: [0.3, 0.8, -0.2] as [number, number, number], r: 125, a: '#fda4af', b: '#a78bfa' },
    ],
    []
  );

  return (
    <group>
      {galaxies.map((g, i) => (
        <group key={i}>
          <DistantSpiralGalaxy position={g.pos} rotation={g.rot} radius={g.r} colorA={g.a} colorB={g.b} />
          <Line
            points={[g.pos, galaxies[(i + 1) % galaxies.length].pos]}
            color="#818cf8"
            lineWidth={0.8}
            transparent
            opacity={0.14}
          />
        </group>
      ))}
    </group>
  );
}

// LAYER 4: OUR OBSERVABLE UNIVERSE HORIZON (Radius 1,550)
function ObservableUniverseShell() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1550, 36, 36]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.12} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1545, 32, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// LAYER 5: OTHER UNIVERSES (INFINITE MULTIVERSE — Starts OUTSIDE our 1,550 Observable Universe!)
function InfiniteMultiverseField() {
  const { camera } = useThree();
  const [tier, setTier] = useState(0);
  const groupRef = useRef<THREE.Group>(null);

  const cyanGlow = useMemo(() => getGlowTexture('rgba(224,242,254,0.95)', 'rgba(56,189,248,0.28)'), []);
  const violetGlow = useMemo(() => getGlowTexture('rgba(233,213,255,0.95)', 'rgba(168,85,247,0.32)'), []);
  const goldGlow = useMemo(() => getGlowTexture('rgba(254,240,138,0.95)', 'rgba(245,158,11,0.28)'), []);

  const baseBubbles = useMemo(() => {
    const list: { dir: [number, number, number]; distMult: number; sizeMult: number; color: string; glowIdx: number }[] = [];
    const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f43f5e', '#22d3ee'];
    for (let i = 0; i < 18; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 18);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      list.push({
        dir: [Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.65, Math.sin(phi) * Math.sin(theta)],
        distMult: 0.85 + (i % 4) * 0.22,
        sizeMult: 0.16 + (i % 3) * 0.05,
        color: palette[i % palette.length],
        glowIdx: i % 3,
      });
    }
    return list;
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.006;
    }
    const camDist = camera.position.length();
    const nextTier = camDist > 2200 ? Math.floor(Math.log2(camDist / 1300)) : 0;
    if (nextTier !== tier) setTier(nextTier);
  });

  // Deduplicated concentric shells (fixes duplicate shell 0 bug)
  const activeShells = tier === 0 ? [0, 1, 2] : [tier - 1, tier, tier + 1, tier + 2];

  return (
    <group ref={groupRef}>
      {activeShells.map((shellIdx) => {
        const shellRadius = 3200 * Math.pow(2.15, shellIdx);
        return (
          <group key={shellIdx}>
            {baseBubbles.map((b, i) => {
              const x = b.dir[0] * shellRadius * b.distMult;
              const y = b.dir[1] * shellRadius * b.distMult;
              const z = b.dir[2] * shellRadius * b.distMult;
              const r = shellRadius * b.sizeMult;
              const glowMap = b.glowIdx === 0 ? cyanGlow : b.glowIdx === 1 ? violetGlow : goldGlow;

              return (
                <group key={`${shellIdx}-${i}`} position={[x, y, z]}>
                  <mesh>
                    <sphereGeometry args={[r, 20, 20]} />
                    <meshBasicMaterial color={b.color} transparent opacity={0.14} depthWrite={false} />
                  </mesh>
                  <mesh>
                    <sphereGeometry args={[r * 1.01, 14, 14]} />
                    <meshBasicMaterial color={b.color} wireframe transparent opacity={0.22} />
                  </mesh>
                  <sprite scale={[r * 1.45, r * 1.45, 1]}>
                    <spriteMaterial map={glowMap} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.85} />
                  </sprite>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function ParticleRing({ inner, outer, count, color, size }: { inner: number; outer: number; count: number; color: string; size: number }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, [inner, outer, count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.55} />
    </points>
  );
}

const MAX_PATH_POINTS = 32;

// Live 60FPS Dynamic Path (Zero-allocation GPU buffer + Constant-speed ship + 150ms live re-routing)
function LiveOrbitalPath() {
  const bodies = useSimulationStore((s) => s.bodies);
  const computedPath = useSimulationStore((s) => s.computedPath);
  const recomputePath = useSimulationStore((s) => s.recomputePath);
  const speed = useSimulationStore((s) => s.speed);

  const shipRef = useRef<THREE.Mesh>(null);
  const distTraveledRef = useRef(0);
  const routeTimerRef = useRef(0);

  // Pre-allocate a single reusable Float32Array on the GPU (eliminates frame lag)
  const { lineObj, posArray, posAttr } = useMemo(() => {
    const arr = new Float32Array(MAX_PATH_POINTS * 3);
    const attr = new THREE.BufferAttribute(arr, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', attr);
    geom.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geom, mat);
    line.frustumCulled = false;
    return { lineObj: line, posArray: arr, posAttr: attr };
  }, []);

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Re-evaluate optimal orbital waypoints every 150ms while planets are moving
    if (speed > 0) {
      routeTimerRef.current += dt;
      if (routeTimerRef.current >= 0.15) {
        routeTimerRef.current = 0;
        recomputePath();
      }
    }

    const pathBodies = computedPath
      .map((id) => bodies.find((b) => b.id === id))
      .filter((b): b is CelestialBody => Boolean(b));

    const count = Math.min(pathBodies.length, MAX_PATH_POINTS);
    if (count < 2) {
      lineObj.geometry.setDrawRange(0, 0);
      return;
    }

    // Write live 60fps coordinates directly into the pre-allocated GPU buffer
    let totalLen = 0;
    const segLengths: number[] = [];

    for (let i = 0; i < count; i++) {
      const [x, y, z] = getBodyPosition(pathBodies[i], simClock.time);
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      if (i > 0) {
        const dx = x - posArray[(i - 1) * 3];
        const dy = y - posArray[(i - 1) * 3 + 1];
        const dz = z - posArray[(i - 1) * 3 + 2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        segLengths.push(len);
        totalLen += len;
      }
    }

    posAttr.needsUpdate = true;
    lineObj.geometry.setDrawRange(0, count);

    // Move delivery spacecraft at a smooth, constant speed along the total path length
    if (shipRef.current && totalLen > 0.01) {
      const shipSpeed = Math.max(18, totalLen * 0.22);
      distTraveledRef.current = (distTraveledRef.current + dt * shipSpeed) % totalLen;

      let accum = 0;
      for (let i = 0; i < segLengths.length; i++) {
        const segLen = segLengths[i];
        if (distTraveledRef.current <= accum + segLen || i === segLengths.length - 1) {
          const t = segLen > 0 ? (distTraveledRef.current - accum) / segLen : 0;
          const ax = posArray[i * 3], ay = posArray[i * 3 + 1], az = posArray[i * 3 + 2];
          const bx = posArray[(i + 1) * 3], by = posArray[(i + 1) * 3 + 1], bz = posArray[(i + 1) * 3 + 2];
          shipRef.current.position.set(
            ax + (bx - ax) * t,
            ay + (by - ay) * t,
            az + (bz - az) * t
          );
          break;
        }
        accum += segLen;
      }
    }
  });

  if (computedPath.length < 2) return null;

  return (
    <group>
      <primitive object={lineObj} />
      <mesh ref={shipRef}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
    </group>
  );
}

function BodyMesh({ body, zoomTier }: { body: CelestialBody; zoomTier: ZoomTier }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useSimulationStore((s) => s.selectedId);
  const computedPath = useSimulationStore((s) => s.computedPath);
  const excludedIds = useSimulationStore((s) => s.excludedIds);
  const selectBody = useSimulationStore((s) => s.selectBody);

  const isSelected = selectedId === body.id;
  const inPath = computedPath.includes(body.id);
  const isExcluded = excludedIds.includes(body.id);

  // Zoom-Aware Label LOD (prevents cluttered label blobs when zoomed out)
  const showLabel =
    isSelected ||
    inPath ||
    (zoomTier === 'solar' && (body.zone === 'Solar System' || body.zone === 'Dwarf & Outer')) ||
    (zoomTier === 'galaxy' && (body.zone === 'Milky Way Exoplanets' || body.id === 'earth')) ||
    (zoomTier === 'cosmos' && body.zone === 'Cosmic & Multiverse');

  const surfaceTex = useMemo(() => getPlanetTexture(body.id, body.color), [body.id, body.color]);
  const ringTex = useMemo(() => getRingTexture(), []);
  const glowTex = useMemo(() => getGlowTexture('rgba(224,242,254,0.9)', 'rgba(56,189,248,0.2)'), []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const [x, y, z] = getBodyPosition(body, simClock.time);
      groupRef.current.position.set(x, y, z);
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
          selectBody(body.id);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[body.radius, 32, 32]} />
        <meshStandardMaterial
          map={surfaceTex}
          roughness={0.65}
          emissive={isExcluded ? '#ef4444' : inPath ? '#22d3ee' : body.color}
          emissiveIntensity={isExcluded ? 0.5 : inPath ? 0.3 : 0.12}
        />
      </mesh>

      {(body.zone === 'Milky Way Exoplanets' || body.zone === 'Cosmic & Multiverse') && (
        <sprite scale={[body.radius * 4, body.radius * 4, 1]}>
          <spriteMaterial map={glowTex} blending={THREE.AdditiveBlending} transparent depthWrite={false} opacity={0.6} />
        </sprite>
      )}

      {body.hasRings && (
        <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
          <ringGeometry args={[body.radius + 0.45, body.radius + 1.85, 48]} />
          <meshStandardMaterial map={ringTex} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {(inPath || body.colonized) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.radius + 0.35, body.radius + 0.55, 28]} />
          <meshBasicMaterial
            color={inPath ? '#fde047' : '#34d399'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {body.moons?.map((m) => (
        <MoonMesh key={m.id} moon={m} />
      ))}

      {showLabel && (
        <Html distanceFactor={65} position={[0, body.radius + 1.4, 0]} center>
          <button
            onClick={() => selectBody(body.id)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono whitespace-nowrap border backdrop-blur-md transition ${
              isExcluded
                ? 'bg-red-950/85 border-red-400 text-red-200 line-through'
                : isSelected
                ? 'bg-cyan-500/35 border-cyan-300 text-white scale-110'
                : inPath
                ? 'bg-amber-500/25 border-amber-400 text-amber-100'
                : 'bg-slate-950/75 border-white/10 text-slate-300 hover:border-cyan-400/60'
            }`}
          >
            {body.name} {inPath ? '★' : body.colonized ? '●' : ''}
          </button>
        </Html>
      )}
    </group>
  );
}

export function UnifiedUniverse3D() {
  const bodies = useSimulationStore((s) => s.bodies);
  const selectBody = useSimulationStore((s) => s.selectBody);
  const [zoomTier, setZoomTier] = useState<ZoomTier>('solar');

  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 48, 86], fov: 45, near: 0.5, far: 50000000 }}
        onPointerMissed={() => selectBody(null)}
      >
        <color attach="background" args={['#020510']} />
        <ambientLight intensity={0.8} />
        <hemisphereLight args={['#bae6fd', '#0f172a', 0.65]} />
        <pointLight position={[0, 0, 0]} intensity={4.5} distance={480} decay={0.25} color="#fff7ed" />
        <Stars radius={2400} depth={800} count={6500} factor={4.5} saturation={0.3} fade speed={0.2} />

        <ClockAndZoomDriver onTierChange={setZoomTier} />
        <CameraController />

        {/* LAYER 1: SOLAR SYSTEM (Always visible) */}
        <SunWithCorona />
        <ParticleRing inner={31} outer={38} count={1400} color="#a8a29e" size={0.18} />
        <ParticleRing inner={88} outer={115} count={1800} color="#93c5fd" size={0.22} />

        {/* LAYER 2: MILKY WAY GALAXY (Always visible) */}
        <MilkyWayGalaxy />

        {/* LAYER 3: OTHER GALAXIES & COSMIC WEB (Only when zoomed out past Solar System) */}
        {zoomTier !== 'solar' && <OtherGalaxiesField />}

        {/* LAYER 4: OUR OBSERVABLE UNIVERSE HORIZON (Only at Cosmic/Multiverse zoom) */}
        {zoomTier === 'cosmos' && <ObservableUniverseShell />}

        {/* LAYER 5: OTHER UNIVERSES / INFINITE MULTIVERSE (Only at Cosmic/Multiverse zoom) */}
        {zoomTier === 'cosmos' && <InfiniteMultiverseField />}

        {bodies.map((body) => (
          <group key={body.id}>
            <OrbitRing
              radius={body.orbitRadius}
              color={body.zone === 'Cosmic & Multiverse' ? '#a78bfa' : '#38bdf8'}
              opacity={body.zone === 'Solar System' ? 0.18 : 0.1}
            />
            <BodyMesh body={body} zoomTier={zoomTier} />
          </group>
        ))}

        <LiveOrbitalPath />

        <OrbitControls enableDamping dampingFactor={0.05} minDistance={8} maxDistance={Infinity} zoomSpeed={1.5} />
      </Canvas>
    </div>
  );
}