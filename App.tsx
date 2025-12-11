import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { TreeMorphState } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.SCATTERED);

  return (
    <div className="relative w-full h-screen bg-arix-dark overflow-hidden selection:bg-arix-gold selection:text-arix-dark">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]} // Optimize pixel ratio for performance
          gl={{ 
            antialias: false, // Post-processing handles AA or stylistic blur
            toneMapping: 3, // ACESFilmic
            toneMappingExposure: 1.2
          }}
        >
          <color attach="background" args={[COLORS.background]} />
          <Experience treeState={treeState} />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <UIOverlay treeState={treeState} setTreeState={setTreeState} />
      
      {/* Grain Overlay for cinematic texture */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.03] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};

export default App;
