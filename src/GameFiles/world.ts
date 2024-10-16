import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from '../rng';
import { blocks, resources } from './blocks.js';
import { Irng, BlockArray, BlockType } from '../types.js';

const geometry = new THREE.BoxGeometry(1, 1, 1);

export class World extends THREE.Group {
  size = {
    width: 64,
    height: 16,
  };

  /* Parameters for terrain generation*/
  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.5,
      dirtLayer: 3,
    },
  };

  /*Array that contains all the block instance of the world*/
  data: BlockArray = [];

  /* Generates the world data and meshes*/
  generate() {
    const rng = new RNG(this.params.seed);
    this.initialize();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();
  }

  /*Initializes an empty world*/
  initialize(): void {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice: any = [];
      for (let y = 0; y < this.size.height; y++) {
        const row: any = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: blocks.air.id,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /*Generates resources within the world*/
  generateResources(rng: Irng): void {
    for (const resource of resources) {
      const simplex = new SimplexNoise(rng);
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const n = simplex.noise3d(
              x / resource.scale.x,
              y / resource.scale.y,
              z / resource.scale.z
            );

            if (n > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    }
  }

  /*Generates the world terrain data*/
  generateTerrain(rng: Irng): void {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // Compute noise value at this x-z location
        const value = simplex.noise(
          x / this.params.terrain.scale,
          z / this.params.terrain.scale
        );

        // Scale noise based on the magnitude and add in the offset
        const scaledNoise =
          this.params.terrain.offset + this.params.terrain.magnitude * value;

        // Compute final height of terrain at this location
        let height = this.size.height * scaledNoise;

        // Clamp between 0 and max height
        height = Math.max(
          0,
          Math.min(Math.floor(height), this.size.height - 1)
        );

        // Starting at the terrain height, fill in all the blocks below that height
        for (let y = 0; y < this.size.height; y++) {
          if (y === height) {
            this.setBlockId(x, y, z, blocks.grass.id);
            // Fill in blocks with dirt if they aren't already filled with something else
          } else if (
            y < height &&
            y > height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)?.id === blocks.air.id
          ) {
            this.setBlockId(x, y, z, blocks.dirt.id);
            // Clear everything above
          } else if (
            y <= height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)?.id === blocks.air.id
          ) {
            this.setBlockId(x, y, z, blocks.stone.id);
            // Clear everything above
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.air.id);
          }
        }
      }
    }
  }

  /*Generates the meshes from the world data*/
  generateMeshes(): void {
    this.disposeChildren();

    // Create lookup table of InstancedMesh's with the block id being the key
    const meshes: Record<number, THREE.InstancedMesh> = {};
    Object.values(blocks)
      .filter((blockType: any) => blockType.id !== blocks.air.id)
      .forEach((blockType: any) => {
        const maxCount = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(
          geometry,
          blockType.material,
          maxCount
        );
        mesh.name = blockType.name;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes[blockType.id] = mesh;
      });

    // Add instances for each non-empty block
    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z)?.id || blocks.air.id;

          // Ignore empty blocks
          if (blockId === blocks.air.id) continue;

          const mesh = meshes[blockId];
          const instanceId = mesh.count;

          // Create a new instance if block is not obscured by other blocks
          if (!this.isBlockObscured(x, y, z)) {
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }

    // Add all instanced meshes to the scene
    this.add(...Object.values(meshes));
  }

  /*Gets the block data at (x, y, z)*/
  getBlock(x: number, y: number, z: number): BlockType | null {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /*Sets the block id for the block at (x, y, z)*/
  setBlockId(x: number, y: number, z: number, id: number): void {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /*Sets the block instance id for the block at (x, y, z)*/
  setBlockInstanceId(
    x: number,
    y: number,
    z: number,
    instanceId: number
  ): void {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /*Checks if the (x, y, z) coordinates are within bounds*/
  inBounds(x: number, y: number, z: number): boolean {
    if (
      x >= 0 &&
      x < this.size.width &&
      y >= 0 &&
      y < this.size.height &&
      z >= 0 &&
      z < this.size.width
    ) {
      return true;
    } else {
      return false;
    }
  }

  /*Returns true if this block is completely hidden by other blocks*/
  isBlockObscured(x: number, y: number, z: number): boolean {
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.air.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.air.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.air.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.air.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.air.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.air.id;

    // If any of the block's sides is exposed, it is not obscured
    if (
      up === blocks.air.id ||
      down === blocks.air.id ||
      left === blocks.air.id ||
      right === blocks.air.id ||
      forward === blocks.air.id ||
      back === blocks.air.id
    ) {
      return false;
    } else {
      return true;
    }
  }

  disposeChildren(): void {
    this.traverse((obj: any) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
