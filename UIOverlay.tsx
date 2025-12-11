import React from 'react';
import { TreeMorphState } from '../types';

interface UIOverlayProps {
  treeState: TreeMorphState;
  setTreeState: (state: TreeMorphState) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ treeState, setTreeState }) => {
  const isTree = treeState === TreeMorphState.TREE_SHAPE;

  const toggleState = () => {
    setTreeState(isTree ? TreeMorphState.SCATTERED : TreeMorphState.TREE_SHAPE);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      
      {/* Header - Top Center */}
      <div className="absolute top-12 left-0 right-0 flex flex-col items-center justify-start pointer-events-none">
        <h1 className="font-serif text-3xl md:text-5xl text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] text-center">
          MERRY CHRISTMAS
        </h1>
        <h2 className="mt-2 font-sans text-[10px] md:text-xs tracking-[0.5em] text-white uppercase opacity-80 text-center">
          Computer Science
        </h2>
      </div>

      {/* Controls - Bottom Center */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-end w-full">
        <button
          onClick={toggleState}
          className="pointer-events-auto group relative flex items-center justify-center px-12 py-4 bg-transparent overflow-hidden transition-all duration-500 ease-out"
        >
          {/* Custom Button Border / Background styling */}
          <div className="absolute inset-0 border border-white/30 group-hover:border-white/80 transition-colors duration-500"></div>
          <div className={`absolute inset-0 bg-white/10 blur-xl transition-opacity duration-700 ${isTree ? 'opacity-100' : 'opacity-0'}`}></div>
          
          <span className="relative z-10 font-serif text-lg text-white group-hover:text-white transition-colors duration-300">
            {isTree ? 'Release Elements' : 'Assemble Form'}
          </span>
          
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white"></div>
        </button>
      </div>

    </div>
  );
};
