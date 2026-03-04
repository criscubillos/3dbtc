import * as THREE from 'three';

export function initParticles(scene: THREE.Scene): THREE.Points {
  const count = 500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.3) * 200;
    positions[i * 3 + 1] = Math.random() * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.15,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
  return particleSystem;
}

export function updateParticles(particleSystem: THREE.Points) {
  const pos = particleSystem.geometry.attributes.position.array as Float32Array;
  for (let i = 1; i < pos.length; i += 3) {
    pos[i] += Math.sin(Date.now() * 0.0005 + i) * 0.005;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}
