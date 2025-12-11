export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}

export type ParticleVariant = 'LEAF' | 'STAR' | 'CUBE';

export interface ParticleData {
  scatterPosition: [number, number, number];
  treePosition: [number, number, number];
  scatterRotation: [number, number, number];
  treeRotation: [number, number, number];
  scale: number;
  color: string;
}

export interface TreeConfig {
  count: number;
  radius: number;
  height: number;
  particleSize: number;
}