import * as THREE from 'three';
import { Block, ResouceBlock } from '../types';

const textureLoader = new THREE.TextureLoader();

function loadTexture(path: string): THREE.Texture {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

const textures: any = {
  dirt: loadTexture('textures/dirt.png'),
  grass: loadTexture('textures/grass.png'),
  grassSide: loadTexture('textures/grass_side.png'),
  stone: loadTexture('textures/stone.png'),
  coalOre: loadTexture('textures/coal_ore.png'),
  ironOre: loadTexture('textures/iron_ore.png'),
};

type BlockKey = 'air' | 'grass' | 'dirt' | 'stone' | 'coalOre' | 'ironOre';

export const blocks: Record<BlockKey, Block> = {
  air: {
    id: 0,
    name: 'air',
    isValueble: false,
  },
  grass: {
    id: 1,
    name: 'grass',
    isValueble: false,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.grass }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // back
    ],
  },
  dirt: {
    id: 2,
    name: 'dirt',
    isValueble: false,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
  },
  stone: {
    id: 3,
    name: 'stone',
    material: new THREE.MeshLambertMaterial({ map: textures.stone }),
    isValueble: false,
  },
  coalOre: {
    id: 4,
    name: 'coal_ore',
    isValueble: true,
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
  },
  ironOre: {
    id: 5,
    name: 'iron_ore',
    isValueble: true,
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
    scale: { x: 40, y: 40, z: 40 },
    scarcity: 0.9,
  },
};

export const resources: ResouceBlock[] = Object.values(blocks).filter(
  (block) => block.isValueble
) as ResouceBlock[];
