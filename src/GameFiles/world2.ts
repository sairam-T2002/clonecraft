import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './WorldRng.js';
import { blocks, resources } from './blocks.js';
import { IRng, WorldArray, BlockType } from '../types.js';

const geometry = new THREE.BoxGeometry(1, 1, 1);

export class World extends THREE.Group {
  // World Dimentions
  size: any = {
    width: 64,
    height: 16,
  };

  /* Parameters for terrain generation*/
  params: any = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.5,
      dirtLayer: 3,
    },
  };

  /*Array that contains all the block instance of the world*/
  data: WorldArray = [];

  /* Generates the world data and meshes*/
  generate(): void {
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
      const slice: BlockType[][] = [];
      for (let y = 0; y < this.size.height; y++) {
        const row: BlockType[] = [];
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
  generateResources(rng: IRng): void {
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
  generateTerrain(rng: IRng): void {
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
            // surface is always grass
            this.setBlockId(x, y, z, blocks.grass.id);
          } else if (
            y < height &&
            y > height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)?.id === blocks.air.id
          ) {
            // Dirt layer below the grass
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (
            y <= height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)?.id === blocks.air.id
          ) {
            // Stone layer below the dirt
            this.setBlockId(x, y, z, blocks.stone.id);
          } else if (y > height) {
            // Air Block above grass layer
            this.setBlockId(x, y, z, blocks.air.id);
          }
        }
      }
    }
  }

  /*Generates the meshes from the world data*/
  generateMeshes(): void {
    this.disposeChildren();

    // Create lookup table for InstancedMeshes for each face of each block type
    const faceMeshes: Record<number, Record<string, THREE.InstancedMesh>> = {};
    const faces = ['top', 'bottom', 'left', 'right', 'front', 'back'];

    // Initialize InstancedMeshes for each face for all blocks
    Object.values(blocks)
      .filter((blockType: any) => blockType.id !== blocks.air.id)
      .forEach((blockType: any) => {
        const maxCount = this.size.width * this.size.width * this.size.height;
        faceMeshes[blockType.id] = {};
        faces.forEach((face) => {
          const mesh = new THREE.InstancedMesh(
            geometry, // Assume each face has a corresponding geometry, or define face-specific geometry here
            blockType.material,
            maxCount
          );
          mesh.name = `${blockType.name}_${face}`;
          mesh.count = 0;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          faceMeshes[blockType.id][face] = mesh;
        });
      });

    // Add instances for each exposed face of non-air blocks
    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z)?.id || blocks.air.id;

          // Ignore air blocks
          if (blockId === blocks.air.id) continue;

          // Check for each face if it is exposed to air
          if (this.isFaceExposed(x, y, z, 'top')) {
            const mesh = faceMeshes[blockId]['top'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
          if (this.isFaceExposed(x, y, z, 'bottom')) {
            const mesh = faceMeshes[blockId]['bottom'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
          if (this.isFaceExposed(x, y, z, 'left')) {
            const mesh = faceMeshes[blockId]['left'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
          if (this.isFaceExposed(x, y, z, 'right')) {
            const mesh = faceMeshes[blockId]['right'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
          if (this.isFaceExposed(x, y, z, 'front')) {
            const mesh = faceMeshes[blockId]['front'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
          if (this.isFaceExposed(x, y, z, 'back')) {
            const mesh = faceMeshes[blockId]['back'];
            this.addFaceInstance(mesh, matrix, x, y, z);
          }
        }
      }
    }

    // Add all instanced face meshes to the scene
    Object.values(faceMeshes).forEach((blockTypeMeshes) =>
      this.add(...Object.values(blockTypeMeshes))
    );
  }

  /* Adds a face instance at the given position to the mesh */
  addFaceInstance(
    mesh: THREE.InstancedMesh,
    matrix: THREE.Matrix4,
    x: number,
    y: number,
    z: number
  ): void {
    const instanceId = mesh.count;
    matrix.setPosition(x, y, z);
    mesh.setMatrixAt(instanceId, matrix);
    mesh.count++;
  }

  /* Checks if the specified face of a block is exposed to air */
  isFaceExposed(x: number, y: number, z: number, face: string): boolean {
    switch (face) {
      case 'top':
        return (
          (this.getBlock(x, y + 1, z)?.id ?? blocks.air.id) === blocks.air.id
        );
      case 'bottom':
        return (
          (this.getBlock(x, y - 1, z)?.id ?? blocks.air.id) === blocks.air.id
        );
      case 'left':
        return (
          (this.getBlock(x + 1, y, z)?.id ?? blocks.air.id) === blocks.air.id
        );
      case 'right':
        return (
          (this.getBlock(x - 1, y, z)?.id ?? blocks.air.id) === blocks.air.id
        );
      case 'front':
        return (
          (this.getBlock(x, y, z + 1)?.id ?? blocks.air.id) === blocks.air.id
        );
      case 'back':
        return (
          (this.getBlock(x, y, z - 1)?.id ?? blocks.air.id) === blocks.air.id
        );
      default:
        return false;
    }
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
