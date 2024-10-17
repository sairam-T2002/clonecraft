import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// import { World } from './GameFiles/world';
import { World } from './GameFiles/world2';
import { resources } from './GameFiles/blocks';
import { Player } from './GameFiles/player';
import { Physics } from './Physics/physics';

export function setupUI(world: World, player: Player, physics: Physics) {
  const gui = new GUI();
  gui.close();
  const playerFolder = gui.addFolder('Player');
  playerFolder.add(player, 'maxSpeed', 1, 20, 0.1).name('Max Speed');
  playerFolder.add(player, 'jumpSpeed', 1, 10, 0.1).name('Jump Speed');
  playerFolder.add(player.boundsHelper, 'visible').name('Show Player Bounds');
  playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');

  const physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(physics.helpers, 'visible').name('Visualize Collisions');
  physicsFolder
    .add(physics, 'simulationRate', 10, 1000)
    .name('Simulation Rate');

  const worldFolder = gui.addFolder('World');
  worldFolder.add(world.size, 'width', 8, 128, 1).name('Width');
  worldFolder.add(world.size, 'height', 8, 32, 1).name('Height');

  const terrainFolder = worldFolder.addFolder('Terrain');
  terrainFolder.add(world.params, 'seed', 0, 10000, 1).name('Seed');
  terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
  terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude');
  terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset');
  terrainFolder.add(world.params.terrain, 'dirtLayer', 0, 10).name('dirtLayer');

  const resourcesFolder = gui.addFolder('Resources');
  for (const resource of resources) {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity');
    const scaleFolder = resourceFolder.addFolder('Scale').close();
    scaleFolder.add(resource.scale, 'x', 10, 100).name('X Scale');
    scaleFolder.add(resource.scale, 'y', 10, 100).name('Y Scale');
    scaleFolder.add(resource.scale, 'z', 10, 100).name('Z Scale');
  }

  terrainFolder.onChange(() => {
    world.generate();
  });

  worldFolder.onChange(() => {
    world.generate();
  });
}
