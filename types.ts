
export type ParticleShape = 'heart' | 'star' | 'tree' | 'planet';

export interface HandState {
  isOpen: boolean;
  distance: number; // 0 to 1 scale for zoom/diffusion
  position: { x: number; y: number; z: number };
}
