// ---- Three.js basic scene setup ----
const container = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x22232b);
scene.fog = new THREE.Fog(0x22232b, 40, 200);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 14);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// ---- Lighting ----
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xfff0c0, 1.1);
dirLight.position.set(10, 22, 8);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.mapSize.set(1024,1024);
scene.add(dirLight);

// ---- Ground ----
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshPhongMaterial({ color: 0x444d5c, shininess: 12 })
);
ground.rotation.x = -Math.PI/2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// ---- GLTFLoader: Load your church ----
const loader = new THREE.GLTFLoader();
// Path to your .glb file (change this if needed)
let churchPath = "church.glb"; // <-- put your actual filename here

let churchModel;
function loadChurch(path) {
  loader.load(
    path,
    function(gltf) {
      if (churchModel) scene.remove(churchModel); // Remove old if reloaded
      churchModel = gltf.scene;
      // Center, scale, and orient the model as needed
      churchModel.traverse(obj => { if(obj.isMesh){ obj.castShadow = obj.receiveShadow = true; }});
      churchModel.position.set(0, 0, 0);
      // Optional: scale church to fit scene (adjust as needed)
      let scale = 1.0;
      let bbox = new THREE.Box3().setFromObject(churchModel);
      let size = bbox.getSize(new THREE.Vector3());
      if (size.y > 20) scale = 12/size.y;
      churchModel.scale.setScalar(scale);
      scene.add(churchModel);
      fitCameraToObject(churchModel, camera, 1.1, new THREE.Vector3(0, 4, 20));
      showMessage("Church model loaded.");
    },
    function(xhr) {
      showMessage(`Loading: ${Math.round(xhr.loaded/xhr.total*100)}%`);
    },
    function(err) {
      showMessage("Error loading model: "+err.message);
    }
  );
}

// ---- Camera auto-fit helper ----
function fitCameraToObject(obj, cam, offset=1.2, lookPos=null) {
  let box = new THREE.Box3().setFromObject(obj);
  let size = box.getSize(new THREE.Vector3());
  let center = box.getCenter(new THREE.Vector3());
  let maxDim = Math.max(size.x, size.y, size.z);
  let fov = cam.fov * (Math.PI / 180);
  let camZ = Math.abs(maxDim / 2 * Math.tan(fov * 0.5)) * offset;
  cam.position.set(center.x, center.y + maxDim*0.2, center.z + camZ);
  if (lookPos) cam.lookAt(lookPos);
  else         cam.lookAt(center);
}

// ---- Overlay logic ----
function closeOverlay() {
  document.getElementById('ui-overlay').classList.remove('visible');
}
function showMessage(msg) {
  let ov = document.getElementById('ui-overlay');
  if(ov) { ov.querySelector('p').innerHTML = msg; ov.classList.add('visible'); }
}

// ---- Drag-and-drop file support ----
window.addEventListener('dragover', e => { e.preventDefault(); document.body.style.opacity = 0.93; });
window.addEventListener('dragleave', e => { e.preventDefault(); document.body.style.opacity = 1; });
window.addEventListener('drop', function(e){
  e.preventDefault(); document.body.style.opacity = 1;
  if(e.dataTransfer.files.length){
    let file = e.dataTransfer.files[0];
    if(file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf")){
      let url = URL.createObjectURL(file);
      loadChurch(url);
    } else {
      showMessage("Only .glb/.gltf files are supported in this demo.<br>For .fbx or .usdz, use Three.js FBXLoader/USDZLoader.");
    }
  }
});

// ---- Responsive ----
window.addEventListener('resize',()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
},false);

// ---- Main loop ----
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ---- Load the church model on startup ----
loadChurch(churchPath);
