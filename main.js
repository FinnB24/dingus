const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('three-canvas').appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5,10,7);
scene.add(dir);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60,60),
  new THREE.MeshPhongMaterial({ color:0x6e613a, shininess: 12 })
);
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
scene.add(ground);

// Camera start
camera.position.set(0,10,30);
camera.lookAt(0,0,0);

// === Load your GLB church model ===
const loader = new THREE.GLTFLoader();
loader.load(
  "my-church.glb", // Change this to your file name if needed
  gltf => {
    const model = gltf.scene;
    model.position.set(0,0,0); // Change as needed
    model.scale.set(1,1,1);    // Change as needed
    scene.add(model);
  },
  undefined,
  err => {console.error("Failed to load model", err);}
);

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
