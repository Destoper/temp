import * as THREE from 'three';
import { GLTFLoader } from 'gltf-loader';
import { GUI } from 'gui';
import { FirstPersonControls } from 'fpcam-ctrl';
import { OrbitControls } from 'orb-cam-ctrl';

const bee_path = './3d_models/bee_minecraft/scene.gltf';
const bee_scale = 0.3;
const bee_main_camera_offset = { x: 0, y: -1, z: -1.8 };

const poly_city = './3d_models/low_poly_city/scene.gltf';
const city_scale = 2;

const FPCAM_SPEED = 10;
const EDIT_MODE_ENABLED = true;

let scene, camera, secondaryCamera, orbitalCamera,  renderer, controls, orbitalControls, clock;
let activeCamera, bee, mixer;

let recording = false;
let playingBack = false;
let path = [];
let playbackIndex = 0;
let playbackSpeed = 1;

clock = new THREE.Clock();

function init() {
  // Initialize scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  // Initialize first-person camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  // Initialize third-person camera (secondary camera)
  secondaryCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.add(secondaryCamera); 
  secondaryCamera.position.set(0, 0.5, -1); // Offset relative to the main camera

  // Initialize orbital camera (independent of other cameras)
  orbitalCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  orbitalCamera.position.set(5, 5, 5);  // Position the orbital camera at a suitable location
  orbitalCamera.lookAt(0, 0, 0);  // Look at the center of the scene
  activeCamera = camera;

  // Initialize renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 20, 10);
  scene.add(directionalLight);

  // First-person controls
  controls = new FirstPersonControls(camera, renderer.domElement);
  controls.lookSpeed = 0.1;
  controls.movementSpeed = FPCAM_SPEED;

  // Orbit controls (for orbital camera)
  orbitalControls = new OrbitControls(orbitalCamera, renderer.domElement);
  orbitalControls.enableDamping = true;
  orbitalControls.dampingFactor = 0.25;
  orbitalControls.screenSpacePanning = false;

  // Pointer lock
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Load models
  loadBeeModel(); 
  console.log('Bee model loaded');
  loadModel(poly_city, city_scale);

  // Initialize GUI for camera switching
  initGUI();

  // Start animation loop
  animate();
}

function initGUI() {
  const gui = new GUI();

  const cameraOptions = {
    activeCamera: 'First Person', // Default to first-person view
  };

  // Add a dropdown to switch between cameras
  gui.add(cameraOptions, 'activeCamera', ['First Person', 'Third Person', 'Orbital']).onChange((value) => {
    if (value === 'First Person') {
      activeCamera = camera;
      controls.enabled = true;  // Enable controls for first-person view
      orbitalControls.enabled = false;  // Disable orbital controls
    } else if (value === 'Third Person') {
      activeCamera = secondaryCamera;
      controls.enabled = false;  // Disable first-person controls
      orbitalControls.enabled = false;  // Disable orbital controls
    } else if (value === 'Orbital') {
      activeCamera = orbitalCamera;
      controls.enabled = false;  // Disable first-person controls
      orbitalControls.enabled = true;  // Enable orbital controls
    }
  });

  
  gui.add({ playback: false }, 'playback').name('Play Recording').onChange((value) => {
    if (value) {
      playingBack = true;
      playbackIndex = 0;
      recording = false;
      console.log('Playback started');
      console.log(path);
    } else {
      playingBack = false;
      console.log('Playback stopped');
    }
  });

   // Add Camera Position and Rotation to GUI
   const cameraInfo = {
    position: camera.position,
    rotation: camera.quaternion,
  };

  // Camera position control
  gui.add(cameraInfo.position, 'x').name('Camera Position X').listen();
  gui.add(cameraInfo.position, 'y').name('Camera Position Y').listen();
  gui.add(cameraInfo.position, 'z').name('Camera Position Z').listen();

  // Camera rotation control
  gui.add(cameraInfo.rotation, 'x').name('Camera Rotation X').listen();
  gui.add(cameraInfo.rotation, 'y').name('Camera Rotation Y').listen();
  gui.add(cameraInfo.rotation, 'z').name('Camera Rotation Z').listen();
}

