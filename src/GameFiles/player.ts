import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);

  maxSpeed: number = 10;
  velocity = new THREE.Vector3();
  input = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.position.set(32, 10, 32);
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  /*Updates the state of the player*/
  update(dt: number): void {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
    }

    document.getElementById('info-player-position')!.innerHTML =
      this.toString();
  }

  /* Returns the current world position of the player*/
  get position(): THREE.Vector3 {
    return this.camera.position;
  }

  /* Event handler for 'keyup' event*/
  onKeyUp(event: KeyboardEvent): void {
    if (!this.controls.isLocked) {
      this.controls.lock();
    }
    switch (event.code) {
      case 'Escape':
        if (event.repeat) break;
        if (this.controls.isLocked) {
          this.controls.unlock();
        }
        break;
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
    }
  }

  /*Event handler for 'keyup' event*/
  onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        if (event.repeat) break;
        this.position.set(32, 10, 32);
        this.velocity.set(0, 0, 0);
        break;
    }
  }

  /* Returns player position in a readable string form*/
  toString(): string {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
