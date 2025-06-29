// Basic Three.js + Cannon-es WASD FPS Controls, Elden Ring Style

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// === SETUP ===
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setClearColor(0x181410);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181410);

// Elden Ring-like fog
scene.fog = new THREE.FogExp2(0x181410, 0.04);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const controls = new PointerLockControls(camera, document.body);

// Lighting - moody and golden
const ambient = new THREE.AmbientLight(0xd1ad5b, 0.45);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffe7b6, 1.2);
dirLight.position.set(-5, 18, -10);
scene.add(dirLight);

// === PHYSICS ===
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -24, 0) });

// Floor
const floorMaterial = new CANNON.Material('floor');
const floorBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  material: floorMaterial
});
floorBody.quaternion.setFromEuler(-Math.PI/2, 0, 0); // make it horizontal
world.addBody(floorBody);

// Floor visual
const floorGeo = new THREE.PlaneGeometry(100, 100, 40, 40);
const floorMat = new THREE.MeshStandardMaterial({ 
  color: 0x29251c, 
  roughness: 0.7, 
  metalness: 0.2,
  side: THREE.DoubleSide,
  wireframe: false
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI/2;
scene.add(floorMesh);

// === PLAYER ===
const playerRadius = 0.45;
const playerBody = new CANNON.Body({
  mass: 80,
  shape: new CANNON.Sphere(playerRadius),
  position: new CANNON.Vec3(0, 2, 0),
  material: new CANNON.Material('player')
});
playerBody.linearDamping = 0.99;
world.addBody(playerBody);

// Golden glowing "aura" for player
const playerAura = new THREE.Mesh(
  new THREE.SphereGeometry(playerRadius, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xf3d77e,
    emissive: 0xc1a045,
    transparent: true,
    opacity: 0.35
  })
);
scene.add(playerAura);

// === Elden Ring Ruins/Props Example ===
const ruinsGeo = new THREE.BoxGeometry(2, 3, 2);
const ruinsMat = new THREE.MeshStandardMaterial({
  color: 0x7a6951, roughness: 0.8, metalness: 0.15
});
const ruins = new THREE.Mesh(ruinsGeo, ruinsMat);
ruins.position.set(4, 1.5, -5);
scene.add(ruins);

// Physics for ruins (static)
const ruinsBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(1, 1.5, 1)),
  position: new CANNON.Vec3(4, 1.5, -5)
});
world.addBody(ruinsBody);

// === CONTROLS ===
const keys = {};
let canJump = false;
let velocity = playerBody.velocity;
let moveSpeed = 7; // walking
let sprintSpeed = 15;
let isSprinting = false;

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === 'ShiftLeft') isSprinting = true;
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if(e.code === 'ShiftLeft') isSprinting = false;
});

function getForwardVector() {
  const v = new THREE.Vector3(0,0,-1);
  v.applyQuaternion(camera.quaternion);
  v.y = 0;
  v.normalize();
  return v;
}
function getRightVector() {
  const v = new THREE.Vector3(-1,0,0);
  v.applyQuaternion(camera.quaternion);
  v.y = 0;
  v.normalize();
  return v;
}

// Mouse lock
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
  controls.lock();
});
controls.addEventListener('lock', () => {
  instructions.style.display = 'none';
});
controls.addEventListener('unlock', () => {
  instructions.style.display = '';
});

// Jumping
document.addEventListener('keydown', e => {
  if(e.code === 'Space' && canJump) {
    playerBody.velocity.y = 10.4; // Elden Ring jump
    canJump = false;
  }
});

// === RENDER LOOP ===
let lastTime;
function animate(time) {
  requestAnimationFrame(animate);

  // Delta time
  if(!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.08);
  lastTime = time;

  // Movement
  let inputVelocity = new THREE.Vector3();
  let speed = isSprinting ? sprintSpeed : moveSpeed;
  if(keys['KeyW']) inputVelocity.add(getForwardVector());
  if(keys['KeyS']) inputVelocity.add(getForwardVector().negate());
  if(keys['KeyA']) inputVelocity.add(getRightVector());
  if(keys['KeyD']) inputVelocity.add(getRightVector().negate());
  inputVelocity.normalize().multiplyScalar(speed);

  // Apply movement in XZ plane
  playerBody.velocity.x += (inputVelocity.x - playerBody.velocity.x) * 0.22;
  playerBody.velocity.z += (inputVelocity.z - playerBody.velocity.z) * 0.22;

  // Step physics
  world.step(1/60, dt, 3);

  // Camera follows player
  camera.position.set(
    playerBody.position.x,
    playerBody.position.y + 0.8,
    playerBody.position.z
  );
  controls.target.set(
    playerBody.position.x,
    playerBody.position.y + 0.8,
    playerBody.position.z
  );
  controls.update();

  // Player aura follows
  playerAura.position.copy(playerBody.position);

  // Ray test to check if on ground
  const ray = new CANNON.Ray(playerBody.position, new CANNON.Vec3(0, -1, 0));
  ray._updateDirection();
  ray.length = playerRadius + 0.15;
  const result = new CANNON.RaycastResult();
  ray.intersectBodies([floorBody, ruinsBody], result);
  canJump = result.hasHit && Math.abs(playerBody.velocity.y) < 1.5;

  renderer.render(scene, camera);
}

animate();

// === HANDLE RESIZE ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
