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

  height: number = 1.75;
  radius: number = 0.4;
  maxSpeed: number = 5;
  jumpSpeed: number = 10;
  onGround: boolean = false;
  boundsHelper: THREE.Mesh;

  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();
  input = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.position.set(32, 50, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Wireframe mesh visualizing the player's bounding cylinder
    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    scene.add(this.boundsHelper);

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  // Updates the state of the player based on the current user inputs
  applyInputs(dt: number) {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;
    }

    document.getElementById('info-player-position')!.innerHTML =
      this.positionToString();
  }

  // Updates the position of the player's bounding cylinder helper
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  // Returns the current world position of the player
  get position(): THREE.Vector3 {
    return this.camera.position;
  }

  // Returns the velocity of the player in world coordinates
  get worldVelocity(): THREE.Vector3 {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0)
    );
    return this.#worldVelocity;
  }
  // Applies a change in velocity 'dv' that is specified in the world frame
  applyWorldDeltaVelocity(dv: THREE.Vector3): void {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  // Event handler for 'keyup' event
  onKeyUp(event: any): void {
    if (!this.controls.isLocked && event.code !== 'Escape') {
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
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
    }
  }

  // Event handler for 'keyup' event
  onKeyDown(event: any): void {
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
        this.position.set(32, 50, 32);
        this.velocity.set(0, 0, 0);
        break;
    }
  }

  // Returns player position in a readable string form
  positionToString(): string {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
