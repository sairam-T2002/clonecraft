import * as THREE from 'three';

export type Block = {
  id: number;
  name: string;
  color?: Color;
  isValueble: boolean;
  scarcity?: number;
  material?: THREE.Material | THREE.Material[];
  scale?: Coords;
};

export type ResouceBlock = {
  id: number;
  name: string;
  color: Color;
  isValueble: boolean;
  scarcity: number;
  material: THREE.Material | THREE.Material[];
  scale: Coords;
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

export type WorldArray = BlockType[][][];

export interface IRng {
  random(): number;
}

export type Coords = {
  x: number;
  y: number;
  z: number;
};

export type Collision = {
  block: Coords;
  contactPoint: Coords;
  normal: THREE.Vector3;
  overlap: number;
};