function loadBeeModel() {
  const loader = new GLTFLoader();
  loader.load(
    bee_path,
    (gltf) => {
      bee = gltf.scene;

      // Scale the bee model
      bee.scale.set(bee_scale, bee_scale, bee_scale);

      // Set up animation mixer if the bee model has animations
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(bee);
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });
      }

      scene.add(bee);
    },
    undefined,
    (error) => {
      console.error('An error occurred while loading the bee model:', error);
    }
  );
}

function loadModel(path, scale) {
  const loader = new GLTFLoader();
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;

      // Scale the model
      model.scale.set(scale, scale, scale);

      scene.add(model);
      console.log('Model loaded');
    },
    undefined,
    (error) => {
      console.error('An error occurred while loading the model:', error);
    }
  );
}

function follow_the_main_camera(object_in_the_scene, xyz_offset) {
  if (!object_in_the_scene) {
    return;
  }
  object_in_the_scene.position.copy(camera.position);
  object_in_the_scene.position.x += xyz_offset.x;
  object_in_the_scene.position.y += xyz_offset.y;
  object_in_the_scene.position.z += xyz_offset.z;
  object_in_the_scene.rotation.copy(camera.rotation);
}

document.addEventListener('keydown', (event) => {

  if ((event.key === 't' || event.key === 'T') && EDIT_MODE_ENABLED) { // Check if "R" is pressed
    recording = !recording; // Toggle the recording state
    if (recording) {
      console.log('Recording started');
      path = []; // Clear the path to start a new recording
    } else {
      console.log('Recording stopped');
    }
  }
});

let lastRecordedTime = 0;
const RECORD_INTERVAL = 0.1; // Reduced interval to 0.1 for smoother recording

function recordMainCameraPath(delta) {
  if (recording) {
    const currentTime = clock.getElapsedTime();
    const timeDifference = currentTime - lastRecordedTime;


    if (timeDifference >= RECORD_INTERVAL) {
      path.push({
        position: camera.position.clone(),  // Clone the position to avoid reference issues
        rotation: camera.quaternion.clone(),  // Clone the quaternion as well
        time: currentTime,
      });
      lastRecordedTime = currentTime;
    }
  }
}


let timeAccumulator = 0;

function playbackPath(delta) {
  if (playingBack && path.length > 1) {
    const currentFrame = path[playbackIndex];
    const nextFrame = path[playbackIndex + 1];

    // Accumulate time based on delta
    timeAccumulator += playbackSpeed * delta;

    // Calculate frame duration and interpolation factor
    const frameDuration = nextFrame.time - currentFrame.time;
    const t = Math.min(timeAccumulator / frameDuration, 1); // Interpolate position and rotation based on elapsed time

    // Interpolate position and rotation
    camera.position.lerpVectors(currentFrame.position, nextFrame.position, t);
    camera.quaternion.slerpQuaternions(currentFrame.rotation, nextFrame.rotation, t);

    // If we've reached the end of the frame, move to the next
    if (t >= 1) {
      playbackIndex++; // Move to next frame
      timeAccumulator = 0; // Reset time accumulator for the next frame

      // If we reach the last frame, stop playback
      if (playbackIndex >= path.length - 1) {
        playingBack = false;
        console.log('Playback finished');
      }
    }
  }
}

function onWindowResize() {
  // Update all cameras' aspect ratios and projection matrices
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  secondaryCamera.aspect = window.innerWidth / window.innerHeight;
  secondaryCamera.updateProjectionMatrix();
  orbitalCamera.aspect = window.innerWidth / window.innerHeight;
  orbitalCamera.updateProjectionMatrix();

  // Resize renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animations
  if (mixer) {
    mixer.update(delta);
  }

  if (!playingBack) {
    controls.update(delta);
  }

  recordMainCameraPath(delta);
  playbackPath(delta);

  // Update orbital controls
  orbitalControls.update(delta);

  // update objects positions based on the main camera
  follow_the_main_camera(bee, bee_main_camera_offset);
  follow_the_main_camera(secondaryCamera, bee_main_camera_offset);

  // Render the scene using the active camera
  renderer.render(scene, activeCamera);
}

// Start the application
init();
