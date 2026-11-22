import * as THREE from 'three';

const textureCache: Record<string, THREE.Texture> = {};
const textureLoader = new THREE.TextureLoader();

export function getGlowTexture(innerColor: string, outerColor: string): THREE.CanvasTexture {
  const key = `glow-${innerColor}-${outerColor}`;
  if (textureCache[key]) return textureCache[key] as THREE.CanvasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.28, outerColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache[key] = tex;
  return tex;
}

export function getRingTexture(): THREE.CanvasTexture {
  if (textureCache['saturn-ring']) return textureCache['saturn-ring'] as THREE.CanvasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0.0, 'rgba(217, 179, 124, 0.0)');
  grad.addColorStop(0.12, 'rgba(180, 150, 110, 0.4)');
  grad.addColorStop(0.28, 'rgba(251, 226, 175, 0.9)');
  grad.addColorStop(0.43, 'rgba(90, 75, 55, 0.12)'); // Cassini Division
  grad.addColorStop(0.49, 'rgba(245, 214, 158, 0.85)');
  grad.addColorStop(0.72, 'rgba(210, 175, 125, 0.6)');
  grad.addColorStop(0.88, 'rgba(170, 145, 115, 0.35)');
  grad.addColorStop(1.0, 'rgba(217, 179, 124, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 32);

  const tex = new THREE.CanvasTexture(canvas);
  textureCache['saturn-ring'] = tex;
  return tex;
}

function createProceduralTexture(id: string, baseColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  let seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (id === 'sun') {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = rand() > 0.45 ? 'rgba(255,255,220,0.3)' : 'rgba(234,88,12,0.35)';
      ctx.beginPath();
      ctx.arc(rand() * 1024, rand() * 512, 4 + rand() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'earth') {
    const ocean = ctx.createLinearGradient(0, 0, 0, 512);
    ocean.addColorStop(0, '#082f49');
    ocean.addColorStop(0.5, '#0369a1');
    ocean.addColorStop(1, '#082f49');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 1024, 512);

    // Continents & desert interiors
    for (let i = 0; i < 75; i++) {
      const x = rand() * 1024;
      const y = 65 + rand() * 380;
      const rx = 24 + rand() * 85;
      const ry = 14 + rand() * 48;
      ctx.fillStyle = rand() > 0.28 ? '#15803d' : '#a16207';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Atmospheric cloud bands
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.beginPath();
      ctx.ellipse(rand() * 1024, rand() * 512, 30 + rand() * 110, 6 + rand() * 18, (rand() - 0.5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice caps
    ctx.fillStyle = 'rgba(241, 245, 249, 0.92)';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillRect(0, 482, 1024, 30);
  } else if (id === 'mars') {
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = rand() > 0.45 ? 'rgba(234, 88, 12, 0.32)' : 'rgba(67, 20, 7, 0.38)';
      ctx.beginPath();
      ctx.arc(rand() * 1024, rand() * 512, 6 + rand() * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.fillRect(0, 0, 1024, 22);
    ctx.fillRect(0, 490, 1024, 22);
  } else if (['jupiter', 'saturn', 'uranus', 'neptune'].includes(id)) {
    const bands =
      id === 'jupiter'
        ? ['#78350f', '#d97706', '#fef3c7', '#b45309', '#f59e0b', '#92400e', '#fde68a']
        : id === 'saturn'
        ? ['#a16207', '#eab308', '#fef08a', '#ca8a04', '#fde047', '#d97706']
        : id === 'uranus'
        ? ['#0e7490', '#22d3ee', '#67e8f9', '#06b6d4', '#a5f3fc']
        : ['#1e3a8a', '#2563eb', '#3b82f6', '#1d4ed8', '#60a5fa'];

    for (let y = 0; y < 512; y += 10) {
      ctx.fillStyle = bands[Math.floor((y / 10) % bands.length)];
      ctx.fillRect(0, y, 1024, 14);
    }
    for (let i = 0; i < 280; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(rand() * 1024, rand() * 512, 60 + rand() * 200, 4 + rand() * 10);
    }
    if (id === 'jupiter') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(520, 315, 56, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 450; i++) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.24)';
      ctx.beginPath();
      ctx.arc(rand() * 1024, rand() * 512, 3 + rand() * 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function getPlanetTexture(id: string, baseColor: string): THREE.Texture {
  if (textureCache[id]) return textureCache[id];

  const tex = createProceduralTexture(id, baseColor);
  textureCache[id] = tex;

  // Automatically upgrades to real NASA 2K texture if placed in frontend/public/textures/<id>.jpg
  textureLoader.load(
    `/textures/${id}.jpg`,
    (realTex) => {
      realTex.colorSpace = THREE.SRGBColorSpace;
      realTex.anisotropy = 8;
      tex.image = realTex.image;
      tex.needsUpdate = true;
    },
    undefined,
    () => {
      // No local file yet — keeps the high-res procedural texture silently
    }
  );

  return tex;
}