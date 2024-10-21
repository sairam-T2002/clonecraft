import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './WorldRng.js';
import { blocks, resources } from './blocks.js';
import { IRng, WorldArray, Block } from '../types.js';

// Define the faces of a cube
const FACES = [
  { dir: [1, 0, 0], name: 'right', index: 0 },
  { dir: [-1, 0, 0], name: 'left', index: 1 },
  { dir: [0, 1, 0], name: 'top', index: 2 },
  { dir: [0, -1, 0], name: 'bottom', index: 3 },
  { dir: [0, 0, 1], name: 'front', index: 4 },
  { dir: [0, 0, -1], name: 'back', index: 5 },
];

export class WorldChunk extends THREE.Group {
  data: WorldArray = [];
  size: any;
  params: any;
  loaded: boolean;

  constructor(size: any, params: any) {
    super();
    this.size = size;
    this.params = params;
    this.loaded = false;
  }

  /**
   * Generates the world data and meshes
   */
  generate() {
    const start = performance.now();

    const rng = new RNG(this.params.seed);
    this.initialize();
    this.generateResources(rng);
    this.generateTerrain(rng);
    this.generateMeshes();

    this.loaded = true;

    console.log(`Loaded chunk in ${performance.now() - start}ms`);
  }

  /**
   * Initializes an empty world
   */
  initialize() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
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

  /**
   * Generates resources within the world
   * @param {RNG} rng Random number generator
   */
  generateResources(rng: IRng) {
    for (const resource of resources) {
      const simplex = new SimplexNoise(rng);
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const n = simplex.noise3d(
              (this.position.x + x) / resource.scale.x,
              (this.position.y + y) / resource.scale.y,
              (this.position.z + z) / resource.scale.z
            );

            if (n > resource.scarcity) {
              this.setBlockId(x, y, z, resource.id);
            }
          }
        }
      }
    }
  }

  /**
   * Generates the world terrain data
   * @param {RNG} rng Random number generator
   */
  generateTerrain(rng: IRng) {
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // Compute noise value at this x-z location
        const value = simplex.noise(
          (this.position.x + x) / this.params.terrain.scale,
          (this.position.z + z) / this.params.terrain.scale
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
          } else if (
            y < height &&
            y > height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)!.id === blocks.air.id
          ) {
            this.setBlockId(x, y, z, blocks.dirt.id);
          } else if (
            y <= height - this.params.terrain.dirtLayer &&
            this.getBlock(x, y, z)!.id === blocks.air.id
          ) {
            this.setBlockId(x, y, z, blocks.stone.id);
          } else if (y > height) {
            this.setBlockId(x, y, z, blocks.air.id);
          }
        }
      }
    }
  }

  /**
   * Generates the meshes from the world data
   */
  generateMeshes() {
    this.disposeChildren();

    // Create lookup table of InstancedMesh's with the block `${blockType.name}_${face.name}` being the key
    const meshes: Record<string, THREE.InstancedMesh> = {};
    Object.values(blocks)
      .filter((blockType: Block) => blockType.id !== blocks.air.id)
      .forEach((blockType: Block) => {
        FACES.forEach((face) => {
          const maxCount = this.size.width * this.size.width * this.size.height;
          const geometry = this.createFaceGeometry(face.name);

          let material: THREE.Material | undefined;
          if (Array.isArray(blockType.material)) {
            material = blockType.material[face.index];
          } else {
            material = blockType.material;
          }

          const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
          mesh.name = `${blockType.name}_${face.name}`;
          mesh.count = 0;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          meshes[`${blockType.id}_${face.name}`] = mesh;
        });
      });

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const block = this.getBlock(x, y, z);
          if (!block || block.id === blocks.air.id) continue;

          FACES.forEach((face) => {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            const neighborBlock = this.getBlock(nx, ny, nz);
            const neighborId = neighborBlock ? neighborBlock.id : blocks.air.id;

            if (neighborId === blocks.air.id) {
              const meshKey = `${block.id}_${face.name}`;
              const mesh = meshes[meshKey];
              if (!mesh) {
                console.warn(`No mesh found for key: ${meshKey}`);
                return;
              }
              const instanceId = mesh.count;

              matrix.makeTranslation(x, y, z);
              mesh.setMatrixAt(instanceId, matrix);
              mesh.count++;
            }
          });
        }
      }
    }

    this.add(...Object.values(meshes));
  }

  createFaceGeometry(face: string): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(1, 1);

    switch (face) {
      case 'right':
        geometry.rotateY(Math.PI / 2);
        geometry.translate(0.5, 0, 0);
        break;
      case 'left':
        geometry.rotateY(-Math.PI / 2);
        geometry.translate(-0.5, 0, 0);
        break;
      case 'top':
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0.5, 0);
        break;
      case 'bottom':
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, -0.5, 0);
        break;
      case 'front':
        geometry.translate(0, 0, 0.5);
        break;
      case 'back':
        geometry.rotateY(Math.PI);
        geometry.translate(0, 0, -0.5);
        break;
    }

    return geometry;
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock(x: number, y: number, z: number) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Sets the block id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} id
   */
  setBlockId(x: number, y: number, z: number, id: number) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    }
  }

  /**
   * Sets the block instance id for the block at (x, y, z)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} instanceId
   */
  setBlockInstanceId(x: number, y: number, z: number, instanceId: number) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    }
  }

  /**
   * Checks if the (x, y, z) coordinates are within bounds
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {boolean}
   */
  inBounds(x: number, y: number, z: number) {
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

  disposeChildren() {
    this.traverse((obj: any) => {
      if (obj.dispose) obj.dispose();
    });
    this.clear();
  }
}
