export type Block = {
  id: number;
  name: string;
  color?: Color;
  isValueble: boolean;
  scarcity?: number;
  spawnLevel?: number;
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

export interface Irng {
  random(): number;
}
