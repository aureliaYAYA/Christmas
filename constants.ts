export const COLORS = {
  emerald: '#051015', // Darkened for background/ambient
  silver: '#FFFFFF',
  silverDim: '#A0A0A0',
  gold: '#FFD700', // Kept for legacy or accents if needed
  lightBlue: '#87CEFA', // Light Sky Blue for Stars
  darkBlue: '#00008B',  // Deep Blue for Cubes
  background: '#020204'
};

export const CONFIG = {
  leafCount: 2500, // Increased for starry sky effect
  starCount: 80,
  cubeCount: 80,
  ribbonParticleCount: 300, // Increased to form a continuous line
  treeHeight: 12,
  treeRadius: 4.5,
  scatterRadius: 18,
  transitionSpeed: 2.0,
};

// Math helpers
export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
