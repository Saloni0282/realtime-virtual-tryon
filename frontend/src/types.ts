export interface Garment {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  category: 'sweaters' | 'hoodies' | 'tops' | 'jackets';
  imageUrl: string;
  color: string;
  prompt: string;
  description: string;
  tags: string[];
  featured?: boolean;
}

export type TryOnStatus =
  | 'idle'
  | 'requesting-camera'
  | 'connecting'
  | 'calibrating'
  | 'streaming'
  | 'error';

export type TryOnEngine = 'decart-live' | 'local-simulator';

export interface PoseState {
  isPersonDetected: boolean;
  isAligned: boolean;
  guidanceText: string;
  shoulderWidth?: number;
  headBox?: { x: number; y: number; width: number; height: number };
}
