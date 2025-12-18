
export type ParticleShape = 'heart' | 'flower' | 'star' | 'firework' | 'planet' | 'random';

export interface ThemeConfig {
  color: string;
  shape: ParticleShape;
  size: number;
  count: number;
  speed: number;
}

export interface HandState {
  isOpen: boolean;
  distance: number; // 0 to 1 scale for zoom/diffusion
  position: { x: number; y: number; z: number };
}
