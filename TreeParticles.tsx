import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, ParticleData, ParticleVariant } from '../types';
import { CONFIG, COLORS, randomRange } from '../constants';

interface TreeParticlesProps {
  state: TreeMorphState;
  variant: ParticleVariant;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const vec3Scattered = new THREE.Vector3();
const vec3Tree = new THREE.Vector3();
const vec3Current = new THREE.Vector3();
const quatScattered = new THREE.Quaternion();
const quatTree = new THREE.Quaternion();
const quatCurrent = new THREE.Quaternion();

// Helper to create Star Geometry
const createStarGeometry = (radius: number, depth: number) => {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.5;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; 
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geom = new THREE.ExtrudeGeometry(shape, { 
    depth, 
    bevelEnabled: true, 
    bevelThickness: 0.02, 
    bevelSize: 0.02, 
    bevelSegments: 1 
  });
  geom.center();
  return geom;
};

export const TreeParticles: React.FC<TreeParticlesProps> = ({ state, variant }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const progress = useRef(0);
  
  const { count, geometry, material } = useMemo(() => {
    let count = 0;
    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    if (variant === 'LEAF') {
      count = CONFIG.leafCount;
      // Small sphere/tetrahedron for "sparkle" point
      geo = new THREE.SphereGeometry(0.06, 8, 8); 
      mat = new THREE.MeshStandardMaterial({
        color: COLORS.silver,
        emissive: COLORS.silver,
        emissiveIntensity: 1.5, // High emissive for starry glow
        roughness: 0.4,
        metalness: 0.9,
      });
    } else if (variant === 'STAR') {
      count = CONFIG.starCount;
      // Reduced size for stars: 0.15 radius (was 0.3)
      geo = createStarGeometry(0.15, 0.05);
      mat = new THREE.MeshStandardMaterial({
        color: COLORS.lightBlue,
        emissive: COLORS.lightBlue,
        emissiveIntensity: 2.0, // Increased glow
        roughness: 0.1,
        metalness: 1.0,
      });
    } else { // CUBE
      count = CONFIG.cubeCount;
      geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      // Transparent dark blue cube
      mat = new THREE.MeshPhysicalMaterial({
        color: COLORS.darkBlue,
        transparent: true,
        opacity: 0.7,
        transmission: 0.5, // Glass-like
        thickness: 1,
        roughness: 0.1,
        metalness: 0.5,
      });
    }

    return { count, geometry: geo, material: mat };
  }, [variant]);

  // Generate Data Once
  const particles = useMemo(() => {
    const data: ParticleData[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); 

    for (let i = 0; i < count; i++) {
      // --- Tree Shape Logic ---
      const yNorm = i / count; 
      const y = CONFIG.treeHeight * (yNorm - 0.5); 
      // Radius calculation
      let r = CONFIG.treeRadius * (1 - yNorm);
      
      // Variants have different spiral densities
      const density = variant === 'LEAF' ? 30 : 10;
      const theta = phi * i * density;

      // Add noise
      const noise = variant === 'LEAF' ? 0.4 : 0.6;
      r += randomRange(-noise * 0.5, noise * 0.5);

      const treeX = r * Math.cos(theta);
      const treeZ = r * Math.sin(theta);
      
      const finalTreePos: [number, number, number] = [
        treeX + randomRange(-noise, noise), 
        y, 
        treeZ + randomRange(-noise, noise)
      ];

      // --- Scattered Logic ---
      const u = Math.random();
      const v = Math.random();
      const thetaScatter = 2 * Math.PI * u;
      const phiScatter = Math.acos(2 * v - 1);
      const rScatter = CONFIG.scatterRadius * Math.cbrt(Math.random());
      
      const scatterX = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      const scatterY = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      const scatterZ = rScatter * Math.cos(phiScatter);

      // --- Rotations ---
      // Leaves point somewhat up/out, Ornaments random
      const treeRot: [number, number, number] = [
        randomRange(-0.5, 0.5), 
        randomRange(0, Math.PI * 2), 
        randomRange(-0.5, 0.5)
      ];

      const scatterRot: [number, number, number] = [
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ];

      // --- Scale ---
      let scale = 1;
      if (variant === 'LEAF') scale = randomRange(0.5, 1.2);
      else scale = randomRange(0.8, 1.2);

      data.push({
        scatterPosition: [scatterX, scatterY, scatterZ],
        treePosition: finalTreePos,
        scatterRotation: scatterRot,
        treeRotation: treeRot,
        scale,
        color: '#ffffff' // Color handled by material mostly, but we can vary
      });
    }
    return data;
  }, [count, variant]);

  // Animation Loop
  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const target = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, CONFIG.transitionSpeed, delta);
    const t = progress.current;

    // Slow spin
    meshRef.current.rotation.y += delta * 0.05 * t;

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // Position
      vec3Scattered.set(...p.scatterPosition);
      // Floating effect
      if (t < 0.9) {
         vec3Scattered.y += Math.sin(stateThree.clock.elapsedTime + i * 0.1) * 0.05;
      }
      
      vec3Tree.set(...p.treePosition);
      vec3Current.lerpVectors(vec3Scattered, vec3Tree, t);

      // Rotation
      const eulerScattered = new THREE.Euler(...p.scatterRotation);
      quatScattered.setFromEuler(eulerScattered);
      
      const eulerTree = new THREE.Euler(...p.treeRotation);
      quatTree.setFromEuler(eulerTree);

      quatCurrent.slerpQuaternions(quatScattered, quatTree, t);

      // Transform
      tempObject.position.copy(vec3Current);
      tempObject.quaternion.copy(quatCurrent);
      
      // Pop effect for ornaments
      const scaleMult = variant !== 'LEAF' ? (0.3 + 0.7 * t) : 1;
      tempObject.scale.setScalar(p.scale * scaleMult);

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]} 
      castShadow 
      receiveShadow
    />
  );
};
