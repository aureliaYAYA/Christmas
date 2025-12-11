import React, { useMemo } from 'react';
import { OrbitControls, Environment, PerspectiveCamera, Float, Stars as DreiStars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeParticles } from './TreeParticles';
import { RibbonText } from './RibbonText';
import { TreeMorphState } from '../types';
import { COLORS } from '../constants';

interface ExperienceProps {
  treeState: TreeMorphState;
}

// Top Star Geometry Helper
const TopStarMesh: React.FC<{ visible: boolean }> = ({ visible }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.35;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const geom = new THREE.ExtrudeGeometry(shape, { 
      depth: 0.3, 
      bevelEnabled: true, 
      bevelThickness: 0.05, 
      bevelSize: 0.05, 
      bevelSegments: 2 
    });
    geom.center();
    return geom;
  }, []);

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
      <mesh 
        position={[0, 6.2, 0]} 
        geometry={geometry} 
        scale={visible ? 1 : 0}
      >
        <meshStandardMaterial 
          color={COLORS.silver} 
          emissive={COLORS.silver} 
          emissiveIntensity={3}
          roughness={0}
          metalness={1}
        />
      </mesh>
    </Float>
  );
};

export const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 20]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minDistance={10} 
        maxDistance={35} 
        autoRotate 
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
      />

      {/* --- Environment & Lighting (Cold/Cinematic) --- */}
      <Environment preset="night" environmentIntensity={0.8} />
      
      <ambientLight intensity={0.1} color={COLORS.darkBlue} />
      
      {/* Key Light (Cool Silver/White) */}
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={300} 
        color="#ffffff" 
        castShadow 
      />

      {/* Rim Light (Deep Blue) */}
      <spotLight 
        position={[-15, 10, -10]} 
        angle={0.6} 
        penumbra={1} 
        intensity={200} 
        color={COLORS.darkBlue} 
      />
      
      {/* Fill Light (Soft Cyan) */}
      <pointLight position={[0, -5, 5]} intensity={80} color={COLORS.lightBlue} distance={30} />

      {/* --- Objects --- */}
      <group position={[0, -2, 0]}>
        
        {/* 1. Leaves: Silver-white glowing dots (Starry Sky) */}
        <TreeParticles state={treeState} variant="LEAF" />
        
        {/* 2. Ornaments A: Light Blue 3D Stars */}
        <TreeParticles state={treeState} variant="STAR" />

        {/* 3. Ornaments B: Dark Blue Semi-transparent Cubes */}
        <TreeParticles state={treeState} variant="CUBE" />

        {/* 4. Silver Ribbon transforming to "Merry Christmas" */}
        <RibbonText state={treeState} />

        {/* 5. Top Star: Big Bright Silver Star (Centered) */}
        <TopStarMesh visible={treeState === TreeMorphState.TREE_SHAPE} />

      </group>

      <DreiStars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

      {/* --- Post Processing --- */}
      <EffectComposer enableNormalPass={false}>
        {/* Increased Bloom for the "Starry Sky" effect */}
        <Bloom 
          luminanceThreshold={1.0} 
          mipmapBlur 
          intensity={1.8} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};