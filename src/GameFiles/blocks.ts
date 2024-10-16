import { Block } from '../types';
type BlockKey = 'air' | 'grass' | 'dirt' | 'stone';

export const blocks: Record<BlockKey, Block> = {
  air: {
    id: 0,
    name: 'air',
    isValueble: false,
  },
  grass: {
    id: 1,
    name: 'grass',
    color: 0x559020,
    isValueble: false,
  },
  dirt: {
    id: 2,
    name: 'dirt',
    color: 0x807020,
    isValueble: false,
  },
  stone: {
    id: 3,
    name: 'stone',
    color: 0x8c8989,
    isValueble: false,
  },
};
