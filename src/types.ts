import * as THREE from 'three';

export type Block = {
  id: number;
  name: string;
  color?: Color;
  isValueble: boolean;
  scarcity?: number;
  material?: THREE.Material | THREE.Material[];
  scale?: CoOrdinates;
};

export type ResouceBlock = {
  id: number;
  name: string;
  color: Color;
  isValueble: boolean;
  scarcity: number;
  material: THREE.Material | THREE.Material[];
  scale: CoOrdinates;
};

export type Color =
  | string
  | `#${string}`
  | `rgb(${number}, ${number}, ${number})`
  | `rgba(${number}, ${number}, ${number}, ${number | string})`
  | `hsl(${number}, ${number}%, ${number}%)`
  | `hsla(${number}, ${number}%, ${number}%, ${number | string})`
  | number;

export type BlockType = {
  id: number;
  instanceId?: number | undefined | null;
};

export type BlockArray = BlockType[][][];

export interface IRng {
  random(): number;
}

export type CoOrdinates = {
  x: number;
  y: number;
  z: number;
};
