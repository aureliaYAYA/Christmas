import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMorphState, ParticleData } from '../types';
import { CONFIG, COLORS, randomRange } from '../constants';

interface RibbonTextProps {
  state: TreeMorphState;
}

const tempObject = new THREE.Object3D();
const vec3Scattered = new THREE.Vector3();
const vec3Tree = new THREE.Vector3();
const vec3Current = new THREE.Vector3();
const quatScattered = new THREE.Quaternion();
const quatTree = new THREE.Quaternion();
const quatCurrent = new THREE.Quaternion();
const dummyLookAt = new THREE.Object3D();

export const RibbonText: React.FC<RibbonTextProps> = ({ state }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const progress = useRef(0);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // create Texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear with transparency
      ctx.clearRect(0, 0, 512, 128);
      
      // Text Settings
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 70px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Strong Glow for visibility
      ctx.shadowColor = 'rgba(255,255,255,1.0)';
      ctx.shadowBlur = 10;
      
      ctx.fillText('Merry Christmas', 256, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Material setup for Morphing
  useEffect(() => {
    if (materialRef.current) {
      const mat = materialRef.current;
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uProgress = { value: 0 };
        shader.fragmentShader = `
          uniform float uProgress;
          ${shader.fragmentShader}
        `.replace(
          '#include <map_fragment>',
          `
          #ifdef USE_MAP
            vec4 texelColor = texture2D( map, vUv );
            
            // Logic:
            // At uProgress = 0.0 (Scattered): Use texture alpha (Text shape).
            // At uProgress = 1.0 (Tree): Force alpha to 1.0 (Solid Ribbon).
            
            float alpha = mix(texelColor.a, 1.0, uProgress);
            
            // Force color to white. 
            // The texture is white text, but transparent pixels might be black (0,0,0,0).
            // We want the solid ribbon to be White, not Black.
            vec3 white = vec3(1.0, 1.0, 1.0);
            
            diffuseColor.rgb *= white; 
            diffuseColor.a *= alpha;
          #endif
          `
        );
        mat.userData.shader = shader;
      };
    }
  }, []);

  const particles = useMemo(() => {
    const data: ParticleData[] = [];
    const count = CONFIG.ribbonParticleCount;
    
    // Spiral Logic for Ribbon
    const turns = 5; 
    const height = CONFIG.treeHeight + 1; 

    for (let i = 0; i < count; i++) {
      const p = i / (count - 1); // 0 to 1
      
      // --- Tree Position: Spiral ---
      const y = (p - 0.5) * height;
      const angle = p * Math.PI * 2 * turns;
      const r = (CONFIG.treeRadius + 0.6) * (1 - p); 

      const tx = r * Math.cos(angle);
      const tz = r * Math.sin(angle);

      // Tangent vector for orientation
      const tangent = new THREE.Vector3(-Math.sin(angle), 0.3, Math.cos(angle)).normalize();
      const lookAtPos = new THREE.Vector3(tx, y, tz).add(tangent);
      
      const dummyObj = new THREE.Object3D();
      dummyObj.position.set(tx, y, tz);
      dummyObj.lookAt(lookAtPos);
      
      const treeRot: [number, number, number] = [dummyObj.rotation.x, dummyObj.rotation.y, dummyObj.rotation.z];

      // --- Scatter Position ---
      const sr = CONFIG.scatterRadius * 1.5;
      const sx = randomRange(-sr, sr);
      const sy = randomRange(-sr, sr);
      const sz = randomRange(-sr, sr);

      data.push({
        treePosition: [tx, y, tz],
        scatterPosition: [sx, sy, sz],
        treeRotation: treeRot,
        scatterRotation: [0, 0, 0], 
        scale: 1,
        color: '#fff'
      });
    }
    return data;
  }, []);

  useFrame((stateThree, delta) => {
    if (!meshRef.current) return;

    const target = state === TreeMorphState.TREE_SHAPE ? 1 : 0;
    progress.current = THREE.MathUtils.damp(progress.current, target, CONFIG.transitionSpeed * 0.8, delta);
    const t = progress.current;

    // Update Uniform
    if (materialRef.current?.userData.shader) {
      materialRef.current.userData.shader.uniforms.uProgress.value = t;
    }

    meshRef.current.rotation.y += delta * 0.1 * t; 

    const camera = stateThree.camera;
    const invMatrix = new THREE.Matrix4().copy(meshRef.current.matrixWorld).invert();
    
    // Calculate local camera position for lookAt
    const localCameraPos = new THREE.Vector3().copy(camera.position).applyMatrix4(invMatrix);

    // Calculate local camera UP vector to ensure text stays horizontal relative to screen
    // We transform the camera's Up vector (0,1,0 usually) into local space by applying the inverse rotation
    const localCameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(invMatrix)).normalize();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // --- Position ---
      vec3Scattered.set(...p.scatterPosition);
      if (t < 0.5) vec3Scattered.y += Math.sin(stateThree.clock.elapsedTime + i) * 0.02;

      vec3Tree.set(...p.treePosition);
      vec3Current.lerpVectors(vec3Scattered, vec3Tree, t);

      // --- Rotation ---
      
      // Scattered: Robust Billboard
      dummyLookAt.position.copy(vec3Scattered);
      dummyLookAt.up.copy(localCameraUp); // Align UP with camera
      dummyLookAt.lookAt(localCameraPos); 
      quatScattered.copy(dummyLookAt.quaternion);
      
      const eulerTree = new THREE.Euler(...p.treeRotation);
      quatTree.setFromEuler(eulerTree);

      quatCurrent.slerpQuaternions(quatScattered, quatTree, t);

      // --- Scale ---
      const currentScale = t > 0.5 ? 0.6 : 1.5; 

      tempObject.position.copy(vec3Current);
      tempObject.quaternion.copy(quatCurrent);
      tempObject.scale.setScalar(currentScale);
      
      // Stretch X in ribbon mode to ensure overlap
      if (t > 0.8) {
         tempObject.scale.x *= 1.8; 
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.ribbonParticleCount]}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial 
        ref={materialRef}
        map={texture} 
        transparent 
        side={THREE.DoubleSide} 
        depthWrite={false}
      />
    </instancedMesh>
  );
};
